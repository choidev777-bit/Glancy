import pandas as pd


def analyze(df: pd.DataFrame) -> dict:
    normalized = df.rename(columns=lambda column: str(column).strip().lower()).copy()
    normalized = normalized.rename(columns={"종목": "ticker", "비중": "weight", "수량": "quantity"})

    if "weight" not in normalized.columns and "quantity" in normalized.columns:
        total = normalized["quantity"].astype(float).sum()
        normalized["weight"] = normalized["quantity"].astype(float) / total if total else 0

    normalized["weight"] = normalized["weight"].astype(float)
    total_weight = normalized["weight"].sum()
    if total_weight > 1.5:
        normalized["weight"] = normalized["weight"] / 100

    normalized = normalized.sort_values("weight", ascending=False).reset_index(drop=True)

    return {
        "type": "portfolio",
        "holdings": normalized[["ticker", "weight"]].to_dict(orient="records"),
        "n_holdings": len(normalized),
        "concentration": {
            "top_1": float(normalized["weight"].iloc[0]) if len(normalized) else 0,
            "top_3": float(normalized["weight"].head(3).sum()) if len(normalized) else 0,
            "top_5": float(normalized["weight"].head(5).sum()) if len(normalized) else 0,
        },
    }

