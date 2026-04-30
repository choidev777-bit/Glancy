from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models import Candle, MarketData, StockQuote
from app.sources import kiwoom_source


client = TestClient(app)


def test_kiwoom_configuration_reports_missing_env(monkeypatch):
    monkeypatch.setattr(settings, "kiwoom_app_key", "")
    monkeypatch.setattr(settings, "kiwoom_app_secret", "")
    monkeypatch.setattr(settings, "kiwoom_api_base_url", "")

    assert kiwoom_source.get_kiwoom_status() == "missing_env"


def test_kiwoom_quote_normalizes_basic_info_response():
    raw = {
        "stk_cd": "005930",
        "stk_nm": "삼성전자",
        "cur_prc": "+71400",
        "pred_pre": "+1600",
        "flu_rt": "+2.34",
        "trde_qty": "12450231",
        "mac": "426000000000000",
        "oyr_hgst": "+73000",
        "oyr_lwst": "-55000",
    }

    quote = kiwoom_source.normalize_quote("005930", raw)

    assert quote.symbol == "005930"
    assert quote.name == "삼성전자"
    assert quote.price == 71400
    assert quote.change == 1600
    assert quote.change_percent == 2.34
    assert quote.volume == 12450231
    assert quote.market_cap == 426000000000000
    assert quote.high52 == 73000
    assert quote.low52 == 55000
    assert quote.meta["source_name"] == "kiwoom"


def test_kr_quote_endpoint_returns_kiwoom_quote(monkeypatch):
    monkeypatch.setattr(
        kiwoom_source,
        "get_kiwoom_quote",
        lambda ticker: StockQuote(
            symbol=ticker,
            name="삼성전자",
            price=71400,
            change=1600,
            change_percent=2.34,
            volume=12450231,
            market_cap=None,
            currency="KRW",
            meta={"data_status": "live", "source_name": "kiwoom"},
        ),
    )

    response = client.get("/kr-stocks/005930/quote")

    assert response.status_code == 200
    body = response.json()
    assert body["symbol"] == "005930"
    assert body["price"] == 71400
    assert body["meta"]["source_name"] == "kiwoom"


def test_kr_stock_route_prefers_kiwoom_in_auto_mode(monkeypatch):
    monkeypatch.setattr(settings, "kiwoom_provider_mode", "auto")
    monkeypatch.setattr(kiwoom_source, "is_kiwoom_configured", lambda: True)
    monkeypatch.setattr(
        kiwoom_source,
        "get_kiwoom_ohlcv",
        lambda ticker, interval="1d", days=365: MarketData(
            source="kr_stocks",
            symbol=ticker,
            name="삼성전자",
            type="OHLCV",
            timezone="KST",
            currency="KRW",
            candles=[Candle(time=1_700_000_000, open=1, high=2, low=1, close=2, volume=100)],
            meta={"data_status": "live", "source_name": "kiwoom"},
        ),
    )

    response = client.get("/kr-stocks/005930")

    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["source_name"] == "kiwoom"


def test_kr_stock_route_falls_back_to_pykrx_when_kiwoom_chart_fails(monkeypatch):
    monkeypatch.setattr(settings, "kiwoom_provider_mode", "auto")
    monkeypatch.setattr(settings, "cache_ttl_seconds", 0)
    monkeypatch.setattr(kiwoom_source, "is_kiwoom_configured", lambda: True)
    monkeypatch.setattr(
        kiwoom_source,
        "get_kiwoom_ohlcv",
        lambda ticker, interval="1d", days=365: (_ for _ in ()).throw(RuntimeError("kiwoom down")),
    )

    import app.routers.kr_stocks as kr_router

    monkeypatch.setattr(
        kr_router,
        "get_kr_stock_ohlcv",
        lambda ticker, days=365, interval="1d": MarketData(
            source="kr_stocks",
            symbol=ticker,
            name="엑스게이트",
            type="OHLCV",
            timezone="KST",
            currency="KRW",
            candles=[Candle(time=1_700_000_000, open=10, high=12, low=9, close=11, volume=100)],
        ),
    )

    response = client.get("/kr-stocks/356680")

    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["source_name"] == "pykrx"


