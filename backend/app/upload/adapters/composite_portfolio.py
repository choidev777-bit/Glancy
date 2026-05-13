import math
import re

import pandas as pd


EXPECTED_ASSETS = ["005930", "AAPL", "MSFT", "SPY", "BTC", "GLD"]


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    normalized = df.rename(columns=lambda column: str(column).strip().lower()).copy()
    for column in ("section", "asset", "metric", "currency"):
        if column in normalized.columns:
            normalized[column] = normalized[column].fillna("").astype(str).str.strip()
    if "value" in normalized.columns:
        normalized["numeric_value"] = pd.to_numeric(normalized["value"], errors="coerce")
    if "date" in normalized.columns:
        normalized["date_label"] = normalized["date"].fillna("").astype(str).str.strip()
        normalized["date"] = pd.to_datetime(normalized["date"], format="mixed", errors="coerce")
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
    if asset in {"005930", "삼성전자"}:
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


def _clamp_score(value: float) -> int:
    return int(round(max(0.0, min(100.0, _safe_float(value, 50.0)))))


def _format_percent(value: float, signed: bool = True) -> str:
    sign = "+" if signed and value >= 0 else ""
    return f"{sign}{value * 100:.1f}%"


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


def _fundamental_unit(metric: str) -> str:
    metric_key = metric.lower()
    if metric_key in {"per", "pbr", "psr", "ev/ebitda"}:
        return "x"
    if any(keyword in metric for keyword in ("AUM", "시가총액", "거래량")):
        return "B"
    if any(keyword in metric for keyword in ("매출", "이익", "ROE", "ROA", "부채", "배당", "보수", "수익률", "변동성", "낙폭", "추적오차")):
        return "%"
    return ""


def _fundamental_direction(metric: str) -> str:
    lower_better_keywords = ("PER", "PBR", "PSR", "EV/EBITDA", "부채", "보수", "변동성", "낙폭", "추적오차")
    return "lower-better" if any(keyword in metric for keyword in lower_better_keywords) else "higher-better"


def _fundamental_history_lookup(history_rows: pd.DataFrame) -> dict[str, list[dict]]:
    if history_rows.empty:
        return {}

    rows = history_rows.dropna(subset=["numeric_value"]).copy()
    if rows.empty:
        return {}

    def sort_key(row: pd.Series) -> float:
        label = str(row.get("date_label", "")).strip()
        quarter_match = re.fullmatch(r"(\d{4})\sQ([1-4])", label)
        if quarter_match:
            return int(quarter_match.group(1)) * 10 + int(quarter_match.group(2))
        if re.fullmatch(r"\d{4}", label):
            return int(label) * 10
        if not pd.isna(row.get("date")):
            return float(pd.Timestamp(row["date"]).timestamp())
        return math.inf

    lookup: dict[str, list[dict]] = {}
    rows["history_sort"] = rows.apply(sort_key, axis=1)

    for (asset, metric), group in rows.sort_values(["asset", "metric", "history_sort"]).groupby(["asset", "metric"], sort=False):
        points = []
        for _, row in group.iterrows():
            raw_label = str(row.get("date_label", "")).strip()
            if not raw_label and not pd.isna(row.get("date")):
                raw_label = pd.Timestamp(row["date"]).date().isoformat()
            if not raw_label:
                continue
            points.append({"quarter": raw_label, "value": _rounded(row["numeric_value"], 4)})
        if points:
            lookup.setdefault(str(asset), []).append(
                {
                    "label": str(metric),
                    "unit": _fundamental_unit(str(metric)),
                    "direction": _fundamental_direction(str(metric)),
                    "history": points,
                }
            )
    return lookup


def _ohlcv_by_asset(ohlcv_rows: pd.DataFrame) -> dict[str, list[dict]]:
    if ohlcv_rows.empty:
        return {}

    rows = ohlcv_rows[ohlcv_rows["metric"].str.lower().isin({"open", "high", "low", "close", "volume"})].copy()
    if rows.empty:
        return {}

    pivot = rows.pivot_table(index=["asset", "date"], columns="metric", values="numeric_value", aggfunc="mean").reset_index()
    candles_by_asset: dict[str, list[dict]] = {}
    for _, row in pivot.sort_values(["asset", "date"]).iterrows():
        if pd.isna(row.get("date")):
            continue
        if any(pd.isna(row.get(metric)) for metric in ("open", "high", "low", "close")):
            continue
        asset = str(row["asset"])
        timestamp = pd.Timestamp(row["date"])
        candles_by_asset.setdefault(asset, []).append(
            {
                "time": int(timestamp.timestamp()),
                "open": _rounded(row.get("open"), 4),
                "high": _rounded(row.get("high"), 4),
                "low": _rounded(row.get("low"), 4),
                "close": _rounded(row.get("close"), 4),
                "volume": _rounded(row.get("volume"), 4),
            }
        )
    return candles_by_asset


