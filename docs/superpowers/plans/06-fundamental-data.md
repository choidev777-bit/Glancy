# Plan 06 — 기본적 분석 데이터 통합

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한국 주식(pykrx + DART)과 미국 주식(yfinance) 펀더멘털 데이터를 표준화된 5개 카테고리(밸류에이션 / 수익성 / 성장성 / 재무건전성 / 주주환원)로 정리하는 API를 완성한다.

**Architecture:** 시장별 어댑터(`fundamental/kr.py`, `fundamental/us.py`)가 원본 데이터를 표준 `FundamentalReport` 객체로 변환. 카테고리 구조와 한국어 라벨이 백엔드에서 결정되어 프론트는 그대로 렌더링.

**Tech Stack:** pykrx + OpenDartReader (한국) / yfinance (미국)

**예상 소요:** 4~6시간

---

## File Structure

```
backend/app/
├── fundamental/
│   ├── __init__.py
│   ├── models.py        # FundamentalReport / Section
│   ├── kr.py            # 한국 주식 어댑터 (pykrx + DART 결합)
│   ├── us.py            # 미국 주식 어댑터 (yfinance)
│   └── format.py        # 값 포맷팅 (배수/% 등)
└── routers/
    └── fundamental.py   # GET /fundamental/{market}/{symbol}
backend/tests/test_fundamental.py
```

---

## Tasks

### Task 1: 모델 + 포맷 헬퍼

**Files:**
- Create: `backend/app/fundamental/__init__.py`
- Create: `backend/app/fundamental/models.py`
- Create: `backend/app/fundamental/format.py`

- [ ] **Step 1: 디렉터리 + init**

```powershell
New-Item -ItemType Directory -Force -Path "backend\app\fundamental" | Out-Null
New-Item -ItemType File -Force -Path "backend\app\fundamental\__init__.py" | Out-Null
```

- [ ] **Step 2: `models.py` 작성**

```python
from typing import Optional

from pydantic import BaseModel


class FundamentalItem(BaseModel):
    label: str                  # "PER"
    value: str                  # "14.2배" (포맷 후)
    raw: Optional[float] = None # 14.2 (정렬/비교용)
    position: Optional[float] = None  # 0~1, 업계 비교 막대 위치
    note: Optional[str] = None  # 보조 설명 (예: "미국 데이터만 제공")


class FundamentalSection(BaseModel):
    title: str                  # "밸류에이션"
    items: list[FundamentalItem]


class FundamentalReport(BaseModel):
    symbol: str
    market: str                 # "kr" | "us"
    name: str
    sections: list[FundamentalSection]
    generated_at: str           # ISO 8601
```

- [ ] **Step 3: `format.py` 작성**

```python
"""값 포맷터: 배수, %, 통화."""


def fmt_multiple(v: float | None) -> str:
    if v is None:
        return "-"
    return f"{v:.2f}배"


def fmt_percent(v: float | None) -> str:
    if v is None:
        return "-"
    return f"{v * 100:.2f}%" if abs(v) < 5 else f"{v:.2f}%"


def fmt_won(v: float | None) -> str:
    if v is None:
        return "-"
    return f"{int(v):,}원"


def fmt_dollar(v: float | None) -> str:
    if v is None:
        return "-"
    return f"${v:,.2f}"


def fmt_market_cap_kr(v: float | None) -> str:
    if v is None:
        return "-"
    if v >= 1_000_000_000_000:
        return f"{v / 1_000_000_000_000:.1f}조 원"
    if v >= 100_000_000:
        return f"{v / 100_000_000:.0f}억 원"
    return f"{v:,.0f}원"


def fmt_market_cap_us(v: float | None) -> str:
    if v is None:
        return "-"
    if v >= 1e12:
        return f"${v / 1e12:.2f}T"
    if v >= 1e9:
        return f"${v / 1e9:.2f}B"
    if v >= 1e6:
        return f"${v / 1e6:.2f}M"
    return f"${v:,.0f}"
```

- [ ] **Step 4: 커밋**

```bash
git add backend/app/fundamental/
git commit -m "feat(fundamental): scaffold models + formatters"
```

---

### Task 2: 한국 주식 어댑터 (pykrx + DART 결합)

**Files:**
- Create: `backend/app/fundamental/kr.py`

- [ ] **Step 1: `kr.py` 작성**

