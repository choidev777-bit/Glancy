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


def test_compose_includes_structured_insight_profile():
    result = {
        "indicators": [
            {"name": "RSI(14)", "value": 61, "signal": "매수", "score": 1},
            {"name": "MACD(12,26)", "value": 2.4, "signal": "매수", "score": 1},
            {"name": "STOCH(9,6)", "value": 82, "signal": "매도", "score": -1},
            {"name": "OBV(5)", "value": 1200000, "signal": "매수", "score": 1},
        ],
        "moving_averages": [
            {"period": 5, "sma": 105, "ema": 106, "signal": "매수", "score": 2},
            {"period": 20, "sma": 100, "ema": 101, "signal": "매수", "score": 2},
            {"period": 50, "sma": 92, "ema": 94, "signal": "매수", "score": 2},
        ],
        "ma_alignment": "정배열",
        "ma_cross": "없음",
        "bollinger": {"upper": 112, "middle": 100, "lower": 88, "signal": "중립"},
        "pivots": {"classic": {"pivot": 100, "r1": 108, "s1": 94}},
        "gauges": {
            "technical": {"percent": 72, "signal": "매수"},
            "moving_average": {"percent": 80, "signal": "매수"},
            "overall": {"percent": 76, "signal": "매수"},
        },
    }

    insights = compose(result, current_price=109)

    profile = insights["insight_profile"]
    assert profile["headline"]
    assert profile["stance"] in {"bullish", "neutral", "bearish", "mixed", "watch"}
    assert 0 <= profile["confidence"] <= 100
    assert {section["id"] for section in profile["sections"]} >= {
        "trend",
        "momentum",
        "volatility",
        "volume",
        "levels",
    }
    assert profile["nextChecks"]
    assert profile["conflicts"], "overbought stochastic should create a mixed-signal conflict"
