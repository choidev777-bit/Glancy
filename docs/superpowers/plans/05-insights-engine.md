# Plan 05 — 인사이트 생성 엔진 (규칙 기반, 외부 LLM 미사용)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** insights.md의 규칙을 코드로 구현하여, 지표 결과를 입력받아 한국어 자연어 인사이트 텍스트를 생성하는 엔진을 만든다. 외부 LLM API는 호출하지 않는다.

**Architecture:** `backend/app/insights/`에 분류별 모듈 분리. 각 모듈은 IF/THEN 규칙 + 텍스트 템플릿 패턴 매칭. `compose_insights()`가 종합 텍스트를 생성한다.

**Tech Stack:** Python 표준 라이브러리만 (외부 의존 없음).

**예상 소요:** 4~6시간

---

## File Structure

```
backend/app/insights/
├── __init__.py
├── per_indicator.py     # 지표별 단문 인사이트
├── overall.py           # 종합 인사이트 (멀티 지표 결합)
├── multi_timeframe.py   # 시간대별 종합 (선택)
└── compose.py           # 외부 진입점
backend/tests/test_insights.py
```

---

## Tasks

### Task 1: 모듈 부트스트랩 + 지표별 인사이트

**Files:**
- Create: `backend/app/insights/__init__.py`
- Create: `backend/app/insights/per_indicator.py`

- [ ] **Step 1: 디렉터리 + init**

```powershell
New-Item -ItemType Directory -Force -Path "backend\app\insights" | Out-Null
New-Item -ItemType File -Force -Path "backend\app\insights\__init__.py" | Out-Null
```

- [ ] **Step 2: `per_indicator.py` 작성**

```python
"""각 지표별 단문 인사이트 생성. 규칙 기반."""


def rsi_insight(value: float, signal: str) -> str:
    if signal == "강한 매수":
        return f"RSI {value:.1f}로 극단적 과매도 구간입니다. 단기 반등 가능성이 높아 보입니다."
    if signal == "매수":
        return f"RSI {value:.1f}로 과매도 구간에 진입했습니다. 매수 관심 구간입니다."
    if signal == "강한 매도":
        return f"RSI {value:.1f}로 극단적 과매수 구간입니다. 단기 조정 가능성에 유의하세요."
    if signal == "매도":
        return f"RSI {value:.1f}로 과매수 구간입니다. 차익 실현 매물에 유의하세요."
    if value < 50:
        return f"RSI {value:.1f}로 중립 구간 하단입니다. 약세 우위가 관찰됩니다."
    return f"RSI {value:.1f}로 중립 구간 상단입니다. 강세 우위가 관찰됩니다."


def macd_insight(macd_value: float, signal: str) -> str:
    if signal == "매수":
        if macd_value > 0:
            return "MACD가 양수권에서 신호선을 상향 돌파했습니다. 상승 모멘텀이 강화되고 있습니다."
        return "MACD가 신호선을 상향 돌파하여 골든크로스 신호가 형성되었습니다."
    if signal == "매도":
        if macd_value < 0:
            return "MACD가 음수권에서 신호선을 하향 돌파했습니다. 하락 모멘텀이 강화되고 있습니다."
        return "MACD가 신호선을 하향 돌파하여 데드크로스 신호가 형성되었습니다."
    return f"MACD {macd_value:.2f}. 추가 모멘텀 확인이 필요한 구간입니다."


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


def bollinger_insight(position: str, signal: str) -> str:
    """position: 'above_upper' / 'near_upper' / 'middle' / 'near_lower' / 'below_lower'."""
    if position == "above_upper":
        return "주가가 볼린저밴드 상단을 이탈했습니다. 과매수 또는 강한 돌파 국면입니다."
    if position == "below_lower":
        return "주가가 볼린저밴드 하단을 이탈했습니다. 과매도 또는 추가 하락 국면입니다."
    if position == "near_upper":
        return "주가가 볼린저밴드 상단에 근접했습니다. 저항 구간 진입에 유의하세요."
    if position == "near_lower":
        return "주가가 볼린저밴드 하단에 근접했습니다. 지지 구간 진입이 관찰됩니다."
    return "주가가 볼린저밴드 중심선 부근에서 움직이고 있습니다."


def adx_insight(adx_value: float, signal: str) -> str:
    if adx_value < 20:
        return f"ADX {adx_value:.1f}로 추세 강도가 약합니다. 횡보 가능성이 높습니다."
    if adx_value < 25:
        return f"ADX {adx_value:.1f}로 추세가 형성되는 초기 단계입니다."
    if adx_value < 50:
        direction = "상승" if signal == "매수" else "하락"
        return f"ADX {adx_value:.1f}로 강한 {direction} 추세가 확인됩니다."
    return f"ADX {adx_value:.1f}로 매우 강한 추세가 진행 중입니다."


def obv_insight(obv_signal: str) -> str:
    mapping = {
        "매수": "OBV가 상승하며 매수세가 추세를 뒷받침합니다.",
        "매도": "OBV가 하락하며 매도 압력이 추세를 뒷받침합니다.",
        "중립": "OBV에서 뚜렷한 매매 압력이 관찰되지 않습니다.",
    }
    return mapping.get(obv_signal, "OBV 신호가 불분명합니다.")
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/insights/
git commit -m "feat(insights): per-indicator narrative rules"
```

