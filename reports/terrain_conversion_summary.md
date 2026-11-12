# Terrain dataset creation and conversion

This note describes how the two terrain datasets—`terrain_features.csv` and `terrain_grid.gpkg`—were made from the TIFF files already in the repository.

## Source and raster conversion

The pipeline used `data/raw/dem/tiles/Copernicus_DSM_COG_10_N16_00_E080_00_DEM.tif` as its source. The original GeoTIFF is geographic EPSG:4326. It was reprojected with bilinear resampling to a nominal 30 m grid in EPSG:32644 (UTM zone 44N). The working projected raster includes a 3 km buffer around the study boundary for terrain calculations. A second raster, `data/interim/dem/dem_clipped.tif`, masks pixels outside the Vijayawada study boundary as NoData; it does not replace NoData with zero. The raw TIFF was left unchanged.

## The two output datasets

1. **`data/processed/terrain_features.csv`** is the non-spatial table. Each of the 1,100 rows corresponds to one existing 250 m grid cell, keyed by `grid_id`. The pipeline samples projected DEM pixel centers falling within each grid polygon and computes elevation summaries, slope in degrees, and TPI summaries at 3×3, 7×7, and 11×11 pixel neighborhoods. Coverage fields record the full nominal cell area, clipped study-area cell area, valid DEM area, pixel sample count, and coverage ratio.

2. **`data/processed/terrain_grid.gpkg`** contains the same grid-level features joined back to the original grid polygons. Its geometry is in EPSG:32644, so it can be mapped and spatially joined to other project layers. It is the spatial counterpart to the CSV, not a separate set of measurements.

The elevation, slope, and TPI values are derived from the local DEM; they are not rainfall or flood observations. Twelve very small boundary slivers have no pixel center inside the cell, so their sampled terrain statistics remain null. The study area itself is covered by valid DEM raster footprint. Flow-accumulation columns are null because the required PyFlwDir dependencies were unavailable; no flow-accumulation raster or map was generated.

See the [full terrain audit](terrain_dataset_audit.md), [processing script](../src/terrain_processing/pipeline.py), and [run instructions](../src/terrain_processing/README.md) for provenance, methods, quality checks, and limitations.
