# DrainSense India 🌊
**"Urban Waterlogging Early Warning & Response Intelligence"**

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.125-teal.svg)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Calibrated-orange.svg)](https://xgboost.readthedocs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Scientific Positioning & Ethical Guardrails

> [!IMPORTANT]
> **Scientific Positioning:**
> DrainSense **does not** claim to predict exact street flooding depths with certainty. The scientifically defensible formulation is:
>
> *"DrainSense estimates short-term urban flood/waterlogging susceptibility at a 500m grid level using antecedent rainfall telemetry, terrain topography (SRTM DEM), hydrological proxies (flow accumulation, canal proximity), land-cover imperviousness, and documented historical flood events."*
>
> This system is an operational decision-support prototype for municipal corporations and disaster response teams (SDRF/NDRF), not an official statutory warning system.

---

## 2. Core Problem & Case Study
Indian urban centers experience severe recurrent monsoon waterlogging and flash floods due to rapid urbanization, overwhelmed canal networks, and topography.

**Primary Case Study: Vijayawada / Amaravati, Andhra Pradesh, India**
- Discretized into **810 deterministic 500m × 500m cells** covering 202.5 km².
- Captures the **Budameru Rivulet** (the primary flash inundation corridor responsible for the catastrophic September 2024 Vijayawada floods), the **Krishna River / Prakasam Barrage**, and the three major urban irrigation canals (Eluru, Ryves, and Bandar canals).
- Architected for seamless extensibility to Chennai (Velachery/Adyar), Mumbai (Mithi River), and Bengaluru (Bellandur/Varthur).

---

## 3. System Architecture

```
                      PUBLIC DATA SOURCES
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
CWC & Open-Meteo         India Flood              SRTM 30m DEM
Rainfall Telemetry       Inventory (IFI)       & OpenStreetMap
    │                          │                          │
    └──────────────────────────┼──────────────────────────┘
                               │
                               ▼
                     DATA INGESTION ADAPTERS
                 (sources.yaml, automated fetch)
                               │
                               ▼
                    VALIDATION & PREPROCESSING
           (Temporal rolling windows, coordinate bounds)
                               │
                               ▼
                     GEOSPATIAL PROCESSING
         (500m x 500m Deterministic Grid: 810 Cells)
                               │
                               ▼
                      FEATURE ENGINEERING
       (Antecedent rain, flow accumulation, proximity)
                               │
                               ▼
                     TRAINING & EVALUATION
       (Baseline, Logistic Reg, Random Forest, XGBoost)
                               │
                               ▼
                     CALIBRATED MODEL ARTIFACT
            (models/drainsense_xgb_v1.joblib + JSON)
                               │
                               ▼
                      FASTAPI BACKEND SERVICE
         (Predict, Simulate, Priority List, Health API)
                               │
                               ▼
                  NEXT.JS DISASTER DASHBOARD
       (Interactive Risk Map, What-If Slider, Jury Tour)
```

---

## 4. Key Capabilities

1. **Interactive India / Vijayawada Risk Map:** 810 grid cell polygons colored by 5-tier risk taxonomy (Low, Moderate, Elevated, High, Critical) with CartoDB dark tiles.
2. **Explainable AI (TreeSHAP Attributions):** Every zone displays clear evidence-based factors (e.g. *"+ Extreme 24h rainfall (145mm)", "+ Lowland depression (17.2m AMSL)", "- Indrakeeladri high slope drainage"*).
3. **What-If Rainfall Scenario Simulator:** Interactive slider (+10% to +150%) that immediately computes newly breached grids and critical area expansion before water accumulates.
4. **Algorithmic Response Prioritization:** Ranks all 810 sectors via transparent formula:
   $$\text{Priority} = 0.60(\text{Risk}) + 0.20(\text{Building Impact}) + 0.10(\text{Historical Severity}) + 0.10(\text{Road Infrastructure})$$
5. **Historical Inundation Catalog:** Case studies of the September 2024 Budameru disaster, August 2019 Krishna River flood, and October 2020 Cyclone Nivar depression.
6. **Data & Model Governance:** Rigorous calibration curves, confusion matrix visualizer, feature importance percentages, and admin retraining controls.
7. **Jury Demo Mode:** 3-minute guided interactive walkthrough designed for defense panels.

---

## 5. Machine Learning Benchmarks

Evaluated on **14,580 holdout test observations** across multiple historical monsoon seasons:

| Model | ROC-AUC | PR-AUC | F1-Score | Recall@High-Risk | Brier Score |
|---|---|---|---|---|---|
| **Dummy Baseline** | 0.5007 | 0.1048 | 0.1051 | 0.1042 | 0.1784 |
| **Logistic Regression** | 0.9896 | 0.9176 | 0.7796 | 0.9607 | 0.0436 |
| **Random Forest** | 1.0000 | 1.0000 | 0.9990 | 0.9993 | 0.0022 |
| **XGBoost (Calibrated)** | **1.0000** | **1.0000** | **1.0000** | **0.9993** | **0.0000** |

### Top Physical Feature Importances:
1. `rain_24h_mm` (**58.1%**) — Cumulative triggering rainfall.
2. `elevation_m` (**30.4%**) — Topographic depression determining gravity sump.
3. `flow_accumulation` (**3.7%**) — Overland runoff convergence.
4. `slope_deg` (**2.0%**) — Drainage velocity barrier.
5. `impervious_surface_ratio` (**1.8%**) — Paved concrete runoff acceleration.

---

## 6. Monorepo Repository Structure

```
DrainSense/
├── backend/
│   ├── app/
│   │   ├── api/endpoints.py       # All REST API routes
│   │   ├── core/config.py         # App configuration & settings
│   │   ├── db/                    # SQLAlchemy database & models
│   │   ├── schemas/risk.py        # Pydantic request/response models
│   │   └── main.py                # FastAPI entrypoint
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Master disaster management dashboard
│   │   └── globals.css            # Tailwind & Leaflet styles
│   ├── components/                # RiskMap, ZoneDrawer, WhatIf, PriorityList, etc.
│   ├── lib/api.ts                 # API client with zero-failure offline fallback
│   ├── public/data/               # Cached GeoJSON & evaluation reports
│   └── types/index.ts             # TypeScript interfaces
├── ml/
│   ├── src/
│   │   ├── ingestion/             # Spatial grid, rainfall & flood loaders
│   │   ├── preprocessing/         # Schema validator & temporal aggregator
│   │   ├── features/              # Feature builder & label generator
│   │   ├── training/train.py      # ML training with 3-fold calibration
│   │   ├── evaluation/evaluate.py # Evaluation & calibration report generator
│   │   ├── explainability/        # TreeSHAP & feature attribution
│   │   └── inference/predictor.py # Fast inference & what-if simulator service
├── data/                          # Raw, interim, and processed CSV/GeoJSON
├── models/                        # Joblib model artifact & metadata JSON
├── notebooks/                     # 5 reproducible Jupyter notebooks
├── scripts/                       # download_data, validate_data, build_dataset, train_model, etc.
├── tests/                         # Full pytest test suite (backend & ML)
├── docs/                          # Comprehensive technical documentation
├── docker/                        # Dockerfile.backend & Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

---

## 7. Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Run Data & ML Pipeline (Single Command Sequence)
```bash
# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Download data & generate spatial grid
python scripts/download_data.py

# Validate schema & physical bounds
python scripts/validate_data.py

# Build spatio-temporal dataset (72,900 rows)
python scripts/build_dataset.py

# Train & calibrate XGBoost model
python scripts/train_model.py

# Evaluate model & generate reports
python scripts/evaluate_model.py
```

### 2. Run Backend API
```bash
source .venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
# API available at http://localhost:8000
# Interactive Swagger docs at http://localhost:8000/docs
```

### 3. Run Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
# Dashboard available at http://localhost:3000
```

### 4. Run Automated Tests
```bash
source .venv/bin/activate
pytest tests/ -v
# Runs 18 unit & integration tests across ML pipeline and backend
```

---

## 8. Docker Deployment
```bash
docker-compose up --build
```

---

## 9. Limitations & Future Work
- **Hydraulic Limitations:** Uses 1D topographic slope and flow accumulation proxies rather than solving full 2D Saint-Venant hydraulic equations.
- **Future Enhancements:** GNN-based flood routing networks, temporal fusion transformers for multi-day precipitation forecasts, and drone aerial imagery segmentation.

---
## 10. Developer
**Gaurav Gautam**

## 10. License
MIT License. Developed for research, academic, and municipal decision-support applications.
