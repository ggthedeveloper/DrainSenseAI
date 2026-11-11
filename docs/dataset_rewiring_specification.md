# DrainSenseAI — Dataset Rewiring & Engineering Specification

**Document Version:** 1.0  
**Target Focus:** Multi-factor urban pluvial vulnerability + flood probability & severity estimation  
**Primary Geographical Scope:** Vijayawada / Krishna River Basin (scalable to other Indian metros)

---

## 1. Executive Strategy & Objectives

### A. Core Shifts
1. **Move beyond trivial binary classification**: Instead of solely predicting $P(\text{flood}) \in \{0, 1\}$ from a synthetic formula, model the **governing physical and infrastructural factors**:
   - **Infiltration & Soil Retention**: SCS-CN capacity, soil hydrological group, saturation.
   - **Topographic Concentration**: Slope, multiscale Topographic Position Index (TPI), depression depth, stream proximity.
   - **Drainage & Infrastructure Deficit**: Drainage density, distance to major conduits (Budameru / Krishna / canals), impervious surface ratio.
   - **Hydro-Meteorological Stress**: Antecedent rolling rainfall (1h, 3h, 6h, 24h, 72h), river stage/discharge backwater pressure (Prakasam Barrage).
2. **Can We Create Our Own Dataset for Genuine Novelty?**
   - **YES**. Novelty in environmental ML does not require installing 10,000 physical IoT sensors.
   - Real scientific novelty comes from creating a **benchmarked, multi-source coupled dataset**:
     - **Static Grid Factor Layer**: Copernicus 30m DEM derivatives (mean elevation, slope, TPI multiscale) + OSM urban infrastructure + soil attributes.
     - **Dynamic Hydro-Meteorological Layer**: Real CWC gauge telemetry (Prakasam Barrage hourly water levels) + CWC/IMD daily and sub-daily rainfall.
     - **Ground Truth Inundation Calibration**: Sentinel-1 SAR backscatter change / ISRO Bhuvan satellite inundation footprints (2024 Budameru flood, 2020 Krishna flood) cross-referenced with CWC barrage levels.
     - **Composite Vulnerability & Hazard Index**: A multi-task dataset that outputs:
       1. Physical Runoff Deficit ($m^3/s$ excess over conveyance).
       2. Multi-factor Hazard Level (Categorical: Low, Ponding, Severe Inundation).
       3. Flood Possibility Probability ($0.0 \to 1.0$).

---

## 2. Dataset Inventory: Keep vs. Discard Audit

### Current Clean Active Datasets in `data/`

| Dataset File in `data/` | Size | Description & Provenance | Role in DrainSense |
| :--- | :--- | :--- | :--- |
| **`terrain_features.csv`** | 612 KB | 1,100 grid cells (250m) in Vijayawada with 36 columns. **Derived directly from Copernicus GLO-30 GeoTIFF raster (`Copernicus_DSM_COG_10_N16_00_E080_00_DEM.tif`)**: includes cell-wise elevation statistics (mean, median, min, max, p10-p90), finite-difference slope, and multiscale TPI (`tpi_3`, `tpi_7`, `tpi_11`). | **Spatial Factor Matrix**: Core physical topography backbone. |
| **`cwc_krishna_river_telemetry_vja.csv`** | 14.8 MB | 65,776 hourly water-level records filtered specifically for Krishna district monitoring stations directly influencing Vijayawada (`Prakasam Barrage`, `Keesara`, `Paleru Bridge`, `Polampalli`). | **Hydraulic Backwater Telemetry**: Quantifies river stage and backwater pressure choking city drainage outfalls. |
| **`cwc_daily_rainfall_krishna_vja.csv`** | 411 KB | 2,738 real daily ground-gauge rainfall records (2021–2025) strictly for stations in Krishna & Guntur districts (the twin-basin area of Vijayawada / Amaravati). | **Ground Precipitation Truth**: Calibrates antecedent rainfall indices. |
| **`urban_pluvial_flood_risk_dataset.csv`** | 441 KB | 2,963 urban segments across 60 global cities with drainage density, curb inlet types, soil groups, and compound risk labels. | **Infrastructure Factor Benchmark**: Maps drainage density and soil groups. |
| **`catchment_characteristics_indofloods.csv`** | 146 KB | 108 geomorphic and hydro-morphological indices across Indian river basins (stream order, sinuosity, bifurcation ratios). | **Catchment Feature Engineering**: Basin-scale shape and runoff parameters. |
| **`andhra_pradesh_krishna_monthly_summary.csv`** | 69 KB | Aggregated monthly hydrological metrics per station. | **Hydrological Baseline Reference**: Normal vs. flood stage baselines. |
| **`andhra_pradesh_krishna_annual_summary.csv`** | 6 KB | Annual high/mean/low water levels per station. | **Return-Period Reference**: Benchmarks historical return periods. |

