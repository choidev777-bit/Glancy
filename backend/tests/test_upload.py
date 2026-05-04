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


def _make_composite_portfolio() -> pd.DataFrame:
    holdings = [
        ("삼성전자", "KRW", 0.25),
        ("AAPL", "USD", 0.20),
        ("MSFT", "USD", 0.18),
        ("SPY", "USD", 0.22),
        ("BTC", "USD", 0.07),
        ("GLD", "USD", 0.08),
    ]
    rows = []
    for asset, currency, weight in holdings:
        rows.append({"section": "portfolio_weight", "asset": asset, "date": "", "metric": "weight", "value": weight, "currency": currency})
        rows.append({"section": "fundamental", "asset": asset, "date": "", "metric": "foundation_score", "value": 70, "currency": ""})
        for offset, close in enumerate((100, 102, 101, 105, 108)):
            date = pd.Timestamp("2025-01-01") + pd.Timedelta(days=offset)
            rows.append({"section": "price", "asset": asset, "date": date.date().isoformat(), "metric": "close", "value": close, "currency": currency})
            rows.append({"section": "return", "asset": asset, "date": date.date().isoformat(), "metric": "daily_return", "value": 0.01, "currency": currency})
            for metric, value in {"open": close - 1, "high": close + 2, "low": close - 2, "close": close, "volume": 1000}.items():
                rows.append({"section": "ohlcv", "asset": asset, "date": date.date().isoformat(), "metric": metric, "value": value, "currency": currency})
    rows.append({"section": "metadata", "asset": "portfolio", "date": "", "metric": "base_currency", "value": "KRW", "currency": ""})
    rows.append({"section": "metadata", "asset": "portfolio", "date": "", "metric": "display_currency", "value": "USD", "currency": ""})
    return pd.DataFrame(rows)


def test_detect_types():
    assert detect_type(_make_composite_portfolio()) == "composite_portfolio"
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


def test_upload_composite_portfolio():
    response = client.post("/upload/", files={"file": ("composite.csv", _csv(_make_composite_portfolio()), "text/csv")})
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "composite_portfolio"
    assert body["summary"]["title"] == "종합 포트폴리오 분석"
    assert body["summary"]["assets"] == ["삼성전자", "AAPL", "MSFT", "SPY", "BTC", "GLD"]
    assert body["portfolio"]["n_holdings"] == 6
    assert body["portfolio"]["total_weight"] == 1
    assert body["performance"]["cumulative_return"] > 0
    assert "analysis" in body["insights"]
    assert body["data_quality"]["sections"]["portfolio_weight"] == 6


def test_upload_samples_manifest():
    response = client.get("/upload/samples")
    assert response.status_code == 200
    samples = response.json()
    sample_ids = {sample["id"] for sample in samples}
    assert sample_ids == {
        "ohlcv-csv",
        "portfolio-csv",
        "multi-asset-csv",
        "returns-csv",
        "price-series-csv",
        "ohlcv-json",
        "composite-portfolio-csv",
    }
    assert all({"id", "label", "format", "data_type", "description"}.issubset(sample) for sample in samples)


def test_upload_sample_each_supported_type():
    expected = {
        "ohlcv-csv": "OHLCV",
        "portfolio-csv": "portfolio",
        "multi-asset-csv": "multi_asset",
        "returns-csv": "returns",
        "price-series-csv": "price_series",
        "composite-portfolio-csv": "composite_portfolio",
    }
    for sample_id, data_type in expected.items():
        response = client.get(f"/upload/samples/{sample_id}")
        assert response.status_code == 200
        assert response.json()["type"] == data_type


def test_upload_sample_json_uses_json_path():
    response = client.get("/upload/samples/ohlcv-json")
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "OHLCV"
    assert body["market_data_summary"]["n_candles"] >= 30


def test_upload_sample_unknown_returns_404():
    response = client.get("/upload/samples/not-found")
    assert response.status_code == 404


def test_composite_portfolio_sample_has_dashboard_sections():
    response = client.get("/upload/samples/composite-portfolio-csv")
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "composite_portfolio"
    assert set(body.keys()) >= {"summary", "portfolio", "performance", "risk", "allocation", "assets", "insights", "data_quality"}
    assert [asset["ticker"] for asset in body["assets"]] == ["삼성전자", "AAPL", "MSFT", "SPY", "BTC", "GLD"]


def test_price_series_sample_has_drawdown_data():
    response = client.get("/upload/samples/price-series-csv")
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "price_series"
    assert "max_drawdown" in body["analysis"]


def test_price_based_samples_include_price_points_for_visualization():
    for sample_id in ("ohlcv-csv", "price-series-csv"):
        response = client.get(f"/upload/samples/{sample_id}")
        assert response.status_code == 200
        points = response.json()["analysis"]["price_points"]
        assert len(points) >= 30
        assert {"time", "open", "high", "low", "close"}.issubset(points[0])
