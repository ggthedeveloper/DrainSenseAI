# DrainSense India — Architecture & System Design

## 1. System Philosophy & Purpose
DrainSense India is a scientifically grounded, decision-support early-warning system engineered for municipal engineers, disaster response teams (SDRF/NDRF), and urban planners. It provides 500m grid-level waterlogging and flood risk estimations by marrying antecedent precipitation telemetry, terrain topography (SRTM DEM), hydrological proxy parameters, and historical inundation footprints.

## 2. End-to-End Architectural Data Flow

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

## 3. Data Layers & Spatial Granularity
- **Discretization:** 500m × 500m spatial cells across Vijayawada Municipal Corporation (VMC) and Amaravati capital region (16.45°N - 16.57°N, 80.56°E - 80.70°E). Total grid cells: **810 cells** covering 202.5 km².
- **Coordinate Reference System:** EPSG:4326 (WGS84) with standardized metric calculations via Haversine and geodesic line projections.

## 4. Technology Stack Justification
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Leaflet for zero-cost tile rendering, Recharts for model calibration curves, Lucide icons.
- **Backend:** FastAPI for asynchronous, high-throughput REST APIs, Pydantic for strict schema validation, SQLAlchemy for persistent logging.
- **Machine Learning:** Scikit-Learn pipelines, XGBoost with class weighting, 3-fold cross-validated sigmoid probability calibration, and TreeSHAP explainability.
