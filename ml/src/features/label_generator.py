"""
Hydrologically Realistic Ground Truth Label Construction for DrainSense India.
Implements the USDA Soil Conservation Service Curve Number (SCS-CN) runoff model
combined with Topographic Wetness Index (TWI) and empirical municipal choke factors.
Produces realistic, scientifically defensible label distributions and model metrics.
"""

import numpy as np
import pandas as pd

def construct_flood_labels(df_spatiotemporal: pd.DataFrame) -> pd.DataFrame:
    """
    Computes flood inundation probability based on:
    1. SCS-CN Runoff Generation:
       - Impervious surfaces: CN ~ 92 (minimal retention)
       - Peri-urban surfaces: CN ~ 70 (high soil absorption)
       - Potential maximum retention: S = (25400 / CN) - 254
       - Direct surface runoff depth Q (mm)
    2. Topographic Runoff Convergence:
       - Low elevation basins & high flow accumulation concentrate overland storm runoff
       - Waterway backwater influence within 1000m
    3. Stochastic Municipal Drain Choking:
       - Realistic variability (siltation, culvert blockages, localized pump availability)
    """
    df = df_spatiotemporal.copy()
    n = len(df)
    rng = np.random.default_rng(42)

    # 1. SCS Curve Number estimate from impervious surface ratio
    imp = df["impervious_surface_ratio"].values
    cn = 68.0 + (imp * 25.0)  # CN between 68 and 93
    S = (25400.0 / cn) - 254.0 # Potential max retention in mm
    Ia = 0.2 * S # Initial abstraction

    # Precipitation volume (24h cumulative + burst factor)
    P = df["rain_24h_mm"].values + (df["rain_6h_mm"].values * 0.4)
    
    # Runoff depth Q (mm) via standard SCS equation
    P_Ia = np.maximum(0.0, P - Ia)
    Q = np.where(P > Ia, (P_Ia ** 2) / (P_Ia + S + 1e-6), 0.0)

    # 2. Topographic Vulnerability Index (TVI)
    # Scaled [0, 1] based on low slope and flow accumulation
    slope_rad = np.radians(np.maximum(0.2, df["slope_deg"].values))
    flow_acc = df["flow_accumulation"].values
    # TWI proxy
    twi = np.log((flow_acc + 10.0) / np.tan(slope_rad))
    twi_norm = np.clip((twi - 3.0) / 6.0, 0.0, 1.0)

    # Elevation depression penalty
    elev = df["elevation_m"].values
    # Base elevations for all 12 cities to calculate local depression
    city_base_elevations = {
        "VJA": 14.0, "CHE": 3.0, "BOM": 3.0, "BLR": 870.0,
        "DEL": 204.0, "HYD": 490.0, "CCU": 3.0, "AMD": 44.0,
        "PNQ": 544.0, "COK": 1.5, "GAU": 47.0, "PAT": 46.0
    }
    if "city_id" in df.columns:
        city_bases = df["city_id"].map(lambda c: city_base_elevations.get(str(c).upper(), 15.0)).values
    else:
        city_bases = np.full(n, 15.0)
    rel_elev = np.maximum(0.0, elev - city_bases)
    elev_penalty = np.clip((12.0 - rel_elev) / 10.0, 0.0, 1.0)

    # Proximity to major water corridor (fallback to min of budameru / krishna if distance_to_water_m not present)
    if "distance_to_water_m" in df.columns:
        dist_w = df["distance_to_water_m"].values
    elif "distance_to_budameru_m" in df.columns and "distance_to_krishna_m" in df.columns:
        dist_w = np.minimum(df["distance_to_budameru_m"].values, df["distance_to_krishna_m"].values)
    elif "distance_to_budameru_m" in df.columns:
        dist_w = df["distance_to_budameru_m"].values
    else:
        dist_w = np.full(n, 5000.0)
    water_proximity_factor = np.clip((1500.0 - dist_w) / 1500.0, 0.0, 1.0)

    # Historical vulnerability prior
    hist_freq = df["historical_flood_frequency"].values

    # 3. Combined Hydrological Inundation Potential Index (HIPI)
    # Runoff + Topography + Proximity + History
    base_potential = (
        (np.clip(Q / 85.0, 0.0, 1.0) * 0.45) +
        (elev_penalty * 0.22) +
        (twi_norm * 0.15) +
        (water_proximity_factor * 0.10) +
        (hist_freq * 0.08)
    )

    # 4. Realistic Physical Stochasticity (unmapped pipe choke, tide, debris)
    noise = rng.normal(0.0, 0.08, n)
    inundation_prob = np.clip(base_potential + noise, 0.0, 1.0)

    # Positive classification threshold
    flood_labels = (inundation_prob >= 0.52).astype(int)

    # Physical impossibilities
    # Hilltops with steep slopes never flood
    hill_mask = (df["slope_deg"].values > 5.0) & (rel_elev > 35.0)
    flood_labels[hill_mask] = 0

    # Dry periods never flood
    dry_mask = df["rain_24h_mm"].values < 15.0
    flood_labels[dry_mask] = 0

    df["flood_label"] = flood_labels
    pos_count = int(flood_labels.sum())
    print(f"Constructed multi-city labels: {pos_count} positive samples out of {n} ({pos_count/n*100:.2f}% positive rate).")
    return df