---

### Task 2: 종합 인사이트 (전체 시그널 결합)

**Files:**
- Create: `backend/app/insights/overall.py`

- [ ] **Step 1: `overall.py` 작성**

```python
"""종합 인사이트: 매수/매도 카운트와 핵심 지표를 결합한 자연어 텍스트."""


def count_signals(indicators: list[dict]) -> dict[str, int]:
    counts = {"강한 매수": 0, "매수": 0, "중립": 0, "매도": 0, "강한 매도": 0}
    for ind in indicators:
        sig = ind.get("signal", "중립")
        if sig in counts:
            counts[sig] += 1
    counts["buy_total"] = counts["강한 매수"] * 2 + counts["매수"]
    counts["sell_total"] = counts["강한 매도"] * 2 + counts["매도"]
    return counts


def find_strongest(indicators: list[dict]) -> dict | None:
    if not indicators:
        return None
    return max(indicators, key=lambda x: abs(x.get("score", 0)))


def overall_insight(
    indicators: list[dict],
    rsi_value: float,
    rsi_signal: str,
    macd_signal: str,
    ma_alignment: str,
    overall_signal: str,
) -> str:
    """종합 인사이트 텍스트 생성."""
    counts = count_signals(indicators)
    buy = counts["buy_total"]
    sell = counts["sell_total"]

    rsi_zone_label = (
        "과매수" if rsi_value > 70 else
        "과매도" if rsi_value < 30 else
        "중립"
    )

    if buy > sell * 2 and buy >= 4:
        return (
            f"전반적으로 강한 매수 신호가 우세합니다. "
            f"이동평균선 {ma_alignment} 상태에서 RSI {rsi_value:.1f}로 {rsi_zone_label} 구간이며, "
            f"MACD {macd_signal} 신호가 확인됩니다."
        )

    if sell > buy * 2 and sell >= 4:
        return (
            f"전반적으로 매도 압력이 우세합니다. "
            f"RSI {rsi_value:.1f}로 {rsi_zone_label} 구간이며, "
            f"이동평균선 {ma_alignment} 상태입니다. 단기 조정 가능성에 유의하세요."
        )

    strongest = find_strongest(indicators)
    if strongest:
        opposite = next(
            (x for x in indicators
             if (strongest.get("score", 0) > 0 and x.get("score", 0) < 0)
             or (strongest.get("score", 0) < 0 and x.get("score", 0) > 0)),
            None,
        )
        if opposite:
            return (
                f"지표가 혼재되어 있습니다. "
                f"{strongest['name']}가 {strongest['signal']}을 나타내나 "
                f"{opposite['name']}는 반대 방향을 가리킵니다. "
                f"추가 확인 후 판단을 권장합니다."
            )

    return (
        f"종합 시그널은 {overall_signal} 영역에 위치합니다. "
        f"RSI {rsi_value:.1f}, 이동평균 {ma_alignment} 상태이며, "
        f"뚜렷한 추세 변환 신호는 관찰되지 않습니다."
    )
```

- [ ] **Step 2: 커밋**

```bash
git add backend/app/insights/overall.py
git commit -m "feat(insights): overall narrative composer"
```

---

### Task 3: 멀티 타임프레임 종합 (선택)

