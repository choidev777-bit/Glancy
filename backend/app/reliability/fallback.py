import json
from pathlib import Path

from app.models import Candle, MarketData
from app.reliability.status import attach_status

SAMPLE_DIR = Path(__file__).resolve().parents[1] / "sample_data"

SAMPLE_MAP = {
    ("kr_stocks", "005930"): "kr_005930.json",
    ("us_stocks", "AAPL"): "us_aapl.json",
    ("us_stocks", "NVDA"): "us_aapl.json",
    ("etfs", "SPY"): "etf_spy.json",
    ("crypto", "BTCUSDT"): "crypto_btcusdt.json",
    ("global_indices", "^GSPC"): "index_gspc.json",
    ("global_indices", "^KS11"): "index_ks11.json",
}


def _deterministic_candles(seed_price: float, days: int = 240) -> list[Candle]:
    candles: list[Candle] = []
    start = 1_735_689_600
    for index in range(days):
        drift = index * seed_price * 0.0009
        wave = ((index % 17) - 8) * seed_price * 0.0015
        base = seed_price + drift + wave
        open_price = base * (1 + ((index % 5) - 2) * 0.001)
        close = base * (1 + ((index % 7) - 3) * 0.001)
        high = max(open_price, close) * 1.01
        low = min(open_price, close) * 0.99
        candles.append(
            Candle(
                time=start + index * 86_400,
                open=round(open_price, 4),
                high=round(high, 4),
                low=round(low, 4),
                close=round(close, 4),
                volume=1_000_000 + index * 12_345,
            )
        )
    return candles


def load_sample(source: str, symbol: str, reason: str) -> MarketData:
    filename = SAMPLE_MAP.get((source, symbol.upper()))
    if not filename:
        raise FileNotFoundError(f"No sample fallback for {source}:{symbol}")

    raw = json.loads((SAMPLE_DIR / filename).read_text(encoding="utf-8"))
    if not raw.get("candles"):
        raw["candles"] = [candle.model_dump() for candle in _deterministic_candles(float(raw.pop("seed_price")))]

    data = MarketData(**raw)
    return attach_status(data, data_status="sample", source_name=source, fallback_reason=reason)


def reliable_market_data(
    cache_key: str,
    source: str,
    symbol: str,
    ttl_seconds: int,
    loader,
) -> MarketData:
    from app.reliability.cache import get_or_set
    from app.reliability.wrappers import with_retry

    try:
        data, from_cache = get_or_set(cache_key, ttl_seconds, loader=lambda: with_retry(loader, retries=1))
        data = data.model_copy(deep=True)
        return attach_status(data, data_status="cached" if from_cache else "live", source_name=source)
    except Exception as exc:
        return load_sample(source, symbol, reason=str(exc))
