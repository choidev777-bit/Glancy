from app.insights.overall import overall_insight
from app.insights.per_indicator import (
    bollinger_insight,
    ma_insight,
    macd_insight,
    obv_insight,
    rsi_insight,
)
from app.insights.technical_profile import build_technical_profile


def _by_name(indicators: list[dict], prefix: str, default: dict) -> dict:
    return next((item for item in indicators if item.get("name", "").startswith(prefix)), default)


def _bb_position(bb: dict, current_price: float) -> str:
    upper = bb.get("upper", 0)
    lower = bb.get("lower", 0)
    if current_price > upper:
        return "above_upper"
    if upper and current_price > upper * 0.98:
        return "near_upper"
    if current_price < lower:
        return "below_lower"
    if lower and current_price < lower * 1.02:
        return "near_lower"
    return "middle"


def compose(compute_result: dict, current_price: float) -> dict:
    if "error" in compute_result:
        return {"summary": "분석에 필요한 데이터가 부족합니다.", "details": []}

    indicators = compute_result["indicators"]
    rsi_data = _by_name(indicators, "RSI", {"value": 50, "signal": "중립"})
    macd_data = _by_name(indicators, "MACD", {"value": 0, "signal": "중립"})
    obv_data = _by_name(indicators, "OBV", {"signal": "중립"})

    details = [
        {
            "category": "추세",
            "text": ma_insight(compute_result.get("ma_alignment", "혼재"), compute_result.get("ma_cross", "없음")),
        },
        {"category": "모멘텀", "text": rsi_insight(float(rsi_data["value"]), rsi_data["signal"])},
        {"category": "모멘텀", "text": macd_insight(float(macd_data["value"]), macd_data["signal"])},
        {
            "category": "변동성",
            "text": bollinger_insight(_bb_position(compute_result.get("bollinger", {}), current_price)),
        },
        {"category": "거래량", "text": obv_insight(obv_data["signal"])},
    ]

    summary = overall_insight(
        indicators=indicators,
        rsi_value=float(rsi_data["value"]),
        macd_signal=macd_data["signal"],
        ma_alignment=compute_result.get("ma_alignment", "혼재"),
        overall_signal=compute_result["gauges"]["overall"]["signal"],
    )

    profile = build_technical_profile(compute_result, current_price)

    return {"summary": summary, "details": details, "insight_profile": profile}
