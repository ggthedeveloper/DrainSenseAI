#!/usr/bin/env python3
"""CLI script to validate data integrity."""
import sys
import os
import pandas as pd
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.src.preprocessing.validator import (
    validate_rainfall_dataframe,
    validate_spatial_features,
    validate_feature_matrix
)

if __name__ == "__main__":
    print("=== DrainSense India: Data Quality & Schema Validation ===")
    # 1. Rainfall
    rain_path = "data/raw/vijayawada_hourly_rainfall_telemetry.csv"
    if os.path.exists(rain_path):
        df_rain = pd.read_csv(rain_path)
        v_r, rep_r = validate_rainfall_dataframe(df_rain)
        print(f"Rainfall Data: {'PASS' if v_r else 'FAIL'} ({rep_r['total_records']} records)")
    else:
        print("Rainfall Data: Missing")

    # 2. Spatial
    spatial_path = "data/processed/vijayawada_grid_features.csv"
    if os.path.exists(spatial_path):
        df_sp = pd.read_csv(spatial_path)
        v_s, rep_s = validate_spatial_features(df_sp)
        print(f"Spatial Grid: {'PASS' if v_s else 'FAIL'} ({rep_s['total_cells']} cells)")
    else:
        print("Spatial Grid: Missing")

    # 3. Dataset
    dataset_path = "data/processed/drainsense_train_dataset.csv"
    if os.path.exists(dataset_path):
        df_data = pd.read_csv(dataset_path)
        v_d, rep_d = validate_feature_matrix(df_data, require_target=True)
        print(f"Dataset Matrix: {'PASS' if v_d else 'FAIL'} ({rep_d['total_rows']} rows)")
    else:
        print("Dataset Matrix: Missing (run python scripts/build_dataset.py)")
