# DrainSenseAI 🌊
**"Physics-Informed Urban Deluge Nowcasting & Autonomous Resource Dispatch"**

[![Python 3.12](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.125-teal.svg)](https://fastapi.tiangolo.com/)
[![XGBoost Calibrated](https://img.shields.io/badge/XGBoost-Calibrated_0.9823_AUC-orange.svg)](https://xgboost.readthedocs.io/)
[![Real Earth Observation](https://img.shields.io/badge/Copernicus_DEM-30m_Resolution-green.svg)](https://spacedata.copernicus.eu/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Scientific Positioning & Research Novelties

Traditional urban flood systems rely either on computationally prohibitive 2D hydrodynamic solvers (SWMM, HEC-RAS taking hours to run) or unconstrained "black-box" machine learning models that frequently violate physical mass conservation laws during severe deluge anomalies.

**DrainSenseAI** resolves this operational gap by coupling **calibrated gradient boosting** with **hydro-physical guardrails** and **operations-research dispatch optimization** on 2,295 deterministic 500m × 500m spatial cells across Indian river basins.

### The Four Core Scientific Hydro-AI Novelties:

1. **Topological Cascade Inundation Graph (DAHG):**
   Models hydrological continuity using D8 steepest descent flow routing. Calculates dynamic spillover arrival lead times using the Manning open-channel velocity equation:
   $$v = \frac{1}{n} R^{2/3} S^{1/2} \quad \Big| \quad \tau_{\text{lag}} = \frac{L}{v}$$
2. **Physics-Informed SCS-CN Mass-Balance Guardrail (PIML):**
   Audits black-box XGBoost probability predictions against USDA-NRCS Curve Number equations. Derives a real-time **Hydrological Concordance Index (HCI)** to enforce mass conservation during cloudburst anomalies:
   $$Q = \frac{(P - I_a)^2}{P - I_a + S} \quad \Big| \quad \text{HCI} = 1 - \frac{|Q_{\text{xgb}} - Q_{\text{scs}}|}{Q_{\text{scs}}}$$
3. **Multi-Horizon Temporal Nowcaster ($T+0\text{h}$ to $T+6\text{h}$):**
   Forecasts forward inundation escalation across 1h, 2h, 4h, and 6h operational horizons, tracking rainfall decay and canal outfall backwater tailback.
4. **Autonomous Operations-Research Dispatch Optimizer:**
   Solves an integer linear programming (ILP) formulation under municipal depot equipment constraints (heavy dewatering pumps, super-suckers, boat squads) and exports **NDMA Form D-4** compliant Incident Action Plans.

---

## 2. 100% Verified Real Earth Observation Data & Provenance

> [!IMPORTANT]
> **Zero Synthetic Data / Zero Mock Proxies:**
> All spatial centroids, elevations, slopes, precipitation time-series, and waterway corridors in DrainSenseAI are harvested from verified space agency Earth observations, meteorological services, and published Kaggle flood benchmarks.

| Data Layer | Source Agency | Resolution / Specs | Project Ground Truth | Official Dataset Hyperlink |
| :--- | :--- | :--- | :--- | :--- |
| **Digital Elevation Model (DEM)** | European Space Agency (ESA) & NASA SRTM | 30m Global DEM resampled to 500m centroids | 2,295 centroids: VJA (7m–246m), CHE (0m–110m AMSL) | [Copernicus DEM / Open-Meteo](https://open-meteo.com/en/docs/elevation-api) |
| **Topographic Gradient Slope** | 2D Finite-Difference $\nabla z$ | Physical slope in degrees ($0.0^\circ$ to $13.17^\circ$) | Derived directly from real Copernicus elevation matrix | [Manning Formula Ref](https://en.wikipedia.org/wiki/Manning_formula) |
| **Precipitation Telemetry** | ECMWF Copernicus ERA5 Reanalysis | Hourly cadence ($0.1\text{mm}$ precision) | 1,008 hours: Budameru 2024 (513.7mm) & Michaung 2023 (434.8mm) | [ERA5 Historical Archive](https://open-meteo.com/en/docs/historical-weather-api) |
| **Waterway Vector Network** | OpenStreetMap (OSM) Contributors | Sub-meter vector polyline centrelines | Krishna, Budameru, Ryves, Eluru, Adyar, Cooum, Buckingham | [OSM Overpass Turbo](https://overpass-turbo.eu/) |
| **Reservoir Ground Truth** | Kaggle Open Benchmark / CMWSSB | Daily storage (mcft) & outfall surges | Chembarambakkam, Poondi, Red Hills discharge | [Kaggle Chennai Water Dataset](https://www.kaggle.com/datasets/anuragkanaujia/chennai-water-management) |
| **Meteorological Archive** | Kaggle Open Benchmark / IMD | Decadal meteorological daily rainfall | Multi-decadal extreme precipitation benchmarks (1990–present) | [Kaggle Chennai Rainfall Series](https://www.kaggle.com/datasets/sudalairajkumar/chennai-rainfall-data) |
| **Satellite Flood Inundation** | ISRO NRSC Bhuvan Disaster Portal | 10m Sentinel-1 SAR radar backscatter | Observed flood footprints for Budameru (VJA) & Velachery (CHE) | [ISRO NRSC Flood Portal](https://bhuvan-app1.nrsc.gov.in/disaster/disaster.php?id=flood) |
| **Hydro-Physical Soil Curves** | USDA-NRCS Engineering Handbook | Hydrological Soil Groups A, B, C, D | SCS Curve Numbers (CN 68 to 92) and Potential Retention $S$ | [USDA-NRCS Handbook NEH-4](https://www.nrcs.usda.gov/resources/guides-and-instructions/national-engineering-handbook) |

---

## 3. Case Studies & Deployment Jurisdictions

### 1. Vijayawada / Amaravati (`VJA`), Andhra Pradesh
- **Grid Scale:** 810 deterministic 500m × 500m spatial cells (202.5 km²).
- **Critical Corridors:** Budameru Rivulet breach corridor, Krishna River / Prakasam Barrage (11.43 lakh cusecs capacity), Ryves & Eluru Canals.
- **Historic Validation:** August 20 – September 12, 2024 Budameru cloudburst (513.7mm cumulative, peak intensity 26.8 mm/h).

### 2. Chennai (`CHE`), Tamil Nadu
- **Grid Scale:** 1,485 deterministic 500m × 500m spatial cells (371.25 km²).
- **Critical Corridors:** Adyar River (Saidapet / Kotturpuram outfall), Cooum River, Buckingham Canal tidal backup, Pallikaranai Marshland basin.
- **Historic Validation:** November 25 – December 12, 2023 Cyclone Michaung (434.8mm cumulative, peak intensity 26.1 mm/h).

---

## 4. Machine Learning Benchmarks & Calibration

Trained on **776,890 spatiotemporal samples** using real Copernicus DEM, slope, and ERA5 rainfall features with 5-fold stratified cross-validation and Sigmoid probability calibration.

### Comparative Architecture Benchmark ($N = 155,378$ Holdout Test Records):

| Model Architecture | ROC-AUC | PR-AUC | F1-Score | Precision | Recall | Brier Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Calibrated XGBoost (DrainSense Production)** | **0.9823** | **0.9346** | **0.8508** | **81.46%** | **89.03%** | **0.0446** |
| Uncalibrated XGBoost (v1.0) | 0.9824 | 0.9350 | 0.8281 | 73.37% | 95.02% | 0.0553 |
| Random Forest (100 Trees) | 0.9805 | 0.9270 | 0.8199 | 72.19% | 94.86% | 0.0576 |
| Stratified Dummy Baseline | 0.4981 | 0.1973 | 0.1952 | 19.49% | 19.54% | 0.3190 |

### Holdout Confusion Matrix ($N = 155,378$):
- **True Negatives (TN):** $118,402$ (Dry cells correctly identified, Specificity: $95.00\%$)
- **False Positives (FP):** $6,229$ (False Alarm Rate: $5.00\%$)
- **False Negatives (FN):** $3,373$ (Missed Deluge Rate: $10.97\%$)
- **True Positives (TP):** $27,374$ (Flood Zones Detected, Sensitivity / Recall: $89.03\%$)

---

## 5. System Architecture

```
                    VERIFIED REAL-WORLD DATA SOURCES
    ┌───────────────────────────┼───────────────────────────┐
    │                           │                           │
Copernicus 30m Global DEM   ECMWF ERA5 Reanalysis    OpenStreetMap & Kaggle
(Open-Meteo Elevation API)   (Hourly Telemetry API)   (Overpass Vector Streams)
    │                           │                           │
    └───────────────────────────┼───────────────────────────┘
                                │
                                ▼
                   FEATURE EXTRACTION & TOPOLOGY
          (2,295 Grids @ 500m x 500m: 810 VJA, 1,485 CHE)
       (∇z Gradient Slope, Flow Accumulation, Canal Distance)
                                │
                                ▼
                 CALIBRATED MACHINE LEARNING CORE
             (models/drainsense_xgb_v1.joblib • Calibrated)
                                │
                                ▼
                 PHYSICS-INFORMED SCS-CN GUARDRAIL
             (HCI Mass-Balance Audit: NEH-4 Verification)
                                │
                                ▼
                TOPOLOGICAL CASCADE TRACER (DAHG)
             (Manning Open-Channel Velocity & D8 Lag)
                                │
                                ▼
                FASTAPI ASYNC BACKEND (PORT 8000)
         (/health, /risk, /simulate, /cascade, /optimize)
                                │
                                ▼
                 NEXT.JS 14 COMMAND CENTER (PORT 3000)
    (Live Map, TreeSHAP Attributions, What-If Slider, NDMA Form D-4)
```

---

## 6. Monorepo Directory Structure

```
DrainSense/
├── backend/
│   ├── app/
│   │   ├── api/endpoints.py           # REST endpoints (/cities, /risk, /cascade, /optimize)
│   │   ├── core/config.py             # App settings & environment bindings
│   │   ├── db/session.py              # SQLite / PostgreSQL engine
│   │   ├── schemas/risk.py            # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── cascade_tracer.py      # DAHG D8 topological cascade algorithm
│   │   │   ├── physics_guardrail.py   # USDA SCS-CN mass balance audit
│   │   │   └── resource_optimizer.py  # Integer Linear Programming pump solver
│   │   └── main.py                    # FastAPI application entrypoint
├── frontend/
│   ├── app/                           # Next.js 14 App Router (page.tsx, globals.css)
│   ├── components/
│   │   ├── RiskMap.tsx                # Google Maps 500m grid vector polygons
│   │   ├── DashboardControlPanel.tsx  # Integrated TreeSHAP & What-If panel
│   │   ├── DataSources.tsx            # Dedicated Data Provenance & Links view
│   │   ├── ModelAnalytics.tsx         # Benchmarks, calibration curves & confusion matrix
│   │   ├── ResourceOptimizerModal.tsx # Autonomous fleet dispatch optimizer
│   │   ├── JuryDemoModal.tsx          # 7-Step defense walkthrough modal
│   │   ├── LandingPage.tsx            # Cinematic public gateway
│   │   └── Navbar.tsx & Sidebar.tsx   # Opaque command navigation
│   └── lib/api.ts                     # TypeScript API client with offline fallback
├── data/
│   ├── raw/                           # Raw Copernicus DEM JSON & ERA5 hourly rainfall CSVs
│   └── processed/                     # Compiled 2,295 grid features & historical flood JSON
├── ml/
│   ├── src/inference/predictor.py     # Sub-15ms calibrated XGBoost inference engine
│   └── src/ingestion/                 # Data harvesting adapters
├── models/
│   ├── drainsense_xgb_v1.joblib       # Serialized production model artifact
│   └── drainsense_xgb_v1_metadata.json# Real training metrics and feature gain rankings
├── scripts/
│   ├── fetch_real_earth_data.py       # Harvests real Copernicus DEM & ERA5 telemetry
│   └── inject_real_earth_data.py      # Computes 2D finite-difference slopes
└── README.md
```

---

## 7. Quickstart Guide

### Prerequisites
- Python 3.11+ / 3.12
- Node.js 18+ and npm

### 1. Start FastAPI Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
# Health check: curl http://127.0.0.1:8000/health
```

### 2. Start Next.js Frontend
```bash
cd frontend
npm install
npm run build
npm run start -- -p 3000
# App available at http://localhost:3000
```

### 3. Reviewer / Evaluator Credentials
- **Username:** `Gaurav`
- **Password:** `DrainSense@2026`
- *(Or click the one-click **"Auto-Fill"** button on the command login modal).*

---

## 8. Academic Citation

For academic evaluations, major project dissertations, and technical reviews:

```bibtex
@misc{gautam2026drainsense,
  author = {Gautam, Gaurav},
  title = {DrainSenseAI: Physics-Informed Topological Cascade Nowcasting & Autonomous Equipment Dispatch for Urban Deluge Resilience},
  year = {2026},
  publisher = {Department of Computer Science & Engineering},
  howpublished = {\url{https://github.com/ggthedeveloper/DrainSenseAI}},
  note = {Validated on Copernicus 30m Global DEM & ECMWF ERA5 Telemetry for Vijayawada and Chennai}
}
```

---

## 9. License
MIT License. Developed for academic defense, municipal decision-support, and flood resilience research.
