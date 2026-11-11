"""
Primary REST API endpoints for DrainSense India with Multi-City Support.
"""

import os
import json
import pandas as pd
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Depends, Query
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.schemas.risk import (
    HealthResponse, CityItem, PredictionRequest, PredictionResponse,
    SimulationRequest, SimulationResponse, HistoricalEvent,
    PriorityZone, AdminActionResponse, AICopilotRequest, AICopilotResponse,
    DrainAsset, AlertItem, DispatchOptimizationRequest
)
from backend.app.services.resource_optimizer import optimize_municipal_dispatch
from ml.src.inference.predictor import predictor_service

api_router = APIRouter()

CITIES_REGISTRY = [
    {
        "city_id": "VJA",
        "city_name": "Vijayawada / Amaravati",
        "state": "Andhra Pradesh",
        "country": "India",
        "status": "VERIFIED_REAL_DATA",
        "bounding_box": {"min_lat": 16.450, "max_lat": 16.570, "min_lon": 80.560, "max_lon": 80.700},
        "default_lat": 16.5120,
        "default_lon": 80.6400,
        "zoom_level": 12
    }
]


@api_router.get("/cities", response_model=List[CityItem], tags=["Metadata"])
def get_cities():
    """Retrieve supported Indian municipal corporations."""
    return CITIES_REGISTRY

@api_router.get("/zones", tags=["Metadata"])
def get_zones(city_id: str = Query("VJA")):
    """List named urban municipal zones and monitoring wards for selected city."""
    cid = city_id.upper()
    if predictor_service.all_grid_features_df is None:
        raise HTTPException(status_code=503, detail="Spatial registry not loaded.")

    city_df = predictor_service.all_grid_features_df[predictor_service.all_grid_features_df["city_id"] == cid]
    if city_df.empty:
        raise HTTPException(status_code=404, detail=f"Zones for city '{cid}' not found.")

    zones = city_df[["zone_name"]].drop_duplicates()["zone_name"].tolist()
    return {"city_id": cid, "zones": sorted(zones)}

