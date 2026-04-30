from fastapi.testclient import TestClient

from app.main import app
from app.models import Candle, MarketData


client = TestClient(app)


def _market_data(source: str, symbol: str, currency: str = "USD") -> MarketData:
    return MarketData(
        source=source,
        symbol=symbol,
        name=symbol,
        type="OHLCV",
        timezone="UTC",
        currency=currency,
        candles=[Candle(time=1_700_000_000, open=1, high=2, low=1, close=2, volume=100)],
    )


def test_us_stock_route_passes_interval_to_yfinance(monkeypatch):
    import app.routers.us_stocks as router

    seen = {}

    def fake_yf(symbol, source, period="1y", interval="1d", currency="USD"):
        seen["symbol"] = symbol
        seen["source"] = source
        seen["period"] = period
        seen["interval"] = interval
        seen["currency"] = currency
        return _market_data(source, symbol)

    monkeypatch.setattr(router, "get_yf_ohlcv", fake_yf)
    monkeypatch.setattr(router.settings, "cache_ttl_seconds", 0)

    response = client.get("/us-stocks/NVDA?period=60d&interval=1h")

    assert response.status_code == 200
    assert seen == {"symbol": "NVDA", "source": "us_stocks", "period": "60d", "interval": "1h", "currency": "USD"}


def test_index_route_passes_interval_to_yfinance(monkeypatch):
    import app.routers.indices as router

    seen = {}

    def fake_yf(symbol, source, period="1y", interval="1d", currency="USD"):
        seen["symbol"] = symbol
        seen["source"] = source
        seen["period"] = period
        seen["interval"] = interval
        seen["currency"] = currency
        return _market_data(source, symbol, currency=currency)

    monkeypatch.setattr(router, "get_yf_ohlcv", fake_yf)
    monkeypatch.setattr(router.settings, "cache_ttl_seconds", 0)

    response = client.get("/indices/%5EGSPC?period=10y&interval=1mo")

    assert response.status_code == 200
    assert seen == {"symbol": "^GSPC", "source": "global_indices", "period": "10y", "interval": "1mo", "currency": "USD"}


def test_korean_index_route_overrides_currency_to_points(monkeypatch):
    import app.routers.indices as router

    seen = {}

    def fake_yf(symbol, source, period="1y", interval="1d", currency="USD"):
        seen["symbol"] = symbol
        seen["currency"] = currency
        return _market_data(source, symbol, currency=currency)

    monkeypatch.setattr(router, "get_yf_ohlcv", fake_yf)
    monkeypatch.setattr(router.settings, "cache_ttl_seconds", 0)

    response = client.get("/indices/%5EKS11")

    assert response.status_code == 200
    body = response.json()
    assert seen == {"symbol": "^KS11", "currency": "POINT"}
    assert body["currency"] == "POINT"
    assert body["name"] == "KOSPI Composite Index"


def test_korean_index_route_overrides_fallback_currency_to_points(monkeypatch):
    import app.routers.indices as router

    def fail_yf(*args, **kwargs):
        raise RuntimeError("yfinance unavailable")

    monkeypatch.setattr(router, "get_yf_ohlcv", fail_yf)
    monkeypatch.setattr(router.settings, "cache_ttl_seconds", 0)

    response = client.get("/indices/%5EKS11")

    assert response.status_code == 200
    body = response.json()
    assert body["symbol"] == "^KS11"
    assert body["currency"] == "POINT"
    assert body["name"] == "KOSPI Composite Index"


def test_foreign_index_route_keeps_usd_currency(monkeypatch):
    import app.routers.indices as router

    seen = {}

    def fake_yf(symbol, source, period="1y", interval="1d", currency="USD"):
        seen["symbol"] = symbol
        seen["currency"] = currency
        return _market_data(source, symbol, currency=currency)

    monkeypatch.setattr(router, "get_yf_ohlcv", fake_yf)
    monkeypatch.setattr(router.settings, "cache_ttl_seconds", 0)

    response = client.get("/indices/%5EGSPC")

    assert response.status_code == 200
    assert seen == {"symbol": "^GSPC", "currency": "USD"}
    assert response.json()["currency"] == "USD"
