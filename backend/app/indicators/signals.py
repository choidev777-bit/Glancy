def normalize_to_percent(score: int, max_abs: int) -> float:
    if max_abs <= 0:
        return 50.0
    percent = ((score + max_abs) / (2 * max_abs)) * 100
    return max(0, min(100, percent))


def percent_to_signal(percent: float) -> str:
    if percent >= 80:
        return "강한 매수"
    if percent >= 60:
        return "매수"
    if percent >= 40:
        return "중립"
    if percent >= 20:
        return "매도"
    return "강한 매도"