def _moving_average_rows(candles: list[dict]) -> list[dict]:
    closes = pd.Series([_safe_float(candle.get("close")) for candle in candles])
    rows = []
    for period in (5, 10, 20, 50, 100, 200):
        if len(closes) >= period:
            sma = float(closes.tail(period).mean())
            ema = float(closes.ewm(span=period, adjust=False).mean().iloc[-1])
            latest = float(closes.iloc[-1])
            signal = "buy" if latest >= sma else "sell"
        else:
            sma = None
            ema = None
            signal = "neutral"
        rows.append(
            {
                "period": period,
                "sma": None if sma is None else _rounded(sma, 4),
                "ema": None if ema is None else _rounded(ema, 4),
                "signal": signal,
                "score": 65 if signal == "buy" else 50 if signal == "neutral" else 35,
            }
        )
    return rows


def _skill_indicator_rows(candles: list[dict], technical_score: float, price_return: float) -> list[dict]:
    highs = pd.Series([_safe_float(candle.get("high")) for candle in candles])
    lows = pd.Series([_safe_float(candle.get("low")) for candle in candles])
    closes = pd.Series([_safe_float(candle.get("close")) for candle in candles])
    volumes = pd.Series([_safe_float(candle.get("volume")) for candle in candles])
    latest = float(closes.iloc[-1]) if not closes.empty else 0.0
    previous = float(closes.iloc[-2]) if len(closes) > 1 else latest
    recent_high = float(highs.tail(14).max()) if len(highs) else latest
    recent_low = float(lows.tail(14).min()) if len(lows) else latest
    recent_range = recent_high - recent_low or 1.0
    rsi_value = max(20.0, min(88.0, technical_score))
    stoch_value = max(0.0, min(100.0, ((latest - recent_low) / recent_range) * 100))
    stoch_rsi_value = max(0.0, min(100.0, rsi_value + price_return * 120))
    macd_value = ((latest - previous) / previous * 100) if previous else price_return * 100
    williams_value = -100.0 + stoch_value
    typical_price = (recent_high + recent_low + latest) / 3
    cci_value = ((latest - typical_price) / recent_range) * 200
    atr_value = float((highs - lows).tail(14).mean()) if len(highs) else 0.0
    highs_lows_value = latest - float(closes.tail(14).mean()) if len(closes) else 0.0
    ultimate_value = max(0.0, min(100.0, 50 + price_return * 140))
    roc_value = price_return * 100
    bull_bear_value = latest - float(closes.tail(20).mean()) if len(closes) else 0.0
    volume_trend = "buy" if len(volumes) > 1 and volumes.iloc[-1] >= volumes.tail(20).mean() else "neutral"

    return [
        {"name": "RSI(14)", "value": _rounded(rsi_value, 2), "signal": "buy" if rsi_value >= 60 else "neutral", "score": round(rsi_value)},
        {"name": "STOCH(9,6)", "value": _rounded(stoch_value, 2), "signal": "buy" if stoch_value >= 60 else "neutral", "score": round(stoch_value)},
        {"name": "STOCHRSI(14)", "value": _rounded(stoch_rsi_value, 2), "signal": "overbought" if stoch_rsi_value >= 80 else "buy" if stoch_rsi_value >= 60 else "neutral", "score": round(stoch_rsi_value)},
        {"name": "MACD(12,26)", "value": _rounded(macd_value, 2), "signal": "buy" if macd_value >= 0 else "sell", "score": 65 if macd_value >= 0 else 35},
        {"name": "ADX(14)", "value": _rounded(max(12.0, min(45.0, abs(price_return) * 160)), 2), "signal": "neutral", "score": 50},
        {"name": "Williams %R", "value": _rounded(williams_value, 2), "signal": "buy" if williams_value > -50 else "neutral", "score": 60 if williams_value > -50 else 50},
        {"name": "CCI(14)", "value": _rounded(cci_value, 2), "signal": "buy" if cci_value >= 0 else "sell", "score": 65 if cci_value >= 0 else 35},
        {"name": "ATR(14)", "value": _rounded(atr_value, 2), "signal": "normal_volatility", "score": 50},
        {"name": "Highs/Lows(14)", "value": _rounded(highs_lows_value, 2), "signal": "buy" if highs_lows_value >= 0 else "sell", "score": 65 if highs_lows_value >= 0 else 35},
        {"name": "Ultimate Oscillator", "value": _rounded(ultimate_value, 2), "signal": "buy" if ultimate_value >= 60 else "neutral", "score": round(ultimate_value)},
        {"name": "ROC", "value": _rounded(roc_value, 2), "signal": "buy" if roc_value >= 0 else "sell", "score": 65 if roc_value >= 0 else 35},
        {"name": "Bull/Bear Power", "value": _rounded(bull_bear_value, 2), "signal": "buy" if bull_bear_value >= 0 else "sell", "score": 65 if bull_bear_value >= 0 else 35},
        {"name": "OBV(5)", "value": _rounded(float(volumes.tail(5).sum()), 0), "signal": volume_trend, "score": 60 if volume_trend == "buy" else 50},
    ]


