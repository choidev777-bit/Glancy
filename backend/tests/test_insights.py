from app.insights.compose import compose
from app.insights.overall import count_signals, overall_insight
from app.insights.per_indicator import ma_insight, macd_insight, rsi_insight


def test_rsi_insight_oversold():
    text = rsi_insight(15, "강한 매수")
    assert "극단적 과매도" in text


def test_macd_buy():
    text = macd_insight(0.5, "매수")
    assert "상승 모멘텀" in text or "모멘텀 개선" in text


def test_ma_insight_uptrend():
    text = ma_insight("정배열", "골든크로스")
    assert "정배열" in text
    assert "골든크로스" in text


def test_count_signals():
    counts = count_signals(
        [
            {"signal": "강한 매수"},
            {"signal": "매수"},
            {"signal": "매도"},
        ]
    )
    assert counts["buy_total"] == 3
    assert counts["sell_total"] == 1


def test_overall_buy_summary():
    indicators = [{"name": f"I{idx}", "signal": "매수", "score": 1} for idx in range(5)]
    text = overall_insight(indicators, 55, "매수", "정배열", "매수")
    assert "매수 신호" in text


def test_compose_shape():
    result = {
        "indicators": [
            {"name": "RSI(14)", "value": 45, "signal": "중립", "score": 0},
            {"name": "MACD(12,26)", "value": 1.2, "signal": "매수", "score": 1},
            {"name": "OBV", "value": 1000, "signal": "매수", "score": 1},
        ],
        "ma_alignment": "정배열",
        "ma_cross": "없음",
        "bollinger": {"upper": 120, "middle": 100, "lower": 80},
        "gauges": {"overall": {"signal": "매수"}},
    }
    insights = compose(result, current_price=101)
    assert "summary" in insights
    assert len(insights["details"]) >= 4

