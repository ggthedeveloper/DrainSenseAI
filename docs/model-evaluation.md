# DrainSense India 2.0 — Model Evaluation Report

## 1. Summary of Holdout Metrics (Test Set: $N = 17,600$)
- **Model Version:** `DrainSense v2.0 (Calibrated XGBoost Classifier)`
- **Evaluation Protocol:** Chronological holdout split (Test events: July 2025 – October 2025; completely unseen storms)
- **Accuracy:** `95.36%`
- **Precision (Positive Predictive Value):** `98.88%`
- **Recall (Sensitivity):** `87.14%`
- **Specificity (True Negative Rate):** `99.50%`
- **Negative Predictive Value (NPV):** `93.88%`
- **F1-Score:** `0.9264`
- **Matthews Correlation Coefficient (MCC):** `0.8965`
- **ROC-AUC:** `0.9920`
- **PR-AUC (Average Precision):** `0.9752`
- **Brier Calibration Score:** `0.0638`

---

## 2. Test Holdout Confusion Matrix
| Metric | Count | Interpretation in Municipal Context |
|---|---|---|
| **True Negatives (TN)** | 11,641 | Safe / dry cells correctly classified without sounding false alerts |
| **False Positives (FP)** | 58 | False alarms minimized to only 0.5% (down from 881 in uncleaned models) |
| **False Negatives (FN)** | 759 | Borderline shallow pooling missed at strict 0.50 cutoff |
| **True Positives (TP)** | 5,142 | Dangerous inundation zones correctly identified in advance |

---

## 3. Production Model Feature Importances (Gain)
From the trained XGBoost tree architecture, the fractional contribution of each feature to log-loss reduction:
1. `rain_24h_mm` (**42.3%**) — Primary triggering dynamic storm load.
2. `tpi_11` (**24.7%**) — Multi-scale Topographic Position Index capturing regional depression bowls.
3. `elevation_m` (**14.1%**) — Absolute gravitational drainage potential.
4. `topographic_trap_index` (**8.9%**) — Physical basin trap indicator.
5. `prakasam_stage_m` (**4.2%**) — Krishna river barrage tailwater level locking outfalls.
6. `curve_number` (**2.6%**) — Soil and land-cover runoff retention capacity ($S$).
7. `slope_deg` (**1.8%**) — Overland flow kinetic velocity.
8. `distance_to_water_m` (**0.9%**) — Proximity to Budameru / Krishna channels.
9. `drainage_density_km_km2` (**0.5%**) — Local stormwater channel conveyance density.

---

## 4. Root Cause Failure Attribution (Tier 3 Multi-Class)
On the holdout test set, the failure mode attribution model achieved an overall accuracy of **97.05%** and a weighted F1-score of **0.9712**:

| Failure Mode | Support | Precision | Recall | F1-Score | Civil Action Triggered |
|---|---|---|---|---|---|
| `NONE_DRY` | 11,540 | 100.0% | 100.0% | 1.000 | Normal operations |
| `NONE_STEEP_SLOPE` | 159 | 100.0% | 100.0% | 1.000 | Monitor runoff velocity downstream |
| `DEPRESSION_TRAP` | 3,747 | 96.6% | 99.8% | 0.982 | Barricade low underpasses, deploy sump pumps |
| `SURFACE_RUNOFF_CHOKE` | 1,848 | 97.4% | 88.5% | 0.927 | Dispatch mobile dewatering units to storm drains |
| `COMBINED_COMPOUND` | 306 | 97.7% | 96.7% | 0.972 | Evacuate residents; mobilize emergency rescue |
| `BARRAGE_BACKWATER` | 0* | N/A | N/A | N/A | Automated flap gates closure |

*\* Note: The late 2025 test storms did not breach the extreme 5.50m barrage emergency threshold.*

