# Plan 07 — CSV/JSON 업로드 자동 감지

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 업로드한 CSV/JSON 파일을 자동으로 5가지 유형(OHLCV / portfolio / multi_asset / returns / price_series)으로 감지하고, 유형별 적절한 분석을 수행한다.

**Architecture:** `backend/app/upload/` 하위에 detector(컬럼 패턴 감지) + 5종 어댑터 분리. `/upload` 라우터가 detector → 어댑터 → MarketData/analysis 변환 → 적절한 분석 모듈로 분기한다. 최종 화면은 Plan 14의 Visualization Intelligence Layer가 받아 raw JSON 대신 데이터 유형별 자동 차트 대시보드로 렌더링한다.

**Tech Stack:** pandas (감지/파싱) + 기존 indicators / insights 엔진 재사용

**예상 소요:** 4~5시간

---

## File Structure

```
backend/app/upload/
├── __init__.py
├── detector.py          # 데이터 유형 자동 감지
├── adapters/
│   ├── __init__.py
│   ├── ohlcv.py
│   ├── portfolio.py
│   ├── multi_asset.py
│   ├── returns.py
│   └── price_series.py
└── analysis.py          # 유형별 분석 dispatch
backend/tests/test_upload.py
backend/tests/fixtures/  # 샘플 CSV
```

---

## Tasks

### Task 1: detector — 컬럼 패턴 감지기

**Files:**
- Create: `backend/app/upload/__init__.py`
- Create: `backend/app/upload/detector.py`

- [ ] **Step 1: 디렉터리 + init**

```powershell
New-Item -ItemType Directory -Force -Path "backend\app\upload\adapters", "backend\tests\fixtures" | Out-Null
New-Item -ItemType File -Force -Path "backend\app\upload\__init__.py", "backend\app\upload\adapters\__init__.py" | Out-Null
```

- [ ] **Step 2: `detector.py` 작성**

```python
"""CSV 컬럼 패턴 → 데이터 유형 자동 감지."""
import pandas as pd

OHLCV_COLS = {"open", "high", "low", "close"}
KOREAN_OHLCV = {"시가", "고가", "저가", "종가"}

PORTFOLIO_COLS_A = {"ticker", "weight"}
PORTFOLIO_COLS_B = {"ticker", "quantity"}
PORTFOLIO_COLS_KR_A = {"종목", "비중"}
PORTFOLIO_COLS_KR_B = {"종목", "수량"}

DATE_KEYWORDS = {"date", "time", "datetime", "날짜", "일자", "시간"}
RETURN_KEYWORDS = {"return", "수익률", "returns"}
CLOSE_KEYWORDS = {"close", "price", "종가", "현재가"}


def _normalize_cols(cols) -> set[str]:
    return {str(c).strip().lower() for c in cols}


def _has_date(cols: set[str]) -> bool:
    return bool(cols & DATE_KEYWORDS)


def detect_type(df: pd.DataFrame) -> str:
    """반환: 'OHLCV' | 'portfolio' | 'multi_asset' | 'returns' | 'price_series' | 'unknown'."""
    cols = _normalize_cols(df.columns)
    raw_cols = set(df.columns.astype(str))

    # 1. OHLCV 우선
    if OHLCV_COLS.issubset(cols) or KOREAN_OHLCV.issubset(raw_cols):
        return "OHLCV"

    # 2. 포트폴리오
    if (PORTFOLIO_COLS_A.issubset(cols) or PORTFOLIO_COLS_B.issubset(cols)
            or PORTFOLIO_COLS_KR_A.issubset(raw_cols) or PORTFOLIO_COLS_KR_B.issubset(raw_cols)):
        return "portfolio"

    # 3. 수익률 시계열
    if _has_date(cols) and (cols & RETURN_KEYWORDS):
        return "returns"

    # 4. 다종목 비교 (Date + 3개 이상의 종목 컬럼)
    if _has_date(cols):
        non_date_cols = [c for c in df.columns if str(c).strip().lower() not in DATE_KEYWORDS]
        # 종가/가격 키워드가 없으면서 컬럼이 3개 이상이면 다종목
        non_special = [c for c in non_date_cols if str(c).strip().lower() not in (CLOSE_KEYWORDS | RETURN_KEYWORDS)]
        if len(non_special) >= 3:
            return "multi_asset"
        # 5. 가격 시계열 (Date + close/price)
        if cols & CLOSE_KEYWORDS:
            return "price_series"
        if len(non_date_cols) == 1:
            return "price_series"

    return "unknown"
```

