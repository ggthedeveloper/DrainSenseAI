# DrainSense India — REST API Documentation

The DrainSense API is built with FastAPI and runs on port 8000. Interactive Swagger documentation is available at `http://localhost:8000/docs`.

## Endpoints

### 1. System Health
- **`GET /health`**
  - Response: System status, database connection, model version, total monitored grid count, and telemetry freshness.

### 2. Metadata & Registry
- **`GET /api/v1/cities`**
  - Response: List of configured Indian cities (Vijayawada / Amaravati active, plus Chennai, Mumbai, Bengaluru).
- **`GET /api/v1/zones?city_id=VJA`**
  - Response: List of named wards in the active case study.

### 3. Risk Inference & GeoJSON
- **`GET /api/v1/risk/current`**
  - Response: Overview KPI summary of current risk distribution.
- **`GET /api/v1/risk/map?rain_24h=145.0`**
  - Response: Complete GeoJSON FeatureCollection with 810 grid cell polygons and attached risk scores.
- **`GET /api/v1/risk/{grid_id}`**
  - Response: Comprehensive breakdown for a single 500m cell including terrain, antecedent rainfall, TreeSHAP factors, and municipal action items.
- **`GET /api/v1/risk/priority-zones?limit=10`**
  - Response: Algorithmically ranked response list.
- **`POST /api/v1/predict`**
  - Body: JSON containing custom rainfall parameters (`rain_1h_mm`, `rain_3h_mm`, `rain_6h_mm`, `rain_24h_mm`).
  - Response: Risk probability, score, alert level, and top factors.

### 4. What-If Simulation
- **`POST /api/v1/simulate`**
  - Body: `{ "multiplier": 1.25, "base_rain_24h_mm": 145.0 }`
  - Response: Newly escalated zones, delta in critical area, and list of newly breached wards.

### 5. Historical Intelligence & Governance
- **`GET /api/v1/historical-events`**
  - Response: Catalog of documented Krishna/Budameru flood events.
- **`GET /api/v1/model/info`**
  - Response: Active model version, training timestamp, and feature importances.
- **`GET /api/v1/statistics`**
  - Response: Confusion matrix and calibration curve points.

### 6. Admin Endpoints (Requires `X-Admin-Token` header)
- **`POST /api/v1/admin/retrain`**
- **`POST /api/v1/admin/refresh-data`**
