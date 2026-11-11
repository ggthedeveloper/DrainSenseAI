"""
Integration and unit tests for DrainSense India FastAPI backend.
"""

import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["HEALTHY", "DEGRADED"]
    assert data["database"] == "CONNECTED"
    assert data["total_grids"] == 1100
    assert data["model_loaded"] is True
    assert data["model_version"] == "2.0"
    assert data["latest_data_timestamp"] == "2025-10-30"

def test_cities_endpoint():
    response = client.get("/api/v1/cities")
    assert response.status_code == 200
    cities = response.json()
    assert len(cities) == 1
    assert cities[0]["city_id"] == "VJA"
    assert cities[0]["status"] == "VERIFIED_REAL_DATA"

def test_current_risk_summary():
    response = client.get("/api/v1/risk/current")
    assert response.status_code == 200
    data = response.json()
    assert "monitored_city" in data
    assert data["total_grids"] == 1100
    assert data["current_rainfall_24h_mm"] == 34.0
    assert data["rainfall_source"] == "data/processed/vijayawada_event_telemetry.csv"
    assert "highest_risk_zone" in data

def test_risk_map_geojson():
    response = client.get("/api/v1/risk/map?rain_24h=145.0")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "geojson" in data
    assert data["geojson"]["type"] == "FeatureCollection"
    assert len(data["geojson"]["features"]) == 1100
    first = data["geojson"]["features"][0]["properties"]
    assert first["grid_id"].startswith("VJA250_")
    assert "risk_level" in first
    assert "risk_score" in first

def test_zone_detail_and_explanation():
    response = client.get("/api/v1/risk/VJA250_R7287_C1850?rain_24h=145.0")
    assert response.status_code == 200
    data = response.json()
    assert data["grid_id"] == "VJA250_R7287_C1850"
    assert "top_factors" in data
    assert len(data["top_factors"]) > 0
    assert "recommended_actions" in data

def test_predict_custom():
    payload = {
        "grid_id": "VJA250_R7287_C1850",
        "rain_1h_mm": 25.0,
        "rain_3h_mm": 45.0,
        "rain_6h_mm": 70.0,
        "rain_24h_mm": 150.0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["grid_id"] == "VJA250_R7287_C1850"
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_level"] in ["LOW", "MODERATE", "ELEVATED", "HIGH", "CRITICAL"]

def test_what_if_simulation():
    payload = {
        "multiplier": 1.5,
        "base_rain_1h_mm": 20.0,
        "base_rain_3h_mm": 40.0,
        "base_rain_6h_mm": 60.0,
        "base_rain_24h_mm": 120.0
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "simulation_scenario" in data
    assert "baseline_summary" in data
    assert "scenario_summary" in data
    assert "impact_deltas" in data

def test_historical_events():
    response = client.get("/api/v1/historical-events")
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 3
    assert any("Budameru" in e["title"] for e in events)

def test_model_info():
    response = client.get("/api/v1/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "model_version" in data
    assert "thresholds" in data
    assert data["training_timestamp"] == "2026-11-11T10:57:15Z"
    evaluation = client.get("/api/v1/statistics").json()["evaluation"]
    assert evaluation["roc_auc"] == 0.992
    assert evaluation["pr_auc"] == 0.9752
    assert evaluation["brier_score"] == 0.0638
    assert evaluation["evaluation_samples"] == 17600
    assert evaluation["feature_importances"][0]["feature"] == "rain_24h_mm"
    assert evaluation["confusion_matrix"] == {"tn": 11641, "fp": 58, "fn": 759, "tp": 5142}
    assert evaluation["benchmarks"][-1]["name"] == "Calibrated XGBoost (Production)"
    assert evaluation["benchmarks"][-1]["highlight"] is True

def test_priority_zones():
    response = client.get("/api/v1/risk/priority-zones?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["zones"]) == 5
    first = data["zones"][0]
    assert "priority_score" in first
    assert "suggested_action" in first

def test_admin_auth():
    # Unauthorized
    r_unauth = client.post("/admin/refresh-data")
    assert r_unauth.status_code in [401, 404]
    
    # Authorized
    r_auth = client.post(
        "/api/v1/admin/refresh-data",
        headers={"X-Admin-Token": "drainsense_admin_secure_key_2026"}
    )
    assert r_auth.status_code == 200
    assert r_auth.json()["success"] is True

def test_ai_copilot_endpoint():
    response = client.post(
        "/api/v1/ai/copilot",
        json={
            "city_id": "VJA",
            "query": "Which wards should the desk inspect first?",
            "current_rainfall_24h_mm": 160.0
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["city_id"] == "VJA"
    assert "810" not in json.dumps(data)
    assert "ai_situation_assessment" in data
    assert len(data["tactical_recommendations"]) >= 1
    assert len(data["critical_infrastructure_alerts"]) >= 1

def test_auth_login_removed():
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "anyone", "password": "not-used", "role": "Administrator"}
    )
    assert res.status_code == 404

def test_drain_assets_empty_without_register():
    res = client.get("/api/v1/assets")
    assert res.status_code == 200
    assert res.json() == []

def test_alerts_empty_without_live_feed():
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    assert res.json() == []
    missing = client.post("/api/v1/alerts/does-not-exist/acknowledge")
    assert missing.status_code == 404

def test_novel_hydrology_cascade():
    res = client.get("/api/v1/hydrology/cascade/VJA250_R7287_C1850?rain_24h=145.0")
    assert res.status_code == 200
    data = res.json()
    assert "cascade_path" in data
    assert len(data["cascade_path"]) >= 1
    assert "terminal_sink" in data
    assert "initial_spillover_volume_m3" in data

def test_novel_hydrology_physics_audit():
    res = client.get("/api/v1/hydrology/physics-audit/VJA250_R7287_C1850?rain_24h=145.0")
    assert res.status_code == 200
    data = res.json()
    assert "concordance_pct" in data
    assert "scs_metrics" in data
    assert "curve_number" in data["scs_metrics"]
    assert "runoff_volume_m3" in data["scs_metrics"]

def test_novel_hydrology_nowcast():
    res = client.get("/api/v1/hydrology/nowcast/VJA?rain_24h=145.0")
    assert res.status_code == 200
    data = res.json()
    assert "timeline" in data
    assert len(data["timeline"]) == 5
    first_step = data["timeline"][0]
    assert "horizon_hours" in first_step
    assert "cell_states" in first_step

def test_novel_operations_dispatch_optimizer():
    res = client.post("/api/v1/operations/optimize-dispatch", json={"city_id": "VJA"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "OPTIMIZATION_SUCCESS"
    assert "memorandum_id" in data
    assert "summary" in data
    assert "ndma_memo_text" in data
    assert "allocations" in data
    assert isinstance(data["allocations"], list)


