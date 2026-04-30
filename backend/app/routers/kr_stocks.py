from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.models import StockQuote
from app.reliability.cache import get_or_set
from app.reliability.status import attach_status
from app.reliability.wrappers import with_retry
from app.sources import kiwoom_source
from app.sources.pykrx_source import get_kr_stock_fundamental, get_kr_stock_ohlcv

router = APIRouter(prefix="/kr-stocks", tags=["kr_stocks"])


@router.get("/{ticker}")
def get_kr_stock(ticker: str, days: int = Query(365, ge=30, le=3650), interval: str = "1d"):
    provider_mode = settings.kiwoom_provider_mode.lower()
    if provider_mode in {"kiwoom_rest", "auto"} and kiwoom_source.is_kiwoom_configured():
        try:
            return kiwoom_source.get_kiwoom_ohlcv(ticker, interval=interval, days=days)
        except Exception:
            if provider_mode == "kiwoom_rest":
                raise

    try:
        data, from_cache = get_or_set(
            f"market:kr_stocks:{ticker}:{days}:{interval}",
            settings.cache_ttl_seconds,
            loader=lambda: with_retry(lambda: get_kr_stock_ohlcv(ticker, days=days, interval=interval), retries=1),
        )
        return attach_status(data.model_copy(deep=True), data_status="cached" if from_cache else "live", source_name="pykrx")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Korean market data unavailable: {exc}") from exc


@router.get("/{ticker}/quote")
def get_kr_quote(ticker: str):
    try:
        return kiwoom_source.get_kiwoom_quote(ticker)
    except Exception as exc:
        return StockQuote(
            symbol=ticker,
            name=ticker,
            currency="KRW",
            meta={
                "data_status": "unavailable",
                "source_name": "quote_unavailable",
                "fallback_reason": str(exc),
            },
        )


@router.get("/{ticker}/fundamental")
def get_kr_fundamental(ticker: str):
    try:
        return get_kr_stock_fundamental(ticker)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
