def _signal_text(value: str | None) -> str:
    return value or "중립"


def _by_name(indicators: list[dict], prefix: str) -> dict:
    return next((item for item in indicators if str(item.get("name", "")).startswith(prefix)), {})


def _num(value, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _tone_from_signal(signal: str) -> str:
    if "매수" in signal or "상승" in signal or "정배열" in signal:
        return "positive"
    if "매도" in signal or "하락" in signal or "역배열" in signal:
        return "negative"
    return "neutral"


def _stance(overall_signal: str, conflicts: list[str]) -> str:
    if conflicts:
        return "mixed"
    if "매수" in overall_signal or "상승" in overall_signal:
        return "bullish"
    if "매도" in overall_signal or "하락" in overall_signal:
        return "bearish"
    return "neutral"


def build_technical_profile(compute_result: dict, current_price: float) -> dict:
    indicators = compute_result.get("indicators", [])
    moving_averages = compute_result.get("moving_averages", [])
    gauges = compute_result.get("gauges", {})
    overall_signal = _signal_text(gauges.get("overall", {}).get("signal"))
    technical_percent = _num(gauges.get("technical", {}).get("percent"), 50)
    ma_percent = _num(gauges.get("moving_average", {}).get("percent"), 50)

    rsi = _by_name(indicators, "RSI")
    macd = _by_name(indicators, "MACD")
    stoch = _by_name(indicators, "STOCH")
    obv = _by_name(indicators, "OBV")
    roc = _by_name(indicators, "ROC")
    cci = _by_name(indicators, "CCI")
    atr = _by_name(indicators, "ATR")
    ma_alignment = _signal_text(compute_result.get("ma_alignment"))
    ma_cross = _signal_text(compute_result.get("ma_cross"))
    bb = compute_result.get("bollinger", {})
    pivots = compute_result.get("pivots", {}).get("classic", {})

    conflicts: list[str] = []
    rsi_value = _num(rsi.get("value"), 50)
    stoch_value = _num(stoch.get("value"), 50)
    macd_signal = _signal_text(macd.get("signal"))
    if ma_alignment == "정배열" and (rsi_value >= 70 or stoch_value >= 80):
        conflicts.append("추세는 우호적이지만 모멘텀 지표가 과열권에 있어 신규 추격 판단은 확인이 필요합니다.")
    if ma_alignment == "역배열" and macd_signal == "매수":
        conflicts.append("장기 추세는 약하지만 MACD가 개선되어 단기 반등과 추세 전환을 구분해야 합니다.")

    if not conflicts:
        sell_like = [item for item in indicators if "매도" in _signal_text(item.get("signal"))]
        buy_like = [item for item in indicators if "매수" in _signal_text(item.get("signal"))]
        if buy_like and sell_like:
            conflicts.append(
                f"{buy_like[0].get('name')}는 매수 쪽이지만 {sell_like[0].get('name')}는 매도 쪽이라 신호 확인이 필요합니다."
            )

    sections = [
        {
            "id": "trend",
            "title": "추세",
            "tone": _tone_from_signal(ma_alignment),
            "summary": f"이동평균 배열은 {ma_alignment}이고 단기 교차 신호는 {ma_cross}입니다.",
            "evidence": [
                {"label": "MA 점수", "value": f"{ma_percent:.0f}%", "interpretation": "가격이 주요 이동평균 위에 있을수록 추세 점수가 높아집니다."},
                {"label": "배열", "value": ma_alignment, "interpretation": "정배열은 상승 추세 지속, 역배열은 하락 추세 지속 가능성을 뜻합니다."},
            ],
        },
        {
            "id": "momentum",
            "title": "모멘텀",
            "tone": _tone_from_signal(macd_signal),
            "summary": f"RSI {rsi_value:.1f}, MACD {macd_signal}, ROC {_num(roc.get('value')):.2f}로 단기 힘을 확인합니다.",
            "evidence": [
                {"label": "RSI", "value": f"{rsi_value:.1f}", "interpretation": _signal_text(rsi.get("signal"))},
                {"label": "MACD", "value": str(macd.get("value", "-")), "interpretation": macd_signal},
                {"label": "CCI", "value": str(cci.get("value", "-")), "interpretation": _signal_text(cci.get("signal"))},
            ],
        },
        {
            "id": "volatility",
            "title": "변동성",
            "tone": "warning" if current_price >= _num(bb.get("upper")) * 0.98 or current_price <= _num(bb.get("lower")) * 1.02 else "neutral",
            "summary": "볼린저밴드와 ATR로 가격이 정상 범위인지, 변동성 확대 구간인지 확인합니다.",
            "evidence": [
                {"label": "상단 밴드", "value": str(bb.get("upper", "-")), "interpretation": "상단 접근은 돌파와 과열을 함께 봐야 합니다."},
                {"label": "하단 밴드", "value": str(bb.get("lower", "-")), "interpretation": "하단 접근은 지지 확인 전까지 리스크가 큽니다."},
                {"label": "ATR", "value": str(atr.get("value", "-")), "interpretation": _signal_text(atr.get("signal"))},
            ],
        },
        {
            "id": "volume",
            "title": "거래량",
            "tone": _tone_from_signal(_signal_text(obv.get("signal"))),
            "summary": f"OBV는 {_signal_text(obv.get('signal'))} 신호로 가격 움직임의 수급 확인에 사용합니다.",
            "evidence": [
                {"label": "OBV", "value": str(obv.get("value", "-")), "interpretation": _signal_text(obv.get("signal"))},
            ],
        },
        {
            "id": "levels",
            "title": "가격 위치",
            "tone": "neutral",
            "summary": "현재가는 피벗과 볼린저밴드 기준으로 다음 확인 가격대를 제공합니다.",
            "evidence": [
                {"label": "현재가", "value": f"{current_price:.2f}", "interpretation": "최근 계산 기준 가격입니다."},
                {"label": "1차 저항", "value": str(pivots.get("r1", "-")), "interpretation": "상단 돌파 확인 가격대로 사용합니다."},
                {"label": "1차 지지", "value": str(pivots.get("s1", "-")), "interpretation": "이탈 시 리스크 관리 기준으로 봅니다."},
            ],
        },
    ]

    confidence = max(0, min(100, round((technical_percent + ma_percent) / 2)))
    next_checks = [
        "다음 캔들에서 가격이 주요 이동평균 위에 머무는지 확인합니다.",
        "돌파 구간에서는 OBV 또는 거래량 동반 여부를 확인합니다.",
        "과열 신호가 있는 경우 볼린저밴드 상단 재진입 여부를 함께 봅니다.",
    ]

    return {
        "headline": f"종합 기술 판단은 {overall_signal}이며, 추세와 모멘텀의 일치 여부가 핵심입니다.",
        "stance": _stance(overall_signal, conflicts),
        "confidence": confidence,
        "horizon": "short",
        "sections": sections,
        "conflicts": conflicts,
        "nextChecks": next_checks,
        "dataQuality": [],
    }
