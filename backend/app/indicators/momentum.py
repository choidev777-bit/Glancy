import numpy as np
import pandas as pd


def rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.where(delta > 0, 0).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def rsi_signal(value: float, overbought: float = 70, oversold: float = 30) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    if value < 20:
        return "강한 매수", 2
    if value < oversold:
        return "매수", 1
    if value > 80:
        return "강한 매도", -2
    if value > overbought:
        return "매도", -1
    return "중립", 0


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> dict[str, pd.Series]:
    fast_ema = close.ewm(span=fast, adjust=False).mean()
    slow_ema = close.ewm(span=slow, adjust=False).mean()
    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return {"macd": macd_line, "signal": signal_line, "histogram": histogram}


def macd_signal(data: dict[str, pd.Series]) -> tuple[str, int]:
    macd_line = data["macd"]
    signal_line = data["signal"]
    histogram = data["histogram"]
    if len(macd_line) < 2:
        return "중립", 0

    macd_now = float(macd_line.iloc[-1])
    macd_prev = float(macd_line.iloc[-2])
    sig_now = float(signal_line.iloc[-1])
    sig_prev = float(signal_line.iloc[-2])
    hist_now = float(histogram.iloc[-1])
    hist_prev = float(histogram.iloc[-2])

    if macd_prev <= sig_prev and macd_now > sig_now:
        return "매수", 1
    if macd_prev >= sig_prev and macd_now < sig_now:
        return "매도", -1
    if macd_now > sig_now and hist_now > hist_prev:
        return "매수", 1
    if macd_now < sig_now and hist_now < hist_prev:
        return "매도", -1
    return "중립", 0


def stochastic(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    k_period: int = 9,
    d_period: int = 6,
) -> dict[str, pd.Series]:
    lowest = low.rolling(window=k_period).min()
    highest = high.rolling(window=k_period).max()
    k = 100 * (close - lowest) / (highest - lowest).replace(0, np.nan)
    d = k.rolling(window=d_period).mean()
    return {"k": k, "d": d}


def stochastic_signal(data: dict[str, pd.Series], overbought: float = 80, oversold: float = 20) -> tuple[str, int]:
    value = float(data["k"].iloc[-1])
    if pd.isna(value):
        return "중립", 0
    if value < oversold:
        return "매수", 1
    if value > overbought:
        return "매도", -1
    return "중립", 0
