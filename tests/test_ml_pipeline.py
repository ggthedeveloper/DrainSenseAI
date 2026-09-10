"""
Unit and algorithmic tests for ML pipeline, data transformations, and validation.
"""

import pytest
import numpy as np
import pandas as pd
from ml.src.ingestion.spatial_loader import generate_grid_cells, haversine_distance_m
from ml.src.preprocessing.validator import (
    validate_rainfall_dataframe,
    validate_spatial_features,
    validate_feature_matrix
)
from ml.src.preprocessing.temporal_aggregator import (
    compute_antecedent_rainfall_windows,
    aggregate_single_point_rainfall
)
from ml.src.features.label_generator import construct_flood_labels
from ml.src.inference.predictor import predictor_service

def test_haversine_distance():
    # Distance between Indrakeeladri and Prakasam Barrage (~1.5 km)
    d = haversine_distance_m(16.514, 80.608, 16.507, 80.605)
    assert 500 < d < 2500

def test_spatial_grid_generation():
    df = generate_grid_cells()
    assert len(df) == 810
    assert "grid_id" in df.columns
    assert "elevation_m" in df.columns
    assert "flow_accumulation" in df.columns
    # Check bounds
    assert df["latitude"].min() >= 16.44
    assert df["latitude"].max() <= 16.58
    assert df["longitude"].min() >= 80.55
    assert df["longitude"].max() <= 80.71

def test_rainfall_validator():
    # Valid
    df_valid = pd.DataFrame({
        "timestamp": ["2024-09-01 00:00:00", "2024-09-01 01:00:00"],
        "rainfall_mm": [12.5, 34.0]
    })
    v, _ = validate_rainfall_dataframe(df_valid)
    assert v is True
    
    # Invalid negative
    df_neg = pd.DataFrame({
        "timestamp": ["2024-09-01 00:00:00"],
        "rainfall_mm": [-5.0]
    })
    v_neg, rep_neg = validate_rainfall_dataframe(df_neg)
    assert v_neg is False
    assert any("negative" in issue for issue in rep_neg["issues"])

def test_temporal_rolling_windows():
    dates = pd.date_range("2024-09-01 00:00", periods=30, freq="1h")
    df_rain = pd.DataFrame({
        "timestamp": dates,
        "rainfall_mm": [10.0] * 30
    })
    res = compute_antecedent_rainfall_windows(df_rain)
    last = res.iloc[-1]
    assert last["rain_1h_mm"] == 10.0
    assert last["rain_3h_mm"] == 30.0
    assert last["rain_6h_mm"] == 60.0
    assert last["rain_24h_mm"] == 240.0
    assert last["rain_intensity_mm_h"] == 10.0

def test_single_point_aggregator():
    history = [5.0] * 24
    res = aggregate_single_point_rainfall(history)
    assert res["rain_1h_mm"] == 5.0
    assert res["rain_3h_mm"] == 15.0
    assert res["rain_24h_mm"] == 120.0

def test_label_generator():
    mock_df = pd.DataFrame([
        {
            "grid_id": "G1",
            "rain_24h_mm": 160.0,
            "rain_6h_mm": 70.0,
            "rain_intensity_mm_h": 20.0,
            "elevation_m": 16.0,
            "slope_deg": 0.8,
            "distance_to_budameru_m": 800.0,
            "distance_to_krishna_m": 3000.0,
            "flow_accumulation": 65.0,
            "impervious_surface_ratio": 0.8,
            "historical_flood_frequency": 0.3
        },
        {
            "grid_id": "G2",
            "rain_24h_mm": 5.0, # Dry period
            "rain_6h_mm": 0.0,
            "rain_intensity_mm_h": 0.0,
            "elevation_m": 16.0,
            "slope_deg": 0.8,
            "distance_to_budameru_m": 800.0,
            "distance_to_krishna_m": 3000.0,
            "flow_accumulation": 65.0,
            "impervious_surface_ratio": 0.8,
            "historical_flood_frequency": 0.3
        },
        {
            "grid_id": "G3",
            "rain_24h_mm": 160.0,
            "rain_6h_mm": 70.0,
            "rain_intensity_mm_h": 20.0,
            "elevation_m": 85.0, # Mountain ridge
            "slope_deg": 8.0,
            "distance_to_budameru_m": 8000.0,
            "distance_to_krishna_m": 6000.0,
            "flow_accumulation": 10.0,
            "impervious_surface_ratio": 0.2,
            "historical_flood_frequency": 0.0
        }
    ])
    labeled = construct_flood_labels(mock_df)
    assert labeled.iloc[0]["flood_label"] == 1 # Lowland extreme storm -> Flood
    assert labeled.iloc[1]["flood_label"] == 0 # Dry period -> No flood
    assert labeled.iloc[2]["flood_label"] == 0 # High hill ridge -> No flood

def test_what_if_simulation_deltas():
    # Testing rainfall scaling increases or maintains high-risk count
    base_res = predictor_service.simulate_rainfall_scenario(
        multiplier=1.5,
        base_rain_24h_mm=100.0
    )
    assert base_res["simulation_scenario"]["percentage_increase"] == "50%"
    assert base_res["simulation_scenario"]["scenario_rainfall_24h_mm"] == 150.0
    assert "scientific_note" in base_res
