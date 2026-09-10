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
    
    # Paths
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/drainsense_xgb_v1.joblib")
    MODEL_METADATA_PATH: str = os.getenv("MODEL_METADATA_PATH", "models/drainsense_xgb_v1_metadata.json")
    GRID_FEATURES_PATH: str = os.getenv("GRID_FEATURES_PATH", "data/processed/vijayawada_grid_features.csv")
    GRID_GEOJSON_PATH: str = os.getenv("GRID_GEOJSON_PATH", "data/processed/vijayawada_grid_500m.json")
    HISTORICAL_EVENTS_PATH: str = os.getenv("HISTORICAL_EVENTS_PATH", "data/processed/historical_flood_events.json")
    EVALUATION_REPORT_PATH: str = os.getenv("EVALUATION_REPORT_PATH", "data/processed/evaluation_report.json")

settings = Settings()
