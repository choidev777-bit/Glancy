import pandas as pd


def obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    direction = (close.diff() > 0).astype(int) - (close.diff() < 0).astype(int)
    return (direction * volume).cumsum()


def obv_signal(obv_series: pd.Series, close: pd.Series, lookback: int = 5) -> tuple[str, int]:
    if len(obv_series) < lookback or len(close) < lookback:
        return "중립", 0
    obv_change = obv_series.iloc[-1] - obv_series.iloc[-lookback]
    price_change = close.iloc[-1] - close.iloc[-lookback]
    if obv_change > 0 and price_change >= 0:
        return "매수", 1
    if obv_change < 0 and price_change <= 0:
        return "매도", -1
    return "중립", 0
