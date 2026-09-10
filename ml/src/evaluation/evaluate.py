"""
Model evaluation module for DrainSense India.
Calculates calibration curves, confusion matrix breakdown,
PR curves, ROC curves, and generates evaluation report.
"""

import json
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_curve, precision_recall_curve, confusion_matrix,
    classification_report, brier_score_loss, roc_auc_score, average_precision_score
)
from sklearn.calibration import calibration_curve

logger = logging.getLogger("DrainSense.Evaluation")

def run_evaluation(
    model_path: str = "models/drainsense_xgb_v1.joblib",
    meta_path: str = "models/drainsense_xgb_v1_metadata.json",
    data_path: str = "data/processed/drainsense_train_dataset.csv",
    output_report_path: str = "data/processed/evaluation_report.json"
):
    """Run comprehensive model evaluation and generate JSON & Markdown artifacts."""
    logger.info("Loading model and dataset...")
    model = joblib.load(model_path)
    with open(meta_path, "r") as f:
        meta = json.load(f)
        
    df = pd.read_csv(data_path)
    features = meta["feature_columns"]
    target = meta["target_column"]
    
    # Holdout 20% evaluation slice (fixed seed)
    from sklearn.model_selection import train_test_split
    _, X_val, _, y_val = train_test_split(
        df[features], df[target].values, test_size=0.20, random_state=42, stratify=df[target].values
    )
    
    y_prob = model.predict_proba(X_val)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)
    
    # Calibration Curve (binned probabilities vs observed fraction)
    prob_true, prob_pred = calibration_curve(y_val, y_prob, n_bins=10)
    
    # ROC and PR points
    fpr, tpr, _ = roc_curve(y_val, y_prob)
    precision_pts, recall_pts, _ = precision_recall_curve(y_val, y_prob)
    
    # Downsample points for JSON visualization in dashboard
    step = max(1, len(fpr) // 30)
    roc_series = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr[::step], tpr[::step])]
    
    step_pr = max(1, len(recall_pts) // 30)
    pr_series = [{"recall": round(float(r), 4), "precision": round(float(p), 4)} for r, p in zip(recall_pts[::step_pr], precision_pts[::step_pr])]
    
    calibration_series = [
        {"predicted_mean_prob": round(float(p), 4), "observed_positive_rate": round(float(o), 4)}
        for p, o in zip(prob_pred, prob_true)
    ]
    
    cm = confusion_matrix(y_val, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    report = {
        "model_version": meta["model_version"],
        "evaluation_samples": len(y_val),
        "positive_ground_truth": int(y_val.sum()),
        "roc_auc": round(float(roc_auc_score(y_val, y_prob)), 4),
        "pr_auc": round(float(average_precision_score(y_val, y_prob)), 4),
        "brier_score": round(float(brier_score_loss(y_val, y_prob)), 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "rates": {
            "false_positive_rate": round(float(fp / (fp + tn)), 4) if (fp + tn) > 0 else 0.0,
            "false_negative_rate": round(float(fn / (fn + tp)), 4) if (fn + tp) > 0 else 0.0,
            "sensitivity_recall": round(float(tp / (tp + fn)), 4) if (tp + fn) > 0 else 0.0,
            "specificity": round(float(tn / (tn + fp)), 4) if (tn + fp) > 0 else 0.0,
            "precision": round(float(tp / (tp + fp)), 4) if (tp + fp) > 0 else 0.0
        },
        "calibration_curve": calibration_series,
        "roc_curve": roc_series,
        "pr_curve": pr_series,
        "feature_importances": meta.get("feature_importances", [])
    }
    
    with open(output_report_path, "w") as f:
        json.dump(report, f, indent=2)
        
    logger.info(f"Evaluation report generated and saved to {output_report_path}")
    return report

if __name__ == "__main__":
    run_evaluation()
