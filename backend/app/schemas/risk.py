"""
Pydantic API request & response schemas for DrainSense India.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    database: str
    model_loaded: bool
    model_version: str
    total_grids: int
    latest_data_timestamp: str

class CityItem(BaseModel):
    city_id: str
    city_name: str
    state: str
    country: str
    status: str
    bounding_box: Dict[str, float]
    default_lat: float
    default_lon: float
    zoom_level: int

class PredictionRequest(BaseModel):
    grid_id: str = Field(..., example="VJA_0036", description="Unique 500m grid cell identifier")
    rain_1h_mm: float = Field(0.0, ge=0.0, le=400.0, description="1-hour burst rainfall in mm")
    rain_3h_mm: float = Field(0.0, ge=0.0, le=500.0, description="3-hour antecedent rainfall in mm")
    rain_6h_mm: float = Field(0.0, ge=0.0, le=600.0, description="6-hour antecedent rainfall in mm")
    rain_12h_mm: Optional[float] = Field(None, ge=0.0, le=700.0, description="12-hour antecedent rainfall in mm")
    rain_24h_mm: float = Field(..., ge=0.0, le=800.0, description="24-hour antecedent rainfall in mm")
    rain_72h_mm: Optional[float] = Field(None, ge=0.0, le=1200.0, description="72-hour antecedent rainfall in mm")
    prediction_horizon_hours: int = Field(3, description="Forecast lead time in hours")

class TopFactor(BaseModel):
    factor: str
    impact: str
    value: str
    direction: str
    explanation: str

class PredictionResponse(BaseModel):
    grid_id: str
    city_id: Optional[str] = "VJA"
    zone_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    risk_probability: float
    risk_score: int
    risk_level: str
    prediction_horizon_hours: int
    model_version: str
    terrain: Optional[Dict[str, Any]] = None
    rainfall_summary: Optional[Dict[str, float]] = None
    top_factors: List[TopFactor] = []
    recommended_actions: List[str] = []

class SimulationRequest(BaseModel):
    city_id: str = Field("VJA", description="Target city ID (VJA, CHE, BOM, BLR)")
    multiplier: float = Field(1.25, ge=0.5, le=3.0, description="Rainfall scaling multiplier (e.g. 1.25 for +25%)")
    base_rain_1h_mm: float = Field(24.5, ge=0.0, description="Baseline 1-hour rainfall")
    base_rain_3h_mm: float = Field(48.0, ge=0.0, description="Baseline 3-hour rainfall")
    base_rain_6h_mm: float = Field(85.0, ge=0.0, description="Baseline 6-hour rainfall")
    base_rain_24h_mm: float = Field(145.0, ge=0.0, description="Baseline 24-hour rainfall")
    base_rain_72h_mm: float = Field(180.0, ge=0.0, description="Baseline 72-hour rainfall")

class SimulationResponse(BaseModel):
    city_id: Optional[str] = "VJA"
    simulation_scenario: Dict[str, Any]
    baseline_summary: Dict[str, Any]
    scenario_summary: Dict[str, Any]
    impact_deltas: Dict[str, Any]
    scientific_note: str

class HistoricalEvent(BaseModel):
    city_id: str
    city_name: str
    event_id: str
    title: str
    start_date: str
    end_date: str
    peak_24h_rainfall_mm: float
    severity: str
    water_level_m: float
    affected_population_est: int
    key_zones: List[str]
    description: str
    response_summary: str

class PriorityZone(BaseModel):
    grid_id: str
    city_id: Optional[str] = "VJA"
    zone_name: str
    risk_level: str
    risk_score: int
    priority_score: float
    elevation_m: float
    distance_to_water_m: float
    reason: str
    suggested_action: str

class AdminActionResponse(BaseModel):
    success: bool
    action: str
    message: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None

class AICopilotRequest(BaseModel):
    city_id: str = Field("VJA", description="Target city code (VJA, CHE, BOM, BLR, DEL, etc.)")
    query: str = Field(..., description="Operational query, e.g. 'What is the pump deployment strategy for the next 6 hours?'")
    current_rainfall_24h_mm: Optional[float] = Field(145.0, description="Current 24h rainfall")
    api_key: Optional[str] = Field(None, description="Optional Google Gemini or Groq API Key")
    provider: Optional[str] = Field("auto", description="AI Provider: auto, gemini, groq, local_rag")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=[], description="Prior messages in conversation")

class AICopilotResponse(BaseModel):
    city_id: str
    city_name: str
    query: str
    ai_situation_assessment: str
    risk_level_summary: str
    tactical_recommendations: List[str]
    critical_infrastructure_alerts: List[str]
    evacuation_and_traffic_advisories: List[str]
    model_confidence_score: float
    model_provider: Optional[str] = "DrainSense Neural RAG"
    model_name: Optional[str] = "Hydrology-AI-v2.5"
    conversational_answer: Optional[str] = None
    suggested_followups: Optional[List[str]] = []

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "Administrator"

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class DrainAsset(BaseModel):
    asset_id: str
    city_id: str
    asset_name: str
    asset_type: str
    location_desc: str
    latitude: float
    longitude: float
    capacity_discharge_m3s: float
    siltation_level_pct: int
    condition: str
    risk_level: str
    last_inspection_date: str
    assigned_team: str
    operational_status: str

class AlertItem(BaseModel):
    alert_id: str
    city_id: str
    zone_name: str
    grid_id: str
    severity: str
    title: str
    message: str
    trigger_metric: str
    timestamp: str
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None
