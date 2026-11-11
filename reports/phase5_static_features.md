# Phase 5 — Static Grid Feature Dataset

**Snapshot:** 2026-11-10 (Asia/Kolkata)  
**Status:** A real, source-backed static feature table has been built; rainfall/event and inundation target integration remains open.

## Output

- [`static_grid_features_2021_osm.csv`](../data/interim/phase5/static_grid_features_2021_osm.csv) — 1,100 rows × 25 columns; one row per boundary-clipped 250 m grid cell.
- [`static_grid_features_2021_osm.meta.json`](../data/interim/phase5/static_grid_features_2021_osm.meta.json) — source and processing metadata, including excluded raster inputs.
- [`build_phase5_static_features.py`](../scripts/build_phase5_static_features.py) — reproducible feature builder; refuses to overwrite an existing output.

All rows are derived from repository land-cover and mapped OSM geometries. No synthetic values or flood labels were added.

## Included features

| Family | Features | Source and interpretation |
|---|---|---|
| Grid support | `grid_id`, clipped cell area, boundary coverage ratio | Local 250 m EPSG:32644 grid; clipped to provisional boundary |
| Land cover | Fractions for all 11 ESA WorldCover classes; Shannon entropy; valid and NoData pixel counts | ESA WorldCover 2021, nearest-neighbor projected to a 10 m analysis raster; class fractions use valid pixels only |
| Roads | Intersecting mapped feature count, length, length density | 7,368 clipped OSM road features; map content only, not verified complete or road condition |
| Waterways | Intersecting mapped feature count, length, length density, distance from cell centroid to nearest mapped waterway | 18 clipped OSM waterways; surface-waterway mapping only, not underground drainage or complete hydrography |

WorldCover codes use the ESA scheme: 10 tree cover, 20 shrubland, 30 grassland, 40 cropland, 50 built-up, 60 bare/sparse vegetation, 70 snow/ice, 80 permanent water, 90 herbaceous wetland, 95 mangroves, 100 moss/lichen. A WorldCover water fraction is a static land-cover class, not an event inundation target.

## Data checks and caveats

- 1,100 unique `grid_id` values were written. Classified 2021 WorldCover pixels total 615,010 at approximately 100 m² each, consistent with the clipped study-area footprint.
- For all cells with valid land-cover pixels, the 11 class fractions sum to 1 within floating-point rounding. Eight cells have no WorldCover pixel center and therefore have null class fractions and entropy.
- The grid retains partial edge intersections. Twelve cells have less than 1% of nominal 250 m area within the boundary; 77 cells have less than 25%. The lowest-coverage geometries are slivers, not meaningful 250 m support units. Keep `boundary_coverage_ratio` in all joins and settle an edge-cell eligibility rule before analysis. Road/waterway densities for tiny clipped cells are particularly unstable; raw lengths are also retained.
- WorldCover was projected with nearest-neighbor resampling. Per-cell proportions are pixel-count estimates, not exact subpixel area fractions.
- OSM road and waterway lengths are clipped map geometries. Missing map features cannot be interpreted as absent roads, channels, or storm drains.
- The Copernicus DEM and SoilGrids were intentionally omitted from this first table because the repository audit found no explicit NoData markers and ambiguous zeros. Do not treat those rasters as complete until their source masks/coverage semantics are resolved.
- The table contains no rainfall event fields, IER, IO, flood-risk score, or target variable. It can support surface characterization and later integration, but it is not yet a supervised ML training dataset.

## Research and project direction

This produces a transparent data foundation similar in scope to the linked HYDRASENSE-AI prototype while replacing its illustrative ward inputs with measured/geospatial features already held in this repository. It does not reproduce the prototype's weighted risk score: the score's outcome semantics are not validated here, and DrainSenseAI does not yet have compatible, defensible flood labels. Continue toward a real event-linked project only after rainfall coverage and SAR target production pass their gates.