- [ ] **Step 3: 테스트**

```python
import pandas as pd
import pytest

from app.upload.detector import detect_type


def test_detect_ohlcv():
    df = pd.DataFrame(columns=["Date", "Open", "High", "Low", "Close", "Volume"])
    assert detect_type(df) == "OHLCV"


def test_detect_ohlcv_korean():
    df = pd.DataFrame(columns=["날짜", "시가", "고가", "저가", "종가", "거래량"])
    assert detect_type(df) == "OHLCV"


def test_detect_portfolio():
    df = pd.DataFrame(columns=["Ticker", "Weight"])
    assert detect_type(df) == "portfolio"


def test_detect_portfolio_korean():
    df = pd.DataFrame(columns=["종목", "비중"])
    assert detect_type(df) == "portfolio"


def test_detect_multi_asset():
    df = pd.DataFrame(columns=["Date", "AAPL", "GOOG", "MSFT", "AMZN"])
    assert detect_type(df) == "multi_asset"


def test_detect_returns():
    df = pd.DataFrame(columns=["Date", "Return"])
    assert detect_type(df) == "returns"


def test_detect_price_series():
    df = pd.DataFrame(columns=["Date", "Close"])
    assert detect_type(df) == "price_series"


def test_detect_unknown():
    df = pd.DataFrame(columns=["Foo", "Bar", "Baz"])
    assert detect_type(df) == "unknown"
```

- [ ] **Step 4: 실행 + 커밋**

```bash
pytest tests/ -v -k detect
git add backend/app/upload/ backend/tests/
git commit -m "feat(upload): data type detector with unit tests"
```

---

### Task 2: OHLCV 어댑터 + price_series 어댑터

**Files:**
- Create: `backend/app/upload/adapters/ohlcv.py`
- Create: `backend/app/upload/adapters/price_series.py`

- [ ] **Step 1: `ohlcv.py` 작성**

```python
"""사용자 OHLCV CSV → MarketData."""
import pandas as pd

from app.models import Candle, MarketData

KOREAN_MAP = {"시가": "Open", "고가": "High", "저가": "Low", "종가": "Close", "거래량": "Volume", "날짜": "Date", "일자": "Date"}


def adapt(df: pd.DataFrame, filename: str) -> MarketData:
    df = df.rename(columns=KOREAN_MAP)
    df.columns = [c.title() if c.lower() in {"open", "high", "low", "close", "volume", "date"} else c for c in df.columns]

    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"])
        df = df.sort_values("Date")
    else:
        df.index = pd.RangeIndex(len(df))
        df["Date"] = pd.Timestamp.now() - pd.to_timedelta(len(df) - df.index, unit="D")

    if "Volume" not in df.columns:
        df["Volume"] = 0

    candles = [
        Candle(
            time=int(pd.Timestamp(row["Date"]).timestamp()),
            open=float(row["Open"]),
            high=float(row["High"]),
            low=float(row["Low"]),
            close=float(row["Close"]),
            volume=float(row.get("Volume", 0) or 0),
        )
        for _, row in df.iterrows()
    ]

    return MarketData(
        source="user_upload",
        symbol=filename,
        name=filename,
        type="OHLCV",
        timezone="UTC",
        currency="UNKNOWN",
        candles=candles,
    )
```

- [ ] **Step 2: `price_series.py` 작성**

```python
"""Date + Close (또는 Price) → MarketData (OHLCV로 보정)."""
import pandas as pd

from app.models import Candle, MarketData


def adapt(df: pd.DataFrame, filename: str) -> MarketData:
    cols_lower = {c: c.lower() for c in df.columns}
    date_col = next((c for c, lc in cols_lower.items() if lc in {"date", "time", "datetime", "날짜", "일자"}), None)
    price_col = next((c for c, lc in cols_lower.items() if lc in {"close", "price", "종가", "현재가"}), None)

    if not date_col or not price_col:
        # fallback: 첫 번째가 date, 두 번째가 price
        date_col = df.columns[0]
        price_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]

    df = df[[date_col, price_col]].copy()
    df.columns = ["Date", "Close"]
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date")

    candles = [
        Candle(
            time=int(pd.Timestamp(row["Date"]).timestamp()),
            open=float(row["Close"]),
            high=float(row["Close"]),
            low=float(row["Close"]),
            close=float(row["Close"]),
            volume=0,
        )
        for _, row in df.iterrows()
    ]

    return MarketData(
        source="user_upload",
        symbol=filename,
        name=filename,
        type="price_series",
        timezone="UTC",
        currency="UNKNOWN",
        candles=candles,
    )
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/upload/adapters/ohlcv.py backend/app/upload/adapters/price_series.py
git commit -m "feat(upload): OHLCV + price_series adapters"
```

