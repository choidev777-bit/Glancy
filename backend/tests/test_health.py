from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["fallback_enabled"] is True
    assert body["deployment"]["provider"] == "railway"
    assert body["deployment"]["healthcheck_path"] == "/health"
    assert "http://localhost:5173" in body["allowed_origins"]
    assert set(body["services"]) >= {"pykrx", "yfinance", "binance", "coingecko"}
