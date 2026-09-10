# DrainSense India — Data Pipeline & Preprocessing

## Pipeline Scripts
1. `python scripts/download_data.py`: Fetches real rainfall telemetry from Open-Meteo and compiles spatial grid layers.
2. `python scripts/validate_data.py`: Runs comprehensive schema and physical boundary checks:
   - Zero negative or extreme (&gt;300mm/h) rainfall records.
   - Coordinate bounding box constraint verification.
   - Zero missing feature values.
3. `python scripts/build_dataset.py`: Cross-joins the 810 spatial cells across 90 representative storm hours, generating 72,900 spatio-temporal training samples.
4. `python scripts/train_model.py`: Trains Dummy, Logistic Regression, Random Forest, and Calibrated XGBoost.
5. `python scripts/evaluate_model.py`: Computes ROC-AUC, PR-AUC, Brier score, and confusion matrix.
6. `python scripts/generate_predictions.py`: Outputs the complete GeoJSON risk prediction layer.

## Leakage Prevention Protocol
- **Strict Antecedent Horizons:** Rainfall metrics ($t-1\text{h}, t-3\text{h}, t-6\text{h}, t-12\text{h}, t-24\text{h}, t-72\text{h}$) are computed exclusively using rolling windows closed on the right, ensuring zero lookahead leakage into future storm hours.
- **Stratified & Temporal Splits:** Model evaluation is performed on a strict holdout slice with balanced representation of dry and storm hours.
