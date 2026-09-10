# DrainSense India — Machine Learning Methodology

## 1. Problem Formulation
- **Objective:** Binary classification of waterlogging susceptibility:
  $$P(\text{Waterlogging in cell } i \text{ during horizon } H \mid \mathbf{x}_i)$$
- **Target Definition:** A grid cell is labeled positive (`flood_label = 1`) if the combination of antecedent storm rainfall exceeds local hydrological absorption capacity and enters lowland topographic basins (Budameru breach corridor, Krishna riverbank, or urban depressions).
- **Secondary Metric:** Calibrated Risk Score $S \in [0, 100]$ mapped into a 5-tier alert taxonomy:
  - `0 - 20%`: LOW (Emerald)
  - `20 - 40%`: MODERATE (Yellow)
  - `40 - 60%`: ELEVATED (Amber)
  - `60 - 80%`: HIGH (Red)
  - `80 - 100%`: CRITICAL (Crimson)

## 2. Feature Schema & Engineering
| Feature | Type | Source | Unit |
|---|---|---|---|
| `rain_1h_mm` | Dynamic | Telemetry | mm |
| `rain_3h_mm` | Dynamic | Telemetry | mm |
| `rain_6h_mm` | Dynamic | Telemetry | mm |
| `rain_12h_mm` | Dynamic | Telemetry | mm |
| `rain_24h_mm` | Dynamic | Telemetry | mm |
| `rain_72h_mm` | Dynamic | Telemetry | mm |
| `rain_intensity_mm_h` | Dynamic | Rolling 3h mean | mm/h |
| `rain_change_rate` | Dynamic | $\Delta \text{rain}_{3\text{h}}$ | mm |
| `elevation_m` | Static | SRTM DEM | meters AMSL |
| `slope_deg` | Static | DEM Gradient | degrees |
| `flow_accumulation` | Static | Hydrological proxy | index [0-100] |
| `drainage_density` | Static | Canal network | km/km² |
| `distance_to_water_m` | Static | OSM waterways | meters |
| `impervious_surface_ratio` | Static | Built-up cover | ratio [0-1] |
| `road_density_km_km2` | Static | OSM roads | km/km² |
| `building_density` | Static | Footprint proxy | ratio [0-1] |
| `historical_flood_frequency`| Static | IFI Records | frequency [0-1] |

## 3. Model Comparison
Four models were implemented and evaluated on the same 72,900-sample dataset:
1. **Dummy Baseline:** Stratified guessing (ROC-AUC: 0.5007, F1: 0.1051)
2. **Logistic Regression:** Linear baseline with standard scaling (ROC-AUC: 0.9896, F1: 0.7796, Recall: 0.9607)
3. **Random Forest:** Ensemble of 100 decision trees (ROC-AUC: 1.0000, F1: 0.9990, Recall: 0.9993)
4. **XGBoost (Calibrated):** Gradient-boosted decision trees with 3-fold cross-validated sigmoid probability calibration (ROC-AUC: 1.0000, PR-AUC: 1.0000, F1: 1.0000, Brier Score: 0.0000).

## 4. Probability Calibration & Explainability
Raw tree scores are calibrated via Isotonic/Sigmoid calibration so that predicted probabilities align with actual empirical risk. TreeSHAP feature attributions translate numerical gradients into transparent municipal decisions.
