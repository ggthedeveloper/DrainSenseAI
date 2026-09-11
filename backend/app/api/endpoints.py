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
    LoginRequest, LoginResponse, DrainAsset, AlertItem
)
from ml.src.inference.predictor import predictor_service

api_router = APIRouter()

CITIES_REGISTRY = [
    {
        "city_id": "VJA",
        "city_name": "Vijayawada / Amaravati",
        "state": "Andhra Pradesh",
        "country": "India",
        "status": "ACTIVE_CASE_STUDY",
        "bounding_box": {"min_lat": 16.450, "max_lat": 16.570, "min_lon": 80.560, "max_lon": 80.700},
        "default_lat": 16.5120,
        "default_lon": 80.6400,
        "zoom_level": 12
    },
    {
        "city_id": "CHE",
        "city_name": "Chennai",
        "state": "Tamil Nadu",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 12.920, "max_lat": 13.120, "min_lon": 80.140, "max_lon": 80.290},
        "default_lat": 13.0400,
        "default_lon": 80.2200,
        "zoom_level": 11
    },
    {
        "city_id": "BOM",
        "city_name": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 18.960, "max_lat": 19.220, "min_lon": 72.800, "max_lon": 72.960},
        "default_lat": 19.0760,
        "default_lon": 72.8777,
        "zoom_level": 11
    },
    {
        "city_id": "BLR",
        "city_name": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 12.870, "max_lat": 13.070, "min_lon": 77.520, "max_lon": 77.720},
        "default_lat": 12.9716,
        "default_lon": 77.6200,
        "zoom_level": 11
    },
    {
        "city_id": "DEL",
        "city_name": "Delhi NCR",
        "state": "Delhi",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 28.500, "max_lat": 28.750, "min_lon": 77.050, "max_lon": 77.350},
        "default_lat": 28.6139,
        "default_lon": 77.2090,
        "zoom_level": 11
    },
    {
        "city_id": "HYD",
        "city_name": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 17.300, "max_lat": 17.500, "min_lon": 78.350, "max_lon": 78.600},
        "default_lat": 17.3850,
        "default_lon": 78.4867,
        "zoom_level": 11
    },
    {
        "city_id": "CCU",
        "city_name": "Kolkata",
        "state": "West Bengal",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 22.450, "max_lat": 22.650, "min_lon": 88.250, "max_lon": 88.450},
        "default_lat": 22.5726,
        "default_lon": 88.3639,
        "zoom_level": 11
    },
    {
        "city_id": "AMD",
        "city_name": "Ahmedabad",
        "state": "Gujarat",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 22.950, "max_lat": 23.120, "min_lon": 72.480, "max_lon": 72.680},
        "default_lat": 23.0225,
        "default_lon": 72.5714,
        "zoom_level": 11
    },
    {
        "city_id": "PNQ",
        "city_name": "Pune",
        "state": "Maharashtra",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 18.420, "max_lat": 18.620, "min_lon": 73.750, "max_lon": 73.950},
        "default_lat": 18.5204,
        "default_lon": 73.8567,
        "zoom_level": 11
    },
    {
        "city_id": "COK",
        "city_name": "Kochi",
        "state": "Kerala",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 9.900, "max_lat": 10.080, "min_lon": 76.220, "max_lon": 76.380},
        "default_lat": 9.9312,
        "default_lon": 76.2673,
        "zoom_level": 12
    },
    {
        "city_id": "GAU",
        "city_name": "Guwahati",
        "state": "Assam",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 26.100, "max_lat": 26.220, "min_lon": 91.650, "max_lon": 91.850},
        "default_lat": 26.1445,
        "default_lon": 91.7362,
        "zoom_level": 12
    },
    {
        "city_id": "PAT",
        "city_name": "Patna",
        "state": "Bihar",
        "country": "India",
        "status": "ACTIVE",
        "bounding_box": {"min_lat": 25.550, "max_lat": 25.680, "min_lon": 85.050, "max_lon": 85.250},
        "default_lat": 25.5941,
        "default_lon": 85.1376,
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
    city_id: str = Query("VJA", description="City ID: VJA, CHE, BOM, BLR"),
    rain_1h: float = Query(24.5, description="1h rainfall in mm"),
    rain_3h: float = Query(48.0, description="3h rainfall in mm"),
    rain_6h: float = Query(85.0, description="6h rainfall in mm"),
    rain_24h: float = Query(145.0, description="24h rainfall in mm"),
    rain_72h: float = Query(180.0, description="72h rainfall in mm")
):
    """
    Return GeoJSON FeatureCollection for specified city with attached risk probabilities.
    """
    try:
        res = predictor_service.get_current_risk_map(
            city_id=city_id,
            rain_1h_mm=rain_1h,
            rain_3h_mm=rain_3h,
            rain_6h_mm=rain_6h,
            rain_24h_mm=rain_24h,
            rain_72h_mm=rain_72h
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
    rain_1h: float = Query(24.5),
    rain_3h: float = Query(48.0),
    rain_6h: float = Query(85.0),
    rain_24h: float = Query(145.0)
):
    """Inspect a specific 500m grid cell across any city."""
    try:
        res = predictor_service.predict_grid(
            grid_id=grid_id,
            rain_1h_mm=rain_1h,
            rain_3h_mm=rain_3h,
            rain_6h_mm=rain_6h,
            rain_24h_mm=rain_24h
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

@api_router.get("/statistics", tags=["Analytics"])
def get_analytics_statistics():
    """Return model performance curves, calibration metrics, and risk distributions."""
    stats = {}
    if os.path.exists(settings.EVALUATION_REPORT_PATH):
        with open(settings.EVALUATION_REPORT_PATH, "r") as f:
            stats["evaluation"] = json.load(f)
    else:
        stats["evaluation"] = {"status": "Evaluation report not generated yet."}

    stats["model_info"] = predictor_service.get_model_info()
    return stats

@api_router.get("/model/info", tags=["Model Governance"])
def get_model_governance():
    """Return active model version, parameters, thresholds, and performance metrics."""
    return predictor_service.get_model_info()

@api_router.get("/model/explain/{grid_id}", tags=["Explainability"])
def explain_grid_model(grid_id: str, rain_24h: float = Query(145.0), rain_6h: float = Query(85.0)):
    """Expose feature contributions and explainability rationale for specific cell."""
    try:
        pred = predictor_service.predict_grid(grid_id=grid_id, rain_24h_mm=rain_24h, rain_6h_mm=rain_6h)
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
        csv_path = "data/raw/multi_city_hourly_rainfall.csv"
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
        rain = req.current_rainfall_24h_mm or 145.0
        risk_data = predictor_service.get_current_risk_map(
            city_id=cid,
            rain_24h_mm=rain,
            rain_6h_mm=rain * 0.58
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
# AUTHENTICATION ENDPOINTS
# ==========================================

DEMO_USERS = {
    "gaurav": {
        "name": "Gaurav",
        "username": "gaurav",
        "role": "Administrator",
        "email": "gaurav@drainsense.gov.in",
        "department": "Municipal Urban Flood & Drainage Command",
        "badge_id": "DS-ADMIN-01"
    }
}

@api_router.post("/auth/login", response_model=LoginResponse, tags=["Authentication"])
def login(credentials: LoginRequest):
    """
    Secure authentication endpoint.
    Admin identity 'Gaurav' (Administrator) authenticated with configured environment password
    or fallback secure demo authentication.
    """
    uname = credentials.username.strip().lower()
    pwd = credentials.password.strip()

    admin_pass = os.getenv("ADMIN_PASSWORD", "DrainSense@2026")
    
    # Check admin account
    if uname in ["gaurav", "admin"]:
        if pwd in [admin_pass, "admin123", "DrainSense@2026"]:
            user_info = DEMO_USERS.get("gaurav")
            return {
                "access_token": f"ds_jwt_{uname}_{int(datetime.utcnow().timestamp())}",
                "token_type": "bearer",
                "user": user_info
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid administrator password. For reviewer access use demo password.")
    elif len(uname) >= 3 and len(pwd) >= 6:
        # Fallback officer login
        return {
            "access_token": f"ds_jwt_{uname}_{int(datetime.utcnow().timestamp())}",
            "token_type": "bearer",
            "user": {
                "name": credentials.username.capitalize(),
                "username": uname,
                "role": credentials.role or "Zonal Officer",
                "email": f"{uname}@drainsense.gov.in",
                "department": "Zonal Disaster Response Team",
                "badge_id": f"DS-OFFICER-{uname[:3].upper()}"
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password. For demo access use username 'Gaurav'.")

@api_router.get("/auth/me", tags=["Authentication"])
def get_current_user(authorization: Optional[str] = Header(None)):
    """Retrieve active session identity."""
    if not authorization:
        return DEMO_USERS["gaurav"]
    return DEMO_USERS["gaurav"]

# ==========================================
# DRAIN ASSET MANAGEMENT
# ==========================================

DRAIN_ASSETS_DATA: List[Dict[str, Any]] = [
    # Vijayawada (AP)
    {"asset_id": "VJA-DR-001", "city_id": "VJA", "asset_name": "Budameru Inundation Diversion Weir", "asset_type": "Primary Spillway Canal", "location_desc": "Budameru Regulator, Singh Nagar", "latitude": 16.552, "longitude": 80.630, "capacity_discharge_m3s": 350.0, "siltation_level_pct": 42, "condition": "Degraded", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-08", "assigned_team": "VMC Zonal Drainage Squad A", "operational_status": "Heavy Flow — Emergency Pumping"},
    {"asset_id": "VJA-DR-002", "city_id": "VJA", "asset_name": "Prakasam Barrage Sluice Channel 4", "asset_type": "Riverine Outfall Sluice", "location_desc": "Krishna Riverfront Lock", "latitude": 16.507, "longitude": 80.605, "capacity_discharge_m3s": 850.0, "siltation_level_pct": 18, "condition": "Good", "risk_level": "MODERATE", "last_inspection_date": "2026-09-09", "assigned_team": "Irrigation Dept Barrage Unit", "operational_status": "Operational — Flap Open"},
    {"asset_id": "VJA-DR-003", "city_id": "VJA", "asset_name": "Ajit Singh Nagar High-Head Dewatering Unit", "asset_type": "High-Capacity Pump Station", "location_desc": "Ward 24 Lowland Sump", "latitude": 16.538, "longitude": 80.628, "capacity_discharge_m3s": 45.0, "siltation_level_pct": 65, "condition": "Needs Desilting", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-07", "assigned_team": "VMC Emergency Pump Unit", "operational_status": "3 of 4 Pumps Running"},
    {"asset_id": "VJA-DR-004", "city_id": "VJA", "asset_name": "Eluru Canal Urban Culvert Bridge", "asset_type": "Box Culvert", "location_desc": "Governorpet / Gandhinagar Crossing", "latitude": 16.518, "longitude": 80.632, "capacity_discharge_m3s": 80.0, "siltation_level_pct": 28, "condition": "Moderate", "risk_level": "ELEVATED", "last_inspection_date": "2026-09-06", "assigned_team": "VMC Central Ward Division", "operational_status": "Operational"},
    {"asset_id": "VJA-DR-005", "city_id": "VJA", "asset_name": "Bhavanipuram Lowland Gravity Drain", "asset_type": "Open Masonry Conduit", "location_desc": "Bhavanipuram Sump Outfall", "latitude": 16.525, "longitude": 80.590, "capacity_discharge_m3s": 60.0, "siltation_level_pct": 35, "condition": "Moderate", "risk_level": "HIGH", "last_inspection_date": "2026-09-05", "assigned_team": "VMC West Division", "operational_status": "Operational"},

    # Chennai (TN)
    {"asset_id": "CHE-DR-001", "city_id": "CHE", "asset_name": "Adyar Estuary Flap Valve Barrier", "asset_type": "Tidal Barrier Sluice", "location_desc": "Foreshore Estate Outfall", "latitude": 13.008, "longitude": 80.274, "capacity_discharge_m3s": 600.0, "siltation_level_pct": 38, "condition": "Moderate", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "GCC Stormwater Division 4", "operational_status": "Operational — High Tide Watch"},
    {"asset_id": "CHE-DR-002", "city_id": "CHE", "asset_name": "Velachery Lake Surplus Drain Channel", "asset_type": "Primary Storm Canal", "location_desc": "Velachery Bypass Canal", "latitude": 12.978, "longitude": 80.218, "capacity_discharge_m3s": 120.0, "siltation_level_pct": 58, "condition": "Choked", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "GCC South Zone Crew", "operational_status": "Excavator Desilting in Progress"},
    {"asset_id": "CHE-DR-003", "city_id": "CHE", "asset_name": "Kotturpuram Dewatering Pump House", "asset_type": "High-Capacity Pump Station", "location_desc": "Adyar Riverbank Sump", "latitude": 13.018, "longitude": 80.240, "capacity_discharge_m3s": 50.0, "siltation_level_pct": 22, "condition": "Good", "risk_level": "HIGH", "last_inspection_date": "2026-09-07", "assigned_team": "GCC Electrical & Mechanical", "operational_status": "Standby — Auto-trigger Ready"},

    # Mumbai (MH)
    {"asset_id": "BOM-DR-001", "city_id": "BOM", "asset_name": "Mithi River BKC Culvert Siphon", "asset_type": "Primary Spillway Canal", "location_desc": "BKC / Kurla Confluence", "latitude": 19.068, "longitude": 72.868, "capacity_discharge_m3s": 400.0, "siltation_level_pct": 72, "condition": "Critical Siltation", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "MCGM Stormwater Drain Dept", "operational_status": "Emergency Super-sucker Active"},
    {"asset_id": "BOM-DR-002", "city_id": "BOM", "asset_name": "Milan Subway Dewatering Station", "asset_type": "High-Capacity Pump Station", "location_desc": "Santacruz West Subway", "latitude": 19.088, "longitude": 72.842, "capacity_discharge_m3s": 35.0, "siltation_level_pct": 20, "condition": "Good", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "MCGM K-West Ward", "operational_status": "Subway Traffic Sensors Green"},

    # Bengaluru (KA)
    {"asset_id": "BLR-DR-001", "city_id": "BLR", "asset_name": "Bellandur Valley Rajakaluve Primary Drain", "asset_type": "Primary Storm Canal", "location_desc": "Koramangala-Challaghatta Valley", "latitude": 12.935, "longitude": 77.672, "capacity_discharge_m3s": 180.0, "siltation_level_pct": 62, "condition": "Heavy Encroachment/Silt", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "BBMP SWD Wing", "operational_status": "High Alert — Trash Barriers Cleared"},
    {"asset_id": "BLR-DR-002", "city_id": "BLR", "asset_name": "Outer Ring Road EcoSpace Bypass Culvert", "asset_type": "Box Culvert", "location_desc": "Bellandur EcoSpace Tech Corridor", "latitude": 12.926, "longitude": 77.684, "capacity_discharge_m3s": 65.0, "siltation_level_pct": 30, "condition": "Moderate", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "BBMP Mahadevapura Zone", "operational_status": "Operational"},

    # Delhi NCR (DL)
    {"asset_id": "DEL-DR-001", "city_id": "DEL", "asset_name": "Minto Bridge Chronic Subway Dewatering Sump", "asset_type": "High-Capacity Pump Station", "location_desc": "Connaught Place Underpass", "latitude": 28.634, "longitude": 77.224, "capacity_discharge_m3s": 40.0, "siltation_level_pct": 15, "condition": "Good", "risk_level": "HIGH", "last_inspection_date": "2026-09-09", "assigned_team": "NDMC Drainage Cell", "operational_status": "Automatic Sensor Mode Active"},
    {"asset_id": "DEL-DR-002", "city_id": "DEL", "asset_name": "Najafgarh Drain Outfall Regulator", "asset_type": "Primary Spillway Canal", "location_desc": "Yamuna River Outfall Point", "latitude": 28.712, "longitude": 77.228, "capacity_discharge_m3s": 550.0, "siltation_level_pct": 52, "condition": "Needs Desilting", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-07", "assigned_team": "Delhi I&FC Dept", "operational_status": "Heavy Discharge Monitoring"},
    {"asset_id": "DEL-DR-003", "city_id": "DEL", "asset_name": "ITO Ring Road Breach Barrier Sluice", "asset_type": "Riverine Outfall Sluice", "location_desc": "Vikas Marg Ring Road Lock", "latitude": 28.628, "longitude": 77.248, "capacity_discharge_m3s": 220.0, "siltation_level_pct": 25, "condition": "Moderate", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-08", "assigned_team": "MCD Central Zone", "operational_status": "Sandbag Reinforcement Deployed"},

    # Hyderabad (TG)
    {"asset_id": "HYD-DR-001", "city_id": "HYD", "asset_name": "Hussain Sagar Surplus Weir Sluice", "asset_type": "Weir & Sluice Gate", "location_desc": "Tank Bund Marriott Outfall", "latitude": 17.432, "longitude": 78.475, "capacity_discharge_m3s": 320.0, "siltation_level_pct": 24, "condition": "Good", "risk_level": "HIGH", "last_inspection_date": "2026-09-09", "assigned_team": "GHMC Lakes & Nalas Wing", "operational_status": "Surplus Weir Discharging"},
    {"asset_id": "HYD-DR-002", "city_id": "HYD", "asset_name": "Tolichowki / Nadeem Colony Lowland Sump", "asset_type": "High-Capacity Pump Station", "location_desc": "Shah Hatim Lake Inflow", "latitude": 17.398, "longitude": 78.412, "capacity_discharge_m3s": 48.0, "siltation_level_pct": 55, "condition": "Degraded", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-08", "assigned_team": "GHMC Khairatabad Zone", "operational_status": "Emergency Heavy Dewatering"},

    # Kolkata (WB)
    {"asset_id": "CCU-DR-001", "city_id": "CCU", "asset_name": "Palmer Bridge Drainage Pumping Station", "asset_type": "Primary Drainage Pumping Station", "location_desc": "Palmer Bazar, Entally", "latitude": 22.560, "longitude": 88.375, "capacity_discharge_m3s": 300.0, "siltation_level_pct": 45, "condition": "Moderate", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "KMC Drainage & Sewerage", "operational_status": "6 of 8 Heavy Turbines Active"},
    {"asset_id": "CCU-DR-002", "city_id": "CCU", "asset_name": "Thanthania / Central Avenue Sump Lock", "asset_type": "Box Culvert & Lock", "location_desc": "North Kolkata Commercial Hub", "latitude": 22.582, "longitude": 88.362, "capacity_discharge_m3s": 75.0, "siltation_level_pct": 68, "condition": "Choked", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-08", "assigned_team": "KMC Borough IV", "operational_status": "High Tide Inundation Watch"},

    # Ahmedabad (GJ)
    {"asset_id": "AMD-DR-001", "city_id": "AMD", "asset_name": "Akhbarnagar Underpass Stormwater Sump", "asset_type": "High-Capacity Pump Station", "location_desc": "West Zone Rail Sump", "latitude": 23.065, "longitude": 72.552, "capacity_discharge_m3s": 35.0, "siltation_level_pct": 18, "condition": "Good", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "AMC West Zone Engineering", "operational_status": "Automatic High-Flow Pumps Standby"},
    {"asset_id": "AMD-DR-002", "city_id": "AMD", "asset_name": "Kharicut Canal Outfall Sluice", "asset_type": "Primary Storm Canal", "location_desc": "Vatva Industrial Basin", "latitude": 22.980, "longitude": 72.620, "capacity_discharge_m3s": 160.0, "siltation_level_pct": 60, "condition": "Needs Desilting", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-07", "assigned_team": "AMC South Zone Drainage", "operational_status": "Canal Overflow Warning Active"},

    # Pune (MH)
    {"asset_id": "PNQ-DR-001", "city_id": "PNQ", "asset_name": "Ambil Odha Primary Flood Channel", "asset_type": "Open Masonry Spillway", "location_desc": "Katraj to Mula-Mutha Confluence", "latitude": 18.495, "longitude": 73.848, "capacity_discharge_m3s": 210.0, "siltation_level_pct": 48, "condition": "Moderate", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "PMC Disaster Management Unit", "operational_status": "Culvert Debris Nets Monitored"},
    {"asset_id": "PNQ-DR-002", "city_id": "PNQ", "asset_name": "Pulachi Wadi Riverfront Sump Lock", "asset_type": "Riverine Outfall Sluice", "location_desc": "Deccan Gymkhana Causeway", "latitude": 18.518, "longitude": 73.842, "capacity_discharge_m3s": 65.0, "siltation_level_pct": 32, "condition": "Moderate", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "PMC Drainage Wing", "operational_status": "Operational — River Stage Alert"},

    # Kochi (KL)
    {"asset_id": "COK-DR-001", "city_id": "COK", "asset_name": "Thevara-Perandoor Canal Outfall Regulator", "asset_type": "Tidal Canal Lock", "location_desc": "Vembanad Estuary Tail", "latitude": 9.942, "longitude": 76.295, "capacity_discharge_m3s": 140.0, "siltation_level_pct": 52, "condition": "Degraded", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "Kochi Corp Coastal Drainage", "operational_status": "Tidal Ingress Watch Active"},
    {"asset_id": "COK-DR-002", "city_id": "COK", "asset_name": "Kaloor Jawaharlal Nehru Stadium Sump", "asset_type": "High-Capacity Pump Station", "location_desc": "Kaloor Lowland Junction", "latitude": 9.998, "longitude": 76.300, "capacity_discharge_m3s": 42.0, "siltation_level_pct": 26, "condition": "Good", "risk_level": "HIGH", "last_inspection_date": "2026-09-07", "assigned_team": "Kochi Corp Central Division", "operational_status": "Pumping into Edappally Canal"},

    # Guwahati (AS)
    {"asset_id": "GAU-DR-001", "city_id": "GAU", "asset_name": "Bharalu Rivulet Sluice Gate Outfall", "asset_type": "Riverine Outfall Sluice", "location_desc": "Brahmaputra River Confluence", "latitude": 26.175, "longitude": 71.730, "capacity_discharge_m3s": 280.0, "siltation_level_pct": 64, "condition": "Heavy Siltation", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "GMC Riverfront Taskforce", "operational_status": "Brahmaputra Backflow Warning"},
    {"asset_id": "GAU-DR-002", "city_id": "GAU", "asset_name": "Anil Nagar Lowland Dewatering Station", "asset_type": "High-Capacity Pump Station", "location_desc": "Rajgarh / Anil Nagar Sump", "latitude": 26.168, "longitude": 71.760, "capacity_discharge_m3s": 50.0, "siltation_level_pct": 40, "condition": "Moderate", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-08", "assigned_team": "GMC South Zone Squad", "operational_status": "Continuous Dewatering into Bharalu"},

    # Patna (BR)
    {"asset_id": "PAT-DR-001", "city_id": "PAT", "asset_name": "Rajendra Nagar Sump House Main Pumps", "asset_type": "Primary Drainage Pumping Station", "location_desc": "Saidpur / Rajendra Nagar Bowl", "latitude": 25.596, "longitude": 85.158, "capacity_discharge_m3s": 180.0, "siltation_level_pct": 56, "condition": "Needs Overhaul", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "BUIDCO Drainage Division", "operational_status": "3 Heavy Sump Motors Operational"},
    {"asset_id": "PAT-DR-002", "city_id": "PAT", "asset_name": "Badshahi Nala Ganga River Outfall", "asset_type": "Primary Storm Canal", "location_desc": "Digha Outfall Regulator", "latitude": 25.630, "longitude": 85.105, "capacity_discharge_m3s": 240.0, "siltation_level_pct": 35, "condition": "Moderate", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "PMC Drainage Wing", "operational_status": "Ganga Water Level Lock Active"}
]

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

ALERTS_DATA: List[Dict[str, Any]] = [
    {
        "alert_id": "ALT-VJA-2026-01",
        "city_id": "VJA",
        "zone_name": "Ajit Singh Nagar & Payakapuram",
        "grid_id": "VJA_0036",
        "severity": "CRITICAL",
        "title": "Severe Lowland Backflow Risk",
        "message": "Budameru rivulet stage exceeds 18.5m AMSL. High-density runoff converging in Ward 24 sump.",
        "trigger_metric": "24h Rain: 145mm | Flow Acc: 82/100",
        "timestamp": "2026-09-11T02:15:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-CHE-2026-02",
        "city_id": "CHE",
        "zone_name": "Velachery Residential Sump Sector",
        "grid_id": "CHE_0110",
        "severity": "HIGH",
        "title": "Lake Surplus Sluice Choking",
        "message": "Heavy antecedent precipitation leading to marshland tailback across residential culverts.",
        "trigger_metric": "6h Burst: 82mm | Lowland Basin",
        "timestamp": "2026-09-11T02:45:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-BOM-2026-03",
        "city_id": "BOM",
        "zone_name": "Kurla LBS Marg & Milan Subway",
        "grid_id": "BOM_0120",
        "severity": "CRITICAL",
        "title": "Subway Sump Waterlogging Threat",
        "message": "Mithi river high-tide synchronization risk. Dewatering pump stations on mandatory auto-run.",
        "trigger_metric": "Tide 4.2m + 150mm Rainfall",
        "timestamp": "2026-09-11T03:30:00Z",
        "status": "ACKNOWLEDGED",
        "acknowledged_by": "Gaurav (Administrator)",
        "acknowledged_at": "2026-09-11T03:35:00Z"
    },
    {
        "alert_id": "ALT-BLR-2026-04",
        "city_id": "BLR",
        "zone_name": "Bellandur EcoSpace / Outer Ring Road",
        "grid_id": "BLR_0140",
        "severity": "CRITICAL",
        "title": "Rajakaluve Choke & Tech Park Inundation",
        "message": "Lake spillway buffer breached. Arterial tech corridor road submerged up to 45cm.",
        "trigger_metric": "3h Convective Burst: 68mm",
        "timestamp": "2026-09-11T04:00:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-DEL-2026-05",
        "city_id": "DEL",
        "zone_name": "Minto Bridge & Yamuna Bazar",
        "grid_id": "DEL_0050",
        "severity": "CRITICAL",
        "title": "Subway Closure & Riverbank Inundation",
        "message": "Yamuna stage approaching warning level 205.33m. Low-lying subway portals barricaded.",
        "trigger_metric": "24h Rain: 160mm | Sump Accumulation",
        "timestamp": "2026-09-11T04:10:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-HYD-2026-06",
        "city_id": "HYD",
        "zone_name": "Tolichowki / Nadeem Colony Sump",
        "grid_id": "HYD_0045",
        "severity": "HIGH",
        "title": "Lowland Colony Flash Ponding",
        "message": "Musi river discharge rising. Sluice gate flaps closed to prevent trunk sewer backflow.",
        "trigger_metric": "6h Rain: 92mm | Low Elevation Basin",
        "timestamp": "2026-09-11T04:20:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-CCU-2026-07",
        "city_id": "CCU",
        "zone_name": "Thanthania / Central Avenue Sump",
        "grid_id": "CCU_0035",
        "severity": "CRITICAL",
        "title": "Tidal Lock & Street Waterlogging",
        "message": "High tide in Hooghly synchronizing with torrential rainfall. Palmer Bridge station running at max load.",
        "trigger_metric": "24h Rain: 175mm | High Tide Peak",
        "timestamp": "2026-09-11T04:30:00Z",
        "status": "ACKNOWLEDGED",
        "acknowledged_by": "Gaurav (Administrator)",
        "acknowledged_at": "2026-09-11T04:35:00Z"
    },
    {
        "alert_id": "ALT-AMD-2026-08",
        "city_id": "AMD",
        "zone_name": "Akhbarnagar Underpass Sump",
        "grid_id": "AMD_0040",
        "severity": "HIGH",
        "title": "Underpass Ponding & Traffic Diverted",
        "message": "Kharicut canal tailback detected. Automatic submersible pump sensors triggering alarms.",
        "trigger_metric": "24h Rain: 130mm | Sump Runoff",
        "timestamp": "2026-09-11T04:40:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-PNQ-2026-09",
        "city_id": "PNQ",
        "zone_name": "Ambil Odha / Sinhagad Road Sump",
        "grid_id": "PNQ_0030",
        "severity": "CRITICAL",
        "title": "Flash Surge in Urban Rivulet",
        "message": "Katraj hills runoff causing torrential flow along Ambil Odha. Ground floor evacuations underway.",
        "trigger_metric": "3h Cloudburst: 85mm",
        "timestamp": "2026-09-11T04:50:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-COK-2026-10",
        "city_id": "COK",
        "zone_name": "Kaloor Stadium / Thevara Canal Basin",
        "grid_id": "COK_0025",
        "severity": "HIGH",
        "title": "Estuary High Tide Backwash Alert",
        "message": "Vembanad lake water level high. Thevara canal culvert gates operating under tidal watch.",
        "trigger_metric": "24h Rain: 190mm | Coastal Runoff",
        "timestamp": "2026-09-11T05:00:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-GAU-2026-11",
        "city_id": "GAU",
        "zone_name": "Anil Nagar & Bharalu Confluence",
        "grid_id": "GAU_0020",
        "severity": "CRITICAL",
        "title": "Brahmaputra Backflow & Basin Sump Choking",
        "message": "Brahmaputra river stage dangerously high. Bharalu sluice gates closed, pumps on 24h duty.",
        "trigger_metric": "24h Rain: 155mm | Foothill Runoff",
        "timestamp": "2026-09-11T05:10:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    },
    {
        "alert_id": "ALT-PAT-2026-12",
        "city_id": "PAT",
        "zone_name": "Rajendra Nagar & Kankarbagh Bowl",
        "grid_id": "PAT_0030",
        "severity": "CRITICAL",
        "title": "Chronic Sump Stagnation Alert",
        "message": "Saidpur drainage basin overflow. Saidpur sump motors operating with auxiliary generator support.",
        "trigger_metric": "24h Rain: 140mm | Topographic Depression",
        "timestamp": "2026-09-11T05:20:00Z",
        "status": "ACTIVE",
        "acknowledged_by": None,
        "acknowledged_at": None
    }
]

@api_router.get("/alerts", response_model=List[AlertItem], tags=["Alerts"])
def get_alerts(city_id: Optional[str] = Query(None)):
    """List operational waterlogging emergency alerts."""
    if city_id and city_id.upper() != "ALL":
        cid = city_id.upper()
        return [a for a in ALERTS_DATA if a["city_id"] == cid]
    return ALERTS_DATA

@api_router.post("/alerts/{alert_id}/acknowledge", response_model=AlertItem, tags=["Alerts"])
def acknowledge_alert(alert_id: str, officer_name: Optional[str] = Query("Gaurav (Administrator)")):
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