```python
"""한국 주식 펀더멘털 어댑터: pykrx + DART API 결합."""
from datetime import datetime

from app.fundamental.format import fmt_multiple, fmt_percent, fmt_won
from app.fundamental.models import FundamentalItem, FundamentalReport, FundamentalSection
from app.sources.dart_source import get_dart_financials
from app.sources.pykrx_source import get_kr_stock_fundamental


def build_kr_report(ticker: str, name: str) -> FundamentalReport:
    pykrx_data = get_kr_stock_fundamental(ticker)
    dart_data = get_dart_financials(ticker)

    valuation = FundamentalSection(
        title="밸류에이션",
        items=[
            FundamentalItem(label="PER", value=fmt_multiple(pykrx_data.get("PER")), raw=pykrx_data.get("PER")),
            FundamentalItem(label="PBR", value=fmt_multiple(pykrx_data.get("PBR")), raw=pykrx_data.get("PBR")),
            FundamentalItem(label="PSR", value="-", note="국내 데이터 미제공"),
            FundamentalItem(label="EV/EBITDA", value="-", note="국내 데이터 미제공"),
        ],
    )

    profitability = FundamentalSection(
        title="수익성",
        items=[
            FundamentalItem(label="ROE", value=fmt_percent(dart_data.get("ROE")), raw=dart_data.get("ROE")),
            FundamentalItem(label="ROA", value=fmt_percent(dart_data.get("ROA")), raw=dart_data.get("ROA")),
            FundamentalItem(label="영업이익률", value=fmt_percent(dart_data.get("operating_margin")), raw=dart_data.get("operating_margin")),
            FundamentalItem(label="순이익률", value=fmt_percent(dart_data.get("net_margin")), raw=dart_data.get("net_margin")),
        ],
    )

    growth = FundamentalSection(
        title="성장성",
        items=[
            FundamentalItem(label="매출액", value=f"{int(dart_data['revenue']):,}원" if dart_data.get("revenue") else "-"),
            FundamentalItem(label="영업이익", value=f"{int(dart_data['operating_income']):,}원" if dart_data.get("operating_income") else "-"),
            FundamentalItem(label="순이익", value=f"{int(dart_data['net_income']):,}원" if dart_data.get("net_income") else "-"),
        ],
    )

    health = FundamentalSection(
        title="재무건전성",
        items=[
            FundamentalItem(label="부채비율", value=fmt_percent(dart_data.get("debt_ratio")), raw=dart_data.get("debt_ratio")),
            FundamentalItem(label="자산총계", value=f"{int(dart_data['total_assets']):,}원" if dart_data.get("total_assets") else "-"),
            FundamentalItem(label="자본총계", value=f"{int(dart_data['total_equity']):,}원" if dart_data.get("total_equity") else "-"),
        ],
    )

    shareholder = FundamentalSection(
        title="주주환원",
        items=[
            FundamentalItem(label="EPS", value=fmt_won(pykrx_data.get("EPS")), raw=pykrx_data.get("EPS")),
            FundamentalItem(label="BPS", value=fmt_won(pykrx_data.get("BPS")), raw=pykrx_data.get("BPS")),
            FundamentalItem(label="배당수익률", value=fmt_percent(pykrx_data.get("DIV") / 100 if pykrx_data.get("DIV") else None)),
            FundamentalItem(label="주당배당금", value=fmt_won(pykrx_data.get("DPS")), raw=pykrx_data.get("DPS")),
        ],
    )

    return FundamentalReport(
        symbol=ticker,
        market="kr",
        name=name,
        sections=[valuation, profitability, growth, health, shareholder],
        generated_at=datetime.utcnow().isoformat() + "Z",
    )
```

- [ ] **Step 2: 커밋**

```bash
git add backend/app/fundamental/kr.py
git commit -m "feat(fundamental): KR adapter (pykrx + DART)"
```

---

### Task 3: 미국 주식 어댑터 (yfinance 풀세트)

**Files:**
- Create: `backend/app/fundamental/us.py`

- [ ] **Step 1: `us.py` 작성**

