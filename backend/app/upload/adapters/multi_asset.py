import pandas as pd


def analyze(df: pd.DataFrame) -> dict:
    date_col = next((column for column in df.columns if str(column).strip().lower() in {"date", "time", "datetime", "날짜", "일자"}), None)
    if date_col:
        df = df.set_index(date_col)
        df.index = pd.to_datetime(df.index)
        df = df.sort_index()

    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        return {"type": "multi_asset", "error": "No numeric columns found"}

    normalized = numeric.divide(numeric.iloc[0]).multiply(100)
    returns = numeric.pct_change().dropna()
    correlation = returns.corr().round(3)
    volatility = (returns.std() * (252**0.5)).round(4)

    return {
        "type": "multi_asset",
        "tickers": list(numeric.columns),
        "n_periods": len(numeric),
        "normalized_series": [
            {"date": str(index), **{column: float(value) for column, value in row.items()}}
            for index, row in normalized.tail(200).iterrows()
        ],
        "correlation": correlation.to_dict(),
        "annualized_volatility": volatility.to_dict(),
    }