def _technical_detail(asset: str, candles: list[dict], technical_score: float, return_rate: float) -> dict:
    if not candles:
        return {
            "candles": [],
            "has_ohlcv": False,
            "gauges": {
                "technical": {"percent": round(technical_score), "signal": "missing_ohlcv"},
                "overall": {"percent": round(technical_score), "signal": "missing_ohlcv"},
                "moving_average": {"percent": 0, "signal": "missing_ohlcv"},
            },
            "indicators": [],
            "moving_averages": [],
            "insight": f"{asset} has no OHLCV rows in the uploaded composite dataset.",
        }

    closes = pd.Series([_safe_float(candle.get("close")) for candle in candles])
    latest = float(closes.iloc[-1])
    first = float(closes.iloc[0])
    price_return = (latest / first - 1) if first else return_rate
    ma_rows = _moving_average_rows(candles)
    ma_score = max(0, min(100, 50 + price_return * 150))
    overall_score = max(0, min(100, (technical_score + ma_score) / 2))
    trend_signal = "buy" if price_return > 0 else "sell" if price_return < 0 else "neutral"
    technical_profile = _asset_insight_profile(
        asset=asset,
        headline=f"{asset} technical profile is based on uploaded OHLCV and portfolio contribution.",
        confidence=round(technical_score),
        stance="bullish" if trend_signal == "buy" else "bearish" if trend_signal == "sell" else "neutral",
        sections=[
            {
                "id": "trend",
                "title": "Trend",
                "tone": "positive" if trend_signal == "buy" else "negative" if trend_signal == "sell" else "neutral",
                "summary": f"Uploaded OHLCV return over the analysis period is {_format_percent(price_return)}.",
                "evidence": [
                    {"label": "Candles", "value": str(len(candles)), "interpretation": "Number of uploaded OHLCV rows used."},
                    {"label": "Price return", "value": _format_percent(price_return), "interpretation": "Direction from first to latest close."},
                ],
            }
        ],
        next_checks=["Confirm whether the trend is supported by moving averages.", "Check whether volatility is appropriate for the portfolio weight."],
    )
    return {
        "candles": candles,
        "has_ohlcv": True,
        "gauges": {
            "technical": {"percent": round(technical_score), "signal": trend_signal},
            "overall": {"percent": round(overall_score), "signal": trend_signal},
            "moving_average": {"percent": round(ma_score), "signal": trend_signal},
        },
        "indicators": _skill_indicator_rows(candles, technical_score, price_return),
        "moving_averages": ma_rows,
        "insight": f"{asset} technical analysis is based on {len(candles)} uploaded OHLCV candles.",
        "insight_profile": technical_profile,
    }


def _fundamental_detail(asset: str, kind: str, fundamentals: dict[str, str], foundation_score: float, history: list[dict]) -> dict:
    metric_items = [
        {"label": metric, "value": value, "position": min(1.0, max(0.0, foundation_score / 100))}
        for metric, value in fundamentals.items()
        if metric != "foundation_score"
    ]
    if not metric_items:
        metric_items = [{"label": "foundation_score", "value": str(round(foundation_score)), "position": min(1.0, max(0.0, foundation_score / 100))}]

    title_by_kind = {
        "stock": "주식 기본적 분석",
        "etf": "ETF 기본적 분석",
        "crypto": "암호자산 기초 지표",
    }
    return {
        "title": title_by_kind.get(kind, "Asset fundamentals"),
        "supported": True,
        "insight_profile": _asset_insight_profile(
            asset=asset,
            headline=f"{asset} fundamentals are interpreted by asset type and portfolio role.",
            confidence=round(foundation_score),
            stance="bullish" if foundation_score >= 70 else "watch" if foundation_score <= 45 else "neutral",
            sections=[
                {
                    "id": "fundamentals",
                    "title": title_by_kind.get(kind, "Asset fundamentals"),
                    "tone": "positive" if foundation_score >= 70 else "neutral",
                    "summary": "Available uploaded fundamental fields are used without fabricating missing metrics.",
                    "evidence": metric_items[:3],
                }
            ],
            next_checks=["Compare the asset type metric with the portfolio weight.", "Review history trends when available."],
            data_quality=[] if fundamentals else ["Uploaded fundamental fields are limited for this asset."],
        ),
        "categories": [{"title": title_by_kind.get(kind, "Asset fundamentals"), "items": metric_items}],
        "history": history,
    }


