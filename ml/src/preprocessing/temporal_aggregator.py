"""
Temporal rainfall aggregation module for DrainSense India.
Computes multi-horizon antecedent rainfall metrics strictly looking backwards in time:
1h, 3h, 6h, 12h, 24h, and 72h moving windows, plus rainfall intensity and rate of change.
"""

import pandas as pd
import numpy as np

def compute_antecedent_rainfall_windows(rainfall_df: pd.DataFrame) -> pd.DataFrame:
    """
    Given a sorted time-series of hourly rainfall, computes rolling antecedent sums.
    Ensures zero future leakage (closed='right' rolling windows).
    """
    df = rainfall_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    # Set timestamp as index for time-aware rolling windows
    df = df.set_index("timestamp")
    
    # Compute rolling cumulative antecedent rainfall
    df["rain_1h_mm"] = df["rainfall_mm"].rolling("1h", min_periods=1).sum().round(2)
    df["rain_3h_mm"] = df["rainfall_mm"].rolling("3h", min_periods=1).sum().round(2)
    df["rain_6h_mm"] = df["rainfall_mm"].rolling("6h", min_periods=1).sum().round(2)
    df["rain_12h_mm"] = df["rainfall_mm"].rolling("12h", min_periods=1).sum().round(2)
    df["rain_24h_mm"] = df["rainfall_mm"].rolling("24h", min_periods=1).sum().round(2)
    df["rain_72h_mm"] = df["rainfall_mm"].rolling("72h", min_periods=1).sum().round(2)
    
    # Rainfall intensity (mm/h over past 3 hours)
    df["rain_intensity_mm_h"] = (df["rain_3h_mm"] / 3.0).round(2)
    
    # Rain change rate: difference between past 3h and the 3h before that (3h to 6h prior)
    prev_3h = (df["rain_6h_mm"] - df["rain_3h_mm"]).clip(lower=0.0)
    df["rain_change_rate"] = (df["rain_3h_mm"] - prev_3h).round(2)
    
    df = df.reset_index()
    return df

def aggregate_single_point_rainfall(rain_history_last_72h: list) -> dict:
    """
    Fast helper for real-time inference when a list of the last 72 hourly rainfall values
    [r_t-71, ..., r_t] is provided.
    """
    arr = np.array(rain_history_last_72h, dtype=float)
    n = len(arr)
    if n == 0:
        return {
            "rain_1h_mm": 0.0, "rain_3h_mm": 0.0, "rain_6h_mm": 0.0,
            "rain_12h_mm": 0.0, "rain_24h_mm": 0.0, "rain_72h_mm": 0.0,
            "rain_intensity_mm_h": 0.0, "rain_change_rate": 0.0
        }
    
    r1 = float(arr[-1]) if n >= 1 else 0.0
    r3 = float(np.sum(arr[-3:])) if n >= 3 else float(np.sum(arr))
    r6 = float(np.sum(arr[-6:])) if n >= 6 else float(np.sum(arr))
    r12 = float(np.sum(arr[-12:])) if n >= 12 else float(np.sum(arr))
    r24 = float(np.sum(arr[-24:])) if n >= 24 else float(np.sum(arr))
    r72 = float(np.sum(arr[-72:])) if n >= 72 else float(np.sum(arr))
    
    intensity = round(r3 / 3.0, 2)
    prev_3h = max(0.0, r6 - r3)
    change_rate = round(r3 - prev_3h, 2)
    
    return {
        "rain_1h_mm": round(r1, 2),
        "rain_3h_mm": round(r3, 2),
        "rain_6h_mm": round(r6, 2),
        "rain_12h_mm": round(r12, 2),
        "rain_24h_mm": round(r24, 2),
        "rain_72h_mm": round(r72, 2),
        "rain_intensity_mm_h": intensity,
        "rain_change_rate": change_rate
    }
