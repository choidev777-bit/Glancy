# Plan 04 — 지표 계산 엔진

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `MarketData`를 입력받아 indicators.md 규칙에 따라 모든 기술 지표를 계산하고, 시그널 점수까지 산출하는 백엔드 엔진을 구현한다.

**Architecture:** `backend/app/indicators/` 하위에 모듈별 파일 분리(추세 / 모멘텀 / 변동성 / 강도 / 거래량 / 피벗). 각 함수는 pandas DataFrame을 입력으로 받아 시리즈 또는 단일 값 반환. 최종 `compute_all()`이 전체 묶음과 게이지 점수 반환.

**Tech Stack:** pandas / numpy / pandas-ta (또는 직접 구현)

**예상 소요:** 6~10시간

---

## File Structure

```
backend/
├── app/
│   ├── indicators/
│   │   ├── __init__.py
│   │   ├── trend.py          # MA(SMA/EMA), 정배열, 골든/데드크로스
│   │   ├── momentum.py       # RSI, MACD, Stochastic, StochRSI
│   │   ├── volatility.py     # 볼린저밴드, ATR
│   │   ├── strength.py       # ADX, Williams %R, CCI, ROC, Bull/Bear, UO
│   │   ├── volume.py         # OBV, Volume MA
│   │   ├── pivot.py          # Classic, Fibonacci, Camarilla, Woodie's, DeMark's
│   │   ├── signals.py        # 시그널 점수화, 게이지 계산
│   │   └── compute.py        # 외부 진입점 (compute_all)
│   ├── routers/
│   │   └── indicators.py     # GET /indicators/{...}
│   └── ...
└── tests/
    └── test_indicators.py
```

---

## Tasks

### Task 1: 의존성 추가 + 모듈 부트스트랩

**Files:**
- Modify: `backend/pyproject.toml`
- Create: `backend/app/indicators/__init__.py`

- [ ] **Step 1: pandas-ta 추가**

`pyproject.toml`의 dependencies에 추가:
```toml
"pandas-ta>=0.3.14b0",
```

- [ ] **Step 2: 설치**

```powershell
pip install pandas-ta
```

- [ ] **Step 3: 빈 init 생성**

```powershell
New-Item -ItemType Directory -Force -Path "backend\app\indicators" | Out-Null
New-Item -ItemType File -Force -Path "backend\app\indicators\__init__.py" | Out-Null
```

- [ ] **Step 4: 커밋**

```bash
git add backend/pyproject.toml backend/app/indicators/__init__.py
git commit -m "feat(indicators): add pandas-ta dep + scaffold module"
```

---

### Task 2: 추세 지표 (이동평균 + 정배열 + 크로스)

**Files:**
- Create: `backend/app/indicators/trend.py`
- Create: `backend/tests/test_trend.py`

- [ ] **Step 1: `trend.py` 작성**

```python
"""추세 지표: SMA, EMA, 정배열, 골든/데드크로스."""
from typing import Iterable

import pandas as pd


def sma(close: pd.Series, period: int) -> pd.Series:
    return close.rolling(window=period, min_periods=period).mean()


def ema(close: pd.Series, period: int) -> pd.Series:
    return close.ewm(span=period, adjust=False).mean()


def ma_alignment(values: dict[int, float]) -> str:
    """{5: ma5_value, 20: ma20_value, 60: ma60_value} → '정배열'/'역배열'/'혼재'."""
    keys = sorted(values.keys())
    if len(keys) < 2:
        return "혼재"
    asc = all(values[keys[i]] > values[keys[i + 1]] for i in range(len(keys) - 1))
    desc = all(values[keys[i]] < values[keys[i + 1]] for i in range(len(keys) - 1))
    if asc:
        return "정배열"
    if desc:
        return "역배열"
    return "혼재"


def detect_cross(short: pd.Series, long: pd.Series) -> str:
    """최근 5개 봉에서 크로스 감지. '골든크로스' / '데드크로스' / '없음'."""
    if len(short) < 5 or len(long) < 5:
        return "없음"
    recent_short = short.tail(5).values
    recent_long = long.tail(5).values
    for i in range(1, 5):
        if recent_short[i - 1] <= recent_long[i - 1] and recent_short[i] > recent_long[i]:
            return "골든크로스"
        if recent_short[i - 1] >= recent_long[i - 1] and recent_short[i] < recent_long[i]:
            return "데드크로스"
    return "없음"


def ma_signals(close: pd.Series, periods: Iterable[int] = (5, 10, 20, 50, 100, 200)) -> list[dict]:
    """각 MA에 대해 현재가 > MA 비교 + signal 매핑."""
    current = float(close.iloc[-1])
    out: list[dict] = []
    for p in periods:
        sma_v = sma(close, p)
        ema_v = ema(close, p)
        sma_last = float(sma_v.iloc[-1]) if not pd.isna(sma_v.iloc[-1]) else None
        ema_last = float(ema_v.iloc[-1]) if not pd.isna(ema_v.iloc[-1]) else None
        out.append({
            "period": p,
            "sma": sma_last,
            "ema": ema_last,
            "signal": "매수" if sma_last and current > sma_last else "매도",
            "score": 1 if sma_last and current > sma_last else -1,
        })
    return out
```