---

### Task 3: 포트폴리오 / 다종목 / 수익률 어댑터

**Files:**
- Create: `backend/app/upload/adapters/portfolio.py`
- Create: `backend/app/upload/adapters/multi_asset.py`
- Create: `backend/app/upload/adapters/returns.py`

- [ ] **Step 1: `portfolio.py` — 비중 정규화 + 분석 결과 반환**

```python
"""포트폴리오 분석: 비중 / 종목 간 상관관계는 외부 가격 데이터 필요."""
import pandas as pd


def analyze(df: pd.DataFrame) -> dict:
    df = df.rename(columns=str.lower)
    df.columns = [c.replace("종목", "ticker").replace("비중", "weight").replace("수량", "quantity") for c in df.columns]

    if "weight" not in df.columns and "quantity" in df.columns:
        total = df["quantity"].sum()
        df["weight"] = df["quantity"] / total if total > 0 else 0

    df["weight"] = df["weight"].astype(float)
    weight_sum = df["weight"].sum()
    if weight_sum > 0 and abs(weight_sum - 1.0) > 0.01 and abs(weight_sum - 100.0) < 5:
        df["weight"] = df["weight"] / 100.0

    # 비중 상위 정렬
    df = df.sort_values("weight", ascending=False).reset_index(drop=True)

    return {
        "type": "portfolio",
        "holdings": df[["ticker", "weight"]].to_dict(orient="records"),
        "n_holdings": len(df),
        "concentration": {
            "top_1": float(df["weight"].iloc[0]) if len(df) > 0 else 0,
            "top_3": float(df["weight"].head(3).sum()) if len(df) > 0 else 0,
            "top_5": float(df["weight"].head(5).sum()) if len(df) > 0 else 0,
        },
        "note": "포트폴리오 수익률/상관관계 분석은 종목별 시계열 데이터가 추가로 필요합니다.",
    }
```

- [ ] **Step 2: `multi_asset.py` — 정규화 비교**

```python
"""다종목 비교: 정규화 수익률 + 상관관계 매트릭스."""
import pandas as pd


def analyze(df: pd.DataFrame) -> dict:
    date_col = next((c for c in df.columns if str(c).lower() in {"date", "time", "datetime", "날짜", "일자"}), None)
    if date_col:
        df = df.set_index(date_col)
        df.index = pd.to_datetime(df.index)
        df = df.sort_index()

    # 숫자 컬럼만
    df = df.select_dtypes(include="number")
    if df.empty:
        return {"type": "multi_asset", "error": "No numeric columns found"}

    # 정규화 (시작값 = 100)
    normalized = df.divide(df.iloc[0]).multiply(100)

    # 상관관계
    correlation = df.pct_change().dropna().corr().round(3)

    # 변동성 (연율화)
    volatility = (df.pct_change().std() * (252 ** 0.5)).round(4)

    return {
        "type": "multi_asset",
        "tickers": list(df.columns),
        "n_periods": len(df),
        "normalized_series": [
            {"date": str(idx), **{c: float(v) for c, v in row.items()}}
            for idx, row in normalized.iterrows()
        ][-200:],  # 최근 200개로 다운샘플
        "correlation": correlation.to_dict(),
        "annualized_volatility": volatility.to_dict(),
    }
```

- [ ] **Step 3: `returns.py` — 통계 분석**

