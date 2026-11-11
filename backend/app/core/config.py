"""
Configuration management for DrainSense India backend.
"""

import os
from typing import List

class Settings:
    PROJECT_NAME: str = "DrainSense India API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ["true", "1", "yes"]
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./drainsense.db")
    
    # Security
    ADMIN_TOKEN: str = os.getenv("ADMIN_TOKEN", "drainsense_admin_secure_key_2026")
    
    # CORS
    cors_str: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000")
    CORS_ORIGINS: List[str] = [origin.strip() for origin in cors_str.split(",") if origin.strip()]
    
    # Paths (DrainSenseAI 2.0 Production Models & Datasets)
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/drainsense_v2_xgb_calibrated.joblib")
    MODEL_METADATA_PATH: str = os.getenv("MODEL_METADATA_PATH", "models/drainsense_v2_metadata.json")
    SCALER_PATH: str = os.getenv("SCALER_PATH", "models/production_scaler.joblib")
    ATTRIBUTION_MODEL_PATH: str = os.getenv("ATTRIBUTION_MODEL_PATH", "models/drainsense_v2_multiclass_attribution.joblib")
    ATTRIBUTION_ENCODER_PATH: str = os.getenv("ATTRIBUTION_ENCODER_PATH", "models/multiclass_label_encoder.joblib")
    ARCHETYPE_MODEL_PATH: str = os.getenv("ARCHETYPE_MODEL_PATH", "models/kmeans_surface_archetypes.joblib")
    GRID_FEATURES_PATH: str = os.getenv("GRID_FEATURES_PATH", "data/processed/vijayawada_grid_with_archetypes.csv")
    GRID_GEOJSON_PATH: str = os.getenv("GRID_GEOJSON_PATH", "data/processed/vijayawada_grid_250m.geojson")
    HISTORICAL_EVENTS_PATH: str = os.getenv("HISTORICAL_EVENTS_PATH", "data/processed/historical_flood_events.json")
    EVALUATION_REPORT_PATH: str = os.getenv("EVALUATION_REPORT_PATH", "reports/model_training_evaluation_results.json")

settings = Settings()