**Files:**
- Create: `backend/app/insights/multi_timeframe.py`

- [ ] **Step 1: `multi_timeframe.py` 작성**

```python
"""여러 타임프레임의 시그널을 결합한 자연어."""

ORDER = ["hourly", "daily", "weekly", "monthly"]
KOREAN = {"hourly": "시간", "daily": "일", "weekly": "주", "monthly": "월"}


def multi_timeframe_insight(signals: dict[str, str]) -> str:
    """signals: {'hourly': '매수', 'daily': '중립', ...}"""
    available = [(tf, signals[tf]) for tf in ORDER if tf in signals]
    if not available:
        return ""

    if all(sig == "매수" for _, sig in available):
        return "전 시간대에서 매수 신호가 정렬되어 추세 신뢰도가 높습니다."
    if all(sig == "매도" for _, sig in available):
        return "전 시간대에서 매도 신호가 정렬되어 하락 압력이 강합니다."

    short_tf, short_sig = available[0]
    long_tf, long_sig = available[-1]
    if short_sig == long_sig:
        middle = [s for _, s in available[1:-1]]
        if any(s != short_sig for s in middle):
            return f"단기({KOREAN[short_tf]}봉)와 장기({KOREAN[long_tf]}봉)는 {short_sig}이나 중기는 혼재되어 있습니다."

    return (
        f"단기({KOREAN[short_tf]}봉) {short_sig}, "
        f"장기({KOREAN[long_tf]}봉) {long_sig}으로 시간대별 신호가 다릅니다. "
        f"본인의 투자 시간대에 맞는 시그널을 우선 참고하세요."
    )
```

- [ ] **Step 2: 커밋**

```bash
git add backend/app/insights/multi_timeframe.py
git commit -m "feat(insights): multi-timeframe summary"
```

---

### Task 4: compose 진입점 + 라우터 연결

**Files:**
- Create: `backend/app/insights/compose.py`
- Modify: `backend/app/routers/indicators.py`

- [ ] **Step 1: `compose.py` 작성**

```python
"""외부 진입점: compute_all 결과 → 인사이트 텍스트."""
from app.insights.overall import overall_insight
from app.insights.per_indicator import (
    adx_insight, bollinger_insight, ma_insight, macd_insight, obv_insight, rsi_insight,
)


def _bb_position(bb: dict, current: float) -> str:
    upper, lower, middle = bb["upper"], bb["lower"], bb["middle"]
    if current > upper:
        return "above_upper"
    if current > upper * 0.98:
        return "near_upper"
    if current < lower:
        return "below_lower"
    if current < lower * 1.02:
        return "near_lower"
    return "middle"


def compose(compute_result: dict, current_price: float) -> dict:
    """compute_all 결과 → 카테고리별 인사이트 + 종합 인사이트."""
    if "error" in compute_result:
        return {"summary": "분석에 필요한 데이터가 부족합니다.", "details": []}

    inds = compute_result["indicators"]
    by_name = {x["name"]: x for x in inds}

    rsi_data = by_name.get("RSI(14)", {"value": 50, "signal": "중립"})
    macd_data = by_name.get("MACD(12,26)", {"value": 0, "signal": "중립"})
    adx_data = by_name.get("ADX(14)", {"value": 0, "signal": "중립"})
    obv_data = by_name.get("OBV", {"signal": "중립"})

    bb = compute_result.get("bollinger", {"upper": 0, "lower": 0, "middle": 0})

    details: list[dict] = []
    details.append({"category": "추세", "text": ma_insight(compute_result["ma_alignment"], compute_result["ma_cross"])})
    details.append({"category": "모멘텀", "text": rsi_insight(rsi_data["value"], rsi_data["signal"])})
    details.append({"category": "모멘텀", "text": macd_insight(macd_data["value"], macd_data["signal"])})
    details.append({"category": "변동성", "text": bollinger_insight(_bb_position(bb, current_price), "")})
    details.append({"category": "추세 강도", "text": adx_insight(adx_data["value"], adx_data["signal"])})
    details.append({"category": "거래량", "text": obv_insight(obv_data["signal"])})

    summary = overall_insight(
        indicators=inds,
        rsi_value=rsi_data["value"],
        rsi_signal=rsi_data["signal"],
        macd_signal=macd_data["signal"],
        ma_alignment=compute_result["ma_alignment"],
        overall_signal=compute_result["gauges"]["overall"]["signal"],
    )

    return {"summary": summary, "details": details}
```

