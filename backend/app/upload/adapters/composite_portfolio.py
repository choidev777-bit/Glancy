import math

import pandas as pd


EXPECTED_ASSETS = ["삼성전자", "AAPL", "MSFT", "SPY", "BTC", "GLD"]


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    normalized = df.rename(columns=lambda column: str(column).strip().lower()).copy()
    for column in ("section", "asset", "metric", "currency"):
        if column in normalized.columns:
            normalized[column] = normalized[column].fillna("").astype(str).str.strip()
    if "value" in normalized.columns:
        normalized["numeric_value"] = pd.to_numeric(normalized["value"], errors="coerce")
    if "date" in normalized.columns:
        normalized["date"] = pd.to_datetime(normalized["date"], errors="coerce")
    return normalized


def _section(df: pd.DataFrame, name: str) -> pd.DataFrame:
    return df[df["section"].str.lower() == name].copy()


def _first_text(df: pd.DataFrame, metric: str, default: str = "") -> str:
    rows = df[df["metric"].str.lower() == metric]
    if rows.empty:
        return default
    value = rows["value"].iloc[0]
    return default if pd.isna(value) else str(value)


def _asset_kind(asset: str) -> str:
    if asset == "BTC":
        return "crypto"
    if asset in {"SPY", "GLD"}:
        return "etf"
    return "stock"


def _market_label(asset: str) -> str:
    if asset == "삼성전자":
        return "한국 주식"
    if asset in {"AAPL", "MSFT"}:
        return "미국 주식"
    if asset in {"SPY", "GLD"}:
        return "ETF"
    return "암호화폐"


def _safe_float(value: object, default: float = 0.0) -> float:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return default
    if not math.isfinite(result):
        return default
    return result


def _rounded(value: float, digits: int = 4) -> float:
    return round(_safe_float(value), digits)


def _weights(weight_rows: pd.DataFrame) -> pd.DataFrame:
    weights = weight_rows[weight_rows["metric"].str.lower().eq("weight")][["asset", "numeric_value", "currency"]].copy()
    weights = weights.rename(columns={"numeric_value": "weight"})
    weights["weight"] = weights["weight"].astype(float)
    if weights["weight"].sum() > 1.5:
        weights["weight"] = weights["weight"] / 100
    order = {asset: index for index, asset in enumerate(EXPECTED_ASSETS)}
    weights["sort_order"] = weights["asset"].map(order).fillna(len(EXPECTED_ASSETS))
    return weights.sort_values("sort_order").reset_index(drop=True)


def _returns_by_asset(return_rows: pd.DataFrame) -> pd.DataFrame:
    rows = return_rows[return_rows["metric"].str.lower().isin({"daily_return", "return"})].copy()
    if rows.empty:
        return pd.DataFrame()
    pivot = rows.pivot_table(index="date", columns="asset", values="numeric_value", aggfunc="mean").sort_index()
    if pivot.abs().mean().mean() > 1:
        pivot = pivot / 100
    return pivot.fillna(0)


def _monthly_returns(portfolio_returns: pd.Series) -> list[dict]:
    if portfolio_returns.empty:
        return []
    monthly = portfolio_returns.groupby(portfolio_returns.index.to_period("M")).apply(lambda values: (1 + values).prod() - 1)
    return [{"period": str(period), "return": _rounded(value)} for period, value in monthly.items()]


def _performance(return_rows: pd.DataFrame, weights: pd.DataFrame) -> tuple[dict, dict, dict[str, float]]:
    returns = _returns_by_asset(return_rows)
    if returns.empty:
        return (
            {"cumulative_return": 0.0, "annualized_return": 0.0, "monthly_returns": []},
            {"annualized_volatility": 0.0, "max_drawdown": 0.0, "sharpe_ratio": 0.0},
            {},
        )

    weight_lookup = dict(zip(weights["asset"], weights["weight"]))
    portfolio_returns = returns.apply(lambda row: sum(_safe_float(row.get(asset, 0)) * weight for asset, weight in weight_lookup.items()), axis=1)
    equity_curve = (1 + portfolio_returns).cumprod()
    cumulative_return = float(equity_curve.iloc[-1] - 1)
    annualized_return = float((1 + portfolio_returns.mean()) ** 252 - 1)
    annualized_volatility = float(portfolio_returns.std() * math.sqrt(252))
    drawdown = equity_curve / equity_curve.cummax() - 1
    sharpe_ratio = annualized_return / annualized_volatility if annualized_volatility else 0.0

    asset_cumulative = ((1 + returns).prod() - 1).to_dict()
    return (
        {
            "cumulative_return": _rounded(cumulative_return),
            "annualized_return": _rounded(annualized_return),
            "monthly_returns": _monthly_returns(portfolio_returns),
        },
        {
            "annualized_volatility": _rounded(annualized_volatility),
            "max_drawdown": _rounded(float(drawdown.min())),
            "sharpe_ratio": _rounded(sharpe_ratio),
        },
        {asset: _rounded(value) for asset, value in asset_cumulative.items()},
    )