```python
"""미국 주식 펀더멘털 어댑터: yfinance 풀커버."""
from datetime import datetime

from app.fundamental.format import fmt_dollar, fmt_multiple, fmt_percent
from app.fundamental.models import FundamentalItem, FundamentalReport, FundamentalSection
from app.sources.yfinance_source import get_yf_fundamentals


def _pct(v):
    """yfinance ratio가 0~1 단위인 경우 그대로 fmt_percent에 넘기면 % 표시."""
    return v if v is None else (v if abs(v) < 5 else v / 100)


def build_us_report(symbol: str, name: str) -> FundamentalReport:
    f = get_yf_fundamentals(symbol)

    valuation = FundamentalSection(
        title="밸류에이션",
        items=[
            FundamentalItem(label="PER", value=fmt_multiple(f.get("PER")), raw=f.get("PER")),
            FundamentalItem(label="Forward PER", value=fmt_multiple(f.get("ForwardPER")), raw=f.get("ForwardPER")),
            FundamentalItem(label="PBR", value=fmt_multiple(f.get("PBR")), raw=f.get("PBR")),
            FundamentalItem(label="PSR", value=fmt_multiple(f.get("PSR")), raw=f.get("PSR")),
            FundamentalItem(label="EV/EBITDA", value=fmt_multiple(f.get("EVtoEBITDA")), raw=f.get("EVtoEBITDA")),
        ],
    )

    profitability = FundamentalSection(
        title="수익성",
        items=[
            FundamentalItem(label="ROE", value=fmt_percent(_pct(f.get("ROE"))), raw=f.get("ROE")),
            FundamentalItem(label="ROA", value=fmt_percent(_pct(f.get("ROA"))), raw=f.get("ROA")),
            FundamentalItem(label="순이익률", value=fmt_percent(_pct(f.get("ProfitMargin"))), raw=f.get("ProfitMargin")),
            FundamentalItem(label="영업이익률", value=fmt_percent(_pct(f.get("OperatingMargin"))), raw=f.get("OperatingMargin")),
            FundamentalItem(label="매출총이익률", value=fmt_percent(_pct(f.get("GrossMargin"))), raw=f.get("GrossMargin")),
        ],
    )

    growth = FundamentalSection(
        title="성장성",
        items=[
            FundamentalItem(label="매출 성장률 YoY", value=fmt_percent(_pct(f.get("RevenueGrowth"))), raw=f.get("RevenueGrowth")),
            FundamentalItem(label="EPS 성장률", value=fmt_percent(_pct(f.get("EarningsGrowth"))), raw=f.get("EarningsGrowth")),
        ],
    )

    health = FundamentalSection(
        title="재무건전성",
        items=[
            FundamentalItem(label="부채비율 (D/E)", value=f"{f['DebtToEquity']:.1f}" if f.get("DebtToEquity") else "-", raw=f.get("DebtToEquity")),
            FundamentalItem(label="유동비율", value=f"{f['CurrentRatio']:.2f}" if f.get("CurrentRatio") else "-", raw=f.get("CurrentRatio")),
            FundamentalItem(label="베타", value=f"{f['Beta']:.2f}" if f.get("Beta") else "-", raw=f.get("Beta")),
        ],
    )

    shareholder = FundamentalSection(
        title="주주환원",
        items=[
            FundamentalItem(label="배당수익률", value=fmt_percent(_pct(f.get("DividendYield"))), raw=f.get("DividendYield")),
            FundamentalItem(label="배당성향", value=fmt_percent(_pct(f.get("PayoutRatio"))), raw=f.get("PayoutRatio")),
            FundamentalItem(label="시가총액", value=fmt_dollar(f.get("MarketCap")), raw=f.get("MarketCap")),
        ],
    )

    return FundamentalReport(
        symbol=symbol,
        market="us",
        name=name,
        sections=[valuation, profitability, growth, health, shareholder],
        generated_at=datetime.utcnow().isoformat() + "Z",
    )
```

- [ ] **Step 2: 커밋**

```bash
git add backend/app/fundamental/us.py
git commit -m "feat(fundamental): US adapter (yfinance full)"
```

---

### Task 4: 라우터 + 통합 테스트

**Files:**
- Create: `backend/app/routers/fundamental.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_fundamental.py`

- [ ] **Step 1: 라우터 작성**

```python
from fastapi import APIRouter, HTTPException

from app.fundamental.kr import build_kr_report
from app.fundamental.us import build_us_report
from app.sources.pykrx_source import get_kr_stock_ohlcv
from app.sources.yfinance_source import get_yf_ohlcv

router = APIRouter(prefix="/fundamental", tags=["fundamental"])


@router.get("/kr/{ticker}")
def kr_report(ticker: str):
    try:
        market_data = get_kr_stock_ohlcv(ticker, days=30)
        return build_kr_report(ticker, name=market_data.name)
    except Exception as exc:
        raise HTTPException(502, str(exc))


@router.get("/us/{symbol}")
def us_report(symbol: str):
    try:
        market_data = get_yf_ohlcv(symbol.upper(), source="us_stocks", period="1mo")
        return build_us_report(symbol.upper(), name=market_data.name)
    except Exception as exc:
        raise HTTPException(502, str(exc))
```

- [ ] **Step 2: main.py에 등록**

```python
from app.routers import crypto, etfs, fundamental, indicators, indices, kr_stocks, upload, us_stocks
app.include_router(fundamental.router)
```

- [ ] **Step 3: 테스트**

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_kr_fundamental_samsung():
    r = client.get("/fundamental/kr/005930")
    assert r.status_code == 200
    body = r.json()
    titles = {s["title"] for s in body["sections"]}
    assert {"밸류에이션", "수익성", "성장성", "재무건전성", "주주환원"}.issubset(titles)


def test_us_fundamental_aapl():
    r = client.get("/fundamental/us/AAPL")
    assert r.status_code == 200
    body = r.json()
    assert body["market"] == "us"
    valuation = next(s for s in body["sections"] if s["title"] == "밸류에이션")
    labels = [i["label"] for i in valuation["items"]]
    assert "PER" in labels
    assert "EV/EBITDA" in labels
```

- [ ] **Step 4: 실행 + 커밋**

```bash
pytest tests/test_fundamental.py -v
git add backend/app/routers/fundamental.py backend/app/main.py backend/tests/test_fundamental.py
git commit -m "feat(fundamental): expose /fundamental API + tests"
```

---

## Self-Review

- [ ] 5개 카테고리 (밸류에이션/수익성/성장성/재무건전성/주주환원) 모두 작성?
- [ ] 한국/미국 어댑터 양쪽 동일 카테고리 구조?
- [ ] 한국에서 미제공 항목은 "-" + note 처리?
- [ ] 값 포맷이 통일됨 (배/원/%)?

## 완료 조건

`/fundamental/kr/005930`, `/fundamental/us/AAPL` 정상 응답.
