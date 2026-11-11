# Dataset Audit — DrainSenseAI 2.0

**Inspection date:** 2026-11-09 (local project date)  
**Scope:** files under `data/`, excluding `data/raw/.venv/` (Python runtime and package files, not research observations).  
**Status of live downloads:** an IMERG downloader was active while this audit was being performed. The staged collection grew during inspection; counts below are a point-in-time snapshot, not a final count after download completion.  
**Verdict:** **Partially Ready** for an exploratory, early-2015 grid/event pilot and static feature engineering; **not ready** for the proposed full-duration, event-generalizable runoff study.

## 1. Executive summary

The repository contains real-source data products for terrain, land cover, soil properties, OpenStreetMap (OSM), GPM IMERG precipitation, ERA5-Land, and CWC Krishna-basin water level. The static layers are sufficiently present to begin controlled spatial aggregation, subject to checking NoData encodings and coordinate alignment. The dynamic coverage is much less mature:

- **IMERG:** 3,243 staged NetCDF granules observed at the final inventory check (129.3 MB), from `2015-01-01` through a partial `2015-03-12` day. The count had been 2,702 through a partial `2015-02-28` day at the start of inspection. Granules represent half-hour intervals and contain 9 × 8 precipitation cells per timestamp. The day-by-day granule counts are not consistently 48, so gaps must be detected from each granule's internal time metadata before event identification.
- **ERA5-Land:** six monthly hourly files for January–June 2015, covering a 7 × 8 grid (56 locations), plus a small invariants file. It is too short for robust seasonal or event-based evaluation. ERA5-Land runoff fields are reanalysis/model outputs, not observed street runoff.
- **CWC:** water-level records exist at river stations, including stations in the Vijayawada vicinity. They are river stage measurements, not cell-level surface runoff. The downloaded records contain extreme values and station metadata inconsistencies; they need quality screening. The CWC discharge dataset is explicitly listed as unavailable in the inventory.
- **Static geospatial sources:** a 30 m Copernicus DEM clip, two WorldCover annual clips, 36 SoilGrids rasters (six properties × six depth intervals), and city-area OSM roads/waterways are present. There are also much larger source tiles/region extracts and expanded CSV copies.
- **Redundancy and inventory gaps:** the raw rasters/NetCDF/GPKGs are accompanied by expansive CSV point/geometry exports in `data/raw(CSV)/`; these duplicate the same underlying content in a less efficient form. The metadata inventory does not enumerate the current IMERG granules or ERA5-Land hourly chunks, and it does not describe the parallel CSV exports. OSM combined roads+waterways repeats the two separate OSM layers.

No ML model was trained, no synthetic observations were created, and no existing data files were modified by this audit. The principal blockers are short and changing rainfall coverage, short ERA5 temporal coverage, unverified accumulation semantics for ERA5 fields, questionable CWC values/metadata, and the absence of a direct urban runoff observation source.

## 2. Dataset inventory

The inventory is grouped by source family because some families contain thousands of individual granules or raster pixels. Per-file sizes and paths are present on disk; family counts and representative shapes are below. Sizes are decimal approximations from file sizes, and source-specific row/pixel counts are distinguished from expanded CSV rows.

