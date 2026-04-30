from fastapi import APIRouter, HTTPException

from app.fundamental.kr import build_kr_report
from app.fundamental.us import build_us_report
from app.sources.pykrx_source import get_kr_stock_ohlcv
from app.sources.yfinance_source import get_yf_ohlcv

router = APIRouter(prefix="/fundamental", tags=["fundamental"])


@router.get("/kr/{ticker}")
def kr_report(ticker: str):
    try:
        market_data = get_kr_stock_ohlcv(ticker, days=30)
        return build_kr_report(ticker, name=market_data.name)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/us/{symbol}")
def us_report(symbol: str):
    try:
        market_data = get_yf_ohlcv(symbol.upper(), source="us_stocks", period="1mo")
        return build_us_report(symbol.upper(), name=market_data.name)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

