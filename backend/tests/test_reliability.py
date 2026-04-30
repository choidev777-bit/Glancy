from app.models import Candle, MarketData
from app.reliability.cache import clear_cache
from app.reliability.fallback import load_sample, reliable_market_data


def test_load_sample_crypto():
    data = load_sample("crypto", "BTCUSDT", reason="test outage")
    assert data.source == "crypto"
    assert data.meta["data_status"] == "sample"
    assert data.meta["fallback_reason"] == "test outage"
    assert len(data.candles) >= 200


def test_load_sample_kospi_index_uses_kospi_metadata():
    data = load_sample("global_indices", "^KS11", reason="test outage")

    assert data.source == "global_indices"
    assert data.symbol == "^KS11"
    assert data.name == "KOSPI Composite Index"
    assert data.currency == "POINT"
    assert data.meta["data_status"] == "sample"
    assert len(data.candles) >= 200


def test_reliable_market_data_uses_cache_status():
    clear_cache()
    calls = {"count": 0}

    def loader():
        calls["count"] += 1
        return MarketData(
            source="us_stocks",
            symbol="AAPL",
            name="Apple Inc.",
            type="OHLCV",
            timezone="UTC",
            currency="USD",
            candles=[
                Candle(time=1_700_000_000, open=1, high=2, low=0.5, close=1.5, volume=100),
            ],
        )

    first = reliable_market_data("market:test:aapl", "us_stocks", "AAPL", 300, loader)
    second = reliable_market_data("market:test:aapl", "us_stocks", "AAPL", 300, loader)

    assert calls["count"] == 1
    assert first.meta["data_status"] == "live"
    assert second.meta["data_status"] == "cached"


def test_reliable_market_data_falls_back_on_error():
    clear_cache()

    def loader():
        raise RuntimeError("forced provider failure")

    data = reliable_market_data("market:test:btc", "crypto", "BTCUSDT", 300, loader)

    assert data.meta["data_status"] == "sample"
    assert "forced provider failure" in data.meta["fallback_reason"]