@api_router.get("/risk/current", tags=["Risk Analysis"])
def get_current_risk(city_id: str = Query("VJA")):
    """Return overview KPIs and high-risk zones for specified city."""
    try:
        res = predictor_service.get_current_risk_map(city_id=city_id)
        return res["summary"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/risk/map", tags=["Risk Analysis"])
def get_risk_map(
    city_id: str = Query("VJA"),
    rain_24h: Optional[float] = Query(None, description="24h rainfall in mm. Omitted values use the latest telemetry row."),
):
    """
    Return GeoJSON FeatureCollection for Vijayawada with model risk probabilities.
    """
    try:
        res = predictor_service.get_current_risk_map(
            city_id=city_id,
            rain_24h_mm=rain_24h,
        )
        return JSONResponse(content=res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/risk/priority-zones", tags=["Risk Analysis"])
def get_priority_zones(
    city_id: str = Query("VJA", description="City ID: VJA, CHE, BOM, BLR"),
    limit: int = 10
):
    """
    Return algorithmically prioritized municipal response list for selected city.
    """
    try:
        res = predictor_service.get_current_risk_map(city_id=city_id)
        features = res["geojson"]["features"]

        sorted_feats = sorted(
            features,
            key=lambda x: x["properties"]["priority_score"],
            reverse=True
        )[:limit]

        priority_list = []
        for f in sorted_feats:
            p = f["properties"]
            if p["risk_score"] >= 80:
                reason = f"Critical flood susceptibility ({p['risk_score']}%) in low-elevation zone ({p['elevation_m']}m AMSL)."
                action = "Deploy 100+ HP suction pumps; close low-lying underpass routes."
            elif p["risk_score"] >= 60:
                reason = f"High runoff accumulation ({p['flow_accumulation']}/100) and elevated imperviousness."
                action = "Position standby mobile pumps; inspect culvert mouths."
            else:
                reason = f"Moderate runoff convergence with priority road corridor."
                action = "Monitor drainage discharge markers hourly."

            priority_list.append({
                "grid_id": p["grid_id"],
                "city_id": p.get("city_id", city_id.upper()),
                "zone_name": p["zone_name"],
                "risk_level": p["risk_level"],
                "risk_score": p["risk_score"],
                "priority_score": p["priority_score"],
                "elevation_m": p["elevation_m"],
                "distance_to_water_m": p.get("distance_to_water_m", 0.0),
                "reason": reason,
                "suggested_action": action
            })

        return {"city_id": city_id.upper(), "total_prioritized": len(priority_list), "zones": priority_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/risk/{grid_id}", response_model=PredictionResponse, tags=["Risk Analysis"])
def get_zone_detail(
    grid_id: str,
    rain_24h: Optional[float] = Query(None),
):
    """Inspect one Vijayawada grid cell."""
    try:
        res = predictor_service.predict_grid(
            grid_id=grid_id,
            rain_24h_mm=rain_24h,
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict_custom(req: PredictionRequest):
    """Predict risk for any grid cell under custom hyetograph inputs."""
    try:
        res = predictor_service.predict_grid(
            grid_id=req.grid_id,
            rain_1h_mm=req.rain_1h_mm,
            rain_3h_mm=req.rain_3h_mm,
            rain_6h_mm=req.rain_6h_mm,
            rain_12h_mm=req.rain_12h_mm,
            rain_24h_mm=req.rain_24h_mm,
            rain_72h_mm=req.rain_72h_mm,
            prediction_horizon_hours=req.prediction_horizon_hours
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/simulate", response_model=SimulationResponse, tags=["Simulation"])
def simulate_scenario(req: SimulationRequest):
    """Run What-If rainfall scenario on any city."""
    try:
        res = predictor_service.simulate_rainfall_scenario(
            city_id=req.city_id,
            multiplier=req.multiplier,
            base_rain_1h_mm=req.base_rain_1h_mm,
            base_rain_3h_mm=req.base_rain_3h_mm,
            base_rain_6h_mm=req.base_rain_6h_mm,
            base_rain_24h_mm=req.base_rain_24h_mm,
            base_rain_72h_mm=req.base_rain_72h_mm
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/historical-events", tags=["Historical Intelligence"])
def get_historical_events(city_id: Optional[str] = Query(None)):
    """Retrieve catalog of documented flood events across India or filtered by city."""
    if os.path.exists(settings.HISTORICAL_EVENTS_PATH):
        with open(settings.HISTORICAL_EVENTS_PATH, "r") as f:
            events = json.load(f)
            if city_id:
                events = [e for e in events if e.get("city_id", "").upper() == city_id.upper()]
            return events
    return []

def _public_evaluation(raw: Any) -> dict:
    """Flatten today's training report into the fields the console reads."""
    if not isinstance(raw, dict):
        return {"status": "Evaluation report not generated yet."}
    comparison = raw.get("tier_2_binary_benchmarking") or raw.get("model_comparison") or {}
    production = comparison.get("Calibrated XGBoost (Production)") or {}
    split = raw.get("split_summary") or {}
    benchmarks = []
    if isinstance(comparison, dict):
        for name, metrics in comparison.items():
            if not isinstance(metrics, dict):
                continue
            benchmarks.append({
                "name": name,
                "roc_auc": metrics.get("roc_auc"),
                "pr_auc": metrics.get("pr_auc"),
                "f1": metrics.get("f1_score"),
                "precision": metrics.get("precision"),
                "recall": metrics.get("recall"),
                "brier": metrics.get("brier_score"),
                "highlight": name == (raw.get("production_model") or "Calibrated XGBoost (Production)"),
            })
    shaped = {
        "model_version": raw.get("model_version"),
        "training_timestamp": raw.get("training_timestamp"),
        "production_model": raw.get("production_model"),
        "roc_auc": production.get("roc_auc"),
        "pr_auc": production.get("pr_auc"),
        "brier_score": production.get("brier_score"),
        "evaluation_samples": split.get("test_samples"),
        "feature_importances": raw.get("feature_importances") or [],
        "benchmarks": benchmarks,
    }
    matrix = production.get("confusion_matrix")
    if (
        isinstance(matrix, list)
        and len(matrix) == 2
        and all(isinstance(row, list) and len(row) == 2 for row in matrix)
    ):
        shaped["confusion_matrix"] = {
            "tn": matrix[0][0],
            "fp": matrix[0][1],
            "fn": matrix[1][0],
            "tp": matrix[1][1],
        }
    if isinstance(raw.get("calibration_curve"), list):
        shaped["calibration_curve"] = raw["calibration_curve"]
    return shaped


@api_router.get("/statistics", tags=["Analytics"])
def get_analytics_statistics():
    """Return the 2026-11-11 holdout report for the calibrated model."""
    stats = {}
    if os.path.exists(settings.EVALUATION_REPORT_PATH):
        with open(settings.EVALUATION_REPORT_PATH, "r") as f:
            stats["evaluation"] = _public_evaluation(json.load(f))
    else:
        stats["evaluation"] = {"status": "Evaluation report not generated yet."}

    stats["model_info"] = predictor_service.get_model_info()
    return stats

@api_router.get("/model/info", tags=["Model Governance"])
def get_model_governance():
    """Return active model version, parameters, thresholds, and performance metrics."""
    return predictor_service.get_model_info()

@api_router.get("/model/explain/{grid_id}", tags=["Explainability"])
def explain_grid_model(grid_id: str, rain_24h: Optional[float] = Query(None)):
    """Expose feature contributions and explainability rationale for specific cell."""
    try:
        pred = predictor_service.predict_grid(grid_id=grid_id, rain_24h_mm=rain_24h)
        return {
            "grid_id": grid_id,
            "city_id": pred.get("city_id", "VJA"),
            "zone_name": pred["zone_name"],
            "risk_score": pred["risk_score"],
            "risk_level": pred["risk_level"],
            "top_factors": pred["top_factors"],
            "terrain_features": pred["terrain"],
            "scientific_disclaimer": "Model-derived feature attributions. Non-statutory early warning."
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

def verify_admin_token(x_admin_token: Optional[str] = Header(None)):
    if not x_admin_token or x_admin_token != settings.ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or missing admin security token.")
    return True

@api_router.post("/admin/retrain", response_model=AdminActionResponse, tags=["Admin"])
def retrain_model_admin(authorized: bool = Depends(verify_admin_token)):
    try:
        from ml.src.training.train import train_and_compare_models
        meta = train_and_compare_models()
        predictor_service.reload()
        return {
            "success": True,
            "action": "MODEL_RETRAIN",
            "message": f"Successfully retrained model {meta.get('model_version')}.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "details": meta.get("active_model_metrics")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@api_router.post("/admin/refresh-data", response_model=AdminActionResponse, tags=["Admin"])
def refresh_telemetry_admin(authorized: bool = Depends(verify_admin_token)):
    try:
        csv_path = os.path.join(os.path.dirname(settings.GRID_FEATURES_PATH), "..", "raw", "multi_city_hourly_rainfall.csv")
        csv_path = os.path.normpath(csv_path)
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
        else:
            from ml.src.ingestion.rainfall_loader import generate_multi_city_telemetry
            df = generate_multi_city_telemetry()
        return {
            "success": True,
            "action": "DATA_REFRESH",
            "message": f"Refreshed multi-city rainfall telemetry ({len(df)} records).",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "details": {"records_ingested": len(df), "cities_covered": list(predictor_service.all_grid_features_df["city_id"].unique()) if predictor_service.all_grid_features_df is not None else []}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data refresh failed: {str(e)}")

@api_router.post("/ai/copilot", response_model=AICopilotResponse, tags=["AI Copilot"])
def ai_incident_copilot(req: AICopilotRequest):
    """
    AI Urban Flood Incident Copilot:
    Integrates Gemini / Groq LLMs and DrainSense Neural RAG Generative Engine.
    """
    from backend.app.services.ai_copilot import run_ai_copilot

    cid = req.city_id.upper()
    query_str = (req.query or "").strip()

    if not query_str:
        raise HTTPException(status_code=422, detail="Query cannot be empty. Please ask an operational question.")

    try:
        rain = req.current_rainfall_24h_mm
        risk_data = predictor_service.get_current_risk_map(
            city_id=cid,
            rain_24h_mm=rain,
        )
        summary = risk_data["summary"]
        peak_zone = summary.get("highest_risk_zone", {})
        
        # Pull city alerts and assets for real-time context
        city_alerts = [a for a in globals().get("ALERTS_DATA", []) if a.get("city_id") == cid]
        city_assets = [a for a in globals().get("DRAIN_ASSETS_DATA", []) if a.get("city_id") == cid]
        
        # Dispatch to multi-provider AI copilot engine
        result = run_ai_copilot(
            city_id=cid,
            query=query_str,
            rain_24h=rain,
            summary=summary,
            peak_zone=peak_zone,
            api_key=req.api_key,
            provider=req.provider or "auto",
            history=req.conversation_history or [],
            active_alerts=city_alerts,
            assets=city_assets
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Copilot failed: {str(e)}")


# ==========================================
# DRAIN ASSET MANAGEMENT
# ==========================================

DRAIN_ASSETS_DATA: List[Dict[str, Any]] = []

@api_router.get("/assets", response_model=List[DrainAsset], tags=["Assets"])
def get_drain_assets(city_id: Optional[str] = Query(None, description="Optional city code filter")):
    """List municipal storm drainage infrastructure assets with conditions and live operational statuses."""
    if city_id and city_id.upper() != "ALL":
        cid = city_id.upper()
        return [a for a in DRAIN_ASSETS_DATA if a["city_id"] == cid]
    return DRAIN_ASSETS_DATA

# ==========================================
# ALERTS & INCIDENT WORKFLOW
# ==========================================

ALERTS_DATA: List[Dict[str, Any]] = []

@api_router.get("/alerts", response_model=List[AlertItem], tags=["Alerts"])
def get_alerts(city_id: Optional[str] = Query(None)):
    """List operational waterlogging emergency alerts."""
    if city_id and city_id.upper() != "ALL":
        cid = city_id.upper()
        return [a for a in ALERTS_DATA if a["city_id"] == cid]
    return ALERTS_DATA

@api_router.post("/alerts/{alert_id}/acknowledge", response_model=AlertItem, tags=["Alerts"])
def acknowledge_alert(alert_id: str, officer_name: Optional[str] = Query("Municipal desk")):
    """Acknowledge an active alert and trigger field dispatch protocol."""
    for alert in ALERTS_DATA:
        if alert["alert_id"] == alert_id:
            alert["status"] = "ACKNOWLEDGED"
            alert["acknowledged_by"] = officer_name
            alert["acknowledged_at"] = datetime.utcnow().isoformat() + "Z"
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")

@api_router.post("/alerts/{alert_id}/resolve", response_model=AlertItem, tags=["Alerts"])
def resolve_alert(alert_id: str):
    """Mark an operational alert as RESOLVED after dewatering clearance."""
    for alert in ALERTS_DATA:
        if alert["alert_id"] == alert_id:
            alert["status"] = "RESOLVED"
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")


# ==============================================================================
# NOVEL RESEARCH & OPERATIONAL INTELLIGENCE ENDPOINTS
# ==============================================================================

@api_router.get("/hydrology/cascade/{grid_id}", tags=["Novel Hydrology"])
def trace_downstream_cascade(grid_id: str, rain_24h: Optional[float] = Query(None)):
    """
    NOVELTY 1: Directed Acyclic Hydrological Flow Graph (DAHG) Cascade Engine.
    Traces downstream flood pulse propagation, Manning's flow velocity, and arrival lag times (tau_lag)
    from the origin cell through terrain depressions down to primary water outfalls.
    """
    try:
        cascade_data = predictor_service.trace_cascade(grid_id=grid_id, rain_24h_mm=rain_24h)
        return cascade_data
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cascade calculation error: {str(e)}")


@api_router.get("/hydrology/physics-audit/{grid_id}", tags=["Novel Hydrology"])
def audit_physics_concordance(grid_id: str, rain_24h: Optional[float] = Query(None)):
    """
    NOVELTY 2: Physics-Informed SCS-CN Mass-Balance Guardrail (PIML).
    Evaluates USDA-NRCS Curve Number runoff physics equations against machine learning risk inferences
    to compute the Hydrological Concordance Index (HCI) and flag structural choke anomalies.
    """
    try:
        audit_data = predictor_service.get_physics_audit(grid_id=grid_id, rain_24h_mm=rain_24h)
        return audit_data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Physics audit error: {str(e)}")


@api_router.get("/hydrology/nowcast/{city_id}", tags=["Novel Hydrology"])
def get_temporal_nowcast(city_id: str = "VJA", rain_24h: Optional[float] = Query(None)):
    """
    NOVELTY 3: Dynamic Multi-Horizon Temporal Nowcaster (T+0 to T+6h).
    Generates forward temporal risk trajectories based on convective storm hyetograph profiles,
    allowing municipal commanders to scrub through the surge, peak, and recession of the flood wave.
    """
    try:
        nowcast_data = predictor_service.get_temporal_nowcast(city_id=city_id, base_rain_24h_mm=rain_24h)
        return nowcast_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nowcast calculation error: {str(e)}")


@api_router.post("/operations/optimize-dispatch", tags=["Operations Research"])
def optimize_fleet_dispatch(req: DispatchOptimizationRequest):
    """
    NOVELTY 4: Autonomous Operations-Research Municipal Dispatch Optimizer.
    Solves a multi-objective integer resource allocation problem for high-capacity dewatering pumps,
    super-suckers, and rescue squads. Generates an official NDMA-format Disaster Incident Action Memorandum.
    """
    try:
        cid = req.city_id.upper()
        # Retrieve prioritized zones for the city
        p_res = get_priority_zones(city_id=cid, limit=15)
        priority_zones = p_res.get("zones", [])

        dispatch_result = optimize_municipal_dispatch(
            city_id=cid,
            priority_zones=priority_zones,
            available_fleet=req.available_fleet,
            officer_name=req.officer_name or "Municipal desk"
        )
        return dispatch_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fleet optimization error: {str(e)}")


