from fastapi import APIRouter, Query

from app.config import settings
from app.indicators.compute import compute_all
from app.insights.compose import compose
from app.reliability.fallback import reliable_market_data
from app.sources.binance_source import get_binance_klines
from app.sources import kiwoom_source
from app.sources.pykrx_source import get_kr_stock_ohlcv
from app.sources.yfinance_source import get_yf_ohlcv

router = APIRouter(prefix="/indicators", tags=["indicators"])


def _params(
    ma_periods: str,
    ma_cross_short: int,
    ma_cross_long: int,
    rsi_period: int,
    rsi_overbought: float,
    rsi_oversold: float,
    macd_fast: int,
    macd_slow: int,
    macd_signal: int,
    stoch_k_period: int,
    stoch_d_period: int,
    stoch_overbought: float,
    stoch_oversold: float,
    bb_period: int,
    bb_std: float,
    wr_period: int,
    wr_overbought: float,
    wr_oversold: float,
    cci_period: int,
    cci_strong_buy: float,
    cci_buy: float,
    cci_sell: float,
    cci_strong_sell: float,
    atr_period: int,
    roc_period: int,
    obv_lookback: int,
) -> dict:
    return {
        "ma_periods": ma_periods,
        "ma_cross_short": ma_cross_short,
        "ma_cross_long": ma_cross_long,
        "rsi_period": rsi_period,
        "rsi_overbought": rsi_overbought,
        "rsi_oversold": rsi_oversold,
        "macd_fast": macd_fast,
        "macd_slow": macd_slow,
        "macd_signal": macd_signal,
        "stoch_k_period": stoch_k_period,
        "stoch_d_period": stoch_d_period,
        "stoch_overbought": stoch_overbought,
        "stoch_oversold": stoch_oversold,
        "bb_period": bb_period,
        "bb_std": bb_std,
        "wr_period": wr_period,
        "wr_overbought": wr_overbought,
        "wr_oversold": wr_oversold,
        "cci_period": cci_period,
        "cci_strong_buy": cci_strong_buy,
        "cci_buy": cci_buy,
        "cci_sell": cci_sell,
        "cci_strong_sell": cci_strong_sell,
        "atr_period": atr_period,
        "roc_period": roc_period,
        "obv_lookback": obv_lookback,
    }


def _query_params(
    ma_periods: str = "5,10,20,50,100,200",
    ma_cross_short: int = 5,
    ma_cross_long: int = 20,
    rsi_period: int = 14,
    rsi_overbought: float = 70,
    rsi_oversold: float = 30,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    stoch_k_period: int = 9,
    stoch_d_period: int = 6,
    stoch_overbought: float = 80,
    stoch_oversold: float = 20,
    bb_period: int = 20,
    bb_std: float = 2.0,
    wr_period: int = 14,
    wr_overbought: float = -20,
    wr_oversold: float = -80,
    cci_period: int = 14,
    cci_strong_buy: float = -200,
    cci_buy: float = -100,
    cci_sell: float = 100,
    cci_strong_sell: float = 200,
    atr_period: int = 14,
    roc_period: int = 12,
    obv_lookback: int = 5,
) -> dict:
    return _params(
        ma_periods,
        ma_cross_short,
        ma_cross_long,
        rsi_period,
        rsi_overbought,
        rsi_oversold,
        macd_fast,
        macd_slow,
        macd_signal,
        stoch_k_period,
        stoch_d_period,
        stoch_overbought,
        stoch_oversold,
        bb_period,
        bb_std,
        wr_period,
        wr_overbought,
        wr_oversold,
        cci_period,
        cci_strong_buy,
        cci_buy,
        cci_sell,
        cci_strong_sell,
        atr_period,
        roc_period,
        obv_lookback,
    )


@router.get("/kr-stocks/{ticker}")
def kr_indicators(
    ticker: str,
    days: int = Query(365, ge=30, le=3650),
    interval: str = "1d",
    ma_periods: str = "5,10,20,50,100,200",
    ma_cross_short: int = 5,
    ma_cross_long: int = 20,
    rsi_period: int = 14,
    rsi_overbought: float = 70,
    rsi_oversold: float = 30,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    stoch_k_period: int = 9,
    stoch_d_period: int = 6,
    stoch_overbought: float = 80,
    stoch_oversold: float = 20,
    bb_period: int = 20,
    bb_std: float = 2.0,
    wr_period: int = 14,
    wr_overbought: float = -20,
    wr_oversold: float = -80,
    cci_period: int = 14,
    cci_strong_buy: float = -200,
    cci_buy: float = -100,
    cci_sell: float = 100,
    cci_strong_sell: float = 200,
    atr_period: int = 14,
    roc_period: int = 12,
    obv_lookback: int = 5,
):
    provider_mode = settings.kiwoom_provider_mode.lower()
    if provider_mode in {"kiwoom_rest", "auto"} and kiwoom_source.is_kiwoom_configured():
        try:
            data = kiwoom_source.get_kiwoom_ohlcv(ticker, interval=interval, days=days)
        except Exception:
            if provider_mode == "kiwoom_rest":
                raise
            data = reliable_market_data(
                cache_key=f"market:kr_stocks:{ticker}:{days}:{interval}",
                source="kr_stocks",
                symbol=ticker,
                ttl_seconds=settings.cache_ttl_seconds,
                loader=lambda: get_kr_stock_ohlcv(ticker, days=days, interval=interval),
            )
    else:
        data = reliable_market_data(
            cache_key=f"market:kr_stocks:{ticker}:{days}:{interval}",
            source="kr_stocks",
            symbol=ticker,
            ttl_seconds=settings.cache_ttl_seconds,
            loader=lambda: get_kr_stock_ohlcv(ticker, days=days, interval=interval),
        )
    result = compute_all(
        data,
        _query_params(
            ma_periods,
            ma_cross_short,
            ma_cross_long,
            rsi_period,
            rsi_overbought,
            rsi_oversold,
            macd_fast,
            macd_slow,
            macd_signal,
            stoch_k_period,
            stoch_d_period,
            stoch_overbought,
            stoch_oversold,
            bb_period,
            bb_std,
            wr_period,
            wr_overbought,
            wr_oversold,
            cci_period,
            cci_strong_buy,
            cci_buy,
            cci_sell,
            cci_strong_sell,
            atr_period,
            roc_period,
            obv_lookback,
        ),
    )
    if "error" not in result:
        result["insights"] = compose(result, current_price=data.candles[-1].close)
    return result


