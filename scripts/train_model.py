#!/usr/bin/env python3
"""CLI script to train candidate models and calibrate the best production model."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.src.training.train import train_and_compare_models

if __name__ == "__main__":
    print("=== DrainSense India: Training ML Models & Calibrating Probabilities ===")
    meta = train_and_compare_models()
    print(f"Model Training Complete! Active Version: {meta['model_version']}")
    print(f"Metrics: {meta['active_model_metrics']}")
