from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.reliability.fallback import reliable_market_data
from app.sources.binance_source import get_binance_klines
from app.sources.coingecko_source import get_top_coins

router = APIRouter(prefix="/crypto", tags=["crypto"])


@router.get("/top")
def top_coins(limit: int = Query(20, ge=1, le=100)):
    try:
        return get_top_coins(limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{symbol}")
def get_crypto(symbol: str, interval: str = "1d", limit: int = Query(365, ge=10, le=1000)):
    normalized = symbol.upper()
    return reliable_market_data(
        cache_key=f"market:crypto:{normalized}:{interval}:{limit}",
        source="crypto",
        symbol=normalized,
        ttl_seconds=settings.cache_ttl_seconds,
        loader=lambda: get_binance_klines(normalized, interval=interval, limit=limit),
    )
