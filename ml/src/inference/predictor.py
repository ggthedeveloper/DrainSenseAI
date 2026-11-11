"""
DrainSenseAI 2.0 — Production Risk Inference, Simulation, and Mechanistic Attribution Service.
Integrates:
- Tier 1: Unsupervised Surface Archetyping (K-Means K=4)
- Tier 2: Calibrated Inundation Classification (Calibrated XGBoost with Platt Sigmoid)
- Tier 3: Mechanistic Root-Cause Attribution (Multi-Class Random Forest Classifier)
- Physics-based SCS-CN Runoff & Hydrological Topographic Traps
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
import joblib
import numpy as np
import pandas as pd

from ml.src.explainability.explainer import explain_prediction
from ml.src.hydrology.cascade_graph import HydrologicalCascadeGraph
from ml.src.hydrology.scs_cn_engine import audit_physics_ml_concordance, calculate_scs_cn_runoff
from backend.app.core.config import settings

logger = logging.getLogger("DrainSense.Predictor")

CITY_NAMES = {
    "VJA": "Vijayawada / Amaravati",
    "CHE": "Chennai",
    "BOM": "Mumbai",
    "BLR": "Bengaluru"
}

ARCHETYPE_DESCRIPTIONS = {
    0: {"name": "Highland Resistant Ridges", "risk_tendency": "Rapid gravitational shedding; zero ponding."},
    1: {"name": "Lowland Catchment Sumps / Depressions", "risk_tendency": "Chronic low elevation basin; convergent water trap."},
    2: {"name": "Dense Built-Up Runoff Accelerated Corridors", "risk_tendency": "High imperviousness; conduit throttling."},
    3: {"name": "Riparian Riverine Buffer Zones", "risk_tendency": "Direct river stage influence; tailwater backwater lock."}
}

FAILURE_MODE_ACTIONS = {
    "NONE_DRY": "Standard baseline monitoring. Inlets clear.",
    "NONE_STEEP_SLOPE": "Monitor downstream receiving channels for rapid overland flow arrival.",
    "DEPRESSION_TRAP": "Deploy heavy submersible sump pumps (100+ HP); barricade depressed vehicular underpasses.",
    "SURFACE_RUNOFF_CHOKE": "Dispatch mobile trash-clearing units to stormwater grating; clear roadside conduits.",
    "COMBINED_COMPOUND": "Pre-stage heavy dewatering apparatus and evacuate vulnerable ground-floor settlements.",
    "BARRAGE_BACKWATER": "Close automated outfall flap gates; activate auxiliary high-head lift stations."
}

class RiskInferenceService:
    def __init__(
        self,
        model_path: str = settings.MODEL_PATH,
        metadata_path: str = settings.MODEL_METADATA_PATH,
        grid_features_path: str = settings.GRID_FEATURES_PATH,
        attribution_model_path: str = settings.ATTRIBUTION_MODEL_PATH,
        attribution_encoder_path: str = settings.ATTRIBUTION_ENCODER_PATH,
        archetype_model_path: str = settings.ARCHETYPE_MODEL_PATH,
        scaler_path: str = settings.SCALER_PATH,
        grid_geojson_path: str = settings.GRID_GEOJSON_PATH
    ):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.grid_features_path = grid_features_path
        self.attribution_model_path = attribution_model_path
        self.attribution_encoder_path = attribution_encoder_path
        self.archetype_model_path = archetype_model_path
        self.scaler_path = scaler_path
        self.grid_geojson_path = grid_geojson_path

        self.model = None
        self.metadata = None
        self.attribution_model = None
        self.attribution_encoder = None
        self.archetype_model = None
        self.scaler = None
        self.all_grid_features_df = None
        self.city_geojsons = {}
        self.cascade_graphs = {}
        self.load_error: Optional[str] = None
        self.latest_observation: Optional[dict] = None

        self.reload()

    def reload(self):
        """Loads the 2026-11-11 model artifacts, scaler, and the Vijayawada grid."""
        self.cascade_graphs.clear()
        self.load_error = None
        self.model = None
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Calibrated model not found at {self.model_path}")
            self.model = joblib.load(self.model_path)
            logger.info(f"Loaded calibrated XGBoost from {self.model_path}")
        except Exception as e:
            self.model = None
            self.load_error = str(e)
            logger.error(f"Calibrated model failed to load: {e}", exc_info=True)

        try:
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, "r") as f:
                    self.metadata = json.load(f)
                logger.info(
                    "Loaded model metadata version %s trained %s",
                    self.metadata.get("model_version"),
                    self.metadata.get("training_timestamp"),
                )

            if os.path.exists(self.attribution_model_path):
                self.attribution_model = joblib.load(self.attribution_model_path)
                logger.info("Loaded failure-mode attribution model from %s", self.attribution_model_path)

            if os.path.exists(self.attribution_encoder_path):
                self.attribution_encoder = joblib.load(self.attribution_encoder_path)

            if os.path.exists(self.archetype_model_path):
                self.archetype_model = joblib.load(self.archetype_model_path)

            if os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)

            if os.path.exists(self.grid_features_path):
                self.all_grid_features_df = pd.read_csv(self.grid_features_path)
                logger.info("Loaded %s grid rows from %s", len(self.all_grid_features_df), self.grid_features_path)

            if os.path.exists(self.grid_geojson_path):
                with open(self.grid_geojson_path, "r") as f:
                    self.city_geojsons["VJA"] = json.load(f)
            else:
                logger.warning("GeoJSON not found at %s", self.grid_geojson_path)

            self.latest_observation = self._read_latest_observation()
        except Exception as e:
            if self.load_error is None:
                self.load_error = str(e)
            logger.error(f"Error loading resources: {e}", exc_info=True)

    def _read_latest_observation(self) -> dict:
        path = settings.EVENT_TELEMETRY_PATH
        frame = pd.read_csv(path)
        frame["_parsed"] = pd.to_datetime(frame["date"], dayfirst=True, errors="coerce")
        frame = frame.dropna(subset=["_parsed"])
        row = frame.loc[frame["_parsed"].idxmax()]
        observed = row["_parsed"].strftime("%Y-%m-%d")
        return {
            "date": observed,
            "rain_24h_mm": float(row["rain_24h_mm"]),
            "prakasam_stage_m": float(row["prakasam_stage_mean_m"]),
            "source": "data/processed/vijayawada_event_telemetry.csv",
        }

    def resolve_observation(self, rain_24h_mm: Optional[float] = None, prakasam_stage_m: Optional[float] = None) -> dict:
        obs = self.latest_observation or self._read_latest_observation()
        used_file = rain_24h_mm is None
        return {
            "rain_24h_mm": float(obs["rain_24h_mm"] if rain_24h_mm is None else rain_24h_mm),
            "prakasam_stage_m": float(obs["prakasam_stage_m"] if prakasam_stage_m is None else prakasam_stage_m),
            "rainfall_source": obs["source"] if used_file else "request",
            "rainfall_observed_on": obs["date"] if used_file else None,
        }

    @property
    def grid_features_df(self):
        return self.all_grid_features_df

    def get_model_info(self) -> dict:
        if not self.metadata:
            return {"status": "Model not loaded", "model_version": "None"}
        return {
            "model_version": self.metadata.get("model_version", "2.0"),
            "model_name": self.metadata.get("model_name", "DrainSenseAI 2.0"),
            "model_type": self.metadata.get("model_type"),
            "training_timestamp": self.metadata.get("training_timestamp"),
            "active_metrics": self.metadata.get("active_model_metrics"),
            "thresholds": self.metadata.get("thresholds"),
            "feature_importances": self.metadata.get("feature_importances", []),
            "failure_modes": self.metadata.get("failure_modes", []),
            "scientific_positioning": "DrainSenseAI 2.0 Physics-Informed Multi-Tier Decision System."
        }

    def map_risk_level(self, probability: float) -> str:
        prob_pct = probability * 100.0
        if prob_pct >= 80.0:
            return "CRITICAL"
        elif prob_pct >= 60.0:
            return "HIGH"
        elif prob_pct >= 40.0:
            return "ELEVATED"
        elif prob_pct >= 20.0:
            return "MODERATE"
        else:
            return "LOW"

    def generate_recommended_actions(self, risk_level: str, zone_name: str, features: dict, failure_mode: str = "NONE_DRY") -> List[str]:
        actions = []
        
        # Add root cause specific action
        mode_action = FAILURE_MODE_ACTIONS.get(failure_mode)
        if mode_action:
            actions.append(f"Root Cause [{failure_mode}]: {mode_action}")

        # Add general operational protocol
        if risk_level == "CRITICAL":
            actions.append("Dispatch heavy dewatering suction pumps (100+ HP) to designated low-lying sumps.")
            actions.append("Issue advisory to traffic police for arterial diversion around subways and canal bridges.")
            actions.append("Activate SDRF standby teams and prepare emergency shelters.")
        elif risk_level == "HIGH":
            actions.append("Deploy mobile quick-response pump sets along discharge choke points.")
            actions.append("Inspect stormwater grating for trash and debris choking.")
            actions.append("Broadcast community advisory in low-elevation wards.")
        elif risk_level == "ELEVATED":
            actions.append("Clear primary drainage culverts along arterial corridors.")
            actions.append("Monitor local rain gauges and river stage markers hourly.")
        elif risk_level == "MODERATE":
            actions.append("Routine monitoring of stormwater drainage network.")
            actions.append("Keep response units on standard monsoon alert.")
        else:
            actions.append("Standard operating baseline. No immediate intervention required.")
            
        return actions

    def compute_priority_score(self, risk_prob: float, building_dens: float, road_dens: float, hist_freq: float) -> float:
        impact_score = min(1.0, building_dens * 1.2)
        infra_score = min(1.0, road_dens / 15.0)
        hist_score = min(1.0, hist_freq * 2.0)
        raw_score = (0.60 * risk_prob) + (0.20 * impact_score) + (0.10 * hist_score) + (0.10 * infra_score)
        return round(float(raw_score * 100.0), 1)

    def _prepare_feature_row(self, row: dict, rain_24h_mm: float, prakasam_stage_m: float = 3.75) -> pd.DataFrame:
        """Prepares a single-row DataFrame with the 9 production features."""
        feat_cols = self.metadata.get("feature_columns", [
            "elevation_m", "slope_deg", "tpi_11", "topographic_trap_index",
            "distance_to_water_m", "drainage_density_km_km2", "curve_number",
            "rain_24h_mm", "prakasam_stage_m"
        ])
        
        row_copy = dict(row)
        row_copy["rain_24h_mm"] = float(rain_24h_mm)
        row_copy["prakasam_stage_m"] = float(prakasam_stage_m)
        
        # Ensure fallback defaults for any missing features
        if "tpi_11" not in row_copy or pd.isna(row_copy["tpi_11"]):
            row_copy["tpi_11"] = 0.0
        if "topographic_trap_index" not in row_copy or pd.isna(row_copy["topographic_trap_index"]):
            row_copy["topographic_trap_index"] = 0.0
        if "curve_number" not in row_copy or pd.isna(row_copy["curve_number"]):
            row_copy["curve_number"] = 96.0

        return pd.DataFrame([row_copy])[feat_cols]

    def predict_grid(
        self,
        grid_id: str,
        rain_1h_mm: float = 0.0,
        rain_3h_mm: float = 0.0,
        rain_6h_mm: float = 0.0,
        rain_12h_mm: Optional[float] = None,
        rain_24h_mm: Optional[float] = None,
        rain_72h_mm: Optional[float] = None,
        prakasam_stage_m: Optional[float] = None,
        prediction_horizon_hours: int = 3
    ) -> dict:
        if self.all_grid_features_df is None or self.model is None:
            raise RuntimeError("Model or spatial grid database not initialized.")

        matched = self.all_grid_features_df[self.all_grid_features_df["grid_id"] == grid_id]
        if matched.empty:
            raise ValueError(f"Grid ID '{grid_id}' not found in spatial registry.")

        row = matched.iloc[0].to_dict()
        observed = self.resolve_observation(rain_24h_mm, prakasam_stage_m)
        rain_24h_mm = observed["rain_24h_mm"]
        prakasam_stage_m = observed["prakasam_stage_m"]

        if rain_12h_mm is None:
            rain_12h_mm = max(rain_6h_mm, round(rain_24h_mm * 0.70, 2))
        if rain_72h_mm is None:
            rain_72h_mm = max(rain_24h_mm, round(rain_24h_mm * 1.5, 2))

        features_dict = {
            **row,
            "rain_1h_mm": rain_1h_mm,
            "rain_3h_mm": rain_3h_mm,
            "rain_6h_mm": rain_6h_mm,
            "rain_12h_mm": rain_12h_mm,
            "rain_24h_mm": rain_24h_mm,
            "rain_72h_mm": rain_72h_mm,
            "prakasam_stage_m": prakasam_stage_m,
            "rain_intensity_mm_h": round(rain_3h_mm / 3.0, 2),
            "rain_change_rate": round(rain_3h_mm - max(0.0, rain_6h_mm - rain_3h_mm), 2)
        }

        X_in = self._prepare_feature_row(features_dict, rain_24h_mm=rain_24h_mm, prakasam_stage_m=prakasam_stage_m)
        
        # 1. Tier 2: Calibrated Inundation Probability
        prob = float(self.model.predict_proba(X_in)[0, 1])
        score = int(round(prob * 100.0))
        risk_level = self.map_risk_level(prob)

        # 2. Tier 3: Failure Mode Attribution
        failure_mode = "NONE_DRY"
        if self.attribution_model is not None and self.attribution_encoder is not None:
            pred_enc = self.attribution_model.predict(X_in)
            failure_mode = str(self.attribution_encoder.inverse_transform(pred_enc)[0])
        elif prob >= 0.50:
            failure_mode = "SURFACE_RUNOFF_CHOKE"

        # 3. Tier 1: Surface Archetype
        arch_id = int(row.get("surface_archetype_cluster", 2))
        arch_info = ARCHETYPE_DESCRIPTIONS.get(arch_id, {"name": f"Archetype {arch_id}", "risk_tendency": "General urban"})

        top_factors = explain_prediction(features_dict, top_k=4)
        recommended_actions = self.generate_recommended_actions(
            risk_level, row.get("zone_name", "Zone"), features_dict, failure_mode=failure_mode
        )

        return {
            "grid_id": grid_id,
            "city_id": row.get("city_id", "VJA"),
            "zone_name": row.get("zone_name"),
            "latitude": row.get("latitude"),
            "longitude": row.get("longitude"),
            "risk_probability": round(prob, 4),
            "risk_score": score,
            "risk_level": risk_level,
            "failure_mode": failure_mode,
            "surface_archetype": arch_info,
            "prediction_horizon_hours": prediction_horizon_hours,
            "model_version": self.metadata.get("model_version", "2.0"),
            "terrain": {
                "elevation_m": row.get("elevation_m"),
                "slope_deg": row.get("slope_deg"),
                "tpi_11": row.get("tpi_11"),
                "topographic_trap_index": row.get("topographic_trap_index"),
                "flow_accumulation": row.get("flow_accumulation"),
                "drainage_density_km_km2": row.get("drainage_density_km_km2"),
                "curve_number": row.get("curve_number"),
                "distance_to_water_m": row.get("distance_to_water_m")
            },
            "rainfall_summary": {
                "rain_1h_mm": rain_1h_mm,
                "rain_3h_mm": rain_3h_mm,
                "rain_6h_mm": rain_6h_mm,
                "rain_24h_mm": rain_24h_mm,
                "prakasam_stage_m": prakasam_stage_m
            },
            "top_factors": top_factors,
            "recommended_actions": recommended_actions
        }

    def get_current_risk_map(
        self,
        city_id: str = "VJA",
        rain_1h_mm: float = 24.5,
        rain_3h_mm: float = 48.0,
        rain_6h_mm: float = 85.0,
        rain_24h_mm: Optional[float] = None,
        rain_72h_mm: float = 180.0,
        prakasam_stage_m: Optional[float] = None
    ) -> dict:
        cid = city_id.upper()
        if self.all_grid_features_df is None or self.model is None:
            raise RuntimeError(self.load_error or "Model or spatial registry not loaded.")

        observed = self.resolve_observation(rain_24h_mm, prakasam_stage_m)
        rain_24h_mm = observed["rain_24h_mm"]
        prakasam_stage_m = observed["prakasam_stage_m"]

        df = self.all_grid_features_df[self.all_grid_features_df["city_id"] == cid].copy()
        if df.empty:
            raise ValueError(f"No trained grid is loaded for city '{cid}'.")

        df["rain_24h_mm"] = float(rain_24h_mm)
        df["prakasam_stage_m"] = float(prakasam_stage_m)

        feat_cols = self.metadata.get("feature_columns", [
            "elevation_m", "slope_deg", "tpi_11", "topographic_trap_index",
            "distance_to_water_m", "drainage_density_km_km2", "curve_number",
            "rain_24h_mm", "prakasam_stage_m"
        ])
        
        X_all = df[feat_cols]
        probs = self.model.predict_proba(X_all)[:, 1]

        df["risk_probability"] = probs.round(4)
        df["risk_score"] = (probs * 100.0).round().astype(int)
        df["risk_level"] = [self.map_risk_level(p) for p in probs]

        # Tier 3: Failure Modes
        if self.attribution_model is not None and self.attribution_encoder is not None:
            pred_enc = self.attribution_model.predict(X_all)
            df["failure_mode"] = self.attribution_encoder.inverse_transform(pred_enc)
        else:
            df["failure_mode"] = np.where(probs >= 0.50, "SURFACE_RUNOFF_CHOKE", "NONE_DRY")

        priorities = [
            self.compute_priority_score(p, b, r, h)
            for p, b, r, h in zip(
                df["risk_probability"],
                df.get("building_density", df["impervious_ratio"] * 0.8),
                df.get("road_density_km_km2", df["drainage_density_km_km2"] * 2.5),
                df.get("historical_flood_frequency", [0.1]*len(df))
            )
        ]
        df["priority_score"] = priorities

        geojson_features = []
        geojson_data = self.city_geojsons.get("VJA", {})
        geom_map = {
            f.get("properties", {}).get("grid_id"): f["geometry"]
            for f in geojson_data.get("features", [])
        }

        for _, row in df.iterrows():
            gid = row["grid_id"]
            geom = geom_map.get(gid)
            if not geom:
                continue

            props = {
                "city_id": cid,
                "grid_id": gid,
                "zone_name": row["zone_name"],
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "elevation_m": float(row["elevation_m"]),
                "slope_deg": float(row["slope_deg"]),
                "tpi_11": float(row["tpi_11"]),
                "topographic_trap_index": float(row["topographic_trap_index"]),
                "curve_number": float(row["curve_number"]),
                "drainage_density_km_km2": float(row["drainage_density_km_km2"]),
                "flow_accumulation": float(row.get("flow_accumulation", 10.0)),
                "surface_archetype_cluster": int(row.get("surface_archetype_cluster", 2)),
                "risk_probability": float(row["risk_probability"]),
                "risk_score": int(row["risk_score"]),
                "risk_level": row["risk_level"],
                "failure_mode": row["failure_mode"],
                "priority_score": float(row["priority_score"]),
                "historical_flood_count": int(row.get("historical_flood_count", 2 if row["elevation_m"] < 21.0 else 0))
            }
            geojson_features.append({
                "type": "Feature",
                "id": gid,
                "geometry": geom,
                "properties": props
            })

        total_cells = len(df)
        crit_count = int((df["risk_level"] == "CRITICAL").sum())
        high_count = int((df["risk_level"] == "HIGH").sum())
        elev_count = int((df["risk_level"] == "ELEVATED").sum())
        mod_count = int((df["risk_level"] == "MODERATE").sum())
        low_count = int((df["risk_level"] == "LOW").sum())

        highest_risk_row = df.loc[df["risk_score"].idxmax()]

        summary = {
            "city_id": cid,
            "monitored_city": CITY_NAMES.get(cid, cid),
            "total_grids": total_cells,
            "monitored_area_sqkm": round(total_cells * 0.0625, 1), # 250m x 250m = 0.0625 sqkm
            "critical_zones": crit_count,
            "high_risk_zones": high_count,
            "elevated_zones": elev_count,
            "moderate_zones": mod_count,
            "low_zones": low_count,
            "current_rainfall_24h_mm": rain_24h_mm,
            "current_prakasam_stage_m": prakasam_stage_m,
            "rainfall_source": observed["rainfall_source"],
            "rainfall_observed_on": observed["rainfall_observed_on"],
            "highest_risk_zone": {
                "grid_id": highest_risk_row["grid_id"],
                "zone_name": highest_risk_row["zone_name"],
                "risk_score": int(highest_risk_row["risk_score"]),
                "risk_level": highest_risk_row["risk_level"],
                "failure_mode": highest_risk_row["failure_mode"]
            },
            "last_updated": observed["rainfall_observed_on"] or "request"
        }

        return {
            "summary": summary,
            "geojson": {
                "type": "FeatureCollection",
                "name": f"DrainSense_{cid}_Risk_Map",
                "features": geojson_features
            }
        }

    def simulate_rainfall_scenario(
        self,
        city_id: str = "VJA",
        multiplier: float = 1.25,
        base_rain_1h_mm: float = 24.5,
        base_rain_3h_mm: float = 48.0,
        base_rain_6h_mm: float = 85.0,
        base_rain_24h_mm: float = 145.0,
        base_rain_72h_mm: float = 180.0
    ) -> dict:
        cid = city_id.upper()
        baseline_map = self.get_current_risk_map(
            city_id=cid,
            rain_1h_mm=base_rain_1h_mm,
            rain_3h_mm=base_rain_3h_mm,
            rain_6h_mm=base_rain_6h_mm,
            rain_24h_mm=base_rain_24h_mm,
            rain_72h_mm=base_rain_72h_mm
        )

        sim_24h = round(base_rain_24h_mm * multiplier, 1)
        sim_map = self.get_current_risk_map(
            city_id=cid,
            rain_24h_mm=sim_24h
        )

        base_summary = baseline_map["summary"]
        sim_summary = sim_map["summary"]

        delta_critical = sim_summary["critical_zones"] - base_summary["critical_zones"]
        delta_high = sim_summary["high_risk_zones"] - base_summary["high_risk_zones"]

        base_high_ids = {
            f["properties"]["grid_id"]
            for f in baseline_map["geojson"]["features"]
            if f["properties"]["risk_level"] in ["CRITICAL", "HIGH"]
        }
        sim_high_ids = {
            f["properties"]["grid_id"]
            for f in sim_map["geojson"]["features"]
            if f["properties"]["risk_level"] in ["CRITICAL", "HIGH"]
        }
        newly_escalated_ids = list(sim_high_ids - base_high_ids)

        return {
            "city_id": cid,
            "simulation_scenario": {
                "multiplier": multiplier,
                "percentage_increase": f"{int(round((multiplier - 1.0) * 100))}%",
                "scenario_rainfall_24h_mm": sim_24h,
                "baseline_rainfall_24h_mm": base_rain_24h_mm
            },
            "baseline_summary": base_summary,
            "scenario_summary": sim_summary,
            "impact_deltas": {
                "new_critical_zones": delta_critical,
                "new_high_risk_zones": delta_high,
                "total_newly_escalated_zones": len(newly_escalated_ids),
                "newly_escalated_grid_ids": newly_escalated_ids[:15]
            },
            "scientific_note": "Model-derived scenario simulation. Physical flood depths depend on dynamic hydraulic drainage flows."
        }

    def get_cascade_graph(self, city_id: str) -> Optional[HydrologicalCascadeGraph]:
        cid = city_id.upper()
        if cid not in self.cascade_graphs:
            if self.all_grid_features_df is None or self.all_grid_features_df.empty:
                return None
            city_df = self.all_grid_features_df[self.all_grid_features_df["city_id"] == cid]
            if city_df.empty:
                city_df = self.all_grid_features_df
            self.cascade_graphs[cid] = HydrologicalCascadeGraph(city_df)
        return self.cascade_graphs[cid]

    def trace_cascade(self, grid_id: str, rain_24h_mm: Optional[float] = None) -> dict:
        gid = str(grid_id).strip()
        cid = "VJA"
        if self.all_grid_features_df is not None:
            match = self.all_grid_features_df[self.all_grid_features_df["grid_id"] == gid]
            if not match.empty:
                cid = match.iloc[0].get("city_id", "VJA")

        graph = self.get_cascade_graph(cid)
        if not graph:
            raise ValueError(f"Could not build cascade graph for city '{cid}'.")
        rain_24h_mm = self.resolve_observation(rain_24h_mm)["rain_24h_mm"]
        return graph.trace_cascade_path(start_grid_id=gid, current_rain_mm=rain_24h_mm)

    def get_physics_audit(self, grid_id: str, rain_24h_mm: Optional[float] = None) -> dict:
        pred = self.predict_grid(grid_id=grid_id, rain_24h_mm=rain_24h_mm)
        terrain = pred.get("terrain", {})
        elev = float(terrain.get("elevation_m", 15.0))
        slope = float(terrain.get("slope_deg", 1.5))
        flow_acc = float(terrain.get("flow_accumulation", 30.0))
        risk_score = float(pred.get("risk_score", 50.0))

        audit = audit_physics_ml_concordance(
            ml_risk_score=risk_score,
            rainfall_mm=rain_24h_mm,
            elevation_m=elev,
            slope_degrees=slope,
            flow_accumulation=flow_acc
        )
        audit["grid_id"] = grid_id
        audit["zone_name"] = pred.get("zone_name", grid_id)
        audit["risk_level"] = pred.get("risk_level", "MODERATE")
        return audit

    def get_temporal_nowcast(self, city_id: str = "VJA", base_rain_24h_mm: Optional[float] = None) -> dict:
        cid = city_id.upper()
        base_rain_24h_mm = self.resolve_observation(base_rain_24h_mm)["rain_24h_mm"]
        horizons_config = [
            {"horizon_hours": 0, "label": "T+0h (Current Telemetry)", "multiplier": 1.0, "stage": "Baseline Telemetry", "desc": "Current observed antecedent moisture."},
            {"horizon_hours": 1, "label": "T+1h (Convective Onset)", "multiplier": 1.35, "stage": "Surge Initiation", "desc": "Rapid surface pooling along tertiary masonry drains."},
            {"horizon_hours": 2, "label": "T+2h (Peak Cloudburst Wave)", "multiplier": 1.90, "stage": "Peak Inundation", "desc": "Maximum hydrological breach; arterial subway and culvert surcharging."},
            {"horizon_hours": 3, "label": "T+3h (Backwater Stall)", "multiplier": 1.55, "stage": "Channel Stagnation", "desc": "Canal backflow preventing gravity drainage into primary water bodies."},
            {"horizon_hours": 6, "label": "T+6h (Drainage Recession)", "multiplier": 0.85, "stage": "Recession & Ponding", "desc": "Gradual tailback recession; chronic sump depressions remain submerged."}
        ]

        nowcast_timeline = []
        for h in horizons_config:
            rain_val = round(base_rain_24h_mm * h["multiplier"], 1)
            h_map = self.get_current_risk_map(
                city_id=cid,
                rain_24h_mm=rain_val,
                rain_6h_mm=round(rain_val * 0.58, 1)
            )
            h_summary = h_map["summary"]
            
            cells_risk = {}
            for feat in h_map["geojson"]["features"]:
                p = feat["properties"]
                cells_risk[p["grid_id"]] = {
                    "risk_score": p["risk_score"],
                    "risk_level": p["risk_level"],
                    "failure_mode": p.get("failure_mode", "NONE_DRY")
                }

            nowcast_timeline.append({
                "horizon_hours": h["horizon_hours"],
                "label": h["label"],
                "stage": h["stage"],
                "description": h["desc"],
                "rainfall_24h_mm": rain_val,
                "summary": h_summary,
                "cell_states": cells_risk
            })

        return {
            "city_id": cid,
            "monitored_city": CITY_NAMES.get(cid, cid),
            "generated_at": "2026-11-11T17:30:00Z",
            "base_rainfall_24h_mm": base_rain_24h_mm,
            "total_horizons": len(nowcast_timeline),
            "timeline": nowcast_timeline
        }

predictor_service = RiskInferenceService()
