# DrainSense India — Data Sources & Telemetry Specification

DrainSense India prioritizes verifiable public Indian and global remote-sensing datasets.

## 1. Rainfall & Meteorological Telemetry
- **Central Water Commission (CWC) / National Water Data Portal (NWDP):**
  - River gauge levels and telemetry discharge records for Krishna Basin stations (e.g. Prakasam Barrage).
  - Web portal: `https://indiawris.gov.in/wris/#/`
- **Open-Meteo Historical Archive API (ERA5 / IMD Calibrated):**
  - High-resolution hourly precipitation for Vijayawada coordinates (`16.5062°N, 80.6480°E`).
  - Fetched via `archive-api.open-meteo.com/v1/archive`.
  - Ingested records: 2,760 hourly time slices across key historical monsoon regimes.

## 2. Historical Flood & Inundation Footprints
- **India Flood Inventory (IFI) & AP SDMA Disaster Documentation:**
  - **Event 1:** September 2024 Budameru Flash Inundation & Krishna Surplus (Peak 24h rain: 290.0 mm; Prakasam Barrage discharge 11.43 lakh cusecs; affected wards: Ajit Singh Nagar, Payakapuram, Nunna).
  - **Event 2:** October 2020 Cyclone Nivar / Krishna Depression (Peak 24h rain: 175.0 mm; stormwater canal overflow).
  - **Event 3:** August 2019 Krishna River Flood (Peak 24h rain: 210.0 mm; Prakasam Barrage inflow 8.2 lakh cusecs; affected wards: Krishnalanka, Undavalli).

## 3. Topography & Geospatial Features
- **SRTM / Copernicus 30m Digital Elevation Model (DEM):**
  - Aggregated to 500m grid cells. Elevation ranges from 14.0m AMSL (Krishna riverfront and Budameru depression) to 110.0m AMSL (Indrakeeladri temple ridge).
- **OpenStreetMap Infrastructure:**
  - Waterways: Krishna River, Budameru Rivulet, Eluru Canal, Ryves Canal, Bandar Canal.
  - Road density and building footprint proxies.