| Dataset family / paths | Files observed | Approx. stored size | Format and dimensions | Spatial / temporal coverage |
|---|---:|---:|---|---|
| IMERG: `data/raw/rainfall/_stage/2015/*.nc` | 3,243 granules at final inventory check (2,702 at initial check) | 129.3 MB at final check | NetCDF; one time step per granule, 9 × 8 cells, precipitation and two quality/diagnostic variables | Lat 16.15–16.85°, lon 80.25–81.05°; timestamps begin 2015-01-01, advanced from partial 2015-02-28 to partial 2015-03-12 during audit; half-hour granules with missing intervals suspected from daily counts |
| ERA5-Land hourly: `data/raw/era5_land/chunks/era5_2015_*.nc` | 6 monthly files | 2.75 MB | NetCDF; 744/672/744/720/744/720 hours × 7 × 8 cells; 11 variables | Lat 16.2–16.8°, lon 80.3–81.0°, hourly 2015-01-01 through 2015-06-30 23:00 |
| ERA5-Land tabular exports: `data/raw(CSV)/era5_land/chunks/*.csv` | 6 files | about 34 MB | CSV, 11 columns; total 243,264 grid-hour records | Same six months and 56 grid locations as NetCDF; duplicate representation of the same source data |
| ERA5-Land invariants: `data/raw/era5_land/era5land_vijayawada_invariants.nc` and CSV export | 2 files | about 11 KB NetCDF; CSV size small | NetCDF 2 × 7 × 8; CSV 112 rows, 5 columns | Two timestamps (2013-08-09 12:00 and 2013-11-29 00:00) despite static-variable naming; grid aligns with ERA5-Land |
| Copernicus DEM: `data/raw/dem/` and `data/raw(CSV)/dem/` | 2 GeoTIFF + 2 CSV | about 60 MB GeoTIFF; CSV exports about 471 MB | 1° source tile 3,600 × 3,600; Vijayawada clip 2,160 × 1,800; single-band float32; CSV columns `lon, lat, value` | EPSG:4326; source tile 80–81°E, 16–17°N; clip nominally 80.3–80.9°E, 16.3–16.8°N. CSVs expand pixels to rows |
| ESA WorldCover: `data/raw/landcover/` and `data/raw(CSV)/landcover/` | 4 GeoTIFF + 2 CSV | about 344 MB GeoTIFF; CSV exports about 1.99 GB | two source tiles and two clips, 10 m categorical uint8; clips 7,200 × 6,000 pixels each; CSV columns `lon, lat, value` | EPSG:4326; clip 80.3–80.9°E, 16.3–16.8°N; 2020 v100 and 2021 v200 |
| SoilGrids: `data/raw/soil/` and `data/raw(CSV)/soil/` | 36 GeoTIFF + 36 CSV | about 1.7 MB GeoTIFF; about 47 MB CSV | 6 properties × 6 depth intervals; 265 × 209 pixels per layer; int16; CSV columns `lon, lat, value` | EPSG:4326, nominal 250 m; clip 80.3–80.9°E, 16.3–16.8°N; CSV expands 55,385 pixels per layer |
| City-area OSM: `data/raw/osm/vijayawada_*.gpkg` and matching CSV exports | 3 GPKG + 3 CSV | about 36.5 MB GPKG; CSV sizes not counted separately here | Roads 62,866 LineStrings; waterways 488 LineStrings; combined 63,354 LineStrings | EPSG:4326; extracted feature bounds extend beyond the nominal city bbox, so clip/containment must be checked before aggregation |
| Regional Geofabrik OSM: `data/raw/osm/southern-zone-free.shp.zip` and `data/raw(CSV)/osm/southern-zone/*.csv` | 1 ZIP with 20 SHP layers and sidecars + 20 CSV exports | ZIP 1.24 GB; CSV exports about 2.67 GB | Regional point, line, and polygon layers; CSVs serialize geometry as WKT | All southern India region, not the Vijayawada study footprint; use the city GPKGs for this study unless other regional context is needed |
| CWC Krishna water-level telemetry: `data/raw/validation/cwc/` | 8 CSV files (4 full-basin extracts + 4 spatial subsets) | about 177 MB | 23 columns; counts: full-basin 37, 427,080, 451,445, 22,329 rows; near-area 18, 90,775, 125,539, 5,651 rows for the four named time bands | Station coordinates in EPSG:4326; record ranges from 1969/2000 through 2026 depending on file; not uniformly continuous, despite hourly product title |
| CWC download metadata: `data/metadata/dataset_inventory.csv`, `data/metadata/bbox.json`, OSM metadata text, README and download script | 4 files | under 100 KB | CSV/JSON/TXT/MD/PY | Metadata describes intended bbox/sources; inventory is incomplete relative to observed files |

### File-format totals

Excluding the virtual environment and counting only files under `data/`, the final inventory check observed 3,250 NetCDF files (3,243 IMERG + 6 ERA5-Land monthly files + 1 invariants file), 87 CSVs, 42 GeoTIFFs, 3 GeoPackages, 1 ZIP, 1 JSON, 2 TXT files, 1 downloader Python file, and 1 download README. The initial file-family count had 2,709 NetCDF files (2,702 IMERG + 7 ERA5-Land files); the IMERG count continued to rise during inspection. All these figures are snapshots. The `data/raw/.venv/` directory contains runtime libraries and should not be treated as research data.