```python
"""수익률 시계열 분석: 누적 수익률 / 샤프 / MDD / 월별 히트맵."""
import numpy as np
import pandas as pd


def analyze(df: pd.DataFrame) -> dict:
    date_col = next((c for c in df.columns if str(c).lower() in {"date", "time", "datetime", "날짜", "일자"}), None)
    return_col = next((c for c in df.columns if str(c).lower() in {"return", "returns", "수익률"}), None)

    if not date_col or not return_col:
        return {"type": "returns", "error": "Missing date or return column"}

    df = df[[date_col, return_col]].copy()
    df.columns = ["Date", "Return"]
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date").reset_index(drop=True)

    # % 단위 자동 감지 (값 절대값 평균이 1보다 크면 %로 가정)
    if df["Return"].abs().mean() > 1:
        df["Return"] = df["Return"] / 100

    cumulative = (1 + df["Return"]).cumprod() - 1
    annualized_return = (1 + df["Return"].mean()) ** 252 - 1
    annualized_vol = df["Return"].std() * np.sqrt(252)
    sharpe = annualized_return / annualized_vol if annualized_vol > 0 else 0

    # MDD
    running_max = (1 + df["Return"]).cumprod().cummax()
    drawdown = (1 + df["Return"]).cumprod() / running_max - 1
    mdd = float(drawdown.min())

    # 월별 히트맵
    df["YearMonth"] = df["Date"].dt.to_period("M")
    monthly = df.groupby("YearMonth")["Return"].apply(lambda x: (1 + x).prod() - 1)

    return {
        "type": "returns",
        "n_observations": len(df),
        "cumulative_return": float(cumulative.iloc[-1]) if len(cumulative) else 0,
        "annualized_return": float(annualized_return),
        "annualized_volatility": float(annualized_vol),
        "sharpe_ratio": float(sharpe),
        "max_drawdown": mdd,
        "monthly_returns": [
            {"period": str(p), "return": float(r)}
            for p, r in monthly.items()
        ],
    }
```

- [ ] **Step 4: 커밋**

```bash
git add backend/app/upload/adapters/portfolio.py backend/app/upload/adapters/multi_asset.py backend/app/upload/adapters/returns.py
git commit -m "feat(upload): portfolio + multi_asset + returns adapters"
```

---

### Task 4: 분석 dispatch + 라우터 통합

**Files:**
- Create: `backend/app/upload/analysis.py`
- Modify: `backend/app/routers/upload.py`

- [ ] **Step 1: `analysis.py` 작성**

```python
"""유형별 분석 dispatch."""
import pandas as pd

from app.indicators.compute import compute_all
from app.insights.compose import compose
from app.upload.adapters import multi_asset as multi_asset_adapter
from app.upload.adapters import ohlcv as ohlcv_adapter
from app.upload.adapters import portfolio as portfolio_adapter
from app.upload.adapters import price_series as ps_adapter
from app.upload.adapters import returns as returns_adapter
from app.upload.detector import detect_type


def dispatch(df: pd.DataFrame, filename: str) -> dict:
    data_type = detect_type(df)

    if data_type == "OHLCV":
        market_data = ohlcv_adapter.adapt(df, filename)
        compute = compute_all(market_data)
        if "error" not in compute:
            compute["insights"] = compose(compute, current_price=market_data.candles[-1].close)
        return {"type": "OHLCV", "market_data_summary": {"name": market_data.name, "n_candles": len(market_data.candles)}, "analysis": compute}

    if data_type == "price_series":
        market_data = ps_adapter.adapt(df, filename)
        compute = compute_all(market_data)
        if "error" not in compute:
            compute["insights"] = compose(compute, current_price=market_data.candles[-1].close)
        return {"type": "price_series", "market_data_summary": {"name": market_data.name, "n_candles": len(market_data.candles)}, "analysis": compute, "note": "거래량 데이터가 없어 일부 지표가 제한됩니다."}

    if data_type == "portfolio":
        return {"type": "portfolio", "analysis": portfolio_adapter.analyze(df)}

    if data_type == "multi_asset":
        return {"type": "multi_asset", "analysis": multi_asset_adapter.analyze(df)}

    if data_type == "returns":
        return {"type": "returns", "analysis": returns_adapter.analyze(df)}

    return {
        "type": "unknown",
        "message": "데이터 유형을 자동으로 판별할 수 없습니다. 컬럼 구조를 확인하거나 수동 선택해주세요.",
        "available_types": ["OHLCV", "portfolio", "multi_asset", "returns", "price_series"],
        "columns": df.columns.tolist(),
    }
```

- [ ] **Step 2: 라우터 업데이트**

`backend/app/routers/upload.py` 교체:

```python
import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.upload.analysis import dispatch
from app.upload.detector import detect_type

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/")
async def upload_data(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith((".csv", ".json")):
        raise HTTPException(400, "CSV / JSON 파일만 지원됩니다")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "파일 크기는 10MB 이하만 지원됩니다")

    try:
        if file.filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_json(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(400, f"파일 파싱 실패: {exc}")

    return dispatch(df, filename=file.filename)


@router.post("/detect-only")
async def detect_only(file: UploadFile = File(...)):
    """유형만 감지하고 분석은 수행하지 않음."""
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content)) if file.filename.endswith(".csv") else pd.read_json(io.BytesIO(content))
    return {
        "filename": file.filename,
        "detected_type": detect_type(df),
        "columns": df.columns.tolist(),
        "row_count": len(df),
        "preview": df.head(10).to_dict(orient="records"),
    }
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/upload/analysis.py backend/app/routers/upload.py
git commit -m "feat(upload): dispatch + router integration"
```