- [ ] **Step 2: 테스트 작성**

```python
import numpy as np
import pandas as pd

from app.indicators.trend import detect_cross, ma_alignment, ma_signals, sma


def _series(values: list[float]) -> pd.Series:
    return pd.Series(values)


def test_sma_basic():
    s = _series([1, 2, 3, 4, 5])
    result = sma(s, 3).tolist()
    assert result[2] == 2.0
    assert result[3] == 3.0
    assert result[4] == 4.0


def test_ma_alignment_uptrend():
    assert ma_alignment({5: 100, 20: 90, 60: 80}) == "정배열"


def test_ma_alignment_downtrend():
    assert ma_alignment({5: 80, 20: 90, 60: 100}) == "역배열"


def test_ma_alignment_mixed():
    assert ma_alignment({5: 100, 20: 80, 60: 90}) == "혼재"


def test_golden_cross_detected():
    short = _series([10, 10, 10, 11, 12])
    long = _series([11, 11, 11, 11, 11])
    assert detect_cross(short, long) == "골든크로스"


def test_death_cross_detected():
    short = _series([12, 12, 11, 10, 9])
    long = _series([11, 11, 11, 11, 11])
    assert detect_cross(short, long) == "데드크로스"


def test_ma_signals_returns_six_periods():
    np.random.seed(0)
    close = _series(np.cumsum(np.random.randn(250)) + 100)
    result = ma_signals(close)
    assert len(result) == 6
    assert all("signal" in r for r in result)
```

- [ ] **Step 3: 테스트 실행**

```powershell
cd backend
pytest tests/test_trend.py -v
```

기대: 모두 PASS.

- [ ] **Step 4: 커밋**

```bash
git add backend/app/indicators/trend.py backend/tests/test_trend.py
git commit -m "feat(indicators): trend indicators (SMA/EMA, alignment, cross)"
```

---

### Task 3: 모멘텀 지표 (RSI / MACD / Stochastic)

**Files:**
- Create: `backend/app/indicators/momentum.py`
- Create: `backend/tests/test_momentum.py`

- [ ] **Step 1: `momentum.py` 작성**

