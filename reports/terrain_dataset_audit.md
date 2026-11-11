# Terrain dataset audit — DrainSenseAI 2.0

## Executive summary
Processed the local Copernicus DEM TIFF into a projected 30 m raster and extracted terrain predictors for 1,100 existing 250 m grid features. No ML model was trained. Values are terrain/surface proxies; no flood or drainage ground truth is present in this phase.

## Inputs and provenance
- Source: `data\raw\dem\tiles\Copernicus_DSM_COG_10_N16_00_E080_00_DEM.tif`; available local file, unchanged.
- Boundary: `data\metadata\study_area.geojson` (provisional study-area geometry; metadata source should be reviewed).
- Grid: `data\interim\phase4\analysis_grid_250m.gpkg` (1,100 cells).
- Source metadata: `{"crs": "EPSG:4326", "bounds": "BoundingBox(left=79.99986111111112, bottom=16.000138888888888, right=80.99986111111112, top=17.000138888888888)", "width": 3600, "height": 3600, "resolution": "(0.0002777777777777778, 0.0002777777777777778)", "nodata": null, "dtype": "float32", "tags": {"AREA_OR_POINT": "Point"}}`
- Raster value unit and vertical datum are documented by Copernicus as metres and EGM2008; the GeoTIFF itself has no explicit unit/noData declaration. See the [Copernicus DEM product handbook](https://dataspace.copernicus.eu/sites/default/files/media/files/2024-06/geo1988-copernicusdem-spe-002_producthandbook_i5.0.pdf) and [Copernicus DEM collection description](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM).
- Product is a Digital Surface Model (DSM), including buildings/vegetation; source observation epoch varies and is not a contemporaneous ground survey.

## Processing
Reprojected bilinearly to EPSG:32644 at nominal 30 m, with 3 km buffer around boundary. `dem_clipped.tif` masks outside the study-area geometry to NoData (-9999); source values are never filled with zero. Existing project grid is used unchanged. Elevation and derivative summaries use pixel-centre inclusion within each clipped grid polygon; The study area is fully covered by valid raster footprint, so valid area equals the clipped grid-polygon area. `valid_pixel_count` is the count of pixel centers inside the cell; slivers smaller than one pixel may have no center sample and consequently have null terrain statistics. Slope uses central finite differences; TPI is center elevation minus valid-neighbourhood mean, neighborhoods (3, 7, 11) pixels (about 90/210/330 m across at the 30 m grid).

Flow accumulation was not generated because PyFlwDir and its compiled numeric dependencies were unavailable; package installation was interrupted due to a slow dependency download. The corresponding three CSV columns are intentionally null, and no flow raster/map is claimed. The intended method, if dependencies are installed later, is PyFlwDir D8 with depressions filled to pour points (max_depth=-1) and edge outlets on the buffered raster. Accumulation represents contributing cells, not stormwater flow/discharge. DSM structures, culverts, artificial drainage and buffer-edge truncation remain limitations.

## Coverage and quality
- The previously available bbox-clipped raster (`data/raw/dem/copernicus_glo30_vijayawada_clip.tif`) was not used as the processing source because its `AREA_OR_POINT` tag is `Area`, unlike the full source tile tag `Point`; pixel values were previously observed to match a tile window, but this metadata discrepancy is unresolved.
- Grid rows: 1100; duplicate grid IDs: 0; invalid geometries: 0.
- Source valid pixels: 12,960,000 of 12,960,000; source nodata tag: None.
- Mean elevation range across cells (min cell mean to max cell mean): 8.50–198.14 m.
- Cells without elevation mean: 12; cells with valid-area coverage < 0.95: 0; cells with no pixel-center sample: 12.
- Missing counts by field: `{"grid_id": 0, "nominal_area_m2": 0, "study_area_m2": 0, "valid_pixel_count": 0, "valid_dem_area_m2": 0, "valid_area_ratio": 0, "elevation_mean": 12, "elevation_median": 12, "elevation_min": 12, "elevation_max": 12, "elevation_std": 12, "elevation_p10": 12, "elevation_p25": 12, "elevation_p75": 12, "elevation_p90": 12, "elevation_range": 12, "slope_mean": 12, "slope_median": 12, "slope_min": 12, "slope_max": 12, "slope_std": 12, "tpi_3_mean": 12, "tpi_3_min": 12, "tpi_3_max": 12, "tpi_3_std": 12, "tpi_7_mean": 12, "tpi_7_min": 12, "tpi_7_max": 12, "tpi_7_std": 12, "tpi_11_mean": 12, "tpi_11_min": 12, "tpi_11_max": 12, "tpi_11_std": 12, "flow_accumulation_mean": 1100, "flow_accumulation_max": 1100, "flow_accumulation_std": 1100}`.
- Cellwise duplicate rows: 0.
- Negative source values occur elsewhere in the full source tile, but the study-area clip examined previously contains none; no blanket negative-value removal is applied.

## Feature distributions and redundancy
- Elevation pixel range across sampled cells: 7.38 to 222.40 m.
- Grid-cell mean slope: median 1.59 degrees; range 0.00 to 31.76.
- Grid-cell mean TPI ranges: 3-pixel -1.74 to 2.03 m; 7-pixel -11.50 to 11.65 m; 11-pixel -17.52 to 26.58 m.
- Constant numeric columns: `['nominal_area_m2', 'valid_area_ratio', 'flow_accumulation_mean', 'flow_accumulation_max', 'flow_accumulation_std']`.
- Numeric feature pairs with absolute correlation above 0.98: `['study_area_m2/valid_dem_area_m2=1.000', 'elevation_mean/elevation_median=0.996', 'elevation_mean/elevation_p75=0.993', 'elevation_median/elevation_p25=0.984', 'elevation_median/elevation_p75=0.984', 'elevation_max/elevation_p90=0.992', 'elevation_std/elevation_range=0.993', 'elevation_p10/elevation_p25=0.991', 'elevation_p75/elevation_p90=0.993', 'slope_mean/slope_median=0.990', 'tpi_7_mean/tpi_11_mean=0.988', 'tpi_7_max/tpi_11_max=0.984', 'tpi_7_std/tpi_11_std=0.987']`. These are largely related summaries of the same elevation surface; review redundancy before modeling.

## Interpretation and limitations
The output is suitable as static topographic/surface context and exploratory features for later integration. It cannot supply rainfall-event labels, observed inundation, drainage capacity, or validated flood outcomes. DEM pixel resampling and grid-cell summaries smooth local relief; cell-centre raster inclusion introduces a boundary coverage approximation. Per-pixel multiscale TPI rasters are retained; grid summary columns are `tpi_3_*`, `tpi_7_*`, and `tpi_11_*` statistics.

## Final verdict: Partially Ready
The elevation, slope, and multiscale TPI layers are prepared for static-feature integration. Twelve sliver cells lack a center-in-polygon sample, and the requested flow accumulation component is not prepared; this terrain phase is not a complete final research dataset.

## Outputs
- `data\interim\dem\dem_projected.tif`
- `data\interim\dem\dem_clipped.tif`
- `data\processed\terrain_features.csv`
- `data\processed\terrain_grid.gpkg`
- Figures: `reports\figures\terrain`
