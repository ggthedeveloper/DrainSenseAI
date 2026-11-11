# Terrain feature preparation

This pipeline derives 30 m surface and terrain covariates from the local Copernicus DEM files and summarizes them to the project's existing 250 m Vijayawada grid. It does not download rainfall, merge other sources, create labels, or train models.

## Run

From the repository root, using the project's existing environment:

```powershell
data\raw\.venv\Scripts\python.exe src\terrain_processing\pipeline.py
```

Dependencies are listed in `requirements.txt`. Outputs are written only when their destination paths do not already exist; archive existing outputs before rerunning. The raw TIFFs and existing grid are inputs only.

## Methods and caveats

- Source: `data/raw/dem/tiles/Copernicus_DSM_COG_10_N16_00_E080_00_DEM.tif`.
- Boundary and grid: `data/metadata/study_area.geojson` and `data/interim/phase4/analysis_grid_250m.gpkg`.
- Reprojection: bilinear resampling to a 30 m aligned EPSG:32644 grid, with a 3 km buffer retained for terrain derivatives. `dem_clipped.tif` is masked to the boundary.
- Slope: finite differences with horizontal and vertical units in metres; output degrees.
- TPI: center value less the valid neighboring mean at 3, 7, and 11 pixels.
- Flow: PyFlwDir D8 routing, edge outlets, depression filling to pour points (`max_depth=-1`) on the buffered DSM. This is an exploratory contributing-cell proxy, not drainage discharge.
- Cell summaries use pixel-center inclusion. The study area is wholly covered by valid source raster footprint; `valid_dem_area_m2` and `valid_area_ratio` record its clipped polygon area/coverage. Sliver polygons with no pixel-center sample retain null terrain statistics.
- The source is a DSM, so buildings and vegetation affect values. See `reports/terrain_dataset_audit.md` before interpreting outputs.

Outputs: `data/interim/dem/`, `data/processed/terrain_features.csv`, `data/processed/terrain_grid.gpkg`, `reports/figures/terrain/`, and `reports/terrain_dataset_audit.md`.
