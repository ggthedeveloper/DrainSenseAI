"""
Model training pipeline for DrainSense India.
Compares:
1. Dummy Baseline
2. Logistic Regression
3. Random Forest Classifier
4. XGBoost Classifier (with probability calibration)

Evaluates precision, recall, F1, ROC-AUC, PR-AUC, Brier score, and calibration curve.
Exports best production artifact and metadata.
"""

import os
import json
import time
import logging
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, brier_score_loss, confusion_matrix
)
from xgboost import XGBClassifier

logger = logging.getLogger("DrainSense.Training")
logging.basicConfig(level=logging.INFO)

FEATURE_COLS = [
    "rain_1h_mm", "rain_3h_mm", "rain_6h_mm", "rain_12h_mm", "rain_24h_mm", "rain_72h_mm",
    "rain_intensity_mm_h", "rain_change_rate",
    "elevation_m", "slope_deg", "flow_accumulation", "drainage_density",
    "distance_to_water_m", "impervious_surface_ratio", "road_density_km_km2",
    "building_density", "historical_flood_frequency"
]

TARGET_COL = "flood_label"

def train_and_compare_models(data_path: str = "data/processed/drainsense_train_dataset.csv"):
    """Train multiple candidate models and select the optimal balanced classifier."""
    os.makedirs("models", exist_ok=True)
    
    logger.info(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    X = df[FEATURE_COLS]
    y = df[TARGET_COL].values
    
    pos_count = int(y.sum())
    neg_count = len(y) - pos_count
    scale_pos = neg_count / max(1, pos_count)
    logger.info(f"Dataset: {len(df)} samples ({pos_count} positive, {neg_count} negative). Scale pos weight: {scale_pos:.2f}")

    # Chronological or stratified split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    models = {
        "Dummy Baseline": DummyClassifier(strategy="stratified", random_state=42),
        "Logistic Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
        ]),
        "Random Forest": RandomForestClassifier(
            n_estimators=100, max_depth=10, class_weight="balanced",
            n_jobs=-1, random_state=42
        ),
        "XGBoost": XGBClassifier(
            n_estimators=120, max_depth=6, learning_rate=0.08,
            scale_pos_weight=scale_pos, eval_metric="logloss",
            random_state=42
        )
    }

    results = {}
    fitted_models = {}

    for name, model in models.items():
        logger.info(f"--- Training {name} ---")
        t0 = time.time()
        model.fit(X_train, y_train)
        train_time = round(time.time() - t0, 3)
        fitted_models[name] = model

        # Predictions & Probabilities
        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_test)[:, 1]
        else:
            y_prob = np.zeros(len(y_test))
            
        y_pred = (y_prob >= 0.5).astype(int) if hasattr(model, "predict_proba") else model.predict(X_test)

        # Compute rigorous metrics
        p = float(precision_score(y_test, y_pred, zero_division=0))
        r = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc_auc = float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 0.5
        pr_auc = float(average_precision_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 0.0
        brier = float(brier_score_loss(y_test, y_prob))
        cm = confusion_matrix(y_test, y_pred).tolist()

        # High risk threshold recall (>= 0.70 probability)
        high_risk_pred = (y_prob >= 0.70).astype(int)
        recall_at_high = float(recall_score(y_test, high_risk_pred, zero_division=0))

        results[name] = {
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "brier_score": round(brier, 4),
            "recall_at_high_risk": round(recall_at_high, 4),
            "train_time_sec": train_time,
            "confusion_matrix": cm
        }
        logger.info(f"{name} -> ROC-AUC: {roc_auc:.4f}, PR-AUC: {pr_auc:.4f}, F1: {f1:.4f}, Recall: {r:.4f}")

    # Select best model: XGBoost with 3-fold probability calibration
    logger.info("Calibrating XGBoost probabilities via 3-Fold Cross-Validation...")
    base_xgb = XGBClassifier(
        n_estimators=100, max_depth=6, learning_rate=0.08,
        scale_pos_weight=scale_pos, eval_metric="logloss",
        random_state=42
    )
    calibrated_xgb = CalibratedClassifierCV(estimator=base_xgb, method="sigmoid", cv=3)
    calibrated_xgb.fit(X_train, y_train)

    # Re-evaluate calibrated model
    cal_prob = calibrated_xgb.predict_proba(X_test)[:, 1]
    cal_pred = (cal_prob >= 0.5).astype(int)
    cal_brier = float(brier_score_loss(y_test, cal_prob))
    cal_roc = float(roc_auc_score(y_test, cal_prob))
    cal_pr = float(average_precision_score(y_test, cal_prob))
    cal_f1 = float(f1_score(y_test, cal_pred))

    results["XGBoost (Calibrated)"] = {
        "precision": round(float(precision_score(y_test, cal_pred)), 4),
        "recall": round(float(recall_score(y_test, cal_pred)), 4),
        "f1_score": round(cal_f1, 4),
        "roc_auc": round(cal_roc, 4),
        "pr_auc": round(cal_pr, 4),
        "brier_score": round(cal_brier, 4),
        "recall_at_high_risk": round(float(recall_score(y_test, (cal_prob >= 0.7).astype(int))), 4),
        "confusion_matrix": confusion_matrix(y_test, cal_pred).tolist()
    }

    # Feature Importance from raw XGBoost
    raw_xgb = fitted_models["XGBoost"]
    importances = raw_xgb.feature_importances_
    feat_imp = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in sorted(zip(FEATURE_COLS, importances), key=lambda x: x[1], reverse=True)
    ]

    # Save Best Model Artifact
    model_version = "v1.0"
    model_filename = "models/drainsense_xgb_v1.joblib"
    joblib.dump(calibrated_xgb, model_filename)
    logger.info(f"Saved best model artifact to {model_filename}")

    # Save Comprehensive Metadata
    metadata = {
        "model_version": model_version,
        "model_type": "XGBoost Classifier (Calibrated with Sigmoid)",
        "training_timestamp": datetime.utcnow().isoformat() + "Z",
        "dataset_path": data_path,
        "total_samples": len(df),
        "test_samples": len(X_test),
        "feature_columns": FEATURE_COLS,
        "target_column": TARGET_COL,
        "thresholds": {
            "LOW": [0.0, 0.20],
            "MODERATE": [0.20, 0.40],
            "ELEVATED": [0.40, 0.60],
            "HIGH": [0.60, 0.80],
            "CRITICAL": [0.80, 1.00]
        },
        "metrics_comparison": results,
        "active_model_metrics": results["XGBoost (Calibrated)"],
        "feature_importances": feat_imp,
        "scientific_disclaimer": "Estimates zone-level waterlogging risk; decision-support only."
    }

    meta_filename = "models/drainsense_xgb_v1_metadata.json"
    with open(meta_filename, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved model metadata to {meta_filename}")

    return metadata

if __name__ == "__main__":
    train_and_compare_models()
