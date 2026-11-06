# DrainSense Data Registry and Processing Lineage

This directory maintains the raw, interim, and processed data assets for DrainSense. All active machine learning models, physics engines, and UI layers ingest data processed from verified real-world satellite, meteorological, and geospatial sources.

---

## 1. Verified Real Data Sources (Indian National & Space Agency Ingestion)

| Dataset Name | Primary Source / Agency | Retrieval Path | Purpose in DrainSense |
| :--- | :--- | :--- | :--- |
| **Copernicus 30m Global DEM** | European Space Agency (ESA) / NASA SRTM via Open-Meteo Elevation API<br/><small>[source link](https://open-meteo.com/en/docs/elevation-api)</small> | `data/raw/*_real_elevation.json` | Replaces flat planes with real topography across 5,827 cells |
| **IMD Official Station Rain Telemetry** | India Meteorological Department (IMD) / MoES, Govt. of India<br/><small>[source link](https://mausam.imd.gov.in/)</small> | `data/raw/imd_daily_rainfall_stations.csv` | Official 24h rainfall bulletins for Gannavaram, Meenambakkam, Santacruz, HAL Airport |
| **CWC River Stage & Barrage Telemetry** | Central Water Commission (CWC) & India-WRIS, Ministry of Jal Shakti<br/><small>[source link](https://indiawris.gov.in/wris/)</small> | `data/raw/cwc_river_barrage_telemetry.csv` | Real-time discharges (Prakasam Barrage 11.43L cusecs, Chembarambakkam 8,000 cusecs) |
| **ISRO NRSC Bhuvan Flood Extents** | National Remote Sensing Centre (NRSC) / ISRO Disaster Portal<br/><small>[source link](https://bhuvan-app1.nrsc.gov.in/disaster/disaster.php?id=flood)</small> | `data/raw/isro_bhuvan_flood_inundation_benchmarks.json` | Satellite SAR radar backscatter flood footprints (Budameru & Velachery inundation) |
| **ECMWF ERA5 Reanalysis** | European Centre for Medium-Range Weather Forecasts (ECMWF)<br/><small>[source link](https://open-meteo.com/en/docs/historical-weather-api)</small> | `data/raw/*_real_hourly_rainfall.csv` | Real hourly precipitation telemetry for cloudburst benchmarks |
| **OpenStreetMap Vector Hydrography** | OpenStreetMap Foundation / Overpass Turbo<br/><small>[source link](https://overpass-turbo.eu/)</small> | `ml/src/ingestion/spatial_loader.py` | Centrelines of Krishna, Budameru, Adyar, Cooum, Mithi, and Bellandur |
| **India Disaster Ground Truth** | CWC, IMD, KSNDMC, MCGM, IEEE IGARSS, Kaggle<br/><small>[source link](https://www.kaggle.com/datasets/anuragkanaujia/chennai-water-management)</small> | `data/processed/historical_flood_events.json` | Validated historical inundation events for model calibration |

---

## 2. Mathematical Processing Pipeline (`data/raw/` -> `data/processed/`)

Every record in `data/processed/` is deterministically computed from raw observations using `scripts/inject_real_earth_data.py`:

### A. Topographic Slope Matrix (Finite Difference)
Copernicus 30m elevations are mapped to a 2D mesh $(z_{i,j})$ with grid cell dimensions $\Delta x \approx 500\text{m}$ and $\Delta y \approx 500\text{m}$. Slopes are calculated using central finite differences:
$$\frac{\partial z}{\partial x} \approx \frac{z_{i, j+1} - z_{i, j-1}}{2 \Delta x}, \quad \frac{\partial z}{\partial y} \approx \frac{z_{i+1, j} - z_{i-1, j}}{2 \Delta y}$$
$$\text{Slope (degrees)} = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right) \times \frac{180}{\pi}$$

### B. Geodesic Proximity to Waterways (Haversine Formula)
For each centroid $(\phi_1, \lambda_1)$ and river polyline vertex $(\phi_2, \lambda_2)$:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
The minimum distance to any active river or canal centerline is assigned to `distance_to_river_m`.

### C. Topographic Wetness Index (TWI)
$$\text{TWI} = \ln\left(\frac{\alpha}{\tan \beta}\right)$$
Where $\alpha$ is the upslope contributing drainage area and $\beta$ is the local slope angle. Low slope combined with high catchment area flags natural water accumulation sumps.

### D. SCS-CN Hydrological Mass-Balance (USDA NRCS)
Soil hydrologic groups and land cover types define Curve Numbers (CN):
$$S = \frac{25400}{\text{CN}} - 254$$
$$Q = \frac{(P - 0.2S)^2}{P + 0.8S} \quad (\text{for } P > 0.2S)$$
Where $P$ is precipitation in mm and $Q$ is direct surface runoff in mm.

---

## 3. Active Processed Assets (`data/processed/`)

- `all_cities_grid_features.csv`: 5,827 rows compiled from the 4 metropolitan basins (810 VJA, 1,485 CHE, 1,768 BOM, 1,764 BLR).
- `vijayawada_grid_features.csv`: 810 rows for the Krishna and Budameru pilot basin.
- `vja_grid_500m.json`, `che_grid_500m.json`, `bom_grid_500m.json`, `blr_grid_500m.json`: GeoJSON feature collections with 500m x 500m polygon boundaries and true elevation attributes.
- `historical_flood_events.json` & `historical_flood_events.csv`: 9 verified benchmark disasters across Vijayawada, Chennai, Mumbai, and Bengaluru with real flood depths, affected populations, and official sources.
- `current_risk_predictions.json`: Pre-computed inference risk scores, severity classifications, and explainability factors.
- `evaluation_report.json`: Validation metrics (96.5% ROC-AUC, 92.4% precision) calculated against verified flood events.

---

## 4. Legacy Prototypes (`data/legacy_prototypes/`)

The early uniform random grid files (`amd`, `ccu`, `cok`, `del`, `gau`, `hyd`, `pat`, `pnq`) from the September 11 draft have been isolated in `data/legacy_prototypes/`. They are not used in active models or runtime APIs.
