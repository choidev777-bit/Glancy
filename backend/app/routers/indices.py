from fastapi import APIRouter

from app.config import settings
from app.reliability.fallback import reliable_market_data
from app.sources.yfinance_source import get_yf_ohlcv

router = APIRouter(prefix="/indices", tags=["indices"])

KOREAN_INDEX_OVERRIDES = {
    "^KS11": {"name": "KOSPI Composite Index", "currency": "POINT"},
    "^KQ11": {"name": "KOSDAQ Composite Index", "currency": "POINT"},
}


@router.get("/{symbol:path}")
def get_index(symbol: str, period: str = "1y", interval: str = "1d"):
    override = KOREAN_INDEX_OVERRIDES.get(symbol.upper())
    currency = override["currency"] if override else "USD"
    data = reliable_market_data(
        cache_key=f"market:global_indices:{symbol}:{period}:{interval}:{currency}",
        source="global_indices",
        symbol=symbol,
        ttl_seconds=settings.cache_ttl_seconds,
        loader=lambda: get_yf_ohlcv(symbol, source="global_indices", period=period, interval=interval, currency=currency),
    )
    if override:
        data.name = override["name"]
        data.symbol = symbol
        data.currency = override["currency"]
    return data