```python
"""모멘텀: RSI, MACD, Stochastic, StochRSI."""
import numpy as np
import pandas as pd


def rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def rsi_signal(rsi_value: float, overbought: float = 70, oversold: float = 30) -> tuple[str, int]:
    if pd.isna(rsi_value):
        return "중립", 0
    if rsi_value < 20:
        return "강한 매수", 2
    if rsi_value < oversold:
        return "매수", 1
    if rsi_value < 50:
        return "중립", 0
    if rsi_value < overbought:
        return "중립", 0
    if rsi_value < 80:
        return "매도", -1
    return "강한 매도", -2


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> dict[str, pd.Series]:
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist = macd_line - signal_line
    return {"macd": macd_line, "signal": signal_line, "histogram": hist}


def macd_signal(macd_data: dict[str, pd.Series]) -> tuple[str, int]:
    macd_l, sig_l, hist = macd_data["macd"], macd_data["signal"], macd_data["histogram"]
    if len(macd_l) < 2:
        return "중립", 0
    macd_now, macd_prev = float(macd_l.iloc[-1]), float(macd_l.iloc[-2])
    sig_now, sig_prev = float(sig_l.iloc[-1]), float(sig_l.iloc[-2])
    hist_now, hist_prev = float(hist.iloc[-1]), float(hist.iloc[-2])

    if macd_prev <= sig_prev and macd_now > sig_now:
        return "매수", 1  # 골든크로스
    if macd_prev >= sig_prev and macd_now < sig_now:
        return "매도", -1  # 데드크로스
    if macd_now > sig_now and hist_now > hist_prev:
        return "매수", 1
    if macd_now < sig_now and hist_now < hist_prev:
        return "매도", -1
    return "중립", 0


def stochastic(high: pd.Series, low: pd.Series, close: pd.Series, k_period: int = 9, d_period: int = 6) -> dict[str, pd.Series]:
    lowest = low.rolling(window=k_period).min()
    highest = high.rolling(window=k_period).max()
    k = 100 * (close - lowest) / (highest - lowest).replace(0, np.nan)
    d = k.rolling(window=d_period).mean()
    return {"k": k, "d": d}


def stochastic_signal(stoch: dict[str, pd.Series]) -> tuple[str, int]:
    k_now = float(stoch["k"].iloc[-1])
    if pd.isna(k_now):
        return "중립", 0
    if k_now < 20:
        return "매수", 1
    if k_now > 80:
        return "매도", -1
    return "중립", 0


def stoch_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    rsi_v = rsi(close, period)
    lowest = rsi_v.rolling(window=period).min()
    highest = rsi_v.rolling(window=period).max()
    return (rsi_v - lowest) / (highest - lowest).replace(0, np.nan)
```

- [ ] **Step 2: 테스트 작성**

```python
import numpy as np
import pandas as pd

from app.indicators.momentum import macd, macd_signal, rsi, rsi_signal, stochastic, stochastic_signal


def _close():
    np.random.seed(0)
    return pd.Series(np.cumsum(np.random.randn(100)) + 100)


def test_rsi_returns_series():
    r = rsi(_close())
    assert len(r) == 100
    valid = r.dropna()
    assert all(0 <= v <= 100 for v in valid)


def test_rsi_signal_extremes():
    assert rsi_signal(15) == ("강한 매수", 2)
    assert rsi_signal(25) == ("매수", 1)
    assert rsi_signal(50) == ("중립", 0)
    assert rsi_signal(75) == ("매도", -1)
    assert rsi_signal(85) == ("강한 매도", -2)


def test_macd_returns_three_series():
    result = macd(_close())
    assert set(result.keys()) == {"macd", "signal", "histogram"}
    assert len(result["macd"]) == 100


def test_stochastic_signal():
    high = _close() + 1
    low = _close() - 1
    close = _close()
    result = stochastic(high, low, close)
    sig, score = stochastic_signal(result)
    assert sig in {"매수", "매도", "중립"}
```

- [ ] **Step 3: 테스트 실행 + 커밋**

```bash
pytest tests/test_momentum.py -v
git add backend/app/indicators/momentum.py backend/tests/test_momentum.py
git commit -m "feat(indicators): momentum (RSI, MACD, Stochastic)"
```

---

### Task 4: 변동성 지표 (볼린저밴드 + ATR)

**Files:**
- Create: `backend/app/indicators/volatility.py`
- Create: `backend/tests/test_volatility.py`

- [ ] **Step 1: `volatility.py` 작성**

```python
import pandas as pd


def bollinger_bands(close: pd.Series, period: int = 20, std: float = 2.0) -> dict[str, pd.Series]:
    middle = close.rolling(window=period).mean()
    deviation = close.rolling(window=period).std()
    upper = middle + (deviation * std)
    lower = middle - (deviation * std)
    bandwidth = (upper - lower) / middle
    return {"upper": upper, "middle": middle, "lower": lower, "bandwidth": bandwidth}


def bollinger_signal(bb: dict[str, pd.Series], current_price: float) -> tuple[str, int]:
    u = float(bb["upper"].iloc[-1])
    l = float(bb["lower"].iloc[-1])
    m = float(bb["middle"].iloc[-1])
    if pd.isna(u) or pd.isna(l):
        return "중립", 0
    if current_price > u:
        return "매도", -1
    if current_price < l:
        return "매수", 1
    if current_price > u * 0.98:
        return "매도", -1
    if current_price < l * 1.02:
        return "매수", 1
    return "중립", 0


def atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()


def atr_signal(atr_value: float, atr_avg: float) -> tuple[str, int]:
    """ATR은 방향성 없음. 변동성 맥락만 반환."""
    if pd.isna(atr_value) or pd.isna(atr_avg) or atr_avg == 0:
        return "중립", 0
    ratio = atr_value / atr_avg
    if ratio > 1.5:
        return "변동적", 0
    if ratio < 0.7:
        return "덜 변동적", 0
    return "보통", 0
```