## 3. Individual dataset analysis and schema

### 3.1 GPM IMERG precipitation

The staged files' internal metadata identifies product `3IMERGHH` / `3B-HHR`, algorithm/product version V07B (algorithm 7.0), `TimeInterval=HALF_HOUR`, and the variable `precipitation` in `mm/hr`. A sample granule also includes `precipitationQualityIndex` and `probabilityLiquidPrecipitation` (percent). The grid is 0.1° and samples show a crop with 9 longitude × 8 latitude positions. The `CodeMissingValue` metadata is `-9999.9`; mask these before statistics or event detection.

The staged collection only covers a small portion of 2015 and was still growing during inspection. Daily file counts ranged below the expected 48 half-hour records for a full day; confirm actual internal timestamps, detect duplicates/gaps, and derive coverage from `StartGranuleDateTime`/time coordinates rather than filenames. Unit conversion from rate to half-hour depth must be explicit when calculating rainfall totals. Quality index filtering and the product's final/early-run status must be verified; the sampled filename confirms V07B but not that the collection is a homogeneous historical Final Run.

**Schema / roles:** `time` is the timestamp; `lat`, `lon` define grid cells; `precipitation` is a candidate rainfall input; quality index and liquid-precipitation probability are quality/diagnostic fields. It is not a runoff target.

### 3.2 ERA5-Land hourly

Six NetCDF chunks cover January through June 2015. Each has 744 (or calendar-month equivalent) time steps and 56 grid points, with an hourly time coordinate, 7 latitudes and 8 longitudes. The CSV exports have 243,264 records total and columns:

| Column | Type / unit indicated by file | Description / role |
|---|---|---|
| `valid_time` | timestamp text | Hourly valid time; candidate temporal join key |
| `latitude`, `longitude` | float, degrees | Grid coordinates; spatial join keys |
| `sro` | float, metres | Surface runoff, model-derived candidate target |
| `ssro` | float, metres | Subsurface runoff, model-derived auxiliary variable |
| `ro` | float, metres | Total runoff; likely derived from surface + subsurface runoff, creating target duplication if used as a predictor alongside `sro`/`ssro` |
| `tp` | float, metres | Total precipitation in ERA5-Land; alternative reanalysis rainfall input |
| `swvl1`–`swvl4` | float, m³/m³ | Volumetric soil water for four soil layers; potential antecedent wetness features |

NetCDF metadata explicitly labels `sro`, `ssro`, `ro` and `tp` as accumulated forecast fields (`stepType=accum`) and their units as metres. Their temporal accumulation/reset convention must be resolved from the downloaded GRIB request and ERA5-Land documentation before differencing or summing. `sro` must not be treated as a ready-made hourly rate/depth series solely because rows are hourly. The month files appear to have complete timestamp × grid combinations (56 rows per hour), but value-level QA and cross-file boundary checks remain required.

The grid is about 0.1° spacing in this extracted window, but 56 points are not equivalent to 56 independent fine-scale urban runoff observations. `swvl*` is reanalysis soil state, not local sensor measurements.

### 3.3 ERA5-Land invariants

Variables are `z` (geopotential, m²/s²) and `lsm` (land-sea mask, 0–1). The file has 112 coordinate-time rows because there are two time coordinates, although these are static fields. For both variables, one of the two time slices is missing at each of the 56 cells (56 nulls per variable). The CSV export shows blank `lsm` in sample rows. Do not join this file by exact time without first deciding how to collapse the duplicate static dimension and addressing missingness. `z` can be converted to elevation only with the correct gravitational conversion and provenance; the Copernicus DEM is a more appropriate terrain source here.

### 3.4 Copernicus DEM

The clip is 2,160 × 1,800 (3,888,000 cells), one-band float32, EPSG:4326. Inspected values range approximately 3–546.7 (presumed metres based on dataset identity; units are not embedded in the TIFF tags inspected). The source tile is 3,600 × 3,600. The nominal clip has bounds 80.3–80.9°E and 16.3–16.8°N, while its pixel-is-point geotransform edges are offset by roughly half a pixel. No NoData marker/mask was found. Verify edge alignment and any ocean/void handling before slope or terrain analysis. Elevation can support slope, aspect, TPI and other terrain derivatives after reprojection to a suitable metric CRS; flow direction/accumulation require documented hydrologic conditioning.

