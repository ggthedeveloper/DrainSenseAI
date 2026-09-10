"""
Multi-City Risk Inference, Simulation, and Prioritization Service for DrainSense India.
Supports:
- VJA (Vijayawada / Amaravati)
- CHE (Chennai)
- BOM (Mumbai)
- BLR (Bengaluru)
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
import joblib
import numpy as np
import pandas as pd

from ml.src.explainability.explainer import explain_prediction

logger = logging.getLogger("DrainSense.Predictor")

CITY_NAMES = {
    "VJA": "Vijayawada / Amaravati",
    "CHE": "Chennai",
    "BOM": "Mumbai",
    "BLR": "Bengaluru",
    "DEL": "Delhi NCR",
    "HYD": "Hyderabad",
    "CCU": "Kolkata",
    "AMD": "Ahmedabad",
    "PNQ": "Pune",
    "COK": "Kochi",
    "GAU": "Guwahati",
    "PAT": "Patna"
}

class RiskInferenceService:
    def __init__(
        self,
        model_path: str = "models/drainsense_xgb_v1.joblib",
        metadata_path: str = "models/drainsense_xgb_v1_metadata.json",
        grid_features_path: str = "data/processed/all_cities_grid_features.csv"
    ):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.grid_features_path = grid_features_path
        
        self.model = None
        self.metadata = None
        self.all_grid_features_df = None
        self.city_geojsons = {}
        
        self.reload()

    def reload(self):
        """Loads model artifacts and spatial grids for all cities."""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded ML model from {self.model_path}")

            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, "r") as f:
                    self.metadata = json.load(f)

            if os.path.exists(self.grid_features_path):
                self.all_grid_features_df = pd.read_csv(self.grid_features_path)
                logger.info(f"Loaded {len(self.all_grid_features_df)} grid spatial records across all cities.")

            # Load GeoJSONs for each city
            for cid in CITY_NAMES.keys():
                path = f"data/processed/{cid.lower()}_grid_500m.json"
                if os.path.exists(path):
                    with open(path, "r") as f:
                        self.city_geojsons[cid] = json.load(f)
        except Exception as e:
            logger.error(f"Error loading resources: {e}")

    @property
    def grid_features_df(self):
        """Backward compatibility alias for all_grid_features_df."""
        return self.all_grid_features_df

    def get_model_info(self) -> dict:
        if not self.metadata:
            return {"status": "Model not loaded", "model_version": "None"}
        return {
            "model_version": self.metadata.get("model_version", "v1.0"),
            "model_type": self.metadata.get("model_type"),
            "training_timestamp": self.metadata.get("training_timestamp"),
            "active_metrics": self.metadata.get("active_model_metrics"),
            "thresholds": self.metadata.get("thresholds"),
            "feature_importances": self.metadata.get("feature_importances", [])[:8],
            "scientific_positioning": self.metadata.get("scientific_disclaimer")
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

    def generate_recommended_actions(self, risk_level: str, zone_name: str, features: dict) -> List[str]:
        actions = []
        if risk_level == "CRITICAL":
            actions.append("Dispatch heavy dewatering suction pumps (100+ HP) to designated low-lying sumps.")
            actions.append("Issue advisory to traffic police for arterial diversion around subways and canal bridges.")
            actions.append("Prepare emergency shelter facilities and activate SDRF standby teams.")
            actions.append("Alert power utility to de-energize vulnerable street feeder transformers.")
        elif risk_level == "HIGH":
            actions.append("Deploy mobile quick-response pump sets along discharge choke points.")
            actions.append("Inspect stormwater grating for trash and debris choking.")
            actions.append("Broadcast community advisory in low-elevation wards.")
        elif risk_level == "ELEVATED":
            actions.append("Clear primary drainage culverts along arterial corridors.")
            actions.append("Monitor local rain gauges and water level markers hourly.")
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

    def predict_grid(
        self,
        grid_id: str,
        rain_1h_mm: float = 0.0,
        rain_3h_mm: float = 0.0,
        rain_6h_mm: float = 0.0,
        rain_12h_mm: Optional[float] = None,
        rain_24h_mm: float = 0.0,
        rain_72h_mm: Optional[float] = None,
        prediction_horizon_hours: int = 3
    ) -> dict:
        if self.all_grid_features_df is None or self.model is None:
            raise RuntimeError("Model or spatial grid database not initialized.")

        matched = self.all_grid_features_df[self.all_grid_features_df["grid_id"] == grid_id]
        if matched.empty:
            raise ValueError(f"Grid ID '{grid_id}' not found in spatial registry.")

        row = matched.iloc[0].to_dict()
        
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
            "rain_intensity_mm_h": round(rain_3h_mm / 3.0, 2),
            "rain_change_rate": round(rain_3h_mm - max(0.0, rain_6h_mm - rain_3h_mm), 2)
        }

        feat_cols = self.metadata["feature_columns"]
        X_in = pd.DataFrame([features_dict])[feat_cols]
        prob = float(self.model.predict_proba(X_in)[0, 1])
        score = int(round(prob * 100.0))
        risk_level = self.map_risk_level(prob)

        top_factors = explain_prediction(features_dict, top_k=4)
        recommended_actions = self.generate_recommended_actions(risk_level, row.get("zone_name", "Zone"), features_dict)

        return {
            "grid_id": grid_id,
            "city_id": row.get("city_id", "VJA"),
            "zone_name": row.get("zone_name"),
            "latitude": row.get("latitude"),
            "longitude": row.get("longitude"),
            "risk_probability": round(prob, 4),
            "risk_score": score,
            "risk_level": risk_level,
            "prediction_horizon_hours": prediction_horizon_hours,
            "model_version": self.metadata.get("model_version", "v1.0"),
            "terrain": {
                "elevation_m": row.get("elevation_m"),
                "slope_deg": row.get("slope_deg"),
                "flow_accumulation": row.get("flow_accumulation"),
                "drainage_density": row.get("drainage_density"),
                "distance_to_water_m": row.get("distance_to_water_m")
            },
            "rainfall_summary": {
                "rain_1h_mm": rain_1h_mm,
                "rain_3h_mm": rain_3h_mm,
                "rain_6h_mm": rain_6h_mm,
                "rain_24h_mm": rain_24h_mm
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
        rain_24h_mm: float = 145.0,
        rain_72h_mm: float = 180.0
    ) -> dict:
        cid = city_id.upper()
        if cid not in self.city_geojsons:
            cid = "VJA"

        if self.all_grid_features_df is None or self.model is None:
            raise RuntimeError("Model or spatial registry not loaded.")

        df = self.all_grid_features_df[self.all_grid_features_df["city_id"] == cid].copy()
        if df.empty:
            df = self.all_grid_features_df[self.all_grid_features_df["city_id"] == "VJA"].copy()
            cid = "VJA"

        df["rain_1h_mm"] = rain_1h_mm
        df["rain_3h_mm"] = rain_3h_mm
        df["rain_6h_mm"] = rain_6h_mm
        df["rain_12h_mm"] = rain_24h_mm * 0.70
        df["rain_24h_mm"] = rain_24h_mm
        df["rain_72h_mm"] = rain_72h_mm
        df["rain_intensity_mm_h"] = round(rain_3h_mm / 3.0, 2)
        df["rain_change_rate"] = round(rain_3h_mm - max(0.0, rain_6h_mm - rain_3h_mm), 2)

        feat_cols = self.metadata["feature_columns"]
        X_all = df[feat_cols]
        probs = self.model.predict_proba(X_all)[:, 1]

        df["risk_probability"] = probs.round(4)
        df["risk_score"] = (probs * 100.0).round().astype(int)
        df["risk_level"] = [self.map_risk_level(p) for p in probs]

        priorities = [
            self.compute_priority_score(p, b, r, h)
            for p, b, r, h in zip(
                df["risk_probability"],
                df["building_density"],
                df["road_density_km_km2"],
                df["historical_flood_frequency"]
            )
        ]
        df["priority_score"] = priorities

        geojson_features = []
        geojson_data = self.city_geojsons.get(cid, {})
        geom_map = {f["id"]: f["geometry"] for f in geojson_data.get("features", [])}

        for _, row in df.iterrows():
            gid = row["grid_id"]
            geom = geom_map.get(gid)
            if not geom:
                continue

            props = {
                "city_id": cid,
                "grid_id": gid,
                "zone_name": row["zone_name"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "elevation_m": row["elevation_m"],
                "slope_deg": row["slope_deg"],
                "flow_accumulation": row["flow_accumulation"],
                "risk_probability": row["risk_probability"],
                "risk_score": int(row["risk_score"]),
                "risk_level": row["risk_level"],
                "priority_score": row["priority_score"],
                "historical_flood_count": int(row["historical_flood_count"])
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
            "monitored_area_sqkm": round(total_cells * 0.25, 1),
            "critical_zones": crit_count,
            "high_risk_zones": high_count,
            "elevated_zones": elev_count,
            "moderate_zones": mod_count,
            "low_zones": low_count,
            "current_rainfall_24h_mm": rain_24h_mm,
            "highest_risk_zone": {
                "grid_id": highest_risk_row["grid_id"],
                "zone_name": highest_risk_row["zone_name"],
                "risk_score": int(highest_risk_row["risk_score"]),
                "risk_level": highest_risk_row["risk_level"]
            },
            "last_updated": "2026-09-10T08:30:00Z"
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

        sim_1h = round(base_rain_1h_mm * multiplier, 1)
        sim_3h = round(base_rain_3h_mm * multiplier, 1)
        sim_6h = round(base_rain_6h_mm * multiplier, 1)
        sim_24h = round(base_rain_24h_mm * multiplier, 1)
        sim_72h = round(base_rain_72h_mm * multiplier, 1)

        scenario_map = self.get_current_risk_map(
            city_id=cid,
            rain_1h_mm=sim_1h,
            rain_3h_mm=sim_3h,
            rain_6h_mm=sim_6h,
            rain_24h_mm=sim_24h,
            rain_72h_mm=sim_72h
        )

        base_summary = baseline_map["summary"]
        sim_summary = scenario_map["summary"]

        delta_critical = sim_summary["critical_zones"] - base_summary["critical_zones"]
        delta_high = sim_summary["high_risk_zones"] - base_summary["high_risk_zones"]

        base_high_ids = {
            f["properties"]["grid_id"] for f in baseline_map["geojson"]["features"]
            if f["properties"]["risk_level"] in ["HIGH", "CRITICAL"]
        }
        sim_high_ids = {
            f["properties"]["grid_id"] for f in scenario_map["geojson"]["features"]
            if f["properties"]["risk_level"] in ["HIGH", "CRITICAL"]
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

predictor_service = RiskInferenceService()
