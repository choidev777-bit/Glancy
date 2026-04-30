from collections.abc import Iterable

import pandas as pd


def sma(close: pd.Series, period: int) -> pd.Series:
    return close.rolling(window=period, min_periods=period).mean()


def ema(close: pd.Series, period: int) -> pd.Series:
    return close.ewm(span=period, adjust=False).mean()


def ma_alignment(values: dict[int, float]) -> str:
    clean = {k: v for k, v in values.items() if v is not None and not pd.isna(v)}
    keys = sorted(clean.keys())
    if len(keys) < 2:
        return "혼재"

    bullish = all(clean[keys[i]] > clean[keys[i + 1]] for i in range(len(keys) - 1))
    bearish = all(clean[keys[i]] < clean[keys[i + 1]] for i in range(len(keys) - 1))
    if bullish:
        return "정배열"
    if bearish:
        return "역배열"
    return "혼재"


def detect_cross(short: pd.Series, long: pd.Series) -> str:
    if len(short) < 5 or len(long) < 5:
        return "없음"

    recent_short = short.tail(5).reset_index(drop=True)
    recent_long = long.tail(5).reset_index(drop=True)
    for idx in range(1, len(recent_short)):
        if recent_short[idx - 1] <= recent_long[idx - 1] and recent_short[idx] > recent_long[idx]:
            return "골든크로스"
        if recent_short[idx - 1] >= recent_long[idx - 1] and recent_short[idx] < recent_long[idx]:
            return "데드크로스"
    return "없음"


def ma_signals(close: pd.Series, periods: Iterable[int] = (5, 10, 20, 50, 100, 200)) -> list[dict]:
    current = float(close.iloc[-1])
    output: list[dict] = []
    for period in periods:
        sma_series = sma(close, period)
        ema_series = ema(close, period)
        sma_last = None if pd.isna(sma_series.iloc[-1]) else float(sma_series.iloc[-1])
        ema_last = None if pd.isna(ema_series.iloc[-1]) else float(ema_series.iloc[-1])

        score = 0
        if sma_last is not None:
            score += 1 if current > sma_last else -1
        if ema_last is not None:
            score += 1 if current > ema_last else -1

        output.append(
            {
                "period": period,
                "sma": sma_last,
                "ema": ema_last,
                "signal": "매수" if score > 0 else "매도" if score < 0 else "중립",
                "score": score,
            }
        )
    return output