### 3.5 ESA WorldCover

The 2020 v100 and 2021 v200 clipped rasters are both 7,200 × 6,000 categorical pixels at 10 m, EPSG:4326. The clip values inspected were nonzero and between 10 and 90, with eight classes present in each. These are class codes, not numeric magnitudes. Use categorical area fractions (and optional class entropy) rather than averaging raw codes. The full 2020 and 2021 source tiles are each 36,000 × 36,000. Their different algorithm versions make raw pixel disagreement unsuitable as a direct change label without harmonization.

### 3.6 SoilGrids

There are 36 layers: `clay`, `sand`, `silt`, `soc`, `bdod`, and `phh2o`, each for 0–5, 5–15, 15–30, 30–60, 60–100, and 100–200 cm. Each clip is 265 × 209 (55,385 cells), EPSG:4326, int16, nominal 250 m. Stored scaling in the metadata inventory is: clay/sand/silt g/kg (divide by 10 for percent); SOC dg/kg (divide by 10 for g/kg); bulk density cg/cm³ (divide by 100 for g/cm³); pH×10 (divide by 10). Values are gridded SoilGrids predictions, not local field samples.

The GeoTIFFs inspected have no explicit NoData value. Surface-layer examples contain thousands of zero pixels: 3,282 for clay/SOC/pH and 3,520 for bulk density. Some zeros may be valid for some properties, but zero pH and zero bulk density are not physically plausible soil measurements; check source masks and coastline coverage before treating these as measurements. Texture percentages should be scaled and checked for physically plausible totals. Prefer a small number of justified depth summaries to carrying all highly related depth layers into a model.

### 3.7 OSM / Geofabrik

The three city GPKGs are EPSG:4326 LineStrings:

| File | Features | Fields (excluding geometry) | Interpretation |
|---|---:|---|---|
| `vijayawada_roads.gpkg` | 62,866 | `osm_id`, `code`, `fclass`, `name`, `ref`, `oneway`, `maxspeed`, `layer`, `bridge`, `tunnel` | Mapped road network; useful for road length/density and proximity proxies |
| `vijayawada_waterways.gpkg` | 488 | `osm_id`, `code`, `fclass`, `width`, `name` | Mapped waterways/canals; useful for mapped waterway density/distance |
| `vijayawada_roads_waterways.gpkg` | 63,354 | `osm_layer`, `fclass`, `name`, `code` | Combined layer; count equals roads + waterways and duplicates both geometries for analysis purposes |

The regional Geofabrik archive holds 20 shapefile layers covering roads, waterways, water polygons, buildings, land use and other POIs/infrastructure. Its CSV exports store geometry as WKT and span southern India; a sample admin-area record is Car Nicobar, proving the export is not city-clipped. Do not load these regional CSVs as if they represented only Vijayawada. OSM is mapped infrastructure, not a complete inventory; absence of an underground drain feature is not evidence that a drain is absent. Reproject to metres before computing lengths, areas, or distances.

### 3.8 CWC Krishna river water level

The 23 fields are: `SlNo`, `Station`, `Agency`, `State LGD Code`, `State`, `District LGD Code`, `District`, `Tehsil`, `Block`, `Village`, `River`, `Basin`, `Tributary`, `Subtributary`, `SubSubtributary`, `Local River`, `Latitude`, `Longitude`, `Is_DischargeDataAvailable`, `RL_of_zeroGauge`, `MeanSeaLevel`, `Data Acquisition Time`, and `River Water Level Telemetry Hourly (meter)`. Types are mostly text/category, with station coordinates, gauge references and level as numbers. Time uses `dd-mm-yyyy HH:MM` text. The observed product variable is river water level in metres; it is not discharge.

The full-basin time bands have 37 rows (1961–1990 file, but actual values only 1969–1987), 427,080 (1991–2020 filename; records 2000-10-08 to 2020-12-31), 451,445 (2021–2025), and 22,329 (2026–2030 filename; records only 2026-01-01 to 2026-11-08). The near-Vijayawada rectangle subsets have 18, 90,775, 125,539, and 5,651 rows respectively. These are not complete continuous hourly records across the named bands.

