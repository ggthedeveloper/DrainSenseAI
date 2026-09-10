#!/usr/bin/env python3
"""CLI script to generate risk predictions for active case study."""
import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.src.inference.predictor import predictor_service

if __name__ == "__main__":
    print("=== DrainSense India: Generating Current Grid Risk Predictions ===")
    res = predictor_service.get_current_risk_map()
    summary = res["summary"]
    print(f"City: {summary['monitored_city']}")
    print(f"Total Grids: {summary['total_grids']} ({summary['monitored_area_sqkm']} sq km)")
    print(f"Critical Zones: {summary['critical_zones']}")
    print(f"High Risk Zones: {summary['high_risk_zones']}")
    print(f"Elevated Zones: {summary['elevated_zones']}")
    print(f"Moderate Zones: {summary['moderate_zones']}")
    print(f"Low Zones: {summary['low_zones']}")
    print(f"Peak Risk Sector: {summary['highest_risk_zone']['zone_name']} (Score: {summary['highest_risk_zone']['risk_score']})")
    
    out_file = "data/processed/current_risk_predictions.json"
    with open(out_file, "w") as f:
        json.dump(res, f, indent=2)
    print(f"Saved full GeoJSON risk predictions to {out_file}.")
