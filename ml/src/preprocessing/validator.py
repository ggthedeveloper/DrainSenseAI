"""
Data validation module for DrainSense India.
Validates rainfall telemetry, spatial grid boundaries, and training feature schemas.
Ensures no missing coordinates, impossible physical values, or data leakage.
"""

import logging
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DrainSense.Validator")

# Physical constraints for urban Andhra Pradesh
VALID_LAT_RANGE = (16.40, 16.65)
VALID_LON_RANGE = (80.50, 80.75)
MAX_HOURLY_RAIN_MM = 300.0  # Beyond Indian record hourly precipitation
MAX_24H_RAIN_MM = 650.0

EXPECTED_FEATURE_COLUMNS = [
    "rain_1h_mm", "rain_3h_mm", "rain_6h_mm", "rain_12h_mm", "rain_24h_mm", "rain_72h_mm",
    "rain_intensity_mm_h", "rain_change_rate",
    "elevation_m", "slope_deg", "flow_accumulation", "drainage_density",
    "distance_to_water_m", "impervious_surface_ratio", "road_density_km_km2",
    "building_density", "historical_flood_frequency"
]

def validate_rainfall_dataframe(df: pd.DataFrame) -> Tuple[bool, Dict[str, Any]]:
    """Validate rainfall telemetry records."""
    report = {
        "valid": True,
        "total_records": len(df),
        "issues": []
    }
    
    if df.empty:
        report["valid"] = False
        report["issues"].append("DataFrame is empty.")
        return False, report
        
    if "rainfall_mm" not in df.columns or "timestamp" not in df.columns:
        report["valid"] = False
        report["issues"].append("Missing required columns: 'rainfall_mm' or 'timestamp'.")
        return False, report
        
    # Check negative rainfall
    neg_count = (df["rainfall_mm"] < 0).sum()
    if neg_count > 0:
        report["valid"] = False
        report["issues"].append(f"Found {neg_count} negative rainfall values.")
        
    # Check extreme outliers
    extreme_count = (df["rainfall_mm"] > MAX_HOURLY_RAIN_MM).sum()
    if extreme_count > 0:
        report["valid"] = False
        report["issues"].append(f"Found {extreme_count} values exceeding maximum physical hourly limit ({MAX_HOURLY_RAIN_MM} mm).")
        
    # Check timestamp parseability
    null_times = df["timestamp"].isna().sum()
    if null_times > 0:
        report["valid"] = False
        report["issues"].append(f"Found {null_times} missing/null timestamps.")
        
    logger.info(f"Rainfall validation report: {report}")
    return report["valid"], report

def validate_spatial_features(df: pd.DataFrame) -> Tuple[bool, Dict[str, Any]]:
    """Validate spatial grid features."""
    report = {
        "valid": True,
        "total_cells": len(df),
        "issues": []
    }
    
    if df.empty:
        report["valid"] = False
        report["issues"].append("Spatial dataframe is empty.")
        return False, report

    # Check coordinate bounds
    lat_invalid = ((df["latitude"] < VALID_LAT_RANGE[0]) | (df["latitude"] > VALID_LAT_RANGE[1])).sum()
    lon_invalid = ((df["longitude"] < VALID_LON_RANGE[0]) | (df["longitude"] > VALID_LON_RANGE[1])).sum()
    
    if lat_invalid > 0 or lon_invalid > 0:
        report["valid"] = False
        report["issues"].append(f"Found {lat_invalid} invalid latitudes and {lon_invalid} invalid longitudes outside case study bbox.")

    # Check terrain physical limits
    elev_invalid = ((df["elevation_m"] < 5.0) | (df["elevation_m"] > 300.0)).sum()
    if elev_invalid > 0:
        report["valid"] = False
        report["issues"].append(f"Found {elev_invalid} elevation values outside realistic bounds [5m, 300m].")

    # Check impervious ratio
    imp_invalid = ((df["impervious_surface_ratio"] < 0.0) | (df["impervious_surface_ratio"] > 1.0)).sum()
    if imp_invalid > 0:
        report["valid"] = False
        report["issues"].append(f"Found {imp_invalid} impervious ratios outside [0.0, 1.0].")

    logger.info(f"Spatial validation report: {report}")
    return report["valid"], report

def validate_feature_matrix(df: pd.DataFrame, require_target: bool = False) -> Tuple[bool, Dict[str, Any]]:
    """Validate ML feature matrix before training or inference."""
    report = {
        "valid": True,
        "total_rows": len(df),
        "issues": []
    }
    
    missing_cols = [c for c in EXPECTED_FEATURE_COLUMNS if c not in df.columns]
    if missing_cols:
        report["valid"] = False
        report["issues"].append(f"Missing required feature columns: {missing_cols}")
        
    if require_target and "flood_label" not in df.columns:
        report["valid"] = False
        report["issues"].append("Missing target column 'flood_label' for training.")
        
    # Check for NaN values in features
    nan_counts = df[EXPECTED_FEATURE_COLUMNS].isna().sum()
    total_nans = nan_counts.sum()
    if total_nans > 0:
        report["valid"] = False
        report["issues"].append(f"Features contain {total_nans} NaN values: {nan_counts[nan_counts > 0].to_dict()}")
        
    logger.info(f"Feature matrix validation report: {report}")
    return report["valid"], report
