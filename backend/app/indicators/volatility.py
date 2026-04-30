import pandas as pd


def bollinger_bands(close: pd.Series, period: int = 20, std: float = 2.0) -> dict[str, pd.Series]:
    middle = close.rolling(window=period).mean()
    deviation = close.rolling(window=period).std()
    upper = middle + deviation * std
    lower = middle - deviation * std
    bandwidth = (upper - lower) / middle
    return {"upper": upper, "middle": middle, "lower": lower, "bandwidth": bandwidth}


def bollinger_signal(data: dict[str, pd.Series], current_price: float) -> tuple[str, int]:
    upper = float(data["upper"].iloc[-1])
    lower = float(data["lower"].iloc[-1])
    if pd.isna(upper) or pd.isna(lower):
        return "중립", 0
    if current_price > upper:
        return "매도", -1
    if current_price < lower:
        return "매수", 1
    return "중립", 0


def atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    previous_close = close.shift(1)
    tr = pd.concat(
        [
            high - low,
            (high - previous_close).abs(),
            (low - previous_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return tr.rolling(window=period).mean()