- [ ] **Step 2: 테스트**

```python
import numpy as np
import pandas as pd

from app.indicators.volatility import atr, bollinger_bands, bollinger_signal


def test_bollinger_bands_structure():
    close = pd.Series(np.random.randn(50).cumsum() + 100)
    bb = bollinger_bands(close)
    assert set(bb.keys()) == {"upper", "middle", "lower", "bandwidth"}


def test_bollinger_signal_above_upper():
    close = pd.Series([100] * 30)
    bb = bollinger_bands(close)
    sig, score = bollinger_signal(bb, 110)
    assert sig in {"매도", "중립"}


def test_atr_returns_series():
    n = 50
    high = pd.Series(np.random.randn(n).cumsum() + 105)
    low = pd.Series(np.random.randn(n).cumsum() + 95)
    close = pd.Series(np.random.randn(n).cumsum() + 100)
    a = atr(high, low, close)
    assert len(a) == n
```

- [ ] **Step 3: 테스트 실행 + 커밋**

```bash
pytest tests/test_volatility.py -v
git add backend/app/indicators/volatility.py backend/tests/test_volatility.py
git commit -m "feat(indicators): volatility (Bollinger Bands, ATR)"
```

---

### Task 5: 추세 강도 지표 (ADX / Williams %R / CCI / ROC / Bull-Bear / UO)

**Files:**
- Create: `backend/app/indicators/strength.py`
- Create: `backend/tests/test_strength.py`

- [ ] **Step 1: `strength.py` 작성**

```python
import numpy as np
import pandas as pd
import pandas_ta as ta


def adx(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> dict[str, pd.Series]:
    df = ta.adx(high=high, low=low, close=close, length=period)
    if df is None:
        return {"adx": pd.Series(dtype=float), "+di": pd.Series(dtype=float), "-di": pd.Series(dtype=float)}
    return {
        "adx": df[f"ADX_{period}"],
        "+di": df[f"DMP_{period}"],
        "-di": df[f"DMN_{period}"],
    }


def adx_signal(adx_data: dict[str, pd.Series]) -> tuple[str, int]:
    adx_now = float(adx_data["adx"].iloc[-1])
    pdi = float(adx_data["+di"].iloc[-1])
    mdi = float(adx_data["-di"].iloc[-1])
    if pd.isna(adx_now):
        return "중립", 0
    if adx_now < 20:
        return "중립", 0
    if adx_now < 25:
        return "중립", 0
    if pdi > mdi:
        return "매수", 1 if adx_now < 50 else 2
    return "매도", -1 if adx_now < 50 else -2


def williams_r(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    highest = high.rolling(window=period).max()
    lowest = low.rolling(window=period).min()
    return -100 * (highest - close) / (highest - lowest).replace(0, np.nan)


def williams_r_signal(value: float) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    if value <= -80:
        return "매수", 1
    if value >= -20:
        return "매도", -1
    return "중립", 0


def cci(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    tp = (high + low + close) / 3
    sma = tp.rolling(window=period).mean()
    md = tp.rolling(window=period).apply(lambda x: np.fabs(x - x.mean()).mean(), raw=False)
    return (tp - sma) / (0.015 * md.replace(0, np.nan))


def cci_signal(value: float) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    if value > 200:
        return "강한 매도", -2
    if value > 100:
        return "매도", -1
    if value < -200:
        return "강한 매수", 2
    if value < -100:
        return "매수", 1
    return "중립", 0


def roc(close: pd.Series, period: int = 12) -> pd.Series:
    return ((close - close.shift(period)) / close.shift(period)) * 100


def roc_signal(value: float) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    return ("매수", 1) if value > 0 else ("매도", -1)


def bull_bear_power(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 13) -> pd.Series:
    e = close.ewm(span=period, adjust=False).mean()
    bull = high - e
    bear = low - e
    return bull + bear


def bbp_signal(value: float) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    return ("매수", 1) if value > 0 else ("매도", -1)


def ultimate_oscillator(high: pd.Series, low: pd.Series, close: pd.Series) -> pd.Series:
    df = ta.uo(high=high, low=low, close=close)
    return df if df is not None else pd.Series(dtype=float)


def uo_signal(value: float) -> tuple[str, int]:
    if pd.isna(value):
        return "중립", 0
    if value < 30:
        return "매수", 1
    if value > 70:
        return "매도", -1
    return "중립", 0
```

