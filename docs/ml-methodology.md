# DrainSense India 2.0 — Machine Learning Methodology & Architecture

## 1. Problem Formulation & Multi-Tier Framework
DrainSenseAI 2.0 transitions from a simplistic binary black-box classifier to a **Physics-Informed, Multi-Tier Decision Architecture**:

1. **Tier 1 — Unsupervised Topographic Archetyping ($K=4$ K-Means):**
   - Stratifies the 1,100 grid cells ($250\,\text{m}$ resolution) into distinct civil infrastructure archetypes:
     - Archetype 0: Highland Resistant Ridges
     - Archetype 1: Lowland Catchment Sumps / Depressions
     - Archetype 2: Dense Built-up Runoff Accelerated Corridors
     - Archetype 3: Riparian Riverine Buffer Zones

2. **Tier 2 — Calibrated Supervised Inundation Probability:**
   - Evaluates:
     $$P(\text{Inundation in cell } i \text{ during event } t \mid \mathbf{x}_{i,t})$$
   - Target Definition: A cell is labeled positive (`flood_label = 1`) if the combination of rainfall, upstream runoff, and river stage causes inundation depth $\ge 0.15\,\text{m}$ (6 inches).
   - Calibrated Risk Score $S \in [0, 100\%]$ mapped into a 5-tier municipal action taxonomy:
     - `0 - 20%`: LOW (Normal operations)
     - `20 - 40%`: MODERATE (Clear curbside inlets)
     - `40 - 60%`: ELEVATED (Stage mobile dewatering units)
     - `60 - 80%`: HIGH (Pre-deploy barricades & emergency pumps)
     - `80 - 100%`: CRITICAL (Evacuate low-lying underpasses & sound sirens)

3. **Tier 3 — Root Cause Failure Mode Attribution (Multi-Class):**
   - Pinpoints the physical mechanism causing the flood:
     - `SURFACE_RUNOFF_CHOKE`: High imperviousness + low canal density choke overland flow.
     - `DEPRESSION_TRAP`: Negative multi-scale TPI collects trapped water.
     - `BARRAGE_BACKWATER`: River level at Prakasam Barrage exceeds $5.50\,\text{m}$ causing gravitational stormwater outfall reversal.
     - `COMBINED_COMPOUND`: Convergence of upstream runoff + localized depression.
     - `NONE_DRY` / `NONE_STEEP_SLOPE`: Safe non-flooding conditions.

---

## 2. Feature Schema & Selection

From an initial pool of 24 raw and derived features, collinearity filters ($|r| > 0.85$) and wrapper selection (Sequential Forward Selection, Sequential Backward Selection, RFECV) established the optimal 9-feature production vector:

| Feature | Type | Source / Derivation | Physical Civil Engineering Role |
|---|---|---|---|
| `elevation_m` | Static | Copernicus GLO-30 DEM | Absolute gravitational potential |
| `slope_deg` | Static | DEM Surface Gradient | Surface runoff flow velocity |
| `tpi_11` | Static | Multi-scale Topographic Position Index ($2,750\,\text{m}$) | Distinguishes deep retention basins from elevated ridges |
| `topographic_trap_index` | Static | $(\text{TPI}_{11} < -1.5) \times (1 - \tanh(\text{slope}))$ | Physics-based depression trap metric |
| `distance_to_water_m` | Static | Hydrographic River Network | Krishna River / Budameru rivulet proximity |
| `drainage_density_km_km2` | Static | Stormwater Canal GIS Network | Local drainage capacity per $\text{km}^2$ |
| `curve_number` | Static | NRCS-SCS Hydrologic Soil-Cover Complex | Infiltration potential vs. surface runoff generation |
| `rain_24h_mm` | Dynamic | CWC / IMD Telemetry & IMERG GPM | Cumulative storm deluge volume |
| `prakasam_stage_m` | Dynamic | CWC Krishna River Telemetry | Tailwater boundary stage (determines outfall lock) |

---

## 3. Data Leakage Prevention & Validation Strategy

To prevent over-optimistic performance estimates from spatial or temporal autocorrelation:
- **Zero Data Leakage Chronological Split:**
  - Events are split strictly by calendar timeline (no random mixing across storm dates):
    - **Training Set (70%):** 77,000 samples (70 events, July 2021 – May 2024)
    - **Validation Set (15%):** 16,500 samples (15 events, May 2024 – June 2025)
    - **Test Holdout Set (15%):** 17,600 samples (16 events, July 2025 – October 2025)
- **Train-Only Preprocessing:**
  - Standard scaling parameters ($\mu, \sigma$) and calibration curves are computed strictly on the training set.
  - 20 zero-rain control periods ($0.0\,\text{mm}$ rain, $3.40\,\text{m}$ river stage) were introduced to eliminate positive reporting bias.

---

## 4. Benchmark Models Comparison (Test Holdout: $N=17,600$)

| Model Architecture | Accuracy | Precision | Recall (Sensitivity) | Specificity (TNR) | NPV | F1-Score | MCC | ROC-AUC | PR-AUC | Brier Score |
|---|---|---|---|---|---|---|---|---|---|---|
| **Dummy Baseline (Prior)** | 60.17% | 33.39% | 33.35% | 66.86% | 66.81% | 0.2367 | -0.0042 | 0.4982 | 0.3344 | 0.3983 |
| **Logistic Regression** | 96.69% | 97.43% | 92.51% | 98.79% | 96.34% | 0.9491 | 0.9269 | 0.9940 | 0.9856 | 0.0247 |
| **Decision Tree (CART)** | 95.34% | 95.17% | 90.63% | 97.71% | 95.40% | 0.9284 | 0.8970 | 0.9936 | 0.9701 | 0.0466 |
| **Random Forest (120 Trees)**| 92.93% | 83.07% | **99.97%** | 89.44% | **99.98%** | 0.9073 | 0.8653 | 0.9996 | 0.9990 | 0.0543 |
| **Uncalibrated XGBoost** | **97.08%**| 92.61% | 98.51% | 96.36% | 99.23% | **0.9547** | **0.9363** | **0.9986** | **0.9972** | 0.0219 |
| **Calibrated XGBoost (Prod)** | 95.36% | **98.88%**| 87.14% | **99.50%** | 93.88% | 0.9264 | 0.8965 | 0.9920 | 0.9752 | 0.0638 |

---

## 5. Probability Calibration & Civil Deployment Decision

While uncalibrated trees maximize raw discrimination, **DrainSenseAI 2.0 adopts Calibrated XGBoost with 3-Fold Sigmoid (Platt) Calibration as the production model**:
- **False Alarm Elimination:** False positives drop from 866 (uncalibrated) to **58** (calibrated) across 11,699 safe cells. In municipal operations, false alarms induce warning fatigue and costly mobilization.
- **Reliability:** Predicted probabilities match empirical flood rates, enabling direct volumetric risk calculation ($V_{\text{excess}} = Q \times A$).

