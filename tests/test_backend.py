"""
Integration and unit tests for DrainSense India FastAPI backend.
"""

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
    assert data["total_grids"] >= 810  # 5,827 total across 4 cities (810 for VJA)
    assert data["model_loaded"] is True

def test_cities_endpoint():
    response = client.get("/api/v1/cities")
    assert response.status_code == 200
    cities = response.json()
    assert len(cities) >= 12
    assert any(c["city_id"] == "VJA" for c in cities)
    assert any(c["city_id"] == "DEL" for c in cities)
    assert any(c["city_id"] == "HYD" for c in cities)
    assert any(c["city_id"] == "PAT" for c in cities)

def test_current_risk_summary():
    response = client.get("/api/v1/risk/current")
    assert response.status_code == 200
    data = response.json()
    assert "monitored_city" in data
    assert data["total_grids"] == 810
    assert "highest_risk_zone" in data

def test_risk_map_geojson():
    response = client.get("/api/v1/risk/map?rain_24h=145.0")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "geojson" in data
    assert data["geojson"]["type"] == "FeatureCollection"
    assert len(data["geojson"]["features"]) == 810
    first = data["geojson"]["features"][0]["properties"]
    assert "grid_id" in first
    assert "risk_level" in first
    assert "risk_score" in first

def test_zone_detail_and_explanation():
    response = client.get("/api/v1/risk/VJA_0001?rain_24h=145.0")
    assert response.status_code == 200
    data = response.json()
    assert data["grid_id"] == "VJA_0001"
    assert "top_factors" in data
    assert len(data["top_factors"]) > 0
    assert "recommended_actions" in data

def test_predict_custom():
    payload = {
        "grid_id": "VJA_0036",
        "rain_1h_mm": 25.0,
        "rain_3h_mm": 45.0,
        "rain_6h_mm": 70.0,
        "rain_24h_mm": 150.0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["grid_id"] == "VJA_0036"
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
    assert "feature_importances" in data

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
            "city_id": "DEL",
            "query": "What are the priority underpass closures in Delhi?",
            "current_rainfall_24h_mm": 160.0
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["city_id"] == "DEL"
    assert "ai_situation_assessment" in data
    assert len(data["tactical_recommendations"]) >= 1
    assert len(data["critical_infrastructure_alerts"]) >= 1