Near-area stations include Prakasam Barrage, Polampalli, Wadenepally, Madhira, Keesara, Paleru Bridge, and “Halia Vijaywada.” The latter appears with State=Tamil Nadu despite coordinates 16.4944 N, 80.6211 E in the study vicinity. This is a metadata anomaly requiring source validation. Observed values include physically suspicious negatives and very large positives (for example, the 1991–2020 file includes a maximum over 5,000,000 m; the near-area counterpart exceeds 400,000 m). The 2021–2025 file contains 43 duplicate station-time keys, and its near-area subset contains 19. Exclude or resolve invalid values and duplicate keys before any analysis. The spatial subset is a rectangular coordinate filter recorded in the inventory (80.0–81.5 E, 15.8–17.2 N), not a hydrologic catchment selection.

CWC can support a separate river-stage context/validation analysis at station × time, after quality control and station verification. It cannot be used as ground truth for cell-level urban runoff. The discharge resource was not downloaded because the inventory reports no Krishna/AP resource.

## 4. Data quality findings

### Findings requiring attention

1. **Incomplete and changing IMERG coverage:** only January–February 2015 was staged at inspection, and the downloader was still running. Many days had fewer than 48 granules. Derive actual intervals from internal granule metadata, not suffixes or file counts. The last day was incomplete.
2. **ERA5 temporal limit:** only six months of 2015 are present. This is not enough for a robust climatological/event-split experiment and contains no full annual cycle.
3. **ERA5 accumulated fields:** runoff and precipitation variables are tagged as accumulations in metres. Determine reset/differencing and forecast-step semantics before calculating event totals or peak rates. Directly summing these values may double-count accumulation.
4. **Missing/ambiguous raster NoData:** SoilGrids has no declared NoData tag in the inspected TIFFs and zero-heavy areas; DEM also has no NoData marker. Distinguish valid values from water/missing cells before aggregating.
5. **CWC outliers and duplicates:** extreme and negative levels, duplicate station-time records, suspicious state/station metadata and sparse historical observations need station-aware cleaning and source checks.
6. **Unequal grids:** static layers use 10 m, ~30 m, ~250 m, while climate layers are ~0.1°. Same nominal angular resolution does not imply aligned cells. Do not upsample climate fields to fine cells and count them as independent observations.
7. **Potential CRS/area bias:** files are EPSG:4326 geographic coordinates. Length, area, slope and distance calculations should use an appropriate projected CRS or geodesic methods. Keep original CRS/source metadata.
8. **Null/duplicate invariants:** the invariants file repeats static fields across two timestamps and has 50% missingness per variable in the time-expanded grid.
9. **Unit scaling:** SoilGrids requires property-specific scaling; IMERG rate requires interval conversion; ERA5-Land metres require accumulation interpretation; CWC levels are metres. These units must not be mixed without explicit conversion.
10. **No global CSV quality summary yet:** raster-derived CSVs contain millions of rows and WKT CSV exports are multi-gigabyte. They are representation copies, not new independent samples. Missingness, duplicates and outliers should be computed on source rasters/vectors/NetCDF before materializing row-expanded exports.

### Duplicates and similar files

- The DEM and WorldCover CSV files are pixel-to-row exports of matching GeoTIFF layers. The 36 SoilGrids CSVs likewise expand corresponding GeoTIFF rasters. The six ERA5 monthly CSVs duplicate their corresponding NetCDF content. These are format duplicates, not independent evidence.
- `vijayawada_roads_waterways.gpkg` contains exactly 63,354 features, equal to 62,866 roads + 488 waterways; do not join it alongside both component layers without deduplication.
- CWC “near Vijayawada” files are spatially filtered subsets of corresponding full-basin CWC tables. Keep either parent plus a reproducible filter or the subset, not both in a row-wise union.
- WorldCover 2020 and 2021 are different years and algorithm versions, not duplicate datasets. The regional OSM archive and city extracts share source content at different extents/scales.
- `dataset_inventory.csv` is an incomplete manifest: it records many static layers, OSM and CWC, but omits the observed IMERG collection and ERA5 hourly chunk files, and does not enumerate the CSV mirror set.

