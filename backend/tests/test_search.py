from fastapi.testclient import TestClient

from app.main import app
from app.sources import search_source


client = TestClient(app)


def test_search_endpoint_returns_mixed_assets(monkeypatch):
    monkeypatch.setattr(
        search_source,
        "_kr_assets",
        lambda: [
            {
                "symbol": "005930",
                "name": "삼성전자",
                "market": "kr",
                "category": "KR Stocks",
                "source": "pykrx",
                "currency": "KRW",
                "exchange": "KOSPI",
            }
        ],
    )
    monkeypatch.setattr(
        search_source,
        "_yahoo_quotes",
        lambda query, limit: [
            {"symbol": "AAPL", "shortname": "Apple Inc.", "quoteType": "EQUITY", "exchange": "NMS", "currency": "USD"},
            {"symbol": "SPY", "shortname": "SPDR S&P 500 ETF", "quoteType": "ETF", "exchange": "PCX", "currency": "USD"},
            {"symbol": "^GSPC", "shortname": "S&P 500", "quoteType": "INDEX", "exchange": "SNP", "currency": "USD"},
        ],
    )
    monkeypatch.setattr(
        search_source,
        "_binance_symbols",
        lambda: [
            {
                "symbol": "BTCUSDT",
                "base": "BTC",
                "name": "Bitcoin",
                "market": "crypto",
                "category": "Crypto",
                "source": "binance",
                "currency": "USDT",
                "exchange": "Binance Spot",
            }
        ],
    )

    samsung = client.get("/search/assets", params={"q": "삼성", "limit": 5}).json()
    assert samsung[0]["symbol"] == "005930"
    assert samsung[0]["market"] == "kr"

    apple = client.get("/search/assets", params={"q": "AAPL", "limit": 5}).json()
    assert any(item["market"] == "us" and item["symbol"] == "AAPL" for item in apple)

    spy = client.get("/search/assets", params={"q": "SPY", "limit": 5}).json()
    assert any(item["market"] == "etf" and item["symbol"] == "SPY" for item in spy)

    btc = client.get("/search/assets", params={"q": "BTC", "limit": 5}).json()
    assert any(item["market"] == "crypto" and item["symbol"] == "BTCUSDT" for item in btc)

    index = client.get("/search/assets", params={"q": "S&P", "limit": 5}).json()
    assert any(item["market"] == "index" and item["symbol"] == "^GSPC" for item in index)


def test_kr_search_uses_major_fallbacks_when_pykrx_unavailable(monkeypatch):
    def fail_kr_assets():
        raise RuntimeError("KRX unavailable")

    monkeypatch.setattr(search_source, "_kr_assets", fail_kr_assets)

    naver = client.get("/search/assets", params={"q": "네이버", "markets": "kr", "limit": 5}).json()
    assert naver[0]["symbol"] == "035420"
    assert naver[0]["name"] == "네이버"
    assert naver[0]["source"] == "sample"

    naver_english = client.get("/search/assets", params={"q": "NAVER", "markets": "kr", "limit": 5}).json()
    assert naver_english[0]["symbol"] == "035420"

    samsung = client.get("/search/assets", params={"q": "삼성", "markets": "kr", "limit": 5}).json()
    assert any(item["symbol"] == "005930" for item in samsung)


def test_kr_search_uses_full_kind_universe(monkeypatch):
    search_source._CACHE.clear()
    monkeypatch.setattr(
        search_source,
        "_kind_kr_assets",
        lambda: [
            {
                "symbol": "042660",
                "name": "한화오션",
                "market": "kr",
                "category": "KR Stocks",
                "source": "krx-kind",
                "currency": "KRW",
                "exchange": "KOSPI",
            },
            {
                "symbol": "026940",
                "name": "부국철강",
                "market": "kr",
                "category": "KR Stocks",
                "source": "krx-kind",
                "currency": "KRW",
                "exchange": "KOSDAQ",
            },
        ],
    )
    monkeypatch.setattr(search_source.stock, "get_etf_ticker_list", lambda: (_ for _ in ()).throw(RuntimeError("KRX unavailable")))

    hanwha = client.get("/search/assets", params={"q": "한화오션", "markets": "kr", "limit": 5}).json()
    assert hanwha[0]["symbol"] == "042660"
    assert hanwha[0]["source"] == "krx-kind"

    bukuk = client.get("/search/assets", params={"q": "부국철강", "markets": "kr", "limit": 5}).json()
    assert bukuk[0]["symbol"] == "026940"
