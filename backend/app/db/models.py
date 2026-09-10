"""
SQLAlchemy database models for DrainSense India.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from backend.app.db.session import Base

class City(Base):
    __tablename__ = "cities"
    
    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    state = Column(String(128), nullable=False)
    country = Column(String(64), default="India")
    min_lat = Column(Float, nullable=False)
    max_lat = Column(Float, nullable=False)
    min_lon = Column(Float, nullable=False)
    max_lon = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class GridCell(Base):
    __tablename__ = "grid_cells"
    
    id = Column(Integer, primary_key=True, index=True)
    grid_id = Column(String(64), unique=True, index=True, nullable=False)
    city_id = Column(String(32), index=True, default="VJA")
    zone_name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    slope_deg = Column(Float, nullable=False)
    flow_accumulation = Column(Float, nullable=False)
    drainage_density = Column(Float, nullable=False)
    distance_to_water_m = Column(Float, nullable=False)
    impervious_surface_ratio = Column(Float, nullable=False)
    road_density_km_km2 = Column(Float, nullable=False)
    building_density = Column(Float, nullable=False)
    historical_flood_count = Column(Integer, default=0)

class PredictionLog(Base):
    __tablename__ = "prediction_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    grid_id = Column(String(64), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    rain_24h_mm = Column(Float, nullable=False)
    risk_probability = Column(Float, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(32), nullable=False)
    model_version = Column(String(32), default="v1.0")
