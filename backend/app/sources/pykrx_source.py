"""Korean stock and ETF market data via pykrx."""

from datetime import datetime, timedelta

import pandas as pd
from pykrx import stock

from app.models import MarketData
from app.normalize import df_to_candles, mark_status, normalize_columns

KOREAN_COLUMN_MAP = {
    "시가": "Open",
    "고가": "High",
    "저가": "Low",
    "종가": "Close",
    "거래량": "Volume",
    "거래대금": "Value",
    "기초지수": "Benchmark",
}


def _resample_ohlcv(df: pd.DataFrame, interval: str) -> pd.DataFrame:
    if interval == "1d":
        return df
    if interval == "1w":
        rule = "W-FRI"
    elif interval == "1mo":
        rule = "ME"
    else:
        raise ValueError(f"pykrx does not support interval: {interval}")

    resampled = df.resample(rule).agg(
        {
            "Open": "first",
            "High": "max",
            "Low": "min",
            "Close": "last",
            "Volume": "sum",
        }
    )
    return resampled.dropna(subset=["Open", "High", "Low", "Close"])


def get_kr_stock_ohlcv(ticker: str, days: int = 365, interval: str = "1d") -> MarketData:
    end = datetime.now().strftime("%Y%m%d")
    start = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")

    df = stock.get_market_ohlcv(start, end, ticker)
    if df.empty:
        raise ValueError(f"No Korean stock data for {ticker}")

    df = normalize_columns(df, KOREAN_COLUMN_MAP)
    name = stock.get_market_ticker_name(ticker) or ticker

    df = _resample_ohlcv(df, interval)

    return mark_status(
        MarketData(
            source="kr_stocks",
            symbol=ticker,
            name=name,
            type="OHLCV",
            timezone="KST",
            currency="KRW",
            candles=df_to_candles(df),
        ),
        status="live",
        source_name="pykrx",
    )


def get_kr_etf_ohlcv(ticker: str, days: int = 365, interval: str = "1d") -> MarketData:
    end = datetime.now().strftime("%Y%m%d")
    start = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")

    df = stock.get_etf_ohlcv_by_date(start, end, ticker)
    if df.empty:
        raise ValueError(f"No Korean ETF data for {ticker}")

    df = normalize_columns(df, KOREAN_COLUMN_MAP)
    name = stock.get_etf_ticker_name(ticker) or ticker

    df = _resample_ohlcv(df, interval)

    return mark_status(
        MarketData(
            source="etfs",
            symbol=ticker,
            name=name,
            type="OHLCV",
            timezone="KST",
            currency="KRW",
            candles=df_to_candles(df),
        ),
        status="live",
        source_name="pykrx",
    )


def get_kr_stock_fundamental(ticker: str) -> dict:
    end = datetime.now().strftime("%Y%m%d")
    df = stock.get_market_fundamental(end, end, ticker)
    if df.empty:
        return {}
    row = df.iloc[0].to_dict()
    return {
        "PER": row.get("PER"),
        "PBR": row.get("PBR"),
        "EPS": row.get("EPS"),
        "BPS": row.get("BPS"),
        "DIV": row.get("DIV"),
        "DPS": row.get("DPS"),
    }
