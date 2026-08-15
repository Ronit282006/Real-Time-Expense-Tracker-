from fastapi.testclient import TestClient

from app.main import app


def test_root():
    with TestClient(app) as client:
        response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


def test_health_check_reports_status():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code in (200, 503)
    body = response.json()
    assert body["status"] in ("ok", "degraded")
    assert body["database"] in ("ok", "unavailable")
    assert body["env"] in ("development", "production", "test")