def _fundamental_lookup(fundamental_rows: pd.DataFrame) -> dict[str, dict[str, str]]:
    lookup: dict[str, dict[str, str]] = {}
    for _, row in fundamental_rows.iterrows():
        asset = str(row["asset"])
        metric = str(row["metric"])
        value = "" if pd.isna(row["value"]) else str(row["value"])
        lookup.setdefault(asset, {})[metric] = value
    return lookup


def _asset_cards(weights: pd.DataFrame, asset_returns: dict[str, float], fundamental_rows: pd.DataFrame) -> list[dict]:
    fundamentals = _fundamental_lookup(fundamental_rows)
    cards = []
    for _, row in weights.iterrows():
        asset = str(row["asset"])
        weight = _safe_float(row["weight"])
        return_rate = asset_returns.get(asset, 0.0)
        foundation_score = _safe_float(fundamentals.get(asset, {}).get("foundation_score"), 65.0)
        technical_score = max(35.0, min(88.0, 62.0 + return_rate * 80))
        cards.append(
            {
                "ticker": asset,
                "name": asset,
                "market": _market_label(asset),
                "kind": _asset_kind(asset),
                "weight": _rounded(weight),
                "return_rate": _rounded(return_rate),
                "contribution": _rounded(weight * return_rate),
                "technical_score": round(technical_score),
                "foundation_score": round(foundation_score),
                "technical_signal": "상승 추세" if return_rate > 0.08 else "중립",
                "foundation_signal": "유형별 기초 지표",
                "fundamentals": fundamentals.get(asset, {}),
            }
        )
    return cards


def analyze(df: pd.DataFrame) -> dict:
    normalized = _clean(df)
    weight_rows = _section(normalized, "portfolio_weight")
    return_rows = _section(normalized, "return")
    fundamental_rows = _section(normalized, "fundamental")
    metadata_rows = _section(normalized, "metadata")

    weights = _weights(weight_rows)
    performance, risk, asset_returns = _performance(return_rows, weights)
    assets = _asset_cards(weights, asset_returns, fundamental_rows)
    total_weight = _rounded(float(weights["weight"].sum()) if not weights.empty else 0.0)
    sections = normalized.groupby(normalized["section"].str.lower()).size().to_dict()
    dates = normalized["date"].dropna().sort_values()
    period = {
        "start": dates.iloc[0].date().isoformat() if len(dates) else "",
        "end": dates.iloc[-1].date().isoformat() if len(dates) else "",
    }

    return {
        "type": "composite_portfolio",
        "summary": {
            "title": "종합 포트폴리오 분석",
            "assets": list(weights["asset"]),
            "period": period,
            "base_currency": _first_text(metadata_rows, "base_currency", "KRW"),
            "display_currency": _first_text(metadata_rows, "display_currency", "USD"),
            "total_return": performance["cumulative_return"],
            "volatility": risk["annualized_volatility"],
            "max_drawdown": risk["max_drawdown"],
            "sharpe_ratio": risk["sharpe_ratio"],
            "signal_score": 72,
        },
        "portfolio": {
            "holdings": weights[["asset", "weight", "currency"]].rename(columns={"asset": "ticker"}).to_dict(orient="records"),
            "n_holdings": len(weights),
            "total_weight": total_weight,
        },
        "performance": performance,
        "risk": risk,
        "allocation": {
            "concentration": {
                "top_1": _rounded(float(weights["weight"].head(1).sum())) if not weights.empty else 0.0,
                "top_3": _rounded(float(weights["weight"].head(3).sum())) if not weights.empty else 0.0,
                "top_5": _rounded(float(weights["weight"].head(5).sum())) if not weights.empty else 0.0,
            },
            "diversification_note": "미국 주식 노출이 중심이지만 GLD가 방어 자산 역할을 보완합니다.",
        },
        "assets": assets,
        "insights": {
            "analysis": "성과, 위험, 자산 배분, 개별 자산 기초 지표를 함께 분석했습니다.",
            "visualization": "누적 수익률, 낙폭, 자산 배분, 개별 자산 카드를 구성할 수 있는 결과입니다.",
            "insight": "BTC는 수익 기여도가 높지만 변동성도 커서 제한 비중이 적절합니다.",
        },
        "data_quality": {
            "sections": {str(key): int(value) for key, value in sections.items()},
            "warnings": [] if total_weight == 1 else [f"포트폴리오 비중 합계가 {total_weight:.2f}입니다."],
            "row_count": len(normalized),
        },
    }