def test_kr_quote_failure_is_unavailable_not_sample(monkeypatch):
    monkeypatch.setattr(kiwoom_source, "get_kiwoom_quote", lambda ticker: (_ for _ in ()).throw(RuntimeError("kiwoom down")))

    response = client.get("/kr-stocks/356680/quote")

    assert response.status_code == 200
    body = response.json()
    assert body["price"] is None
    assert body["meta"]["data_status"] == "unavailable"
    assert body["meta"]["source_name"] == "quote_unavailable"


def test_kiwoom_daily_chart_filters_to_calendar_days(monkeypatch):
    monkeypatch.setattr(kiwoom_source, "get_access_token", lambda: "token")

    def fake_post(*args, **kwargs):
        class Response:
            def raise_for_status(self):
                return None

            def json(self):
                return {
                    "stk_nm": "엑스게이트",
                    "output": [
                        {"dt": "20260429", "open_pric": "6000", "high_pric": "7000", "low_pric": "6000", "cur_prc": "6500", "trde_qty": "10"},
                        {"dt": "20241031", "open_pric": "4500", "high_pric": "5000", "low_pric": "4345", "cur_prc": "4600", "trde_qty": "10"},
                    ],
                }

        return Response()

    monkeypatch.setattr(kiwoom_source.requests, "post", fake_post)

    data = kiwoom_source.get_kiwoom_daily_ohlcv("356680", days=365)

    assert len(data.candles) == 1
    assert data.candles[0].low == 6000


def test_kiwoom_interval_chart_uses_matching_api_id(monkeypatch):
    monkeypatch.setattr(kiwoom_source, "get_access_token", lambda: "token")
    calls = []

    def fake_post(api_id, endpoint, body):
        calls.append((api_id, endpoint, body))
        return {
            "stk_nm": "Samsung Electronics",
            "output": [
                {
                    "cntr_tm": "20260430103000",
                    "open_pric": "70000",
                    "high_pric": "71000",
                    "low_pric": "69000",
                    "cur_prc": "70500",
                    "trde_qty": "100",
                }
            ],
        }

    monkeypatch.setattr(kiwoom_source, "_post", fake_post)

    data = kiwoom_source.get_kiwoom_ohlcv("005930", interval="1h")

    assert calls == [
        (
            "ka10080",
            "/api/dostk/chart",
            {"stk_cd": "005930", "tic_scope": "60", "upd_stkpc_tp": "1"},
        )
    ]
    assert data.candles[0].close == 70500
    assert data.meta["source_name"] == "kiwoom"


def test_kr_stock_route_passes_interval_to_kiwoom(monkeypatch):
    monkeypatch.setattr(settings, "kiwoom_provider_mode", "auto")
    monkeypatch.setattr(kiwoom_source, "is_kiwoom_configured", lambda: True)
    seen = {}

    def fake_ohlcv(ticker, interval="1d", days=365):
        seen["ticker"] = ticker
        seen["interval"] = interval
        seen["days"] = days
        return MarketData(
            source="kr_stocks",
            symbol=ticker,
            name="Samsung Electronics",
            type="OHLCV",
            timezone="KST",
            currency="KRW",
            candles=[Candle(time=1_700_000_000, open=1, high=2, low=1, close=2, volume=100)],
            meta={"data_status": "live", "source_name": "kiwoom"},
        )

    monkeypatch.setattr(kiwoom_source, "get_kiwoom_ohlcv", fake_ohlcv)

    response = client.get("/kr-stocks/005930?interval=1w")

    assert response.status_code == 200
    assert seen == {"ticker": "005930", "interval": "1w", "days": 365}
