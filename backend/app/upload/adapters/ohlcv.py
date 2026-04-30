import pandas as pd

from app.models import Candle, MarketData

KOREAN_MAP = {
    "시가": "Open",
    "고가": "High",
    "저가": "Low",
    "종가": "Close",
    "거래량": "Volume",
    "날짜": "Date",
    "일자": "Date",
}


def adapt(df: pd.DataFrame, filename: str) -> MarketData:
    df = df.rename(columns=KOREAN_MAP).copy()
    df.columns = [
        column.title() if str(column).lower() in {"open", "high", "low", "close", "volume", "date"} else column
        for column in df.columns
    ]

    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"])
        df = df.sort_values("Date")
    else:
        df["Date"] = pd.date_range(end=pd.Timestamp.utcnow(), periods=len(df), freq="D")

    if "Volume" not in df.columns:
        df["Volume"] = 0

    candles = [
        Candle(
            time=int(pd.Timestamp(row["Date"]).timestamp()),
            open=float(row["Open"]),
            high=float(row["High"]),
            low=float(row["Low"]),
            close=float(row["Close"]),
            volume=float(row.get("Volume", 0) or 0),
        )
        for _, row in df.iterrows()
    ]

    return MarketData(
        source="user_upload",
        symbol=filename,
        name=filename,
        type="OHLCV",
        timezone="UTC",
        currency="UNKNOWN",
        candles=candles,
        meta={"data_status": "live", "source_name": "user_upload"},
    )

