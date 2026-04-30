import pandas as pd

from app.indicators.momentum import macd, macd_signal, rsi, rsi_signal, stochastic, stochastic_signal
from app.indicators.pivot import classic, fibonacci
from app.indicators.signals import normalize_to_percent, percent_to_signal
from app.indicators.strength import cci, cci_signal, roc, roc_signal, williams_r, williams_r_signal
from app.indicators.trend import detect_cross, ma_alignment, ma_signals, sma
from app.indicators.volatility import atr, bollinger_bands, bollinger_signal
from app.indicators.volume import obv, obv_signal
from app.models import MarketData


def candles_to_df(data: MarketData) -> pd.DataFrame:
    rows = [
        {
            "time": candle.time,
            "Open": candle.open,
            "High": candle.high,
            "Low": candle.low,
            "Close": candle.close,
            "Volume": candle.volume,
        }
        for candle in data.candles
    ]
    df = pd.DataFrame(rows)
    if not df.empty:
        df.index = pd.to_datetime(df["time"], unit="s")
    return df


def _safe_float(value, fallback: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return fallback
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _int_tuple(value, fallback: tuple[int, ...]) -> tuple[int, ...]:
    if isinstance(value, str):
        items = value.split(",")
    elif isinstance(value, (list, tuple)):
        items = value
    else:
        return fallback

    output: list[int] = []
    for item in items:
        try:
            period = int(item)
        except (TypeError, ValueError):
            continue
        if period > 0:
            output.append(period)
    return tuple(output) or fallback


def compute_all(data: MarketData, params: dict | None = None) -> dict:
    params = params or {}
    df = candles_to_df(data)
    if len(df) < 30:
        return {"error": "Insufficient data (min 30 candles required)"}

    high = df["High"]
    low = df["Low"]
    close = df["Close"]
    volume = df["Volume"]
    current = float(close.iloc[-1])

    ma_periods = _int_tuple(params.get("ma_periods"), (5, 10, 20, 50, 100, 200))
    ma_cross_short = params.get("ma_cross_short", 5)
    ma_cross_long = params.get("ma_cross_long", 20)

    moving_averages = ma_signals(close, ma_periods)
    ma_values = {item["period"]: item["sma"] for item in moving_averages if item["sma"] is not None}
    alignment = ma_alignment(ma_values)
    cross = detect_cross(sma(close, ma_cross_short), sma(close, ma_cross_long))

    rsi_values = rsi(close, params.get("rsi_period", 14))
    rsi_now = _safe_float(rsi_values.iloc[-1], 50)
    rsi_sig, rsi_score = rsi_signal(
        rsi_now,
        params.get("rsi_overbought", 70),
        params.get("rsi_oversold", 30),
    )

    macd_data = macd(
        close,
        params.get("macd_fast", 12),
        params.get("macd_slow", 26),
        params.get("macd_signal", 9),
    )
    macd_sig, macd_score = macd_signal(macd_data)

    stoch_k_period = params.get("stoch_k_period", 9)
    stoch_d_period = params.get("stoch_d_period", 6)
    stoch_data = stochastic(high, low, close, stoch_k_period, stoch_d_period)
    stoch_sig, stoch_score = stochastic_signal(
        stoch_data,
        params.get("stoch_overbought", 80),
        params.get("stoch_oversold", 20),
    )

    bb_data = bollinger_bands(close, params.get("bb_period", 20), params.get("bb_std", 2.0))
    bb_sig, bb_score = bollinger_signal(bb_data, current)

    wr_period = params.get("wr_period", 14)
    wr = williams_r(high, low, close, wr_period)
    wr_sig, wr_score = williams_r_signal(
        _safe_float(wr.iloc[-1]),
        params.get("wr_overbought", -20),
        params.get("wr_oversold", -80),
    )

    cci_period = params.get("cci_period", 14)
    cci_values = cci(high, low, close, cci_period)
    cci_sig, cci_score = cci_signal(
        _safe_float(cci_values.iloc[-1]),
        params.get("cci_strong_buy", -200),
        params.get("cci_buy", -100),
        params.get("cci_sell", 100),
        params.get("cci_strong_sell", 200),
    )

    roc_period = params.get("roc_period", 12)
    roc_values = roc(close, roc_period)
    roc_sig, roc_score = roc_signal(_safe_float(roc_values.iloc[-1]))

    obv_values = obv(close, volume)
    obv_lookback = params.get("obv_lookback", 5)
    obv_sig, obv_score = obv_signal(obv_values, close, obv_lookback)

    atr_period = params.get("atr_period", 14)
    atr_values = atr(high, low, close, atr_period)
    last = df.iloc[-1]
    pivots = {
        "classic": classic(last["High"], last["Low"], last["Close"]),
        "fibonacci": fibonacci(last["High"], last["Low"], last["Close"]),
    }

    indicators = [
        {
            "name": f"RSI({params.get('rsi_period', 14)})",
            "value": round(rsi_now, 2),
            "signal": rsi_sig,
            "score": rsi_score,
        },
        {
            "name": f"MACD({params.get('macd_fast', 12)},{params.get('macd_slow', 26)})",
            "value": round(_safe_float(macd_data["macd"].iloc[-1]), 2),
            "signal": macd_sig,
            "score": macd_score,
        },
        {
            "name": f"STOCH({stoch_k_period},{stoch_d_period})",
            "value": round(_safe_float(stoch_data["k"].iloc[-1]), 2),
            "signal": stoch_sig,
            "score": stoch_score,
        },
        {
            "name": f"Williams %R({wr_period})",
            "value": round(_safe_float(wr.iloc[-1]), 2),
            "signal": wr_sig,
            "score": wr_score,
        },
        {
            "name": f"CCI({cci_period})",
            "value": round(_safe_float(cci_values.iloc[-1]), 2),
            "signal": cci_sig,
            "score": cci_score,
        },
        {
            "name": f"ATR({atr_period})",
            "value": round(_safe_float(atr_values.iloc[-1]), 2),
            "signal": "보통",
            "score": 0,
        },
        {
            "name": f"ROC({roc_period})",
            "value": round(_safe_float(roc_values.iloc[-1]), 2),
            "signal": roc_sig,
            "score": roc_score,
        },
        {
            "name": f"OBV({obv_lookback})",
            "value": round(_safe_float(obv_values.iloc[-1]), 0),
            "signal": obv_sig,
            "score": obv_score,
        },
    ]

    ma_score = sum(item["score"] for item in moving_averages)
    tech_score = sum(item["score"] for item in indicators if isinstance(item["score"], int))
    ma_percent = normalize_to_percent(ma_score, 24)
    tech_percent = normalize_to_percent(tech_score, 16)
    overall_percent = normalize_to_percent(ma_score + tech_score, 40)

    return {
        "indicators": indicators,
        "moving_averages": moving_averages,
        "ma_alignment": alignment,
        "ma_cross": cross,
        "bollinger": {
            "upper": round(_safe_float(bb_data["upper"].iloc[-1]), 2),
            "middle": round(_safe_float(bb_data["middle"].iloc[-1]), 2),
            "lower": round(_safe_float(bb_data["lower"].iloc[-1]), 2),
            "signal": bb_sig,
            "score": bb_score,
        },
        "pivots": pivots,
        "gauges": {
            "moving_average": {
                "percent": round(ma_percent, 1),
                "signal": percent_to_signal(ma_percent),
            },
            "technical": {"percent": round(tech_percent, 1), "signal": percent_to_signal(tech_percent)},
            "overall": {"percent": round(overall_percent, 1), "signal": percent_to_signal(overall_percent)},
        },
    }
