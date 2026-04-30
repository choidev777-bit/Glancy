from typing import Literal

from pydantic import BaseModel, Field


class Candle(BaseModel):
    time: int = Field(..., description="Unix timestamp in seconds")
    open: float
    high: float
    low: float
    close: float
    volume: float = 0


class PortfolioWeight(BaseModel):
    ticker: str
    weight: float
    cost: float | None = None


class ReturnPoint(BaseModel):
    time: int
    value: float


SourceType = Literal[
    "kr_stocks",
    "us_stocks",
    "etfs",
    "crypto",
    "global_indices",
    "user_upload",
]

DataType = Literal["OHLCV", "price_series", "portfolio", "multi_asset", "returns"]


class MarketDataMeta(BaseModel):
    data_status: Literal["live", "cached", "sample", "unavailable"] | None = None
    source_name: str | None = None
    fetched_at: str | None = None
    fallback_reason: str | None = None


class MarketData(BaseModel):
    source: SourceType
    symbol: str
    name: str
    type: DataType
    timezone: Literal["KST", "UTC"]
    currency: str
    candles: list[Candle] = Field(default_factory=list)
    weights: list[PortfolioWeight] | None = None
    returns: list[ReturnPoint] | None = None
    meta: dict = Field(default_factory=dict)


class StockQuote(BaseModel):
    symbol: str
    name: str
    price: float | None = None
    change: float | None = None
    change_percent: float | None = None
    volume: float | None = None
    market_cap: float | None = None
    high52: float | None = None
    low52: float | None = None
    currency: str = "KRW"
    meta: dict = Field(default_factory=dict)


class AssetSearchResult(BaseModel):
    symbol: str
    name: str
    market: Literal["kr", "us", "etf", "crypto", "index"]
    category: str
    source: str
    currency: str | None = None
    exchange: str | None = None
    score: float = 0
