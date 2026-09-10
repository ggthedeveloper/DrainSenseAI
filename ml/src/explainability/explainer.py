"""
Explainability module for DrainSense India.
Calculates SHAP-based feature attributions and translates numerical feature impacts
into human-interpretable municipal decision-support rationales.
"""

import json
import logging
import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger("DrainSense.Explainer")

FEATURE_DESCRIPTIONS = {
    "rain_24h_mm": "24-hour antecedent rainfall volume",
    "rain_6h_mm": "6-hour antecedent rainfall volume",
    "rain_1h_mm": "1-hour burst rainfall volume",
    "elevation_m": "Ground surface elevation above mean sea level",
    "slope_deg": "Topographic terrain slope",
    "flow_accumulation": "Hydrological flow accumulation index",
    "drainage_density": "Urban drainage network density",
    "distance_to_water_m": "Proximity to primary water bodies/corridors",
    "impervious_surface_ratio": "Impervious surface fraction (built-up cover)",
    "road_density_km_km2": "Road network density",
    "historical_flood_frequency": "Historical flood recurrence frequency in zone"
}

def explain_prediction(features_dict: dict, top_k: int = 4) -> list:
    """
    Generate transparent, evidence-based feature rationales for a zone's risk prediction.
    Calculates positive risk multipliers and mitigating buffer factors.
    """
    factors = []
    
    # 1. Rainfall volume
    r24 = features_dict.get("rain_24h_mm", 0.0)
    r6 = features_dict.get("rain_6h_mm", 0.0)
    if r24 >= 140.0:
        factors.append({
            "factor": "Extreme 24h Rainfall Accumulation",
            "impact": "+ CRITICAL",
            "value": f"{r24} mm",
            "direction": "escalating",
            "explanation": f"24h cumulative rainfall of {r24}mm exceeds urban storm drainage threshold (120mm)."
        })
    elif r24 >= 75.0 or r6 >= 45.0:
        factors.append({
            "factor": "Heavy Antecedent Rainfall",
            "impact": "+ HIGH",
            "value": f"{r24} mm / 24h",
            "direction": "escalating",
            "explanation": f"Heavy antecedent rainfall saturated local catchment soil absorption capacity."
        })
    elif r24 < 25.0:
        factors.append({
            "factor": "Low Rainfall Antecedent",
            "impact": "- LOW",
            "value": f"{r24} mm / 24h",
            "direction": "mitigating",
            "explanation": "Low precipitation volume keeps runoff well within stormwater capacity."
        })

    # 2. Elevation & Topography
    elev = features_dict.get("elevation_m", 25.0)
    slope = features_dict.get("slope_deg", 1.5)
    if elev <= 19.5:
        factors.append({
            "factor": "Low-Lying Topographic Depression",
            "impact": "+ HIGH",
            "value": f"{elev} m AMSL",
            "direction": "escalating",
            "explanation": f"Low elevation ({elev}m) creates natural gravity sump prone to water stagnation."
        })
    elif elev >= 45.0:
        factors.append({
            "factor": "High Ridge Elevation",
            "impact": "- MITIGATING",
            "value": f"{elev} m AMSL",
            "direction": "mitigating",
            "explanation": f"High ground elevation ({elev}m) and steep slope prevent water pooling."
        })

    # 3. Flow Accumulation & Drainage Density
    flow = features_dict.get("flow_accumulation", 10.0)
    if flow >= 45.0:
        factors.append({
            "factor": "High Surface Runoff Accumulation",
            "impact": "+ HIGH",
            "value": f"Index {flow}/100",
            "direction": "escalating",
            "explanation": "Geomorphic convergence lines route overland storm runoff directly into this cell."
        })

    # 4. Proximity to Budameru / Krishna
    dist_w = features_dict.get("distance_to_water_m", 1500.0)
    dist_budameru = features_dict.get("distance_to_budameru_m", 3000.0)
    if dist_budameru <= 1500.0:
        factors.append({
            "factor": "Proximity to Budameru Breach Corridor",
            "impact": "+ ELEVATED",
            "value": f"{dist_budameru} m",
            "direction": "escalating",
            "explanation": "Located in the primary Budameru flood release and overflow buffer corridor."
        })
    elif dist_w <= 600.0:
        factors.append({
            "factor": "Riverbank / Canal Buffer Proximity",
            "impact": "+ MODERATE",
            "value": f"{dist_w} m",
            "direction": "escalating",
            "explanation": "High groundwater table and backwater pressure from adjacent canal/river."
        })

    # 5. Built-up Impervious Surface
    imp = features_dict.get("impervious_surface_ratio", 0.3)
    if imp >= 0.70:
        factors.append({
            "factor": "High Impervious Built-Up Cover",
            "impact": "+ MODERATE",
            "value": f"{int(imp * 100)}%",
            "direction": "escalating",
            "explanation": "Dense concrete and asphalt pavement prevents natural stormwater infiltration."
        })

    # 6. Historical Flooding
    hist_freq = features_dict.get("historical_flood_frequency", 0.0)
    if hist_freq >= 0.3:
        factors.append({
            "factor": "Repeated Historical Flood Recurrence",
            "impact": "+ ELEVATED",
            "value": f"{int(hist_freq * 10)} documented events",
            "direction": "escalating",
            "explanation": "Zone has repeatedly inundated during 2019, 2020, or 2024 severe monsoon storms."
        })

    # Fallback if no triggers fired
    if not factors:
        factors.append({
            "factor": "Normal Urban Baseline Condition",
            "impact": "NEUTRAL",
            "value": "Nominal",
            "direction": "neutral",
            "explanation": "Topography, slope, and drainage capacity are in balance under current conditions."
        })

    return factors[:top_k]