- [ ] **Step 2: 간단 테스트**

```python
import numpy as np
import pandas as pd
import pytest

from app.indicators.strength import (
    adx, adx_signal, cci_signal, roc, roc_signal, williams_r, williams_r_signal,
)

np.random.seed(42)
N = 100
HIGH = pd.Series(np.random.randn(N).cumsum() + 105)
LOW = pd.Series(np.random.randn(N).cumsum() + 95)
CLOSE = pd.Series(np.random.randn(N).cumsum() + 100)


def test_adx_returns_three_series():
    result = adx(HIGH, LOW, CLOSE)
    assert set(result.keys()) == {"adx", "+di", "-di"}


def test_williams_r_signal_oversold():
    assert williams_r_signal(-90) == ("매수", 1)


def test_williams_r_signal_overbought():
    assert williams_r_signal(-10) == ("매도", -1)


def test_cci_signal_extreme():
    assert cci_signal(250) == ("강한 매도", -2)
    assert cci_signal(-250) == ("강한 매수", 2)
```

- [ ] **Step 3: 테스트 실행 + 커밋**

```bash
pytest tests/test_strength.py -v
git add backend/app/indicators/strength.py backend/tests/test_strength.py
git commit -m "feat(indicators): strength (ADX, Williams, CCI, ROC, BBP, UO)"
```

---

### Task 6: 거래량 지표 (OBV) + 피벗 포인트

**Files:**
- Create: `backend/app/indicators/volume.py`
- Create: `backend/app/indicators/pivot.py`

- [ ] **Step 1: `volume.py` 작성**

```python
import pandas as pd


def obv(close: pd.Series, volume: pd.Series) -> pd.Series:
    direction = (close.diff() > 0).astype(int) - (close.diff() < 0).astype(int)
    return (direction * volume).cumsum()


def obv_signal(obv_series: pd.Series, close: pd.Series) -> tuple[str, int]:
    if len(obv_series) < 5 or len(close) < 5:
        return "중립", 0
    obv_change = obv_series.iloc[-1] - obv_series.iloc[-5]
    price_change = close.iloc[-1] - close.iloc[-5]
    if obv_change > 0 and price_change > 0:
        return "매수", 1
    if obv_change < 0 and price_change < 0:
        return "매도", -1
    if obv_change > 0 and price_change < 0:
        return "매수", 1  # 강세 다이버전스
    if obv_change < 0 and price_change > 0:
        return "매도", -1  # 약세 다이버전스
    return "중립", 0
```

- [ ] **Step 2: `pivot.py` 작성**

