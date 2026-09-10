"""
Multi-City Training Dataset Builder for DrainSense India.
Cross-joins spatial grid cells across Vijayawada, Chennai, Mumbai, and Bengaluru
with real historical storm hourly snapshots, antecedent rainfall windows,
and realistic SCS-CN hydrological ground truth labels.
"""

import os
import logging
import pandas as pd
import numpy as np

from ml.src.ingestion.spatial_loader import save_all_cities_spatial_layers
from ml.src.ingestion.rainfall_loader import generate_multi_city_telemetry
from ml.src.preprocessing.temporal_aggregator import compute_antecedent_rainfall_windows
from ml.src.preprocessing.validator import validate_feature_matrix
from ml.src.features.label_generator import construct_flood_labels

logger = logging.getLogger("DrainSense.MultiCityFeatureBuilder")

def build_full_dataset(output_path: str = "data/processed/drainsense_train_dataset.csv") -> pd.DataFrame:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 1. Load multi-city spatial features
    logger.info("Loading multi-city spatial grid features...")
    spatial_csv = "data/processed/all_cities_grid_features.csv"
    if not os.path.exists(spatial_csv):
        spatial_df = save_all_cities_spatial_layers()
        if "geometry" in spatial_df.columns:
            spatial_df = spatial_df.drop(columns=["geometry"])
    else:
        spatial_df = pd.read_csv(spatial_csv)

    # 2. Load multi-city real rainfall telemetry
    logger.info("Loading real multi-city rainfall telemetry...")
    rain_csv = "data/raw/multi_city_hourly_rainfall.csv"
    if not os.path.exists(rain_csv):
        rain_df = generate_multi_city_telemetry()
    else:
        rain_df = pd.read_csv(rain_csv)

    # 3. Compute rolling antecedent windows per city
    logger.info("Computing antecedent rolling rainfall windows for each city...")
    rain_windows_list = []
    for cid, c_df in rain_df.groupby("city_id"):
        w_df = compute_antecedent_rainfall_windows(c_df)
        w_df["city_id"] = cid
        rain_windows_list.append(w_df)
    
    all_rain_windows = pd.concat(rain_windows_list, ignore_index=True)

    # 4. Sample representative storm & baseline time slices per city
    logger.info("Sampling storm slices across all cities...")
    sampled_slices = []
    for cid, c_rain in all_rain_windows.groupby("city_id"):
        heavy = c_rain[c_rain["rain_24h_mm"] >= 80.0].sample(n=min(20, len(c_rain[c_rain["rain_24h_mm"] >= 80.0])), random_state=42)
        mod = c_rain[(c_rain["rain_24h_mm"] >= 35.0) & (c_rain["rain_24h_mm"] < 80.0)].sample(n=min(15, len(c_rain[(c_rain["rain_24h_mm"] >= 35.0) & (c_rain["rain_24h_mm"] < 80.0)])), random_state=42)
        light = c_rain[(c_rain["rain_24h_mm"] >= 10.0) & (c_rain["rain_24h_mm"] < 35.0)].sample(n=min(10, len(c_rain[(c_rain["rain_24h_mm"] >= 10.0) & (c_rain["rain_24h_mm"] < 35.0)])), random_state=42)
        dry = c_rain[c_rain["rain_24h_mm"] < 5.0].sample(n=min(10, len(c_rain[c_rain["rain_24h_mm"] < 5.0])), random_state=42)
        sampled_slices.append(pd.concat([heavy, mod, light, dry]).drop_duplicates(subset=["timestamp"]))

    selected_temporal = pd.concat(sampled_slices, ignore_index=True)
    logger.info(f"Selected {len(selected_temporal)} total storm and baseline snapshots across 4 cities.")

    # 5. Cross-join each city's grid cells with its sampled rainfall slices
    dataset_rows = []
    for cid, s_city in spatial_df.groupby("city_id"):
        t_city = selected_temporal[selected_temporal["city_id"] == cid]
        if t_city.empty:
            t_city = selected_temporal.sample(n=30, random_state=42)

        for _, t_row in t_city.iterrows():
            t_dict = {
                "timestamp": t_row["timestamp"],
                "event_label": t_row.get("event_label", "Monsoon Snapshot"),
                "rain_1h_mm": t_row["rain_1h_mm"],
                "rain_3h_mm": t_row["rain_3h_mm"],
                "rain_6h_mm": t_row["rain_6h_mm"],
                "rain_12h_mm": t_row["rain_12h_mm"],
                "rain_24h_mm": t_row["rain_24h_mm"],
                "rain_72h_mm": t_row["rain_72h_mm"],
                "rain_intensity_mm_h": t_row["rain_intensity_mm_h"],
                "rain_change_rate": t_row["rain_change_rate"]
            }
            for _, s_row in s_city.iterrows():
                dataset_rows.append({**s_row.to_dict(), **t_dict})

    combined_df = pd.DataFrame(dataset_rows)
    logger.info(f"Constructed multi-city cross-joined matrix with {len(combined_df)} rows.")

    # 6. Apply SCS-CN hydrological label construction
    labeled_df = construct_flood_labels(combined_df)

    # 7. Validate final matrix
    valid, report = validate_feature_matrix(labeled_df, require_target=True)
    if not valid:
        raise ValueError(f"Feature matrix validation failed: {report['issues']}")

    labeled_df.to_csv(output_path, index=False)
    logger.info(f"Successfully saved multi-city dataset ({len(labeled_df)} rows) to {output_path}.")
    return labeled_df

if __name__ == "__main__":
    build_full_dataset()
