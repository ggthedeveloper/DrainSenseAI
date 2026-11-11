# DrainSense Dataset Documentation (`datadoc.md`)

A concise guide to how every dataset in DrainSense is gathered, derived, classified (real vs. derived vs. synthetic), and used across training, inference, and the web UI.

---

## 1. End-to-End Data Flow

```text
[1. Data Gathering]                      [2. Spatial & Temporal Processing]               [3. Model & App Usage]
Open-Meteo Elevation API (30m DEM)  ---> 2D Finite-Diff Slope + Urban Proxies ---------> all_cities_grid_features.csv (5,827 cells)
OpenStreetMap Overpass / City Specs ---> Haversine Waterway Distance & Grid GeoJSONs --> {vja,che,bom,blr}_grid_500m.json
Open-Meteo Historical Archive (ERA5) --> Rolling Windows (1h..72h) & Sampled Slices ---> drainsense_train_dataset.csv (776,890 rows)
IMD / CWC / ISRO Bhuvan Bulletins -----> Curated CSV/JSON Reference Logs --------------> Historical Event Registry & UI Provenance
```

1. **Gather Raw Earth Data**: Run [`scripts/fetch_real_earth_data.py`](file:///Users/gg/Desktop/DrainSense/scripts/fetch_real_earth_data.py) and [`ml/src/ingestion/rainfall_loader.py`](file:///Users/gg/Desktop/DrainSense/ml/src/ingestion/rainfall_loader.py).
2. **Compile 500m City Grids**: Run [`scripts/inject_real_earth_data.py`](file:///Users/gg/Desktop/DrainSense/scripts/inject_real_earth_data.py) to convert raw elevation JSONs and waterway polylines into cell features.
3. **Build ML Training Matrix**: Run [`scripts/build_dataset.py`](file:///Users/gg/Desktop/DrainSense/scripts/build_dataset.py) (calls [`build_full_dataset`](file:///Users/gg/Desktop/DrainSense/ml/src/features/feature_builder.py)) to join spatial cells with antecedent rainfall slices and generate hydrological training labels.

---

## 2. How Datasets Are Retrieved (APIs & Sources)

| Source / Endpoint | Retrieval Method | Script / Module | What Was Retrieved |
| :--- | :--- | :--- | :--- |
| **Open-Meteo Elevation API**<br/>`https://api.open-meteo.com/v1/elevation` | HTTP `GET` in batches of 90 cell centroids (`0.3s` throttle) over Copernicus / SRTM 30m DEM. | [`fetch_real_elevations`](file:///Users/gg/Desktop/DrainSense/scripts/fetch_real_earth_data.py) | Ground elevation (`m` AMSL) for all 5,827 grid centers across VJA (810), CHE (1,485), BOM (1,768), BLR (1,764). |
| **Open-Meteo Historical Weather API (ERA5)**<br/>`https://archive-api.open-meteo.com/v1/archive` | HTTP `GET` (`hourly=precipitation,rain`, `timezone=Asia/Kolkata`) across documented storm dates. | [`fetch_real_rainfall`](file:///Users/gg/Desktop/DrainSense/scripts/fetch_real_earth_data.py), [`fetch_open_meteo_city_hourly`](file:///Users/gg/Desktop/DrainSense/ml/src/ingestion/rainfall_loader.py) | 1,632 hourly rain records for the 4 core cities (`*_real_hourly_rainfall.csv`) and 3,456 records across 12 cities (`multi_city_hourly_rainfall.csv`). |
| **OpenStreetMap Overpass API + Manual Polylines**<br/>`https://overpass-api.de/api/interpreter` | HTTP `POST` Overpass QL query (`way["waterway"]`) inside city bbox; falls back to curated polylines in `CITY_SPECS` on timeout / HTTP 502. | [`fetch_real_waterways_osm`](file:///Users/gg/Desktop/DrainSense/scripts/fetch_real_earth_data.py), [`spatial_loader.py`](file:///Users/gg/Desktop/DrainSense/ml/src/ingestion/spatial_loader.py) | Vertex coordinates for Krishna, Budameru, Adyar, Cooum, Buckingham Canal, Mithi, Oshiwara, Bellandur, Vrishabhavathi, and Hebbal corridors. |
| **Indian Agency Bulletins (IMD, CWC, ISRO Bhuvan)** | Curated offline from published IMD weather reports, CWC/APSDMA/WRD/MCGM/BBMP discharge logs, NRSC Bhuvan SAR summaries, and Kaggle references. | [`flood_loader.py`](file:///Users/gg/Desktop/DrainSense/ml/src/ingestion/flood_loader.py), manual raw ingestion | Verified 24h peak rainfall, barrage discharge stages, SAR inundated areas, and flood timelines stored in static CSV/JSON logs. |

---

## 3. Dataset Inventory, Type (Real vs. Synthetic), & Usage

### A. Raw Data (`data/raw/`)

| Dataset File | Description | Real or Synthetic? | Usage in DrainSense |
| :--- | :--- | :--- | :--- |
| `{vja,che,bom,blr}_real_elevation.json` | 5,827 grid centroid elevations (`810` VJA, `1,485` CHE, `1,768` BOM, `1,764` BLR). | **Real** (Copernicus / SRTM 30m via Open-Meteo). | Consumed by [`inject_real_earth_data.py`](file:///Users/gg/Desktop/DrainSense/scripts/inject_real_earth_data.py) to build true elevation and slope grids. |
| `{vja,che,bom,blr}_real_hourly_rainfall.csv` | Hourly precipitation during flagship storms (VJA Aug-Sep 2024: 576h, CHE Nov-Dec 2023: 432h, BOM Jul 2023: 336h, BLR Aug-Sep 2022: 288h). | **Real** (ERA5 reanalysis via Open-Meteo). | Historical telemetry archive and chart generation; API telemetry evidence. |
| `multi_city_hourly_rainfall.csv` & `vijayawada_hourly_rainfall_telemetry.csv` | Hourly rain time-series (`3,456` rows across 12 cities; `576` VJA slice). | **Real** (Open-Meteo Archive API; includes Gaussian fallback in code if API fails). | Joined in [`feature_builder.py`](file:///Users/gg/Desktop/DrainSense/ml/src/features/feature_builder.py) to compute rolling windows for ML training; read by `/admin/refresh-data`. |
| `{vja,che,bom,blr}_osm_waterways.json` | 3 to 4 polyline corridors per city (`way` elements). | **Real geometry (manually curated fallback)** saved when Overpass timed out / returned 502. | Raw archive of river/canal vectors used for waterway proximity. |
| `imd_daily_rainfall_stations.csv` (22 rows)<br/>`cwc_river_barrage_telemetry.csv` (14 rows)<br/>`isro_bhuvan_flood_inundation_benchmarks.json` (4 events) | Official IMD/KSNDMC gauge totals, CWC/municipal barrage stages, and NRSC Bhuvan SAR flood area summaries. | **Real (curated historical records)**. | Reference benchmarks and provenance documentation (not ingested into automated ML training or live endpoints). |

### B. Processed & Serving Datasets (`data/processed/`, `models/`, `frontend/public/data/`)

| Dataset File | Description | Real or Synthetic? | Usage in DrainSense |
| :--- | :--- | :--- | :--- |
| `all_cities_grid_features.csv` (5,827 rows)<br/>`vijayawada_grid_features.csv` (810 rows) | Spatial feature matrix for the 4 active 500m x 500m city grids. | **Hybrid (Real DEM + Derived Physics + Synthetic Proxies)**. See Section 4. | Loaded at runtime by [`RiskInferenceService`](file:///Users/gg/Desktop/DrainSense/ml/src/inference/predictor.py) to power `/risk/map`, `/risk/{grid_id}`, `/simulate`, `/cascade`, and `/nowcast`. |
| `{vja,che,bom,blr}_grid_500m.json` & `vijayawada_grid_500m.json` | GeoJSON polygon boundaries (`0.0045-0.0050°` grid cells) paired with spatial properties. | **Hybrid** (deterministic grid polygons + same features above). | Loaded by [`RiskInferenceService`](file:///Users/gg/Desktop/DrainSense/ml/src/inference/predictor.py) to render colored 500m map polygons in `RiskMap.tsx`. |
| `drainsense_train_dataset.csv` (`776,890` rows, ~200 MB) | Spatiotemporal ML matrix cross-joining 12 cities' spatial cells with ~55 rain snapshots/city. | **Semi-Synthetic** (VJA/CHE real DEM + BOM/BLR/8 legacy cities synthetic DEM on Oct 26 snapshot + ERA5 rain + **100% synthetic labels**). | Trains and compares Dummy, Logistic Regression, Random Forest, and Calibrated XGBoost in [`train.py`](file:///Users/gg/Desktop/DrainSense/ml/src/training/train.py). |
| `historical_flood_events.json` & `.csv` (9 events) | Documented Indian flood disasters across VJA, CHE, BOM, BLR with citations. | **Real (curated summaries)**. | Served by `/api/v1/historical-events` and synced to `frontend/public/data/historical_events.json`. |
| `current_risk_predictions.json` & `evaluation_report.json` | Precomputed VJA baseline inference GeoJSON and holdout evaluation curves/metrics. | **Model Output** (XGBoost trained on semi-synthetic dataset). | Offline/static artifacts generated by `generate_predictions.py` & `evaluate_model.py`; mirrored into `frontend/public/data/` for offline fallback. |
| `data/legacy_prototypes/{amd,ccu,cok,del,gau,hyd,pat,pnq}_grid_500m.json` | Retired Sept 11 GeoJSONs for 8 earlier cities. | **Synthetic** (`rng.uniform` in [`spatial_loader.py`](file:///Users/gg/Desktop/DrainSense/ml/src/ingestion/spatial_loader.py)). | Quarantined; unused by backend inference or active cities. *(Note: stale `current_risk_*.json` files for these cities still sit in `frontend/public/data/` as unused static files.)* |
| In-memory backend lists (`DRAIN_ASSETS_DATA`, `ALERTS_DATA`) | 20 municipal drains/pumps (`siltation_level_pct`) and 4 active alerts in [`endpoints.py`](file:///Users/gg/Desktop/DrainSense/backend/app/api/endpoints.py). | **Synthetic / Hardcoded Operational Fixtures**. | Served by `/api/v1/assets` and `/api/v1/alerts` in the Drain Assets and Alerts tabs. |

---

## 4. Exact Initial Processing & Synthetic Creation Formulas

### Step 1: Real Terrain + Proxy Feature Derivation ([`inject_real_earth_data.py`](file:///Users/gg/Desktop/DrainSense/scripts/inject_real_earth_data.py))

1. **True Topographic Slope (`slope_deg`, Real Derived)**:
   Raw elevation points are reshaped into a 2D grid $z_{r,c}$ with cell spacings $\Delta y = \Delta\text{lat} \times 111139\text{ m}$ and $\Delta x = \Delta\text{lon} \times 111139\text{ m} \cdot \cos(\text{lat}_0)$. Central finite differences (`numpy.gradient`) yield:
   $$\text{slope\_deg} = \text{degrees}\left(\arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right)\right)$$

2. **Waterway Proximity (`distance_to_water_m`, Real Derived)**:
   Minimum great-circle Haversine distance ($R = 6,371,000\text{ m}$) from cell center $(\phi_1, \lambda_1)$ to every polyline vertex $(\phi_2, \lambda_2)$ in `CITY_SPECS[city]["waterways"]`.

3. **Heuristic Spatial Proxies (Synthetic Formula-Derived)**:
   Because municipal sub-surface pipe GIS, LiDAR flow rasters, and building footprints are not publicly available across all 4 cities, these columns are synthesized deterministically from elevation, water distance, and city-center distance $d_{\text{center}}$:
   - **Flow Accumulation**: $\text{clip}\big(6.5 \cdot \max(0, T_{\text{spill}} - \text{elev}) + \frac{2200}{d_{\text{water}} + 120},\ 5.0,\ 99.0\big)$, where city spill thresholds $T_{\text{spill}}$ are `19.5m` (VJA), `6.0m` (CHE), `7.0m` (BOM), and `882.0m` (BLR).
   - **Drainage Density ($\text{km/km}^2$)**: $\text{clip}\big(4.0 - \frac{d_{\text{water}}}{1500},\ 0.4,\ 4.8\big)$.
   - **Urban Density Rings**: Deterministic 3-tier step function around `spec["center"]`:
     - $d_{\text{center}} < 3.5\text{ km}$: `impervious=0.88`, `road_density=14.2`, `building_density=0.78`
     - $3.5 \le d_{\text{center}} < 8.0\text{ km}$: `impervious=0.65`, `road_density=8.5`, `building_density=0.52`
     - $d_{\text{center}} \ge 8.0\text{ km}$: `impervious=0.35`, `road_density=3.8`, `building_density=0.25`
   - **Historical Flood Priors**: `count=4, freq=0.40, area=85%` if inside a `flood_prone` zone and $\text{elev} \le T_{\text{spill}}$; `count=2, freq=0.20, area=45%` if only in a `flood_prone` zone; else `0`.

*(Legacy Note: When Open-Meteo DEM is skipped and [`spatial_loader.py`](file:///Users/gg/Desktop/DrainSense/ml/src/ingestion/spatial_loader.py) runs instead, `elevation_m`, `slope_deg`, urban densities, and flood frequencies are sampled via `rng.uniform()` inside zone elevation bands. That Oct 26 snapshot still appears inside `drainsense_train_dataset.csv` for non-VJA/CHE cities before Nov 6's `BOM`/`BLR` Copernicus update.)*

### Step 2: Temporal Aggregation & Storm Sampling ([`temporal_aggregator.py`](file:///Users/gg/Desktop/DrainSense/ml/src/preprocessing/temporal_aggregator.py) & [`feature_builder.py`](file:///Users/gg/Desktop/DrainSense/ml/src/features/feature_builder.py))

1. **Backward Rolling Windows**: Over sorted hourly telemetry (zero future leakage), backward pandas time rolling computes cumulative `rain_1h_mm`, `rain_3h_mm`, `rain_6h_mm`, `rain_12h_mm`, `rain_24h_mm`, and `rain_72h_mm`, plus:
   $$\text{rain\_intensity\_mm\_h} = \frac{\text{rain\_3h}}{3}, \quad \text{rain\_change\_rate} = \text{rain\_3h} - \max(0,\ \text{rain\_6h} - \text{rain\_3h})$$
2. **Temporal Slice Sampling**: Per city, up to `55` timestamps are sampled (`20` heavy $\ge 80\text{ mm/24h}$, `15` moderate $35\text{-}80\text{ mm}$, `10` light $10\text{-}35\text{ mm}$, `10` dry $< 5\text{ mm}$) and Cartesian cross-joined with every spatial grid cell in that city.
   *(Fallback: If Open-Meteo fails in [`rainfall_loader.py`](file:///Users/gg/Desktop/DrainSense/ml/src/ingestion/rainfall_loader.py), a 500-hour Gaussian storm bell curve $e^{-(t-10)^2 / 8} \cdot U(25,45) \cdot U(0.2,1.2)$ is generated.)*

### Step 3: Synthetic Ground-Truth Label Formula ([`label_generator.py`](file:///Users/gg/Desktop/DrainSense/ml/src/features/label_generator.py))

Because continuous per-500m-cell inundation sensors do not exist across Indian cities, binary `flood_label` targets (`0` or `1`) are synthetically constructed in `construct_flood_labels()` using hydrology equations:

1. **SCS-CN Direct Surface Runoff ($Q$, mm)**:
   $$CN = 68.0 + 25.0 \cdot \text{impervious\_surface\_ratio}, \quad S = \frac{25400}{CN} - 254, \quad I_a = 0.2 S$$
   $$P = \text{rain\_24h} + 0.4 \cdot \text{rain\_6h}, \quad Q = \begin{cases} \frac{(P - I_a)^2}{(P - I_a) + S} & \text{if } P > I_a \\ 0 & \text{otherwise} \end{cases}$$

2. **Topographic Wetness Index (TWI) & Elevation / Water Penalties**:
   $$\text{TWI}_{\text{norm}} = \text{clip}\left(\frac{\ln\big((\text{flow\_acc} + 10) / \tan(\max(0.2^\circ, \text{slope}))\big) - 3.0}{6.0},\ 0,\ 1\right)$$
   $$\text{elev\_penalty} = \text{clip}\left(\frac{12.0 - \max(0, \text{elev} - \text{city\_base})}{10.0},\ 0,\ 1\right), \quad \text{water\_factor} = \text{clip}\left(\frac{1500 - d_{\text{water}}}{1500},\ 0,\ 1\right)$$
   *(where `city_base` is `14.0m` VJA, `3.0m` CHE/BOM, `870.0m` BLR).*

3. **Hydrological Inundation Potential Index (HIPI) + Stochasticity**:
   $$\text{HIPI} = 0.45 \cdot \text{clip}\left(\frac{Q}{85}, 0, 1\right) + 0.22 \cdot \text{elev\_penalty} + 0.15 \cdot \text{TWI}_{\text{norm}} + 0.10 \cdot \text{water\_factor} + 0.08 \cdot \text{hist\_freq}$$
   $$p_{\text{flood}} = \text{clip}\big(\text{HIPI} + \epsilon,\ 0,\ 1\big), \quad \epsilon \sim \mathcal{N}(0,\ 0.08^2) \text{ (seed=42)}$$

4. **Final Binary Classification & Physical Override Rules**:
   - `flood_label = 1` if $p_{\text{flood}} \ge 0.52$, else `0`.
   - **Hard Overrides to `0`**: Hilltops (`slope_deg > 5.0` and `elev - city_base > 35.0`) and dry hours (`rain_24h_mm < 15.0`) are always forced to `0`.

---

## 5. Quality Validation Checks ([`validator.py`](file:///Users/gg/Desktop/DrainSense/ml/src/preprocessing/validator.py))

Before training (`scripts/validate_data.py`), data is checked for zero missing timestamps, non-negative hourly rain $\le 300\text{ mm/h}$, impervious ratio $\in [0, 1]$, and zero `NaN` values across all 17 `EXPECTED_FEATURE_COLUMNS`. *(Note: `validate_spatial_features` still checks the original VJA bounding box `[16.40, 16.65]` and `[5m, 300m]` elevation limits, matching `vijayawada_grid_features.csv` rather than BLR's `~896m` plateau.)*
