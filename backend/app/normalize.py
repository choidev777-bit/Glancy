"""Helpers for normalizing market data into the shared MarketData shape."""

import pandas as pd

from app.models import Candle


def normalize_columns(df: pd.DataFrame, mapping: dict[str, str]) -> pd.DataFrame:
    """Rename source-specific columns to Open/High/Low/Close/Volume."""
    return df.rename(columns=mapping)


def df_to_candles(df: pd.DataFrame) -> list[Candle]:
    """Convert an OHLCV DataFrame with a DatetimeIndex into candles."""
    candles: list[Candle] = []
    for ts, row in df.iterrows():
        candles.append(
            Candle(
                time=int(pd.Timestamp(ts).timestamp()),
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                close=float(row["Close"]),
                volume=float(row.get("Volume", 0) or 0),
            )
        )
    return candles


def mark_status(data, status: str, source_name: str, fallback_reason: str | None = None):
    data.meta = {
        **(data.meta or {}),
        "data_status": status,
        "source_name": source_name,
        "fallback_reason": fallback_reason,
    }
    return data