```python
"""5종 피벗 포인트: Classic / Fibonacci / Camarilla / Woodie's / DeMark's."""


def classic(high: float, low: float, close: float) -> dict:
    p = (high + low + close) / 3
    r1 = 2 * p - low
    s1 = 2 * p - high
    r2 = p + (high - low)
    s2 = p - (high - low)
    r3 = high + 2 * (p - low)
    s3 = low - 2 * (high - p)
    return {"pivot": p, "r1": r1, "r2": r2, "r3": r3, "s1": s1, "s2": s2, "s3": s3}


def fibonacci(high: float, low: float, close: float) -> dict:
    p = (high + low + close) / 3
    rng = high - low
    return {
        "pivot": p,
        "r1": p + 0.382 * rng, "r2": p + 0.618 * rng, "r3": p + 1.0 * rng,
        "s1": p - 0.382 * rng, "s2": p - 0.618 * rng, "s3": p - 1.0 * rng,
    }


def camarilla(high: float, low: float, close: float) -> dict:
    rng = high - low
    return {
        "pivot": (high + low + close) / 3,
        "r1": close + rng * 1.1 / 12, "r2": close + rng * 1.1 / 6,
        "r3": close + rng * 1.1 / 4, "s1": close - rng * 1.1 / 12,
        "s2": close - rng * 1.1 / 6, "s3": close - rng * 1.1 / 4,
    }


def woodies(high: float, low: float, close: float) -> dict:
    p = (high + low + 2 * close) / 4
    return {
        "pivot": p,
        "r1": 2 * p - low, "r2": p + (high - low), "r3": high + 2 * (p - low),
        "s1": 2 * p - high, "s2": p - (high - low), "s3": low - 2 * (high - p),
    }


def demarks(high: float, low: float, close: float, open_price: float) -> dict:
    if close < open_price:
        x = high + 2 * low + close
    elif close > open_price:
        x = 2 * high + low + close
    else:
        x = high + low + 2 * close
    p = x / 4
    r1 = x / 2 - low
    s1 = x / 2 - high
    return {"pivot": p, "r1": r1, "s1": s1, "r2": None, "r3": None, "s2": None, "s3": None}
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/indicators/volume.py backend/app/indicators/pivot.py
git commit -m "feat(indicators): OBV + 5 pivot point variants"
```

---

### Task 7: 시그널 점수화 + 게이지 + compute_all 통합

**Files:**
- Create: `backend/app/indicators/signals.py`
- Create: `backend/app/indicators/compute.py`

- [ ] **Step 1: `signals.py` 작성**

```python
"""시그널 → 게이지 점수 변환."""
from typing import Literal

SignalType = Literal["강한 매수", "매수", "중립", "매도", "강한 매도"]


def normalize_to_percent(score: int, max_abs: int) -> float:
    """점수를 0~100% 게이지 위치로 변환."""
    if max_abs == 0:
        return 50.0
    pct = ((score + max_abs) / (2 * max_abs)) * 100
    return max(0, min(100, pct))


def percent_to_signal(percent: float) -> SignalType:
    if percent >= 80:
        return "강한 매수"
    if percent >= 60:
        return "매수"
    if percent >= 40:
        return "중립"
    if percent >= 20:
        return "매도"
    return "강한 매도"
```

- [ ] **Step 2: `compute.py` 작성 (외부 진입점)**

