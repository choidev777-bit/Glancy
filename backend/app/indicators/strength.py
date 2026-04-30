import numpy as np
import pandas as pd


def williams_r(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    highest = high.rolling(window=period).max()
    lowest = low.rolling(window=period).min()
    return -100 * (highest - close) / (highest - lowest).replace(0, np.nan)


def williams_r_signal(value: float, overbought: float = -20, oversold: float = -80) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    if value <= oversold:
        return "매수", 1
    if value >= overbought:
        return "매도", -1
    return "중립", 0


def cci(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    typical_price = (high + low + close) / 3
    average = typical_price.rolling(window=period).mean()
    mean_deviation = typical_price.rolling(window=period).apply(
        lambda values: np.fabs(values - values.mean()).mean(),
        raw=False,
    )
    return (typical_price - average) / (0.015 * mean_deviation.replace(0, np.nan))


def cci_signal(
    value: float,
    strong_buy: float = -200,
    buy: float = -100,
    sell: float = 100,
    strong_sell: float = 200,
) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    if value > strong_sell:
        return "강한 매도", -2
    if value > sell:
        return "매도", -1
    if value < strong_buy:
        return "강한 매수", 2
    if value < buy:
        return "매수", 1
    return "중립", 0


def roc(close: pd.Series, period: int = 12) -> pd.Series:
    return ((close - close.shift(period)) / close.shift(period)) * 100


def roc_signal(value: float) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    return ("매수", 1) if value > 0 else ("매도", -1)