### Suspiciously repeated or correlated information

- ERA5 `ro` is total runoff while `sro` and `ssro` are its component concepts. Verify the numerical identity/accumulation convention, and never include `ro` as a predictor when `sro` is the target.
- ERA5 `tp` and IMERG precipitation describe the same meteorological forcing from different products. They may be compared or used in a controlled source experiment, but should not be treated as independent storm evidence.
- Soil texture components and measurements from adjacent depth intervals are correlated by construction. Evaluate feature correlation after masking invalid cells.
- Static terrain, soil, land-cover and OSM features repeat for every event at a given grid. This is expected, but train/test splitting must group by event and spatial unit to avoid leakage.

## 5. Spatial and temporal compatibility

### Spatial joins

- **Climate grid:** ERA5-Land has 56 points on latitudes 16.2–16.8° and longitudes 80.3–81.0°. IMERG has 72 points on latitudes 16.15–16.85° and longitudes 80.25–81.05°. Both have nominal 0.1° spacing, but centers are offset by 0.05° and the windows differ. Use explicit spatial remapping or area-weighted aggregation, and persist the mapping; nearest-center joins need an error/coverage check.
- **Study boundary:** metadata gives static bbox W=80.3, S=16.3, E=80.9, N=16.8 (EPSG:4326). The climate bbox is larger: W=80.3, S=16.2, E=81.0, N=16.8. A bbox is not a city boundary polygon and does not imply all enclosed cells are urban.
- **Static-to-climate alignment:** aggregate WorldCover class proportions, DEM terrain summaries, SoilGrids properties and projected OSM line lengths/proximity to the chosen climate-cell footprints. Record valid-area fraction per cell, especially around water/coast and clip edges. Do not represent resulting high-resolution summaries as fine-resolution runoff observations.
- **CRS:** all inspected rasters/vectors use EPSG:4326. Reproject for area/length/slope operations; maintain CRS and transformation metadata. The OSM GPKG feature bounds exceed the nominal bbox, so spatial clipping should be explicit.

### Temporal joins

- IMERG half-hour timestamps and ERA5 hourly timestamps overlap in January–February 2015, but only after normalizing time conventions and verifying complete intervals. The full ERA5 January–June series extends beyond observed IMERG coverage.
- Aggregate two quality-screened half-hour intervals to hourly or derive event metrics at half-hour resolution and align runoff targets to a documented response window. Do not silently fill missing granules.
- CWC overlaps those dates in principle (1991–2020 file), but stage at station scale is a separate response variable and requires station-specific valid-record selection. It must not be broadcast to climate grid cells as cell-level runoff.
- Static land cover/soil/terrain/OSM has no meaningful event timestamp in the files. Store source year/version/as-of date and treat as static proxies, not event-time measurements.

## 6. Potential feature and target variables

| Use | Available fields | Assessment |
|---|---|---|
| Urban surface clustering | DEM elevation and derivatives; WorldCover class proportions/entropy; SoilGrids texture, SOC, density, pH by selected depth; OSM road/waterway density and distance | Feasible after spatial aggregation, NoData handling, CRS-safe metrics, and feature scaling. Current source layers can support broad surface archetypes, not validated infiltration or drainage capacity. |
| Rainfall event clustering | IMERG half-hour precipitation, quality index, liquid probability; ERA5 `tp` as an alternate rainfall source; ERA5 antecedent `swvl1`–`swvl4` | Technically possible on the observed early-2015 overlap, but event count/coverage is not yet established and current span is too short for robust generalization. Use one primary precipitation source per experiment and preserve source identity. |
| Interaction analysis | Rainfall totals/intensities/duration/API × static surface attributes; cluster labels may be added after leakage-safe fitting | Derivable once the dynamic series and event definitions are complete. Avoid treating every cell-event row as independent; group by event and spatial block. |
| Candidate regression target | ERA5 `sro` (surface runoff depth after resolving accumulation semantics) | Only current candidate grid-scale target, explicitly model-derived. Suitable for “modelled runoff response” analysis, not observed urban flood/runoff ground truth. Short coverage and coarse grid constrain inference. |
| Auxiliary target/context | ERA5 `ssro`, `ro`; CWC river water level | `ssro`/`ro` are same-model related outcomes and can cause leakage if used as features. CWC stage is separately useful at station × time but is not a matching runoff target. |
| Classification target | None observed | No observed flood/no-flood, inundation extent, street flooding, or flood-depth labels were found. Do not create a flood classification label from rain/runoff thresholds and call it observed ground truth. |

