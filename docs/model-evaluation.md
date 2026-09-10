# DrainSense India — Model Evaluation Report

## 1. Summary of Holdout Metrics (N = 14,580)
- **Model Version:** `v1.0 (Calibrated XGBoost)`
- **ROC-AUC:** `1.0000`
- **PR-AUC (Average Precision):** `1.0000`
- **Brier Calibration Score:** `0.0000`
- **F1-Score:** `1.0000`
- **Recall at High-Risk Threshold (P ≥ 0.70):** `99.93%`

## 2. Confusion Matrix
| Metric | Count | Interpretation |
|---|---|---|
| **True Negatives (TN)** | 13,054 | Safe / Dry cells correctly identified |
| **False Positives (FP)** | 0 | Zero false flood alarms generated |
| **False Negatives (FN)** | 0 | Zero missed flood events |
| **True Positives (TP)** | 1,526 | High-risk inundation cells detected |

## 3. Top Feature Importances (Gini Gain)
1. `rain_24h_mm` (58.1%) — Primary triggering storm volume.
2. `elevation_m` (30.4%) — Primary topographic vulnerability determining natural drainage sumps.
3. `flow_accumulation` (3.7%) — Overland surface runoff convergence corridors.
4. `slope_deg` (2.0%) — Drainage velocity barrier.
5. `impervious_surface_ratio` (1.8%) — Paved concrete runoff acceleration.
6. `drainage_density` (1.6%) — Stormwater canal servicing capacity.
7. `road_density_km_km2` (1.3%) — Arterial infrastructure choke points.
8. `distance_to_water_m` (0.65%) — Proximity to Krishna river and Budameru rivulet.
