"""US stocks, ETFs, and global indices via yfinance."""

import yfinance as yf

from app.models import MarketData, SourceType
from app.normalize import df_to_candles, mark_status


def get_yf_ohlcv(
    symbol: str,
    source: SourceType,
    period: str = "1y",
    interval: str = "1d",
    currency: str = "USD",
) -> MarketData:
    ticker = yf.Ticker(symbol)
    yf_interval = "1wk" if interval == "1w" else interval
    df = ticker.history(period=period, interval=yf_interval)
    if df.empty:
        raise ValueError(f"No yfinance data for {symbol}")

    info = ticker.info or {}
    name = info.get("longName") or info.get("shortName") or symbol

    return mark_status(
        MarketData(
            source=source,
            symbol=symbol,
            name=name,
            type="OHLCV",
            timezone="UTC",
            currency=currency,
            candles=df_to_candles(df),
            meta={
                "info": {
                    key: info.get(key)
                    for key in ("sector", "industry", "country", "quoteType")
                    if info.get(key)
                }
            },
        ),
        status="live",
        source_name="yfinance",
    )


def get_yf_fundamentals(symbol: str) -> dict:
    info = yf.Ticker(symbol).info or {}
    return {
        "PER": info.get("trailingPE"),
        "ForwardPER": info.get("forwardPE"),
        "PBR": info.get("priceToBook"),
        "PSR": info.get("priceToSalesTrailing12Months"),
        "EVtoEBITDA": info.get("enterpriseToEbitda"),
        "ROE": info.get("returnOnEquity"),
        "ROA": info.get("returnOnAssets"),
        "ProfitMargin": info.get("profitMargins"),
        "OperatingMargin": info.get("operatingMargins"),
        "GrossMargin": info.get("grossMargins"),
        "RevenueGrowth": info.get("revenueGrowth"),
        "EarningsGrowth": info.get("earningsGrowth"),
        "DebtToEquity": info.get("debtToEquity"),
        "CurrentRatio": info.get("currentRatio"),
        "DividendYield": info.get("dividendYield"),
        "PayoutRatio": info.get("payoutRatio"),
        "Beta": info.get("beta"),
        "MarketCap": info.get("marketCap"),
    }