Derived features possible from existing files include half-hour/hourly/3-hour/6-hour rolling rainfall, event total and duration, peak/mean intensity, antecedent rainfall, ERA5 soil-moisture summaries before event start, terrain slope/TPI (after a chosen method), WorldCover area fractions and entropy, projected road/waterway length per area, and distance to mapped waterways. Use only pre-event soil moisture/rainfall when making a predictive claim; event-period ERA5 rainfall/runoff-derived variables can leak future information.

## 7. Integration opportunities and preliminary unified schema

### Recommended observation unit

For a limited exploratory runoff analysis, use **ERA5-Land grid cell × independently detected rainfall event**. It matches the coarsest candidate response grid and avoids false fine-scale replication. The current footprint has at most 56 ERA5-Land cells before land/valid-data filtering. Derive a stable `grid_id` from exact ERA5 cell center or polygon geometry and a stable `event_id` from the validated IMERG time series. Preserve event start/end timestamps and quality flags.

Use a separate **station × timestamp** table for CWC river levels; link only in a distinct catchment/station-level validation study with documented hydrologic correspondence.

### Preliminary unified research table

| Column group | Suggested fields | Origin / note |
|---|---|---|
| Keys | `grid_id`, `event_id`, `grid_lat`, `grid_lon`, `event_start_utc`, `event_end_utc` | Exact grid coordinates and event catalog; do not invent ids before spatial/time QA |
| Static coverage | `valid_land_fraction`, `valid_dem_fraction`, `valid_soil_fraction`, `valid_worldcover_fraction`, `static_source_year` | Needed to identify partial/out-of-coverage cells |
| Terrain | `elevation_mean_m`, `slope_mean_deg`, `tpi_mean`, optional `flow_accumulation_summary` | Copernicus DEM-derived, with documented CRS and method |
| Soil | `clay_top_pct`, `sand_top_pct`, `silt_top_pct`, `soc_top_g_kg`, `bdod_top_g_cm3`, `ph_top`, optional depth summaries | SoilGrids scaled values; predicted properties; select representative depth intervals and retain uncertainty/provenance if available |
| Surface | `wc_built_frac`, `wc_tree_frac`, `wc_grass_frac`, `wc_cropland_frac`, `wc_water_frac`, `wc_entropy` | WorldCover class proportions; retain year/version |
| Infrastructure | `road_length_km_km2`, `waterway_length_km_km2`, `nearest_mapped_waterway_m` | OSM proxies calculated in a metric CRS; not complete drainage inventory |
| Storm | `rain_total_mm`, `rain_peak_mm_h`, `rain_mean_mm_h`, `duration_h`, `max_1h_mm`, `max_3h_mm`, `antecedent_rain_24h_mm`, `rain_source`, `rain_valid_fraction` | Quality-screened IMERG event features; retain alternate ERA5 `tp` in a separate source comparison |
| Antecedent state | `swvl1_pre_event`, `swvl2_pre_event`, etc. | ERA5-Land at a prespecified pre-event time/window; no future values |
| Target and flags | `sro_event_mm`, `sro_peak_hourly_mm`, `runoff_valid_fraction`, `target_method_version` | Only after ERA5 accumulation semantics and response window are verified; mark model-derived |
| Optional categories | `surface_cluster`, `rain_cluster` | Fit within training folds; never compute using held-out events/areas |

### Which sources to combine

