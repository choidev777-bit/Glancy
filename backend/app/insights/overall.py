def count_signals(indicators: list[dict]) -> dict[str, int]:
    counts = {"강한 매수": 0, "매수": 0, "중립": 0, "매도": 0, "강한 매도": 0}
    for indicator in indicators:
        signal = indicator.get("signal", "중립")
        if signal in counts:
            counts[signal] += 1
    counts["buy_total"] = counts["강한 매수"] * 2 + counts["매수"]
    counts["sell_total"] = counts["강한 매도"] * 2 + counts["매도"]
    return counts


def find_opposing_pair(indicators: list[dict]) -> tuple[dict, dict] | None:
    positive = next((item for item in indicators if item.get("score", 0) > 0), None)
    negative = next((item for item in indicators if item.get("score", 0) < 0), None)
    if positive and negative:
        return positive, negative
    return None


def overall_insight(
    indicators: list[dict],
    rsi_value: float,
    macd_signal: str,
    ma_alignment: str,
    overall_signal: str,
) -> str:
    counts = count_signals(indicators)
    buy = counts["buy_total"]
    sell = counts["sell_total"]

    rsi_zone = "과매수" if rsi_value > 70 else "과매도" if rsi_value < 30 else "중립"

    if buy > sell * 2 and buy >= 4:
        return (
            "전반적으로 매수 신호가 우세합니다. "
            f"이동평균은 {ma_alignment} 상태이며 RSI {rsi_value:.1f}는 {rsi_zone} 구간, "
            f"MACD는 {macd_signal} 신호를 나타냅니다."
        )

    if sell > buy * 2 and sell >= 4:
        return (
            "전반적으로 매도 압력이 우세합니다. "
            f"RSI {rsi_value:.1f}는 {rsi_zone} 구간이며 이동평균은 {ma_alignment} 상태입니다. "
            "단기 변동성에 유의가 필요합니다."
        )

    pair = find_opposing_pair(indicators)
    if pair:
        positive, negative = pair
        return (
            "지표가 혼재되어 있습니다. "
            f"{positive['name']}는 {positive['signal']}을 나타내지만 "
            f"{negative['name']}는 {negative['signal']} 방향입니다. "
            "추가 확인 후 판단하는 것이 적절합니다."
        )

    return (
        f"종합 시그널은 {overall_signal} 영역입니다. "
        f"RSI {rsi_value:.1f}, 이동평균 {ma_alignment} 상태이며 뚜렷한 방향성은 제한적입니다."
    )

