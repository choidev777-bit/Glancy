def rsi_insight(value: float, signal: str) -> str:
    if signal == "강한 매수":
        return f"RSI {value:.1f}로 극단적 과매도 구간입니다. 단기 반등 가능성이 높아 보입니다."
    if signal == "매수":
        return f"RSI {value:.1f}로 과매도 구간에 진입했습니다."
    if signal == "강한 매도":
        return f"RSI {value:.1f}로 극단적 과매수 구간입니다. 변동성 확대에 유의하세요."
    if signal == "매도":
        return f"RSI {value:.1f}로 과매수 구간입니다. 단기 조정 가능성에 유의하세요."
    if value < 50:
        return f"RSI {value:.1f}로 중립 구간 하단입니다. 약세 우위가 관찰됩니다."
    return f"RSI {value:.1f}로 중립 구간 상단입니다. 강세 우위가 관찰됩니다."


def macd_insight(value: float, signal: str) -> str:
    if signal == "매수":
        if value > 0:
            return "MACD가 양수권에서 신호선을 상회하며 상승 모멘텀이 강화되고 있습니다."
        return "MACD가 신호선을 상향 돌파하며 모멘텀 개선이 관찰됩니다."
    if signal == "매도":
        if value < 0:
            return "MACD가 음수권에서 신호선을 하회하며 하락 모멘텀이 강화되고 있습니다."
        return "MACD가 신호선을 하향 돌파하며 단기 약세 신호가 나타났습니다."
    return f"MACD {value:.2f}. 추가 모멘텀 확인이 필요한 구간입니다."


def ma_insight(alignment: str, cross: str) -> str:
    parts: list[str] = []
    if alignment == "정배열":
        parts.append("이동평균선이 정배열을 유지하며 상승 추세가 확인됩니다.")
    elif alignment == "역배열":
        parts.append("이동평균선이 역배열로 하락 추세가 진행 중입니다.")
    else:
        parts.append("이동평균선이 혼재되어 추세 방향이 불분명합니다.")

    if cross == "골든크로스":
        parts.append("최근 단기선이 장기선을 상향 돌파하며 골든크로스가 발생했습니다.")
    elif cross == "데드크로스":
        parts.append("최근 단기선이 장기선을 하향 돌파하며 데드크로스가 발생했습니다.")

    return " ".join(parts)


def bollinger_insight(position: str) -> str:
    if position == "above_upper":
        return "가격이 볼린저밴드 상단을 이탈했습니다. 과열 또는 강한 돌파 국면입니다."
    if position == "below_lower":
        return "가격이 볼린저밴드 하단을 이탈했습니다. 과매도 또는 추가 하락 국면입니다."
    if position == "near_upper":
        return "가격이 볼린저밴드 상단에 근접했습니다. 저항 구간 진입에 유의하세요."
    if position == "near_lower":
        return "가격이 볼린저밴드 하단에 근접했습니다. 지지 구간 진입이 관찰됩니다."
    return "가격이 볼린저밴드 중심선 부근에서 움직이고 있습니다."


def obv_insight(signal: str) -> str:
    if signal == "매수":
        return "OBV가 상승하며 매수세가 가격 흐름을 뒷받침합니다."
    if signal == "매도":
        return "OBV가 하락하며 매도 압력이 가격 흐름을 뒷받침합니다."
    return "OBV에서 뚜렷한 매매 압력은 관찰되지 않습니다."

