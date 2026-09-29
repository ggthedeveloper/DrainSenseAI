"""
USDA-NRCS SCS-CN (Soil Conservation Service Curve Number) Hydrological Engine.
Provides physics-guided constraints, mass-conservation bounds, and concordance auditing
for the DrainSense machine learning pipeline.
"""

import math
from typing import Dict, Any, Optional

SOIL_GROUP_BASE_CN = {
    "A": 45.0,  # High infiltration (sandy/gravelly)
    "B": 65.0,  # Moderate infiltration (sandy loam/loam)
    "C": 78.0,  # Slow infiltration (clay loam, shallow soils) - Typical Indian alluvial
    "D": 84.0   # Very slow infiltration (heavy clay, high water table)
}

def calculate_scs_cn_runoff(
    rainfall_mm: float,
    urban_imperviousness_pct: float = 65.0,
    slope_degrees: float = 2.0,
    soil_group: str = "C",
    cell_area_m2: float = 250000.0,  # 500m x 500m
    drainage_conveyance_m3s: float = 12.0
) -> Dict[str, Any]:
    """
    Computes physical hydrological runoff using USDA-NRCS SCS-CN methodology.
    
    Returns:
        Dictionary containing curve number, retention, initial abstraction,
        runoff depth (mm), runoff volume (m3), peak discharge (m3/s), and drainage capacity status.
    """
    sg = soil_group.upper() if soil_group in SOIL_GROUP_BASE_CN else "C"
    base_cn = SOIL_GROUP_BASE_CN[sg]
    
    # Composite Curve Number accounting for impervious urban fractions (impervious pavement CN ~ 98)
    imp_frac = max(0.05, min(0.98, urban_imperviousness_pct / 100.0))
    cn_composite = (base_cn * (1.0 - imp_frac)) + (98.0 * imp_frac)
    
    # Slope adjustment for CN
    slope_pct = math.tan(math.radians(max(0.2, min(45.0, slope_degrees)))) * 100.0
    cn_slope_adj = cn_composite * (322.79 + 15.63 * slope_pct) / (slope_pct + 323.52)
    cn = max(50.0, min(98.5, round(cn_slope_adj, 1)))
    
    # Potential Maximum Retention S (mm)
    s_retention = (25400.0 / cn) - 254.0
    
    # Initial Abstraction Ia (mm) - standard 0.2S (urban Indian calibrated at 0.15S)
    ia = 0.18 * s_retention
    
    # Direct Runoff Depth Q (mm)
    if rainfall_mm <= ia:
        runoff_mm = 0.0
    else:
        runoff_mm = ((rainfall_mm - ia) ** 2) / (rainfall_mm - ia + s_retention)
        
    runoff_mm = round(min(rainfall_mm, runoff_mm), 2)
    
    # Volumetric Runoff (m3) across 500m x 500m cell
    runoff_volume_m3 = round(runoff_mm * (cell_area_m2 / 1000.0), 1)
    
    # Time of Concentration tc (Kirpich formula for 500m cell length)
    length_m = 500.0
    slope_ratio = max(0.001, math.tan(math.radians(max(0.1, slope_degrees))))
    tc_hours = 0.01947 * (length_m ** 0.77) * (slope_ratio ** -0.385) / 60.0
    tc_hours = max(0.2, min(3.0, round(tc_hours, 2)))
    
    # Time to Peak tp
    tp_hours = max(0.15, round(0.6 * tc_hours, 2))
    
    # Peak Discharge Rate qp (m3/s) via SCS Triangular Unit Hydrograph
    # qp = (2.08 * Area_km2 * Runoff_mm) / tp_hours
    area_km2 = cell_area_m2 / 1e6  # 0.25 km2
    peak_discharge_m3s = round((2.08 * area_km2 * runoff_mm) / max(0.15, tp_hours), 2)
    
    # Conveyance surplus/deficit
    drainage_deficit_m3s = max(0.0, round(peak_discharge_m3s - drainage_conveyance_m3s, 2))
    
    return {
        "curve_number": cn,
        "soil_hydrologic_group": sg,
        "imperviousness_pct": round(imp_frac * 100.0, 1),
        "potential_retention_mm": round(s_retention, 2),
        "initial_abstraction_mm": round(ia, 2),
        "rainfall_depth_mm": round(rainfall_mm, 2),
        "runoff_depth_mm": runoff_mm,
        "runoff_volume_m3": runoff_volume_m3,
        "time_of_concentration_hours": tc_hours,
        "time_to_peak_hours": tp_hours,
        "peak_discharge_m3s": peak_discharge_m3s,
        "drainage_conveyance_m3s": drainage_conveyance_m3s,
        "drainage_deficit_m3s": drainage_deficit_m3s,
        "drainage_overloaded": drainage_deficit_m3s > 0
    }

def audit_physics_ml_concordance(
    ml_risk_score: float,  # 0 to 100
    rainfall_mm: float,
    elevation_m: float,
    slope_degrees: float,
    flow_accumulation: float,
    soil_group: str = "C"
) -> Dict[str, Any]:
    """
    Cross-evaluates the ML model's risk prediction against physical SCS-CN runoff laws.
    Identifies whether the prediction obeys physical hydrology or represents localized anomalies.
    """
    # Estimate imperviousness from flow accumulation and typical urban settlement proxy
    est_imperviousness = max(20.0, min(92.0, 35.0 + (flow_accumulation * 0.45)))
    
    # Standard cell conveyance capacity proxy based on elevation and drainage infrastructure
    conveyance_proxy = max(5.0, min(25.0, 8.0 + (slope_degrees * 1.5)))
    
    scs_metrics = calculate_scs_cn_runoff(
        rainfall_mm=rainfall_mm,
        urban_imperviousness_pct=est_imperviousness,
        slope_degrees=slope_degrees,
        soil_group=soil_group,
        drainage_conveyance_m3s=conveyance_proxy
    )
    
    # Runoff ratio (0.0 to 1.0)
    runoff_ratio = scs_metrics["runoff_depth_mm"] / max(1.0, rainfall_mm)
    ml_prob = ml_risk_score / 100.0
    
    # Concordance calculation
    divergence = abs(ml_prob - runoff_ratio)
    concordance_pct = max(10.0, min(99.0, round((1.0 - divergence) * 100.0, 1)))
    
    # Categorize relationship
    if divergence <= 0.20:
        concordance_class = "STRONG_CONCORDANCE"
        concordance_label = "Strong Physics-ML Alignment"
        diagnosis = "Machine learning probability aligns closely with physical SCS-CN overland runoff generation."
    elif ml_prob > runoff_ratio + 0.20:
        concordance_class = "ML_ELEVATED_ANOMALY"
        concordance_label = "Backwater / Structural Choke Risk"
        diagnosis = "ML risk exceeds local surface runoff due to external river backwater, low drainage density, or historical chronic sump stagnation."
    else:
        concordance_class = "HIGH_INFILTRATION_BUFFER"
        concordance_label = "Natural Absorption Buffer"
        diagnosis = "Physical runoff is high, but permeable soil or terrain gradient mitigates structural inundation risk."
        
    return {
        "concordance_pct": concordance_pct,
        "concordance_class": concordance_class,
        "concordance_label": concordance_label,
        "diagnosis": diagnosis,
        "ml_risk_score": ml_risk_score,
        "physical_runoff_ratio_pct": round(runoff_ratio * 100.0, 1),
        "scs_metrics": scs_metrics
    }