---

### Record of Changes: Files Removed & Filtered

The following operations were executed to eliminate bloat, remove redundant data, and focus purely on the target Vijayawada catchment:

1. **Removed `weather_monthly.csv` (1.4 MB)**:
   - *Reason*: Coarse monthly-aggregated summaries (1991–present). Completely unsuited for storm-level or sub-daily pluvial flood modeling; superseded by daily CWC gauge observations.
2. **Removed redundant 74.0 MB `rwl_tel_hr_cwc_krishna_2021_2025.csv`**:
   - *Reason*: Contained over 450,000 hourly rows across upstream dams in Karnataka and Maharashtra (Almatti, Bhadra, Shimoga, etc.) that do not directly inform Vijayawada's local stormwater choking. The Prakasam Barrage data inside was identical to the AP CWC series.
3. **Filtered `andhra_pradesh_krishna_telemetry_timeseries.csv` (29.3 MB) → `cwc_krishna_river_telemetry_vja.csv` (14.8 MB)**:
   - *Change*: Stripped out distant non-coastal stations (e.g., Kurnool, Bawapuram, Mantralayam) and extracted 65,776 relevant hourly rows for Krishna district stations (`Prakasam Barrage`, `Keesara`, `Paleru Bridge`, `Polampalli`). The raw 29.3 MB file was deleted.
4. **Filtered `rainfall_manual_daily_cwc_ap_2021_2025 (1).csv` (3.4 MB) → `cwc_daily_rainfall_krishna_vja.csv` (411 KB)**:
   - *Change*: Filtered down 17 irrelevant AP districts (e.g., Anantapur, Chittoor, Srikakulam) to only `KRISHNA` and `GUNTUR` districts (the Vijayawada / Amaravati metropolitan basin). The raw 3.4 MB file was deleted.
5. **Net Workspace Impact**:
   - Total raw data size reduced from **~110 MB to ~16.5 MB** while **100% of relevant local Vijayawada hydrological, terrain, and rainfall data was preserved**.

---

## 3. Creating Our Own Novel Dataset: Architecture & Schema

### Multi-Factor Spatial Grid: The `drainsense_v2_grid_factors` Matrix

Instead of treating the city as abstract numbers, each spatial grid cell ($250\text{m} \times 250\text{m}$ or $500\text{m} \times 500\text{m}$) is characterized by **4 factor groups**:

```
[Group 1: Topographic Factors] (From Copernicus DEM 30m)
  ├── elevation_mean_m, elevation_min_m, elevation_range_m
  ├── slope_mean_deg, slope_max_deg
  ├── tpi_3_mean, tpi_7_mean, tpi_11_mean (depression vs. ridge indicators)
  └── distance_to_water_m (Euclidean / cost-distance to Krishna & Budameru)

[Group 2: Surface & Soil Factors] (From WorldCover + SoilGrids + IndoFloods)
  ├── impervious_surface_ratio (0.0 to 1.0)
  ├── building_footprint_density
  ├── soil_hydrologic_group (A, B, C, D)
  └── potential_max_retention_s_mm (Derived via SCS-CN)

[Group 3: Drainage Infrastructure Factors] (From Urban Pluvial Benchmark + OSM)
  ├── drainage_density_km_per_km2
  ├── storm_drain_proximity_m
  └── outfall_conveyance_capacity_m3s

[Group 4: Dynamic Hydro-Meteorological Forcing] (From CWC Daily/Hourly + ERA5)
  ├── rain_1h_mm, rain_3h_mm, rain_6h_mm, rain_24h_mm, rain_72h_mm
  ├── rain_intensity_mm_h
  ├── river_stage_prakasam_m (Current gauge height at Prakasam Barrage)
  └── barrage_backwater_risk_flag (Boolean: water level > danger mark 17.5m)
```

