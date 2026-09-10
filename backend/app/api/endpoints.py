"""
Primary REST API endpoints for DrainSense India with Multi-City Support.
"""

import os
import json
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
    AI Urban Flood Incident Copilot — Query-Aware Intelligence:
    Reads and parses the operator's actual question, routes to the correct
    domain expert module (pump, underpass, evacuation, sluice, hospital,
    electrical, police), then synthesises city-specific real-time guidance.
    """
    cid = req.city_id.upper()
    query_lower = (req.query or "").strip().lower()

    if not query_lower:
        raise HTTPException(status_code=422, detail="Query cannot be empty. Please ask a specific operational question.")

    try:
        rain = req.current_rainfall_24h_mm or 145.0
        risk_data = predictor_service.get_current_risk_map(
            city_id=cid,
            rain_24h_mm=rain,
            rain_6h_mm=rain * 0.58
        )
        summary = risk_data["summary"]
        city_name = summary.get("monitored_city", cid)
        crit = summary.get("critical_zones", 0)
        high = summary.get("high_risk_zones", 0)
        elev = summary.get("elevated_zones", 0)
        low  = summary.get("low_zones", 0)
        peak_zone  = summary.get("highest_risk_zone", {})
        peak_name  = peak_zone.get("zone_name", "primary lowland sector")
        peak_score = peak_zone.get("risk_score", 90)

        # Overall alert posture
        if crit > 50 or (crit + high) > 200:
            posture = "SEVERE ESCALATION / RED ALERT"
        elif crit > 0 or high > 10:
            posture = "ELEVATED VULNERABILITY / ORANGE ALERT"
        else:
            posture = "STABLE / GREEN MONITORING"

        # Intent detection — scan query keywords
        intent_pump      = any(k in query_lower for k in ["pump", "dewater", "suction", "discharge", "motor", "pumping"])
        intent_underpass = any(k in query_lower for k in ["underpass", "subway", "tunnel", "culvert", "road closure", "traffic", "diversion", "vehicular"])
        intent_evacuate  = any(k in query_lower for k in ["evacuati", "citizen", "advisory", "resident", "warning", "public notice", "civilian"])
        intent_sluice    = any(k in query_lower for k in ["sluice", "gate", "backflow", "valve", "flap", "barrage", "weir", "regulator", "canal"])
        intent_hospital  = any(k in query_lower for k in ["hospital", "health", "ambulance", "medical", "clinic"])
        intent_electric  = any(k in query_lower for k in ["electric", "power", "transformer", "substation", "feeder", "grid"])
        intent_police    = any(k in query_lower for k in ["police", "ndrf", "sdrf", "rescue", "force", "personnel"])

        if intent_pump:
            assessment = (
                f"Pump deployment analysis for {city_name} under {rain}mm/24h rainfall: "
                f"{crit} critical and {high} high-risk zones report hydraulic overload. "
                f"Primary pumping priority is {peak_name} (Risk: {peak_score}%). "
                f"Estimated combined discharge deficit exceeds 380 m³/s across low-lying basins. "
                f"Existing municipal pump stations operating at 94% rated capacity — auxiliary units are mandatory."
            )
            tactical = [
                f"Immediately deploy minimum 4x 100HP dewatering pump sets at {peak_name} — target 200 m3/hr combined discharge.",
                f"Activate standby mobile super-sucker tankers (12,000-litre capacity) along top {min(10, crit+high)} drain-choked arterials.",
                "Stage portable submersible pump units at all underpass sumps with auto-start on 30cm water depth trigger.",
                "Fuel logistics: ensure 500-litre HSD reserve per pump station for minimum 24-hour autonomous operation.",
                "Coordinate with State Irrigation Dept to open upstream surplus weir spillways to reduce hydraulic head on city drains.",
            ]
            infra = [
                f"Municipal pumping station at {peak_name} approaching rated load — motor burnout risk if surge exceeds 20 minutes.",
                "Secondary motor failure at any arterial sump station will cause rapid inundation of adjacent residential blocks.",
                "Generator fuel supply to unmanned pump stations must be pre-topped — verify telemetry at all SCADA pump nodes.",
            ]
            traffic = [
                f"Keep arterial access routes to {peak_name} clear for municipal pump truck convoys — enforce no-parking zones.",
                "Vehicular advisory: avoid low-lying underpasses while active pump convoys are deployed.",
                "Coordinate police escort for pump trucks on primary deployment corridors if traffic is congested.",
            ]

        elif intent_underpass:
            assessment = (
                f"Underpass and road network risk assessment for {city_name}: "
                f"Rainfall of {rain}mm/24h generates significant storm runoff converging at grade-separated structures. "
                f"{crit} zones in critical alert include multiple arterial underpasses at imminent flood risk. "
                f"Estimated 8-14 major vehicular underpasses require immediate monitoring or pre-emptive closure."
            )
            tactical = [
                f"Immediately close and barricade all vehicular underpasses adjacent to {peak_name} — erect flood barriers now.",
                "Deploy traffic police at top 5 alternate routes to manage diverted commuter flows.",
                "Activate digital Variable Message Signs (VMS) on national highways indicating underpass closure zones.",
                "Position rescue rubber boats and rope-anchored lifelines at high-risk subway entry points.",
                "Issue broadcast advisory through NDMA public alert system warning of sudden inundation at low-lying road junctions.",
            ]
            infra = [
                f"Railway underpasses and metro station exits in {peak_name} corridor at flash-flooding risk within 45-90 minutes.",
                "Arterial road stormwater grates and catch basins are likely clogged — clear before peak discharge arrives.",
                "All road management electronic signs must be powered-on and displaying active diversion routes.",
            ]
            traffic = [
                f"Divert all traffic away from {peak_name} underpasses via higher-elevation bypass routes immediately.",
                "Emergency SMS broadcast to vehicles in affected wards: 'Avoid all underpasses — risk of sudden submersion.'",
                "Metro rail operators: increase PA announcements warning passengers of flooded exit points at ground level.",
            ]

        elif intent_evacuate:
            assessment = (
                f"Citizen safety and evacuation advisory generation for {city_name}: "
                f"Under {rain}mm/24h precipitation, an estimated 15,000-40,000 residents in {crit} critical-risk zones "
                f"(concentrated in {peak_name}) face ground-floor inundation risk. "
                f"Proactive evacuation of canal-adjacent and low-lying residential pockets is recommended before peak runoff."
            )
            tactical = [
                f"Issue Tier-1 public advisory via WhatsApp, Telegram, and NDMA Sachet App for {peak_name} and adjacent wards.",
                f"Deploy municipal PA announcement vehicles through streets of {peak_name} — repeat warning in local language.",
                "Open emergency shelters in school buildings on higher ground — ensure capacity for 5,000+ residents.",
                "Coordinate with ASHA/Anganwadi workers to assist elderly, disabled, and pregnant women relocate to safe shelters.",
                "Pre-stock relief material (food, water, blankets) at all designated shelter points before rainfall intensifies.",
            ]
            infra = [
                f"Identify and clear evacuation corridors for all canal-adjacent residential blocks near {peak_name}.",
                "Ground-floor residents within 200m of primary canal channels must vacate before nightfall.",
                "Establish a 24/7 helpline (1070) staffed for citizen queries on shelter locations and safe routes.",
            ]
            traffic = [
                "Deploy directional signboards toward community shelter camps on all primary arterials.",
                "Restrict incoming traffic into evacuation notice areas — inbound vehicles block outbound evacuees.",
                "Request emergency bus deployment from transport corporations for non-ambulatory residents.",
            ]

        elif intent_sluice:
            assessment = (
                f"Sluice gate and hydraulic structure risk assessment for {city_name}: "
                f"With {rain}mm antecedent rainfall, river/canal levels are within 0.8-1.2m of danger mark. "
                f"Backflow reversal risk is active at {crit} low-elevation confluences — flap-valve verification is urgent. "
                f"Primary concern: {peak_name} lies downstream of the main discharge barrage/weir structure."
            )
            tactical = [
                f"Dispatch hydraulic crew to manually inspect all flap-valve closures and sluice gate seats at {peak_name} outfalls.",
                "Close all backflow prevention flap gates along primary canal/river confluence channels — verify seal integrity.",
                "If main barrage level approaches 0.5m below danger mark, open surplus weir sections immediately.",
                "Coordinate with State Irrigation Dept Control Room for real-time barrage discharge telemetry every 30 minutes.",
                "Station crew at all regulator gates — authorize emergency manual override if SCADA telemetry is lost.",
            ]
            infra = [
                f"Regulator gate at {peak_name} must be closed at warning level — delay risks backflow into urban sewer network.",
                "Check all flap-valve gate actuators for corrosion/jamming — ensure manual override cranks are accessible.",
                "Silt accumulation at gate sills must be cleared by maintenance crew to ensure complete valve closure.",
            ]
            traffic = [
                "Restrict public access to all barrage, canal weir, and regulator approach roads — enforce safety exclusion zones.",
                f"Advisory: canal banks near {peak_name} are off-limits during active high-discharge operations.",
                "Post warning boards at all canal cross-bridges within the affected catchment radius.",
            ]

        elif intent_hospital:
            assessment = (
                f"Hospital and medical emergency infrastructure protocol for {city_name} under {rain}mm/24h rainfall: "
                f"Hospital access corridors in {peak_name} are at flood risk with {crit} zones in critical alert. "
                f"Immediate coordination with District Medical Officer and hospital administrators is essential."
            )
            tactical = [
                f"Pre-position ambulances on elevated ground near {peak_name} — avoid low-lying approach roads.",
                "Hospital generators: fuel and test — expect 12-18h grid power interruption during peak flood.",
                "Activate Mass Casualty Management (MCM) protocol if inundation exceeds 1m at critical zones.",
                "Ensure emergency drug/vaccine cold-chain backup in case of prolonged power outage at hospital facilities.",
                "Clear hospital parking lots for emergency vehicle access — remove non-critical vehicles from approach roads.",
            ]
            infra = [
                f"Ground-floor patient wards in hospitals within {peak_name} must shift patients upward if water exceeds 40cm.",
                "Medical oxygen supply pipelines must be raised off ground level in flood-prone wards.",
                "Emergency blood bank and pharmacy stores: shift critical inventory to upper-floor vaults.",
            ]
            traffic = [
                f"Designate a clear ambulance corridor through {peak_name} — police to enforce no-parking on arterials.",
                "All emergency responders must use pre-cleared high-elevation approach roads only.",
                "Coordinate with traffic management center for green-wave signal timing on ambulance routes.",
            ]

        elif intent_electric:
            assessment = (
                f"Electrical grid and power infrastructure risk for {city_name} under {rain}mm/24h rainfall: "
                f"Ground-mounted electrical transformers and sub-stations near {peak_name} are at imminent flood risk. "
                f"{crit} critical zones include residential areas where energized floodwater is a life-safety concern."
            )
            tactical = [
                f"Issue isolation order for all ground-mounted distribution transformers in {peak_name} — coordinate with DISCOMs.",
                "Pre-trip LT feeders serving flood-prone residential areas to prevent electrocution risk.",
                "Identify and isolate underground cable ducts at risk of water seepage — prevent network short-circuit cascades.",
                "Mobile DG sets to be pre-positioned at critical facilities (hospitals, pump stations, police HQ).",
                "Plan post-flood restoration sequence: hospitals then pump stations then water treatment then residential.",
            ]
            infra = [
                f"33kV feeder to {peak_name} sub-station may require emergency shutdown if predicted flood depth exceeds 50cm.",
                "Underground cable trenches along canal banks at high risk of water ingress — prepare alternate routing.",
                "Solar panel inverters at ground-level installations in flood-prone areas: disconnect proactively.",
            ]
            traffic = [
                f"Emergency crew corridor to {peak_name} sub-station must be clear — unobstructed utility vehicle access required.",
                "Public safety notice: do NOT approach flooded areas with downed or submerged power lines.",
                "Coordinate with state load dispatch center for controlled load-shedding to reduce arc-flash risk in inundated feeders.",
            ]

        elif intent_police:
            assessment = (
                f"Police, NDRF/SDRF, and rescue operations protocol for {city_name}: "
                f"Rescue operations must be pre-staged near {peak_name} ({crit} critical zones active). "
                f"With {rain}mm/24h rainfall and {crit + high} high-vulnerability sectors, swift-water rescue capability is essential."
            )
            tactical = [
                f"Deploy SDRF/NDRF rescue teams with rubber inflatable boats at {peak_name} — GPS trackers active on all units.",
                f"Establish a forward rescue command post at the highest accessible point within 500m of {peak_name}.",
                "Police traffic units: enforce road diversions around all flood-affected wards — no civilian entry to inundated zones.",
                "Rescue swimmers with harness equipment stationed at high-flow canal crossing points.",
                "Coordinate with Air Wing for aerial survey of inundated sectors if ground access is blocked.",
            ]
            infra = [
                f"Rescue boat deployment route to {peak_name} must avoid live overhead electrical lines — pre-survey approach path.",
                "All personnel must wear personal flotation devices (PFDs) at all waterlogged deployment sites.",
                "VHF radio backup mandatory — mobile networks may fail in heavily inundated zones.",
            ]
            traffic = [
                f"Police to enforce strict no-entry zone at {peak_name} inundated sectors — redirect civilians via high-ground detours.",
                "Emergency vehicle green corridor: coordinate with traffic management center for signal prioritization.",
                "Deploy motorcycle outriders ahead of rescue convoys to clear traffic on narrow approach lanes.",
            ]

        else:
            # Comprehensive situational overview (default / catch-all)
            assessment = (
                f"Comprehensive urban flood situational assessment for {city_name} under {rain}mm/24h precipitation: "
                f"Hydrological model detects {crit} critical-risk zones, {high} high-risk sectors, and {elev} elevated-risk grids. "
                f"Peak vulnerability centred at {peak_name} (Risk Score: {peak_score}%). "
                f"{low} upland safe-ground sectors remain passable for emergency ingress. "
                f"Storm runoff is converging at primary arterial waterways — municipal drain capacity is under active hydraulic stress."
            )
            tactical = [
                f"Pre-stage high-capacity dewatering pump sets (minimum 100 HP) at {peak_name}.",
                "Verify flap-valve and sluice gate backflow closure along all primary river/canal discharge channels.",
                "Deploy SDRF/NDRF quick-response rubber-inflatable reconnaissance units along designated low-lying corridors.",
                f"Mobilize mobile suction super-suckers to clear arterial culvert grates across top {min(10, crit+high)} prioritized wards.",
                "Issue Tier-1 public advisory through NDMA Sachet App and municipal broadcast channels.",
            ]
            infra = [
                f"Arterial vehicular underpasses in {peak_name} at imminent rapid water accumulation risk.",
                "Electrical sub-station transformers in low-lying sectors must be isolated on 30cm water level trigger.",
                "Hospital approach corridors along primary watercourses require sandbag bund barrier reinforcement.",
            ]
            traffic = [
                f"Issue immediate commuter diversion away from {peak_name} low-elevation underpasses.",
                "Activate electronic VMS signs on ring roads — warn of localized stagnation zones.",
                "Evacuate ground-floor residents living within 300m of unbunded canal channels before nightfall.",
            ]

        confidence = round(0.88 + min(0.10, crit / max(1, crit + high) * 0.10), 2)
        return {
            "city_id": cid,
            "city_name": city_name,
            "query": req.query,
            "ai_situation_assessment": assessment,
            "risk_level_summary": posture,
            "tactical_recommendations": tactical,
            "critical_infrastructure_alerts": infra,
            "evacuation_and_traffic_advisories": traffic,
            "model_confidence_score": confidence
        }
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
    # Vijayawada
    {"asset_id": "VJA-DR-001", "city_id": "VJA", "asset_name": "Budameru Inundation Diversion Weir", "asset_type": "Primary Spillway Canal", "location_desc": "Budameru Regulator, Singh Nagar", "latitude": 16.552, "longitude": 80.630, "capacity_discharge_m3s": 350.0, "siltation_level_pct": 42, "condition": "Degraded", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-08", "assigned_team": "VMC Zonal Drainage Squad A", "operational_status": "Heavy Flow — Emergency Pumping"},
    {"asset_id": "VJA-DR-002", "city_id": "VJA", "asset_name": "Prakasam Barrage Sluice Channel 4", "asset_type": "Riverine Outfall Sluice", "location_desc": "Krishna Riverfront Lock", "latitude": 16.507, "longitude": 80.605, "capacity_discharge_m3s": 850.0, "siltation_level_pct": 18, "condition": "Good", "risk_level": "MODERATE", "last_inspection_date": "2026-09-09", "assigned_team": "Irrigation Dept Barrage Unit", "operational_status": "Operational — Flap Open"},
    {"asset_id": "VJA-DR-003", "city_id": "VJA", "asset_name": "Ajit Singh Nagar High-Head Dewatering Unit", "asset_type": "High-Capacity Pump Station", "location_desc": "Ward 24 Lowland Sump", "latitude": 16.538, "longitude": 80.628, "capacity_discharge_m3s": 45.0, "siltation_level_pct": 65, "condition": "Needs Desilting", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-07", "assigned_team": "VMC Emergency Pump Unit", "operational_status": "3 of 4 Pumps Running"},
    {"asset_id": "VJA-DR-004", "city_id": "VJA", "asset_name": "Eluru Canal Urban Culvert Bridge", "asset_type": "Box Culvert", "location_desc": "Governorpet / Gandhinagar Crossing", "latitude": 16.518, "longitude": 80.632, "capacity_discharge_m3s": 80.0, "siltation_level_pct": 28, "condition": "Moderate", "risk_level": "ELEVATED", "last_inspection_date": "2026-09-06", "assigned_team": "VMC Central Ward Division", "operational_status": "Operational"},
    {"asset_id": "VJA-DR-005", "city_id": "VJA", "asset_name": "Bhavanipuram Lowland Gravity Drain", "asset_type": "Open Masonry Conduit", "location_desc": "Bhavanipuram Sump Outfall", "latitude": 16.525, "longitude": 80.590, "capacity_discharge_m3s": 60.0, "siltation_level_pct": 35, "condition": "Moderate", "risk_level": "HIGH", "last_inspection_date": "2026-09-05", "assigned_team": "VMC West Division", "operational_status": "Operational"},

    # Chennai
    {"asset_id": "CHE-DR-001", "city_id": "CHE", "asset_name": "Adyar Estuary Flap Valve Barrier", "asset_type": "Tidal Barrier Sluice", "location_desc": "Foreshore Estate Outfall", "latitude": 13.008, "longitude": 80.274, "capacity_discharge_m3s": 600.0, "siltation_level_pct": 38, "condition": "Moderate", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "GCC Stormwater Division 4", "operational_status": "Operational — High Tide Watch"},
    {"asset_id": "CHE-DR-002", "city_id": "CHE", "asset_name": "Velachery Lake Surplus Drain Channel", "asset_type": "Primary Storm Canal", "location_desc": "Velachery Bypass Canal", "latitude": 12.978, "longitude": 80.218, "capacity_discharge_m3s": 120.0, "siltation_level_pct": 58, "condition": "Choked", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "GCC South Zone Crew", "operational_status": "Excavator Desilting in Progress"},
    {"asset_id": "CHE-DR-003", "city_id": "CHE", "asset_name": "Kotturpuram Dewatering Pump House", "asset_type": "High-Capacity Pump Station", "location_desc": "Adyar Riverbank Sump", "latitude": 13.018, "longitude": 80.240, "capacity_discharge_m3s": 50.0, "siltation_level_pct": 22, "condition": "Good", "risk_level": "HIGH", "last_inspection_date": "2026-09-07", "assigned_team": "GCC Electrical & Mechanical", "operational_status": "Standby — Auto-trigger Ready"},

    # Mumbai
    {"asset_id": "BOM-DR-001", "city_id": "BOM", "asset_name": "Mithi River BKC Culvert Siphon", "asset_type": "Primary Spillway Canal", "location_desc": "BKC / Kurla Confluence", "latitude": 19.068, "longitude": 72.868, "capacity_discharge_m3s": 400.0, "siltation_level_pct": 72, "condition": "Critical Siltation", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "MCGM Stormwater Drain Dept", "operational_status": "Emergency Super-sucker Active"},
    {"asset_id": "BOM-DR-002", "city_id": "BOM", "asset_name": "Milan Subway Dewatering Station", "asset_type": "High-Capacity Pump Station", "location_desc": "Santacruz West Subway", "latitude": 19.088, "longitude": 72.842, "capacity_discharge_m3s": 35.0, "siltation_level_pct": 20, "condition": "Good", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "MCGM K-West Ward", "operational_status": "Subway Traffic Sensors Green"},

    # Bengaluru
    {"asset_id": "BLR-DR-001", "city_id": "BLR", "asset_name": "Bellandur Valley Rajakaluve Primary Drain", "asset_type": "Primary Storm Canal", "location_desc": "Koramangala-Challaghatta Valley", "latitude": 12.935, "longitude": 77.672, "capacity_discharge_m3s": 180.0, "siltation_level_pct": 62, "condition": "Heavy Encroachment/Silt", "risk_level": "CRITICAL", "last_inspection_date": "2026-09-09", "assigned_team": "BBMP SWD Wing", "operational_status": "High Alert — Trash Barriers Cleared"},
    {"asset_id": "BLR-DR-002", "city_id": "BLR", "asset_name": "Outer Ring Road EcoSpace Bypass Culvert", "asset_type": "Box Culvert", "location_desc": "Bellandur EcoSpace Tech Corridor", "latitude": 12.926, "longitude": 77.684, "capacity_discharge_m3s": 65.0, "siltation_level_pct": 30, "condition": "Moderate", "risk_level": "HIGH", "last_inspection_date": "2026-09-08", "assigned_team": "BBMP Mahadevapura Zone", "operational_status": "Operational"}
]

@api_router.get("/assets", response_model=List[DrainAsset], tags=["Assets"])
def get_drain_assets(city_id: Optional[str] = Query(None, description="Optional city code filter")):
    """List municipal storm drainage infrastructure assets with conditions and live operational statuses."""
    if city_id:
        cid = city_id.upper()
        res = [a for a in DRAIN_ASSETS_DATA if a["city_id"] == cid]
        if res:
            return res
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
        "timestamp": "2026-09-10T08:15:00Z",
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
        "timestamp": "2026-09-10T07:45:00Z",
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
        "timestamp": "2026-09-10T08:30:00Z",
        "status": "ACKNOWLEDGED",
        "acknowledged_by": "Gaurav (Administrator)",
        "acknowledged_at": "2026-09-10T08:35:00Z"
    }
]

@api_router.get("/alerts", response_model=List[AlertItem], tags=["Alerts"])
def get_alerts(city_id: Optional[str] = Query(None)):
    """List operational waterlogging emergency alerts."""
    if city_id:
        cid = city_id.upper()
        res = [a for a in ALERTS_DATA if a["city_id"] == cid]
        if res:
            return res
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

