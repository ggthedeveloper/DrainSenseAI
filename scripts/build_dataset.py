#!/usr/bin/env python3
"""CLI script to build the training dataset."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.src.features.feature_builder import build_full_dataset

if __name__ == "__main__":
    print("=== DrainSense India: Building Dataset ===")
    df = build_full_dataset()
    print(f"Complete! Dataset built with {len(df)} rows.")