---

## 4. Multi-Target Learning Formulation (Moving Beyond Simple 0/1)

For every cell-event pair $(i, t)$, the target vector $Y_{i,t}$ contains:

1. **`flood_probability` ($\in [0.0, 1.0]$)**: Calibrated probability that water depth $> 15\text{ cm}$.
2. **`dominant_risk_factor` (Categorical Multi-Class)**:
   - `DEPRESSION_TRAP`: Low TPI + low slope + high surrounding elevation.
   - `SURFACE_RUNOFF_CHOKE`: High imperviousness + high rainfall intensity exceeding infiltration.
   - `RIVERINE_BACKWATER`: High river stage at barrage choking urban canal outfalls.
   - `DRAINAGE_DEFICIT`: High building/road density with inadequate conduit conveyance.
3. **`runoff_excess_volume_m3` (Continuous Regression)**:
   - Estimated volumetric water accumulation requiring pump/drain conveyance.

---

## 5. End-to-End Pipeline: Raw → Interim → Processed

```
[1. Raw Sources]
  ├── Copernicus DEM 30m Tile
  ├── CWC Hourly Telemetry (AP Krishna)
  ├── CWC Daily Rainfall (2021-2025)
  ├── IndoFloods Catchment Traits
  └── Urban Pluvial Benchmark
         ↓
[2. Spatial & Temporal Harmonization]
  ├── Grid Resampling & Zonal Stats (250m Cells)
  ├── Temporal Windowing (1h..72h Rolling Sums)
  ├── Barrage Discharge & Stage Alignment
  └── Geomorphic & Drainage Factor Synthesis
         ↓
[3. Final Multi-Factor ML Ready Datasets]
  ├── data/processed/vijayawada_grid_static_factors.csv (1,100 cells)
  ├── data/processed/vijayawada_event_telemetry.csv (Storm Slices)
  └── data/processed/drainsense_v2_training_matrix.csv (Spatiotemporal Joined)
```

### Conversion Steps:
1. **Step 1 — Static Factor Normalization**:
   - Ingest `data/terrain_features.csv` (1,100 cells).
   - Impute the 12 boundary sliver cells using nearest neighbor interpolation.
   - Merge geomorphic traits (drainage density, curve numbers) mapped from `urban_pluvial_flood_risk_dataset.csv`.
   - Output: `data/processed/vijayawada_grid_static_factors.csv`.
2. **Step 2 — Hydro-Meteorological Event Assembly**:
   - Parse `rainfall_manual_daily_cwc_ap_2021_2025 (1).csv` and `andhra_pradesh_krishna_telemetry_timeseries.csv`.
   - Extract Prakasam Barrage and Vijayawada stations across key historic monsoon events (e.g., September 2024 Budameru floods, October 2020 extreme storm, July 2022 Krishna surges).
   - Compute rolling antecedent rainfall ($P_{1h}, P_{6h}, P_{24h}, P_{72h}$) and river stage differentials ($\Delta H = H_{\text{current}} - H_{\text{warning}}$).
   - Output: `data/processed/vijayawada_event_telemetry.csv`.
3. **Step 3 — Spatiotemporal Fusion (The ML Matrix)**:
   - Cartesian join of the 1,100 static factor cells with the sampled storm event time slices.
   - Label assignment using hybrid physics-satellite ground truth calibration.
   - Output: `data/processed/drainsense_v2_training_matrix.csv`.