```python
"""compute_all: MarketData → 전체 지표 + 시그널 + 게이지."""
import pandas as pd

from app.indicators.momentum import (
    macd, macd_signal, rsi, rsi_signal, stochastic, stochastic_signal,
)
from app.indicators.pivot import camarilla, classic, demarks, fibonacci, woodies
from app.indicators.signals import normalize_to_percent, percent_to_signal
from app.indicators.strength import (
    adx, adx_signal, bbp_signal, bull_bear_power, cci, cci_signal,
    roc, roc_signal, ultimate_oscillator, uo_signal, williams_r, williams_r_signal,
)
from app.indicators.trend import detect_cross, ma_alignment, ma_signals, sma
from app.indicators.volatility import atr, atr_signal, bollinger_bands, bollinger_signal
from app.indicators.volume import obv, obv_signal
from app.models import MarketData


def candles_to_df(data: MarketData) -> pd.DataFrame:
    rows = [
        {"time": c.time, "Open": c.open, "High": c.high, "Low": c.low, "Close": c.close, "Volume": c.volume}
        for c in data.candles
    ]
    df = pd.DataFrame(rows)
    df.index = pd.to_datetime(df["time"], unit="s")
    return df


def compute_all(data: MarketData, params: dict | None = None) -> dict:
    """모든 지표 + 시그널 + 게이지 계산."""
    params = params or {}
    df = candles_to_df(data)
    if len(df) < 30:
        return {"error": "Insufficient data (min 30 candles required)"}

    high, low, close, vol = df["High"], df["Low"], df["Close"], df["Volume"]
    current = float(close.iloc[-1])

    # 추세
    ma_data = ma_signals(close)
    ma_align_label = ma_alignment({m["period"]: m["sma"] for m in ma_data if m["sma"] is not None})
    sma5, sma20 = sma(close, 5), sma(close, 20)
    cross = detect_cross(sma5, sma20)

    # 모멘텀
    rsi_v = rsi(close, params.get("rsi_period", 14))
    rsi_now = float(rsi_v.iloc[-1])
    rsi_sig, rsi_score = rsi_signal(rsi_now, params.get("rsi_overbought", 70), params.get("rsi_oversold", 30))

    macd_d = macd(close, params.get("macd_fast", 12), params.get("macd_slow", 26), params.get("macd_signal", 9))
    macd_sig, macd_score = macd_signal(macd_d)

    stoch_d = stochastic(high, low, close, params.get("stoch_k", 9), params.get("stoch_d", 6))
    stoch_sig, stoch_score = stochastic_signal(stoch_d)

    # 변동성
    bb = bollinger_bands(close, params.get("bb_period", 20), params.get("bb_std", 2.0))
    bb_sig, bb_score = bollinger_signal(bb, current)
    atr_v = atr(high, low, close)
    atr_sig, atr_score = atr_signal(float(atr_v.iloc[-1]), float(atr_v.tail(50).mean()))

    # 강도
    adx_d = adx(high, low, close)
    adx_sig, adx_score = adx_signal(adx_d)
    wr = williams_r(high, low, close)
    wr_sig, wr_score = williams_r_signal(float(wr.iloc[-1]))
    cci_v = cci(high, low, close)
    cci_sig, cci_score = cci_signal(float(cci_v.iloc[-1]))
    roc_v = roc(close)
    roc_sig, roc_score = roc_signal(float(roc_v.iloc[-1]))
    bbp_v = bull_bear_power(high, low, close)
    bbp_sig, bbp_score = bbp_signal(float(bbp_v.iloc[-1]))
    uo_v = ultimate_oscillator(high, low, close)
    uo_sig, uo_score = uo_signal(float(uo_v.iloc[-1]) if not uo_v.empty else float("nan"))

    # 거래량
    obv_v = obv(close, vol)
    obv_sig, obv_score = obv_signal(obv_v, close)

    # 피벗 (마지막 봉)
    last = df.iloc[-1]
    pivots = {
        "classic": classic(last["High"], last["Low"], last["Close"]),
        "fibonacci": fibonacci(last["High"], last["Low"], last["Close"]),
        "camarilla": camarilla(last["High"], last["Low"], last["Close"]),
        "woodies": woodies(last["High"], last["Low"], last["Close"]),
        "demarks": demarks(last["High"], last["Low"], last["Close"], last["Open"]),
    }

    # 게이지 점수 합산
    ma_score_sum = sum(m["score"] for m in ma_data) * 2  # SMA + EMA 동일 적용 가정
    technical_scores = [rsi_score, macd_score, stoch_score, bb_score, adx_score, wr_score, cci_score, roc_score, bbp_score, uo_score, obv_score]
    technical_score_sum = sum(technical_scores)

    ma_pct = normalize_to_percent(ma_score_sum, 24)
    tech_pct = normalize_to_percent(technical_score_sum, 20)
    overall_pct = normalize_to_percent(ma_score_sum + technical_score_sum, 44)

    return {
        "indicators": [
            {"name": "RSI(14)", "value": round(rsi_now, 2), "signal": rsi_sig, "score": rsi_score},
            {"name": "MACD(12,26)", "value": round(float(macd_d['macd'].iloc[-1]), 2), "signal": macd_sig, "score": macd_score},
            {"name": "STOCH(9,6)", "value": round(float(stoch_d['k'].iloc[-1]), 2), "signal": stoch_sig, "score": stoch_score},
            {"name": "ADX(14)", "value": round(float(adx_d['adx'].iloc[-1]), 2), "signal": adx_sig, "score": adx_score},
            {"name": "Williams %R", "value": round(float(wr.iloc[-1]), 2), "signal": wr_sig, "score": wr_score},
            {"name": "CCI(14)", "value": round(float(cci_v.iloc[-1]), 2), "signal": cci_sig, "score": cci_score},
            {"name": "ATR(14)", "value": round(float(atr_v.iloc[-1]), 2), "signal": atr_sig, "score": atr_score},
            {"name": "ROC", "value": round(float(roc_v.iloc[-1]), 2), "signal": roc_sig, "score": roc_score},
            {"name": "Bull/Bear Power", "value": round(float(bbp_v.iloc[-1]), 2), "signal": bbp_sig, "score": bbp_score},
            {"name": "Ultimate Oscillator", "value": round(float(uo_v.iloc[-1]) if not uo_v.empty else 0, 2), "signal": uo_sig, "score": uo_score},
            {"name": "OBV", "value": round(float(obv_v.iloc[-1]), 0), "signal": obv_sig, "score": obv_score},
        ],
        "moving_averages": ma_data,
        "ma_alignment": ma_align_label,
        "ma_cross": cross,
        "bollinger": {
            "upper": round(float(bb["upper"].iloc[-1]), 2),
            "middle": round(float(bb["middle"].iloc[-1]), 2),
            "lower": round(float(bb["lower"].iloc[-1]), 2),
            "signal": bb_sig,
        },
        "pivots": pivots,
        "gauges": {
            "moving_average": {"percent": round(ma_pct, 1), "signal": percent_to_signal(ma_pct)},
            "technical": {"percent": round(tech_pct, 1), "signal": percent_to_signal(tech_pct)},
            "overall": {"percent": round(overall_pct, 1), "signal": percent_to_signal(overall_pct)},
        },
    }
```

