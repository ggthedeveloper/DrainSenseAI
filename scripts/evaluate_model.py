#!/usr/bin/env python3
"""CLI script to evaluate the trained model and output calibration stats."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.src.evaluation.evaluate import run_evaluation

if __name__ == "__main__":
    print("=== DrainSense India: Running Model Evaluation ===")
    rep = run_evaluation()
    print(f"Evaluation Complete!")
    print(f"ROC-AUC: {rep['roc_auc']:.4f}")
    print(f"PR-AUC:  {rep['pr_auc']:.4f}")
    print(f"Brier:   {rep['brier_score']:.4f}")
    print(f"Confusion Matrix: {rep['confusion_matrix']}")
