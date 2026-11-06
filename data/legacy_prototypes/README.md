# Legacy Prototype Datasets (September 2024 Initial Drafts)

This directory contains legacy synthetic grid files generated during the preliminary proof of concept phase on September 11, 2024.

## Reason for Archival

In early development, 10 city grids were generated using synthetic random ranges before the integration of the automated Copernicus 30m Digital Elevation Model (DEM) and ECMWF ERA5 telemetry harvester.

These files have been superseded by verified Earth observation telemetry for the primary 4 metropolitan study basins:
1. Vijayawada / Amaravati (`VJA`)
2. Chennai (`CHE`)
3. Mumbai (`BOM`)
4. Bengaluru (`BLR`)

All active models, API endpoints, physics engines, and UI maps exclusively use the verified datasets located in `data/raw/` and `data/processed/`.