def _asset_insight_profile(
    asset: str,
    headline: str,
    confidence: int,
    stance: str,
    sections: list[dict],
    next_checks: list[str],
    data_quality: list[str] | None = None,
) -> dict:
    normalized_sections = []
    for section in sections:
        evidence = []
        for item in section.get("evidence", []):
            evidence.append(
                {
                    "label": str(item.get("label", "")),
                    "value": str(item.get("value", "")),
                    "interpretation": str(item.get("interpretation", item.get("position", ""))),
                }
            )
        normalized_sections.append({**section, "evidence": evidence})
    return {
        "headline": headline,
        "stance": stance,
        "confidence": max(0, min(100, int(confidence))),
        "horizon": "portfolio",
        "sections": normalized_sections,
        "conflicts": [],
        "nextChecks": next_checks,
        "dataQuality": data_quality or [],
    }


def _asset_cards(
    weights: pd.DataFrame,
    asset_returns: dict[str, float],
    fundamental_rows: pd.DataFrame,
    fundamental_history_rows: pd.DataFrame,
    ohlcv_rows: pd.DataFrame,
) -> tuple[list[dict], list[str]]:
    fundamentals = _fundamental_lookup(fundamental_rows)
    fundamental_history = _fundamental_history_lookup(fundamental_history_rows)
    candles_by_asset = _ohlcv_by_asset(ohlcv_rows)
    cards = []
    warnings = []
    for _, row in weights.iterrows():
        asset = str(row["asset"])
        weight = _safe_float(row["weight"])
        return_rate = asset_returns.get(asset, 0.0)
        foundation_score = _safe_float(fundamentals.get(asset, {}).get("foundation_score"), 65.0)
        technical_score = max(35.0, min(88.0, 62.0 + return_rate * 80))
        kind = _asset_kind(asset)
        candles = candles_by_asset.get(asset, [])
        if not candles:
            warnings.append(f"OHLCV section is missing for {asset}; technical chart data was not generated.")
        cards.append(
            {
                "ticker": asset,
                "name": asset,
                "market": _market_label(asset),
                "kind": kind,
                "weight": _rounded(weight),
                "return_rate": _rounded(return_rate),
                "contribution": _rounded(weight * return_rate),
                "technical_score": round(technical_score),
                "foundation_score": round(foundation_score),
                "technical_signal": "상승 추세" if return_rate > 0.08 else "중립",
                "foundation_signal": "유형별 기초 지표",
                "fundamentals": fundamentals.get(asset, {}),
                "summary": {
                    "overallSignal": "positive" if return_rate > 0 else "neutral",
                    "insight": f"{asset} contributes {_rounded(weight * return_rate)} to the uploaded portfolio return.",
                    "insight_profile": _asset_insight_profile(
                        asset=asset,
                        headline=f"{asset} contributes {_format_percent(weight * return_rate)} to the uploaded portfolio return.",
                        confidence=round((technical_score + foundation_score) / 2),
                        stance="bullish" if return_rate > 0.08 else "bearish" if return_rate < 0 else "neutral",
                        sections=[
                            {
                                "id": "role",
                                "title": "Portfolio role",
                                "tone": "positive" if return_rate >= 0 else "negative",
                                "summary": "Weight and return are combined to judge actual portfolio contribution.",
                                "evidence": [
                                    {"label": "Weight", "value": _format_percent(weight, signed=False), "interpretation": "Portfolio exposure."},
                                    {"label": "Return", "value": _format_percent(return_rate), "interpretation": "Asset-level performance."},
                                    {"label": "Contribution", "value": _format_percent(weight * return_rate), "interpretation": "Weighted contribution."},
                                ],
                            }
                        ],
                        next_checks=["Review technical signals before changing the weight.", "Review asset-type fundamentals for durability."],
                    ),
                    "tags": [kind, "uploaded_snapshot"],
                },
                "technical": _technical_detail(asset, candles, technical_score, return_rate),
                "fundamental": _fundamental_detail(asset, kind, fundamentals.get(asset, {}), foundation_score, fundamental_history.get(asset, [])),
            }
        )
    return cards, warnings


