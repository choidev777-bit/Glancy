import pandas as pd

from app.models import Candle, MarketData


def adapt(df: pd.DataFrame, filename: str) -> MarketData:
    cols = {column: str(column).strip().lower() for column in df.columns}
    date_col = next((column for column, lower in cols.items() if lower in {"date", "time", "datetime", "날짜", "일자"}), None)
    price_col = next((column for column, lower in cols.items() if lower in {"close", "price", "종가", "현재가"}), None)

    if date_col is None:
        date_col = df.columns[0]
    if price_col is None:
        price_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]

    series = df[[date_col, price_col]].copy()
    series.columns = ["Date", "Close"]
    series["Date"] = pd.to_datetime(series["Date"])
    series = series.sort_values("Date")

    candles = [
        Candle(
            time=int(pd.Timestamp(row["Date"]).timestamp()),
            open=float(row["Close"]),
            high=float(row["Close"]),
            low=float(row["Close"]),
            close=float(row["Close"]),
            volume=0,
        )
        for _, row in series.iterrows()
    ]

    return MarketData(
        source="user_upload",
        symbol=filename,
        name=filename,
        type="price_series",
        timezone="UTC",
        currency="UNKNOWN",
        candles=candles,
        meta={"data_status": "live", "source_name": "user_upload"},
    )