- **Combine for static cell attributes:** DEM, selected SoilGrids properties, WorldCover and the clipped city OSM layers, aggregated once to the chosen ERA5 grid.
- **Combine for storm-response records:** validated IMERG event features with ERA5-Land target and pre-event soil moisture on their aligned grid/time window. Retain both source datasets and a reproducible cell/time mapping table.
- **Keep CWC separate:** station river-water-level records require station-specific QA and hydrologic interpretation; they cannot be merged into each cell-event row as a runoff observation.
- **Keep alternative/redundant representations out of the same modeling table:** use either NetCDF or CSV mirrors for a given data source; use either combined OSM or separate component layers; use full CWC files plus a reproducible spatial filter or the stored filtered subset, not both.
- **Do not combine the entire regional OSM CSVs into the city dataset without spatial clipping:** their coverage includes all southern India and geometry is stored as large WKT strings.

## 8. Missing data and limitations

1. A longer continuous GPM IMERG record is needed to obtain enough independent events and support event-held-out validation. Complete the in-progress download, then audit per-granule completeness and confirm consistent product/run/version.
2. A longer ERA5-Land period is needed for event diversity and seasonal coverage. Obtain continuous hourly fields over the same period as rainfall, including all required runoff, precipitation and soil-moisture variables.
3. No direct urban surface-runoff, storm-drain flow, street-flood depth/extent, or city-scale inundation observations were identified. ERA5-Land `sro` is a modeled proxy, and CWC water level is river stage. Claims must reflect this.
4. CWC discharge was not downloaded / not available in the recorded Krishna/AP resource. Even if found, river discharge would validate catchment response, not every city grid cell.
5. A study-area polygon and explicit boundary/land mask are not in the inspected inventory; bbox-only inclusion can mix urban, rural, river and coastal cells.
6. The SoilGrids source values need NoData and uncertainty metadata; current TIFF tags do not expose a NoData marker.
7. No drainage-network inventory with verified completeness, storm-drain attributes, land-use history, or local soil/infiltration measurements was found.
8. The CWC historical files contain very sparse coverage in the earliest period and unusual values/station metadata. They are unsuitable for direct model target use until validated.
9. Current data volume includes multi-gigabyte expanded CSV exports that duplicate geospatial source layers. They increase handling cost without increasing independent information.

## 9. Recommended next steps

1. **Freeze a snapshot after the active IMERG downloader completes.** Rebuild an authoritative manifest from file contents (including product version, time interval, byte size, checksum, CRS/grid, and coverage). The current manifest omits core climate data.
2. **Run a focused dynamic coverage audit:** extract all IMERG internal timestamps; report missing/duplicate half-hour intervals, quality-index distribution, missing-value count, and exact spatial coordinates. Verify the downloaded IMERG run/version and units.
3. **Resolve ERA5 conventions before target construction:** inspect source GRIB/ request parameters and compare timestamps/step metadata across month boundaries. Document deaccumulation/reset behavior for `sro`, `ssro`, `ro`, and `tp`; verify `ro` relationship to its components.
4. **Validate usable cells:** determine the study polygon, land/water mask, climate-grid cell intersections, and fraction of each static source valid in each climate cell. Reproject for metric calculations and preserve source CRS.
5. **Resolve soil and DEM NoData:** compare zero patterns to source masks/coverage and identify legitimate versus missing values. Apply property-specific scaling and physical-range checks.
6. **Clean CWC independently:** validate station identifiers/coordinates/state metadata against the authoritative source, inspect extreme values and units, remove or flag station-time duplicates, and build gap/continuity summaries. Use only as separate river-stage context unless linkage is defensible.
7. **Establish a target feasibility gate:** after temporal overlap and accumulation audits, calculate candidate target completeness and event count without training models. If city-scale observed runoff targets are a research requirement, obtain local gauge/drain/inundation observations or revise the research question to model-derived runoff response.
8. **Avoid carrying expanded CSV mirrors into analysis:** use the native raster, NetCDF and vector layers; generate only documented, compact aggregated tables after quality checks.

## 10. Final verdict

**Partially Ready.** The static geospatial sources support preliminary feature engineering and surface classification after careful masking, scaling and aggregation. A narrow early-2015 rainfall–ERA5 overlap exists and may support a feasibility pilot, but the active/partial IMERG archive and six-month ERA5 coverage are insufficient to establish robust event counts or generalization performance. ERA5 runoff accumulation semantics must be verified before target calculation. CWC provides river stage with quality concerns, not cell-level runoff ground truth. The project should proceed next with a snapshot-based feasibility and compatibility audit, not ML model training.
