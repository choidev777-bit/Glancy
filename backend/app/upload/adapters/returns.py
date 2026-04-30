import numpy as np
import pandas as pd


def analyze(df: pd.DataFrame) -> dict:
    date_col = next((column for column in df.columns if str(column).strip().lower() in {"date", "time", "datetime", "날짜", "일자"}), None)
    return_col = next((column for column in df.columns if str(column).strip().lower() in {"return", "returns", "수익률"}), None)

    if date_col is None or return_col is None:
        return {"type": "returns", "error": "Missing date or return column"}

    series = df[[date_col, return_col]].copy()
    series.columns = ["Date", "Return"]
    series["Date"] = pd.to_datetime(series["Date"])
    series = series.sort_values("Date").reset_index(drop=True)
    series["Return"] = series["Return"].astype(float)
    if series["Return"].abs().mean() > 1:
        series["Return"] = series["Return"] / 100

    equity_curve = (1 + series["Return"]).cumprod()
    cumulative = equity_curve - 1
    annualized_return = (1 + series["Return"].mean()) ** 252 - 1
    annualized_volatility = series["Return"].std() * np.sqrt(252)
    sharpe = annualized_return / annualized_volatility if annualized_volatility else 0
    drawdown = equity_curve / equity_curve.cummax() - 1
    monthly = series.groupby(series["Date"].dt.to_period("M"))["Return"].apply(lambda values: (1 + values).prod() - 1)

    return {
        "type": "returns",
        "n_observations": len(series),
        "cumulative_return": float(cumulative.iloc[-1]) if len(cumulative) else 0,
        "annualized_return": float(annualized_return),
        "annualized_volatility": float(annualized_volatility),
        "sharpe_ratio": float(sharpe),
        "max_drawdown": float(drawdown.min()),
        "monthly_returns": [{"period": str(period), "return": float(value)} for period, value in monthly.items()],
    }