- [ ] **Step 2: 커밋**

```bash
git add backend/app/indicators/signals.py backend/app/indicators/compute.py
git commit -m "feat(indicators): unified compute_all + gauge scoring"
```

---

### Task 8: 라우터 + 통합 테스트

**Files:**
- Create: `backend/app/routers/indicators.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_compute.py`

- [ ] **Step 1: `app/routers/indicators.py` 작성**

```python
from fastapi import APIRouter, HTTPException, Query

from app.indicators.compute import compute_all
from app.sources.binance_source import get_binance_klines
from app.sources.pykrx_source import get_kr_stock_ohlcv
from app.sources.yfinance_source import get_yf_ohlcv

router = APIRouter(prefix="/indicators", tags=["indicators"])


@router.get("/kr-stocks/{ticker}")
def kr_indicators(ticker: str, days: int = Query(365, ge=30, le=3650)):
    data = get_kr_stock_ohlcv(ticker, days=days)
    return compute_all(data)


@router.get("/us-stocks/{symbol}")
def us_indicators(symbol: str, period: str = "1y"):
    data = get_yf_ohlcv(symbol.upper(), source="us_stocks", period=period)
    return compute_all(data)


@router.get("/crypto/{symbol}")
def crypto_indicators(symbol: str, interval: str = "1d", limit: int = Query(365, ge=30)):
    data = get_binance_klines(symbol.upper(), interval=interval, limit=limit)
    return compute_all(data)
```

- [ ] **Step 2: `main.py`에 등록**

```python
from app.routers import crypto, etfs, indicators, indices, kr_stocks, upload, us_stocks
app.include_router(indicators.router)
```

- [ ] **Step 3: 통합 테스트**

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_kr_indicators_samsung():
    r = client.get("/indicators/kr-stocks/005930?days=400")
    assert r.status_code == 200
    body = r.json()
    assert "gauges" in body
    assert "indicators" in body
    assert len(body["indicators"]) >= 10


def test_us_indicators_aapl():
    r = client.get("/indicators/us-stocks/AAPL?period=1y")
    assert r.status_code == 200


def test_crypto_indicators_btc():
    r = client.get("/indicators/crypto/BTCUSDT?limit=200")
    assert r.status_code == 200
```

- [ ] **Step 4: 실행 + 커밋**

```bash
pytest tests/test_compute.py -v
git add backend/app/routers/indicators.py backend/app/main.py backend/tests/test_compute.py
git commit -m "feat(indicators): expose /indicators API + integration tests"
```

---

## Self-Review

- [ ] indicators.md의 모든 지표가 코드로 구현됐는가?
- [ ] 시그널 5단계 (강한 매수/매수/중립/매도/강한 매도) 일관 적용?
- [ ] 게이지 3개 (이동평균/기술지표/종합) 모두 계산?
- [ ] 사용자 파라미터 오버라이드 (`params` 인자) 지원?
- [ ] 데이터 부족 시 graceful 처리?

## 완료 조건

`pytest tests/test_compute.py` 전체 통과, `/indicators/...` API가 정상 응답.
