from fastapi import APIRouter, HTTPException

from app.config import settings
from app.reliability.fallback import reliable_market_data
from app.sources.yfinance_source import get_yf_fundamentals, get_yf_ohlcv

router = APIRouter(prefix="/us-stocks", tags=["us_stocks"])


@router.get("/{symbol}")
def get_us_stock(symbol: str, period: str = "1y", interval: str = "1d"):
    normalized = symbol.upper()
    return reliable_market_data(
        cache_key=f"market:us_stocks:{normalized}:{period}:{interval}",
        source="us_stocks",
        symbol=normalized,
        ttl_seconds=settings.cache_ttl_seconds,
        loader=lambda: get_yf_ohlcv(normalized, source="us_stocks", period=period, interval=interval),
    )


@router.get("/{symbol}/fundamental")
def get_us_fundamental(symbol: str):
    try:
        return get_yf_fundamentals(symbol.upper())
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
