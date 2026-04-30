from fastapi import APIRouter, Query

from app.config import settings
from app.reliability.fallback import reliable_market_data
from app.sources.pykrx_source import get_kr_etf_ohlcv
from app.sources.yfinance_source import get_yf_ohlcv

router = APIRouter(prefix="/etfs", tags=["etfs"])


@router.get("/{symbol}")
def get_etf(symbol: str, period: str = "1y", interval: str = "1d", days: int = Query(365, ge=30, le=3650)):
    normalized = symbol.upper()
    if normalized.isdigit():
        return reliable_market_data(
            cache_key=f"market:etfs:{normalized}:{days}:{interval}",
            source="etfs",
            symbol=normalized,
            ttl_seconds=settings.cache_ttl_seconds,
            loader=lambda: get_kr_etf_ohlcv(normalized, days=days, interval=interval),
        )
    return reliable_market_data(
        cache_key=f"market:etfs:{normalized}:{period}:{interval}",
        source="etfs",
        symbol=normalized,
        ttl_seconds=settings.cache_ttl_seconds,
        loader=lambda: get_yf_ohlcv(normalized, source="etfs", period=period, interval=interval),
    )