@router.get("/us-stocks/{symbol}")
def us_indicators(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    ma_periods: str = "5,10,20,50,100,200",
    ma_cross_short: int = 5,
    ma_cross_long: int = 20,
    rsi_period: int = 14,
    rsi_overbought: float = 70,
    rsi_oversold: float = 30,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    stoch_k_period: int = 9,
    stoch_d_period: int = 6,
    stoch_overbought: float = 80,
    stoch_oversold: float = 20,
    bb_period: int = 20,
    bb_std: float = 2.0,
    wr_period: int = 14,
    wr_overbought: float = -20,
    wr_oversold: float = -80,
    cci_period: int = 14,
    cci_strong_buy: float = -200,
    cci_buy: float = -100,
    cci_sell: float = 100,
    cci_strong_sell: float = 200,
    atr_period: int = 14,
    roc_period: int = 12,
    obv_lookback: int = 5,
):
    normalized = symbol.upper()
    data = reliable_market_data(
        cache_key=f"market:us_stocks:{normalized}:{period}:{interval}",
        source="us_stocks",
        symbol=normalized,
        ttl_seconds=settings.cache_ttl_seconds,
        loader=lambda: get_yf_ohlcv(normalized, source="us_stocks", period=period, interval=interval),
    )
    result = compute_all(
        data,
        _query_params(
            ma_periods,
            ma_cross_short,
            ma_cross_long,
            rsi_period,
            rsi_overbought,
            rsi_oversold,
            macd_fast,
            macd_slow,
            macd_signal,
            stoch_k_period,
            stoch_d_period,
            stoch_overbought,
            stoch_oversold,
            bb_period,
            bb_std,
            wr_period,
            wr_overbought,
            wr_oversold,
            cci_period,
            cci_strong_buy,
            cci_buy,
            cci_sell,
            cci_strong_sell,
            atr_period,
            roc_period,
            obv_lookback,
        ),
    )
    if "error" not in result:
        result["insights"] = compose(result, current_price=data.candles[-1].close)
    return result


@router.get("/crypto/{symbol}")
def crypto_indicators(
    symbol: str,
    interval: str = "1d",
    limit: int = Query(365, ge=30, le=1000),
    ma_periods: str = "5,10,20,50,100,200",
    ma_cross_short: int = 5,
    ma_cross_long: int = 20,
    rsi_period: int = 14,
    rsi_overbought: float = 70,
    rsi_oversold: float = 30,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    stoch_k_period: int = 9,
    stoch_d_period: int = 6,
    stoch_overbought: float = 80,
    stoch_oversold: float = 20,
    bb_period: int = 20,
    bb_std: float = 2.0,
    wr_period: int = 14,
    wr_overbought: float = -20,
    wr_oversold: float = -80,
    cci_period: int = 14,
    cci_strong_buy: float = -200,
    cci_buy: float = -100,
    cci_sell: float = 100,
    cci_strong_sell: float = 200,
    atr_period: int = 14,
    roc_period: int = 12,
    obv_lookback: int = 5,
):
    normalized = symbol.upper()
    data = reliable_market_data(
        cache_key=f"market:crypto:{normalized}:{interval}:{limit}",
        source="crypto",
        symbol=normalized,
        ttl_seconds=settings.cache_ttl_seconds,
        loader=lambda: get_binance_klines(normalized, interval=interval, limit=limit),
    )
    result = compute_all(
        data,
        _query_params(
            ma_periods,
            ma_cross_short,
            ma_cross_long,
            rsi_period,
            rsi_overbought,
            rsi_oversold,
            macd_fast,
            macd_slow,
            macd_signal,
            stoch_k_period,
            stoch_d_period,
            stoch_overbought,
            stoch_oversold,
            bb_period,
            bb_std,
            wr_period,
            wr_overbought,
            wr_oversold,
            cci_period,
            cci_strong_buy,
            cci_buy,
            cci_sell,
            cci_strong_sell,
            atr_period,
            roc_period,
            obv_lookback,
        ),
    )
    if "error" not in result:
        result["insights"] = compose(result, current_price=data.candles[-1].close)
    return result