- [ ] **Step 2: indicators 라우터에 인사이트 추가**

`backend/app/routers/indicators.py`에 추가:

```python
from app.insights.compose import compose

# 기존 함수들 수정 — 반환에 insights 추가
@router.get("/kr-stocks/{ticker}")
def kr_indicators(ticker: str, days: int = Query(365, ge=30, le=3650)):
    data = get_kr_stock_ohlcv(ticker, days=days)
    result = compute_all(data)
    if "error" not in result:
        result["insights"] = compose(result, current_price=data.candles[-1].close)
    return result


@router.get("/us-stocks/{symbol}")
def us_indicators(symbol: str, period: str = "1y"):
    data = get_yf_ohlcv(symbol.upper(), source="us_stocks", period=period)
    result = compute_all(data)
    if "error" not in result:
        result["insights"] = compose(result, current_price=data.candles[-1].close)
    return result


@router.get("/crypto/{symbol}")
def crypto_indicators(symbol: str, interval: str = "1d", limit: int = Query(365, ge=30)):
    data = get_binance_klines(symbol.upper(), interval=interval, limit=limit)
    result = compute_all(data)
    if "error" not in result:
        result["insights"] = compose(result, current_price=data.candles[-1].close)
    return result
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/insights/compose.py backend/app/routers/indicators.py
git commit -m "feat(insights): compose entry point + router integration"
```

---

### Task 5: 단위 테스트

**Files:**
- Create: `backend/tests/test_insights.py`

- [ ] **Step 1: 테스트 작성**

```python
from app.insights.overall import count_signals, overall_insight
from app.insights.per_indicator import (
    adx_insight, ma_insight, macd_insight, rsi_insight,
)
from app.insights.multi_timeframe import multi_timeframe_insight


def test_rsi_insight_oversold():
    text = rsi_insight(15, "강한 매수")
    assert "극단적 과매도" in text
    assert "15" in text


def test_rsi_insight_overbought():
    text = rsi_insight(85, "강한 매도")
    assert "극단적 과매수" in text


def test_macd_golden_cross():
    text = macd_insight(0.5, "매수")
    assert "골든크로스" in text or "상향 돌파" in text


def test_ma_insight_uptrend():
    text = ma_insight("정배열", "골든크로스")
    assert "정배열" in text
    assert "골든크로스" in text


def test_count_signals_basic():
    inds = [
        {"signal": "매수", "score": 1},
        {"signal": "매수", "score": 1},
        {"signal": "강한 매수", "score": 2},
        {"signal": "매도", "score": -1},
    ]
    counts = count_signals(inds)
    assert counts["매수"] == 2
    assert counts["강한 매수"] == 1
    assert counts["buy_total"] == 4  # 2 + 1*2


def test_overall_strong_buy():
    inds = [{"signal": "매수", "score": 1, "name": f"X{i}"} for i in range(5)]
    text = overall_insight(inds, 65, "중립", "매수", "정배열", "매수")
    assert "강한 매수" in text or "매수 신호" in text


def test_multi_timeframe_aligned_buy():
    text = multi_timeframe_insight({"hourly": "매수", "daily": "매수", "weekly": "매수"})
    assert "정렬" in text


def test_multi_timeframe_conflicting():
    text = multi_timeframe_insight({"hourly": "매수", "weekly": "매도"})
    assert "단기" in text and "장기" in text
```

- [ ] **Step 2: 실행 + 커밋**

```bash
pytest tests/test_insights.py -v
git add backend/tests/test_insights.py
git commit -m "test(insights): unit tests"
```

---

## Self-Review

- [ ] 모든 핵심 지표(RSI/MACD/MA/BB/ADX/OBV)에 인사이트 함수 있는가?
- [ ] "외부 LLM API 미사용" 원칙 준수?
- [ ] 한국어 톤 가이드(객관적, 단정 금지) 준수?
- [ ] 인사이트 결과가 라우터 응답 `insights` 필드로 전달?

## 완료 조건

`pytest tests/test_insights.py` 통과 + API 응답에 `insights.summary` / `insights.details` 포함.
