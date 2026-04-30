"""Public Binance market data. No API key required."""

import requests

from app.models import Candle, MarketData
from app.normalize import mark_status

BINANCE_BASE = "https://api.binance.com/api/v3"

INTERVALS = {"1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"}


def get_binance_klines(symbol: str, interval: str = "1d", limit: int = 365) -> MarketData:
    if interval not in INTERVALS:
        raise ValueError(f"Invalid Binance interval: {interval}")

    session = requests.Session()
    session.trust_env = False
    response = session.get(
        f"{BINANCE_BASE}/klines",
        params={"symbol": symbol, "interval": interval, "limit": limit},
        timeout=10,
    )
    response.raise_for_status()

    candles = [
        Candle(
            time=int(row[0] // 1000),
            open=float(row[1]),
            high=float(row[2]),
            low=float(row[3]),
            close=float(row[4]),
            volume=float(row[5]),
        )
        for row in response.json()
    ]

    return mark_status(
        MarketData(
            source="crypto",
            symbol=symbol,
            name=symbol,
            type="OHLCV",
            timezone="UTC",
            currency="USDT" if symbol.endswith("USDT") else "USD",
            candles=candles,
        ),
        status="live",
        source_name="binance",
    )
