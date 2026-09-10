#!/usr/bin/env python3
"""CLI script to download raw rainfall, flood, and spatial data."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.src.ingestion.rainfall_loader import generate_curated_telemetry_series
from ml.src.ingestion.spatial_loader import save_spatial_layers
from ml.src.ingestion.flood_loader import save_flood_events_table

if __name__ == "__main__":
    print("=== DrainSense India: Downloading & Preparing Ingestion Layers ===")
    print("1. Ingesting rainfall telemetry...")
    generate_curated_telemetry_series()
    print("2. Generating spatial 500m grid layers...")
    save_spatial_layers()
    print("3. Ingesting historical flood events...")
    save_flood_events_table()
    print("All ingestion layers successfully prepared.")
