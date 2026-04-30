import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.upload.detector import detect_type

client = TestClient(app)


def _csv(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode()


def _make_ohlcv(n: int = 80) -> bytes:
    dates = pd.date_range("2025-01-01", periods=n)
    base = pd.Series(range(n)) + 100
    return _csv(
        pd.DataFrame(
            {
                "Date": dates,
                "Open": base,
                "High": base + 1,
                "Low": base - 1,
                "Close": base + 0.5,
                "Volume": 1000,
            }
        )
    )


def test_detect_types():
    assert detect_type(pd.DataFrame(columns=["Date", "Open", "High", "Low", "Close"])) == "OHLCV"
    assert detect_type(pd.DataFrame(columns=["Ticker", "Weight"])) == "portfolio"
    assert detect_type(pd.DataFrame(columns=["Date", "AAPL", "MSFT", "GOOG"])) == "multi_asset"
    assert detect_type(pd.DataFrame(columns=["Date", "Return"])) == "returns"
    assert detect_type(pd.DataFrame(columns=["Date", "Close"])) == "price_series"


def test_upload_ohlcv():
    response = client.post("/upload/", files={"file": ("ohlcv.csv", _make_ohlcv(), "text/csv")})
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "OHLCV"
    assert "analysis" in body


def test_upload_portfolio():
    df = pd.DataFrame({"Ticker": ["AAPL", "MSFT", "GOOG"], "Weight": [0.5, 0.3, 0.2]})
    response = client.post("/upload/", files={"file": ("portfolio.csv", _csv(df), "text/csv")})
    assert response.status_code == 200
    assert response.json()["type"] == "portfolio"


def test_upload_returns():
    df = pd.DataFrame({"Date": pd.date_range("2025-01-01", periods=60), "Return": [0.01] * 60})
    response = client.post("/upload/", files={"file": ("returns.csv", _csv(df), "text/csv")})
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "returns"
    assert "sharpe_ratio" in body["analysis"]