---

### Task 5: 샘플 픽스처 + 통합 테스트

**Files:**
- Create: `backend/tests/fixtures/ohlcv_sample.csv`
- Create: `backend/tests/fixtures/portfolio_sample.csv`
- Create: `backend/tests/fixtures/returns_sample.csv`
- Create: `backend/tests/test_upload.py`

- [ ] **Step 1: 샘플 CSV 생성**

```powershell
# 간단한 샘플 (수동으로 만들거나 Python 스크립트로)
```

`backend/tests/fixtures/ohlcv_sample.csv`:
```csv
Date,Open,High,Low,Close,Volume
2025-01-01,100,105,99,103,10000
2025-01-02,103,108,102,107,12000
... (최소 50행)
```

(자세한 픽스처 데이터는 task에서 직접 생성. 필요시 Python 스크립트로 자동 생성 가능.)

- [ ] **Step 2: 통합 테스트**

```python
import io
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

FIXTURES = Path(__file__).parent / "fixtures"


def _make_ohlcv_csv() -> bytes:
    import numpy as np
    np.random.seed(42)
    n = 100
    dates = pd.date_range("2025-01-01", periods=n)
    base = np.cumsum(np.random.randn(n)) + 100
    df = pd.DataFrame({
        "Date": dates,
        "Open": base,
        "High": base + 1,
        "Low": base - 1,
        "Close": base + np.random.randn(n) * 0.5,
        "Volume": np.random.randint(1000, 10000, n),
    })
    return df.to_csv(index=False).encode()


def _make_portfolio_csv() -> bytes:
    df = pd.DataFrame({"Ticker": ["AAPL", "GOOG", "MSFT", "AMZN"], "Weight": [0.4, 0.3, 0.2, 0.1]})
    return df.to_csv(index=False).encode()


def _make_returns_csv() -> bytes:
    import numpy as np
    np.random.seed(1)
    n = 252
    df = pd.DataFrame({
        "Date": pd.date_range("2024-01-01", periods=n),
        "Return": np.random.randn(n) * 0.01,
    })
    return df.to_csv(index=False).encode()


def test_upload_ohlcv():
    r = client.post("/upload/", files={"file": ("test.csv", _make_ohlcv_csv(), "text/csv")})
    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "OHLCV"
    assert "analysis" in body


def test_upload_portfolio():
    r = client.post("/upload/", files={"file": ("p.csv", _make_portfolio_csv(), "text/csv")})
    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "portfolio"


def test_upload_returns():
    r = client.post("/upload/", files={"file": ("r.csv", _make_returns_csv(), "text/csv")})
    assert r.status_code == 200
    body = r.json()
    assert body["type"] == "returns"
    assert "sharpe_ratio" in body["analysis"]


def test_upload_detect_only():
    r = client.post("/upload/detect-only", files={"file": ("t.csv", _make_portfolio_csv(), "text/csv")})
    assert r.status_code == 200
    assert r.json()["detected_type"] == "portfolio"


def test_upload_unsupported_extension():
    r = client.post("/upload/", files={"file": ("a.txt", b"foo,bar", "text/plain")})
    assert r.status_code == 400
```

- [ ] **Step 3: 실행 + 커밋**

```bash
pytest tests/test_upload.py -v
git add backend/tests/
git commit -m "test(upload): integration tests for all 5 types"
```

---

## Self-Review

- [ ] 5종 유형 모두 어댑터 구현?
- [ ] detector가 한국어/영문 컬럼 모두 인식?
- [ ] 감지 실패 시 unknown 응답에 컬럼 정보 포함?
- [ ] 파일 크기 제한 (10MB)?
- [ ] OHLCV/price_series는 기존 indicators 엔진 재사용?
- [ ] Plan 14와 연결되어 업로드 결과가 자동 시각화 대시보드로 표시되는가?

## 완료 조건

`pytest tests/test_upload.py` 전체 통과 + `/upload/`에 5종 샘플 업로드 시 정상 응답.