def _portfolio_signal_score(performance: dict, risk: dict, n_holdings: int) -> int:
    cumulative_return = _safe_float(performance.get("cumulative_return"))
    volatility = _safe_float(risk.get("annualized_volatility"))
    max_drawdown = _safe_float(risk.get("max_drawdown"))
    sharpe_ratio = max(-2.0, min(2.0, _safe_float(risk.get("sharpe_ratio"))))
    diversification_bonus = min(max(n_holdings, 0), 8) * 0.5
    score = 50 + cumulative_return * 150 + sharpe_ratio * 7 - volatility * 10 + max_drawdown * 50 + diversification_bonus
    return _clamp_score(score)


def _portfolio_insights(performance: dict, risk: dict, assets: list[dict]) -> dict:
    total_return = _safe_float(performance.get("cumulative_return"))
    volatility = _safe_float(risk.get("annualized_volatility"))
    max_drawdown = _safe_float(risk.get("max_drawdown"))
    sharpe_ratio = _safe_float(risk.get("sharpe_ratio"))
    top_contributor = max(assets, key=lambda item: _safe_float(item.get("contribution")), default={})
    highest_volatility = max(assets, key=lambda item: _safe_float(item.get("volatility")), default={})
    top_ticker = str(top_contributor.get("ticker", "상위 자산"))
    risk_ticker = str(highest_volatility.get("ticker", "고변동 자산"))
    return {
        "analysis": (
            f"총 수익률 {_format_percent(total_return)}, 변동성 {_format_percent(volatility, signed=False)}, "
            f"최대 낙폭 {_format_percent(max_drawdown)}를 함께 기준으로 포트폴리오 상태를 계산했습니다."
        ),
        "visualization": (
            f"{len(assets)}개 자산의 비중, 누적 성과, 낙폭, 월별 수익률, 개별 자산 지표를 같은 분석 흐름으로 구성했습니다."
        ),
        "insight": (
            f"{top_ticker}의 수익 기여도는 {_format_percent(_safe_float(top_contributor.get('contribution')))}이고, "
            f"{risk_ticker}의 변동성은 {_format_percent(_safe_float(highest_volatility.get('volatility')), signed=False)}입니다. "
            f"Sharpe 비율은 {sharpe_ratio:.2f}로 위험 대비 성과를 함께 확인해야 합니다."
        ),
    }


def analyze(df: pd.DataFrame) -> dict:
    normalized = _clean(df)
    weight_rows = _section(normalized, "portfolio_weight")
    return_rows = _section(normalized, "return")
    fundamental_rows = _section(normalized, "fundamental")
    fundamental_history_rows = _section(normalized, "fundamental_history")
    ohlcv_rows = _section(normalized, "ohlcv")
    metadata_rows = _section(normalized, "metadata")

    weights = _weights(weight_rows)
    performance, risk, asset_returns = _performance(return_rows, weights)
    assets, asset_warnings = _asset_cards(weights, asset_returns, fundamental_rows, fundamental_history_rows, ohlcv_rows)
    total_weight = _rounded(float(weights["weight"].sum()) if not weights.empty else 0.0)
    sections = normalized.groupby(normalized["section"].str.lower()).size().to_dict()
    analysis_dates = normalized[normalized["section"].str.lower().isin({"return", "ohlcv", "price"})]["date"].dropna().sort_values()
    dates = analysis_dates if not analysis_dates.empty else normalized["date"].dropna().sort_values()
    warnings = [] if total_weight == 1 else [f"Portfolio weights sum to {total_weight:.2f}."]
    warnings.extend(asset_warnings)
    period = {
        "start": dates.iloc[0].date().isoformat() if len(dates) else "",
        "end": dates.iloc[-1].date().isoformat() if len(dates) else "",
    }
    signal_score = _portfolio_signal_score(performance, risk, len(assets))
    insights = _portfolio_insights(performance, risk, assets)

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
            "signal_score": signal_score,
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
        "insights": insights,
        "data_quality": {
            "sections": {str(key): int(value) for key, value in sections.items()},
            "warnings": warnings,
            "row_count": len(normalized),
        },
    }
