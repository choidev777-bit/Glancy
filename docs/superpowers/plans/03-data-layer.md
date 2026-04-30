# Plan 03 — 데이터 레이어 (백엔드 부트스트랩 + 5개 데이터 소스)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Python FastAPI 백엔드를 부트스트랩하고, 6개 데이터 소스(pykrx / DART / yfinance / Binance / CoinGecko / 사용자 업로드)를 통합하여 표준 `MarketData` 형식으로 출력하는 API를 완성한다.

**Architecture:** FastAPI + uvicorn 백엔드. 각 데이터 소스는 `app/sources/*.py` 모듈로 분리. 공통 정규화 레이어(`app/normalize.py`)가 표준 `MarketData` 객체를 만든다. CORS는 프론트(Vercel) 도메인 허용.

**Tech Stack:** Python 3.11+ / FastAPI / pykrx / yfinance / OpenDartReader / python-binance / requests / pandas / pydantic

**예상 소요:** 8~12시간

---

## File Structure

```
backend/
├── pyproject.toml             # 의존성 정의
├── .env.example
├── .gitignore
├── README.md
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI 앱 + 라우터 등록
│   ├── config.py              # 환경변수 로딩
│   ├── models.py              # MarketData / Pydantic 모델
│   ├── normalize.py           # 표준화 헬퍼
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── kr_stocks.py
│   │   ├── us_stocks.py
│   │   ├── etfs.py
│   │   ├── crypto.py
│   │   ├── indices.py
│   │   └── upload.py
│   └── sources/
│       ├── __init__.py
│       ├── pykrx_source.py
│       ├── dart_source.py
│       ├── yfinance_source.py
│       ├── binance_source.py
│       └── coingecko_source.py
└── tests/
    ├── __init__.py
    └── test_sources.py
```

---

## Tasks

### Task 1: 백엔드 디렉터리 + Python 환경

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`
- Create: `backend/README.md`

- [ ] **Step 1: 디렉터리 생성 + 가상환경**

```powershell
cd "C:\Users\thisi\Documents\Glancy"
New-Item -ItemType Directory -Force -Path "backend\app\routers", "backend\app\sources", "backend\tests" | Out-Null
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

- [ ] **Step 2: `pyproject.toml` 작성**

```toml
[project]
name = "glancy-backend"
version = "0.1.0"
description = "Glancy investment dashboard backend"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.27.0",
    "pydantic>=2.6.0",
    "pydantic-settings>=2.2.0",
    "python-dotenv>=1.0.0",
    "pykrx>=1.0.46",
    "yfinance>=0.2.36",
    "OpenDartReader>=0.2.4",
    "python-binance>=1.0.19",
    "requests>=2.31.0",
    "pandas>=2.2.0",
    "numpy>=1.26.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
    "ruff>=0.3.0",
]

[tool.ruff]
line-length = 100
```

- [ ] **Step 3: `.env.example` 작성**

```
DART_API_KEY=
ALLOWED_ORIGINS=http://localhost:5173
PORT=8000
```

- [ ] **Step 4: `.gitignore` 작성**

```
.venv/
__pycache__/
*.pyc
.env
.pytest_cache/
.ruff_cache/
*.egg-info/
```

- [ ] **Step 5: 의존성 설치**

```powershell
pip install -e ".[dev]"
```

설치 실패 시 (특히 pykrx, ta-lib 등):
- pykrx: `pip install pykrx` 단독 시도. 실패하면 GitHub 직접 설치
- 기타: 에러 메시지 보고 누락된 시스템 라이브러리 설치

- [ ] **Step 6: 커밋**

```bash
git add backend/pyproject.toml backend/.env.example backend/.gitignore
git commit -m "feat(backend): bootstrap python project with deps"
```

---

### Task 2: FastAPI 메인 앱 + 헬스체크

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`

- [ ] **Step 1: 빈 `__init__.py` 생성**

```powershell
New-Item -ItemType File -Force -Path "backend\app\__init__.py" | Out-Null
```

- [ ] **Step 2: `app/config.py` 작성**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    dart_api_key: str = ""
    allowed_origins: str = "http://localhost:5173"
    port: int = 8000

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
```

- [ ] **Step 3: `app/main.py` 작성 (헬스체크만)**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(title="Glancy Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}
```

- [ ] **Step 4: 서버 기동 확인**

```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

다른 터미널에서:
```powershell
curl http://localhost:8000/health
```

기대: `{"status":"ok","version":"0.1.0"}`

- [ ] **Step 5: 커밋**

```bash
git add backend/app/
git commit -m "feat(backend): add FastAPI main app with health endpoint"
```

---

### Task 3: 표준 모델 + 정규화 헬퍼

**Files:**
- Create: `backend/app/models.py`
- Create: `backend/app/normalize.py`

- [ ] **Step 1: `app/models.py` 작성**

```python
from typing import Literal, Optional

from pydantic import BaseModel, Field


class Candle(BaseModel):
    time: int = Field(..., description="Unix timestamp in seconds")
    open: float
    high: float
    low: float
    close: float
    volume: float = 0


class PortfolioWeight(BaseModel):
    ticker: str
    weight: float
    cost: Optional[float] = None


class ReturnPoint(BaseModel):
    time: int
    value: float


SourceType = Literal[
    "kr_stocks", "us_stocks", "etfs", "crypto", "global_indices", "user_upload"
]
DataType = Literal["OHLCV", "price_series", "portfolio", "multi_asset", "returns"]


class MarketData(BaseModel):
    source: SourceType
    symbol: str
    name: str
    type: DataType
    timezone: Literal["KST", "UTC"]
    currency: str
    candles: list[Candle] = []
    weights: Optional[list[PortfolioWeight]] = None
    returns: Optional[list[ReturnPoint]] = None
    meta: dict = {}
```

- [ ] **Step 2: `app/normalize.py` 작성**

```python
"""표준화 헬퍼: 다양한 입력을 MarketData 형식으로 변환."""
from datetime import datetime
from typing import Iterable

import pandas as pd

from app.models import Candle, MarketData


def df_to_candles(df: pd.DataFrame) -> list[Candle]:
    """OHLCV DataFrame → Candle list. 인덱스가 DatetimeIndex여야 함."""
    candles: list[Candle] = []
    for ts, row in df.iterrows():
        candles.append(
            Candle(
                time=int(pd.Timestamp(ts).timestamp()),
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                close=float(row["Close"]),
                volume=float(row.get("Volume", 0) or 0),
            )
        )
    return candles


def normalize_columns(df: pd.DataFrame, mapping: dict[str, str]) -> pd.DataFrame:
    """한국어/영문 컬럼명을 표준 (Open/High/Low/Close/Volume)으로 변환."""
    return df.rename(columns=mapping)
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/models.py backend/app/normalize.py
git commit -m "feat(backend): add MarketData model and normalization helpers"
```

---

### Task 4: 한국 주식 — pykrx 소스

**Files:**
- Create: `backend/app/sources/__init__.py`
- Create: `backend/app/sources/pykrx_source.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/kr_stocks.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 빈 init 파일 생성**

```powershell
New-Item -ItemType File -Force -Path "backend\app\sources\__init__.py", "backend\app\routers\__init__.py" | Out-Null
```

- [ ] **Step 2: `app/sources/pykrx_source.py` 작성**

```python
"""pykrx로 한국 주식 OHLCV + 기본 펀더멘털 조회."""
from datetime import datetime, timedelta

from pykrx import stock

from app.models import Candle, MarketData
from app.normalize import df_to_candles, normalize_columns

KOREAN_COLUMN_MAP = {
    "시가": "Open",
    "고가": "High",
    "저가": "Low",
    "종가": "Close",
    "거래량": "Volume",
}


def get_kr_stock_ohlcv(ticker: str, days: int = 365) -> MarketData:
    """ticker: 6자리 종목코드 (예: '005930')"""
    end = datetime.now().strftime("%Y%m%d")
    start = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")

    df = stock.get_market_ohlcv(start, end, ticker)
    df = normalize_columns(df, KOREAN_COLUMN_MAP)

    name = stock.get_market_ticker_name(ticker)

    return MarketData(
        source="kr_stocks",
        symbol=ticker,
        name=name,
        type="OHLCV",
        timezone="KST",
        currency="KRW",
        candles=df_to_candles(df),
        meta={"market": stock.get_market_ticker_list_market(ticker)} if False else {},
    )


def get_kr_stock_fundamental(ticker: str) -> dict:
    """PER, PBR, EPS, BPS, 배당수익률 (pykrx 기본)."""
    end = datetime.now().strftime("%Y%m%d")
    df = stock.get_market_fundamental(end, end, ticker)
    if df.empty:
        return {}
    row = df.iloc[0].to_dict()
    return {
        "PER": row.get("PER"),
        "PBR": row.get("PBR"),
        "EPS": row.get("EPS"),
        "BPS": row.get("BPS"),
        "DIV": row.get("DIV"),
        "DPS": row.get("DPS"),
    }
```

- [ ] **Step 3: `app/routers/kr_stocks.py` 작성**

```python
from fastapi import APIRouter, HTTPException, Query

from app.sources.pykrx_source import get_kr_stock_fundamental, get_kr_stock_ohlcv

router = APIRouter(prefix="/kr-stocks", tags=["kr_stocks"])


@router.get("/{ticker}")
def get_kr_stock(ticker: str, days: int = Query(365, ge=30, le=3650)):
    try:
        return get_kr_stock_ohlcv(ticker, days=days)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/{ticker}/fundamental")
def get_kr_fundamental(ticker: str):
    return get_kr_stock_fundamental(ticker)
```

- [ ] **Step 4: `app/main.py`에 라우터 등록**

```python
# 기존 임포트 아래에 추가
from app.routers import kr_stocks

# CORS 미들웨어 등록 다음에 추가
app.include_router(kr_stocks.router)
```

- [ ] **Step 5: 동작 확인**

서버 재시작 후:
```powershell
curl http://localhost:8000/kr-stocks/005930?days=30
curl http://localhost:8000/kr-stocks/005930/fundamental
```

기대: 삼성전자 OHLCV / PER 등 JSON 반환.

- [ ] **Step 6: 커밋**

```bash
git add backend/app/
git commit -m "feat(backend): add pykrx source for Korean stocks"
```

---

### Task 5: 미국 주식 + ETF + 글로벌 지수 — yfinance 소스

**Files:**
- Create: `backend/app/sources/yfinance_source.py`
- Create: `backend/app/routers/us_stocks.py`
- Create: `backend/app/routers/etfs.py`
- Create: `backend/app/routers/indices.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: `app/sources/yfinance_source.py` 작성**

```python
"""yfinance로 미국 주식 / ETF / 글로벌 지수 OHLCV + 펀더멘털."""
import yfinance as yf

from app.models import MarketData, SourceType
from app.normalize import df_to_candles


def get_yf_ohlcv(symbol: str, source: SourceType, period: str = "1y", currency: str = "USD") -> MarketData:
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    if df.empty:
        raise ValueError(f"No data for {symbol}")

    info = ticker.info or {}
    name = info.get("longName") or info.get("shortName") or symbol

    return MarketData(
        source=source,
        symbol=symbol,
        name=name,
        type="OHLCV",
        timezone="UTC",
        currency=currency,
        candles=df_to_candles(df),
        meta={"info": {k: info.get(k) for k in ("sector", "industry", "country") if info.get(k)}},
    )


def get_yf_fundamentals(symbol: str) -> dict:
    """yfinance로 미국 주식 기본적 분석 데이터 풀세트."""
    info = yf.Ticker(symbol).info or {}
    return {
        "PER": info.get("trailingPE"),
        "ForwardPER": info.get("forwardPE"),
        "PBR": info.get("priceToBook"),
        "PSR": info.get("priceToSalesTrailing12Months"),
        "EVtoEBITDA": info.get("enterpriseToEbitda"),
        "ROE": info.get("returnOnEquity"),
        "ROA": info.get("returnOnAssets"),
        "ProfitMargin": info.get("profitMargins"),
        "OperatingMargin": info.get("operatingMargins"),
        "GrossMargin": info.get("grossMargins"),
        "RevenueGrowth": info.get("revenueGrowth"),
        "EarningsGrowth": info.get("earningsGrowth"),
        "DebtToEquity": info.get("debtToEquity"),
        "CurrentRatio": info.get("currentRatio"),
        "DividendYield": info.get("dividendYield"),
        "PayoutRatio": info.get("payoutRatio"),
        "Beta": info.get("beta"),
        "MarketCap": info.get("marketCap"),
    }
```

- [ ] **Step 2: 3개 라우터 작성**

`app/routers/us_stocks.py`:
```python
from fastapi import APIRouter, HTTPException

from app.sources.yfinance_source import get_yf_fundamentals, get_yf_ohlcv

router = APIRouter(prefix="/us-stocks", tags=["us_stocks"])


@router.get("/{symbol}")
def get_us_stock(symbol: str, period: str = "1y"):
    try:
        return get_yf_ohlcv(symbol.upper(), source="us_stocks", period=period)
    except Exception as exc:
        raise HTTPException(502, str(exc))


@router.get("/{symbol}/fundamental")
def get_us_fundamental(symbol: str):
    return get_yf_fundamentals(symbol.upper())
```

`app/routers/etfs.py`:
```python
from fastapi import APIRouter, HTTPException

from app.sources.yfinance_source import get_yf_ohlcv

router = APIRouter(prefix="/etfs", tags=["etfs"])


@router.get("/{symbol}")
def get_etf(symbol: str, period: str = "1y"):
    try:
        return get_yf_ohlcv(symbol.upper(), source="etfs", period=period)
    except Exception as exc:
        raise HTTPException(502, str(exc))
```

`app/routers/indices.py`:
```python
from fastapi import APIRouter, HTTPException

from app.sources.yfinance_source import get_yf_ohlcv

router = APIRouter(prefix="/indices", tags=["indices"])

ALLOWED_INDICES = {"^KS11", "^KQ11", "^GSPC", "^IXIC", "^DJI", "^N225", "^FTSE", "^HSI"}


@router.get("/{symbol:path}")
def get_index(symbol: str, period: str = "1y"):
    if symbol not in ALLOWED_INDICES:
        raise HTTPException(400, f"Index {symbol} not in allowed list")
    try:
        return get_yf_ohlcv(symbol, source="global_indices", period=period)
    except Exception as exc:
        raise HTTPException(502, str(exc))
```

- [ ] **Step 3: main.py에 라우터 등록**

```python
from app.routers import etfs, indices, kr_stocks, us_stocks

app.include_router(kr_stocks.router)
app.include_router(us_stocks.router)
app.include_router(etfs.router)
app.include_router(indices.router)
```

- [ ] **Step 4: 동작 확인**

```powershell
curl http://localhost:8000/us-stocks/AAPL
curl http://localhost:8000/etfs/SPY
curl "http://localhost:8000/indices/^GSPC"
```

- [ ] **Step 5: 커밋**

```bash
git add backend/app/
git commit -m "feat(backend): add yfinance sources for US stocks, ETFs, indices"
```

---

### Task 6: 암호화폐 — Binance + CoinGecko 소스

**Files:**
- Create: `backend/app/sources/binance_source.py`
- Create: `backend/app/sources/coingecko_source.py`
- Create: `backend/app/routers/crypto.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: `app/sources/binance_source.py` 작성**

```python
"""Binance 공개 시장 데이터 (키 불필요)."""
import requests

from app.models import Candle, MarketData

BINANCE_BASE = "https://api.binance.com/api/v3"

INTERVAL_MAP = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w", "1M": "1M",
}


def get_binance_klines(symbol: str, interval: str = "1d", limit: int = 365) -> MarketData:
    """symbol 예: 'BTCUSDT'."""
    if interval not in INTERVAL_MAP:
        raise ValueError(f"Invalid interval {interval}")

    resp = requests.get(
        f"{BINANCE_BASE}/klines",
        params={"symbol": symbol, "interval": INTERVAL_MAP[interval], "limit": limit},
        timeout=10,
    )
    resp.raise_for_status()
    rows = resp.json()

    candles = [
        Candle(
            time=int(row[0] // 1000),
            open=float(row[1]),
            high=float(row[2]),
            low=float(row[3]),
            close=float(row[4]),
            volume=float(row[5]),
        )
        for row in rows
    ]

    return MarketData(
        source="crypto",
        symbol=symbol,
        name=symbol,
        type="OHLCV",
        timezone="UTC",
        currency="USDT" if symbol.endswith("USDT") else "USD",
        candles=candles,
    )
```

- [ ] **Step 2: `app/sources/coingecko_source.py` 작성**

```python
"""CoinGecko 무료 플랜으로 시총 상위 코인 목록 + 메타."""
import requests

CG_BASE = "https://api.coingecko.com/api/v3"


def get_top_coins(limit: int = 20) -> list[dict]:
    resp = requests.get(
        f"{CG_BASE}/coins/markets",
        params={
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": limit,
            "page": 1,
            "sparkline": False,
        },
        timeout=10,
    )
    resp.raise_for_status()
    return [
        {
            "id": c["id"],
            "symbol": c["symbol"].upper(),
            "name": c["name"],
            "market_cap_rank": c["market_cap_rank"],
            "market_cap": c["market_cap"],
            "image": c["image"],
            "current_price": c["current_price"],
            "binance_symbol": f"{c['symbol'].upper()}USDT",
        }
        for c in resp.json()
    ]
```

- [ ] **Step 3: `app/routers/crypto.py` 작성**

```python
from fastapi import APIRouter, HTTPException, Query

from app.sources.binance_source import get_binance_klines
from app.sources.coingecko_source import get_top_coins

router = APIRouter(prefix="/crypto", tags=["crypto"])


@router.get("/top")
def top_coins(limit: int = Query(20, ge=1, le=100)):
    try:
        return get_top_coins(limit=limit)
    except Exception as exc:
        raise HTTPException(502, str(exc))


@router.get("/{symbol}")
def get_crypto(symbol: str, interval: str = "1d", limit: int = Query(365, ge=10, le=1000)):
    try:
        return get_binance_klines(symbol.upper(), interval=interval, limit=limit)
    except Exception as exc:
        raise HTTPException(502, str(exc))
```

- [ ] **Step 4: main.py에 라우터 등록**

```python
from app.routers import crypto, etfs, indices, kr_stocks, us_stocks
app.include_router(crypto.router)
```

- [ ] **Step 5: 동작 확인**

```powershell
curl http://localhost:8000/crypto/top?limit=5
curl http://localhost:8000/crypto/BTCUSDT?interval=1d
```

- [ ] **Step 6: 커밋**

```bash
git add backend/app/
git commit -m "feat(backend): add Binance + CoinGecko sources for crypto"
```

---

### Task 7: DART API 소스 (한국 주식 재무제표)

**Files:**
- Create: `backend/app/sources/dart_source.py`
- Modify: `backend/app/routers/kr_stocks.py`

- [ ] **Step 1: DART API 키 발급**

https://opendart.fss.or.kr/uss/umt/cnfrmGuestKey.do 에서 키 발급 → `.env` 에 `DART_API_KEY=...` 저장.

- [ ] **Step 2: `app/sources/dart_source.py` 작성**

```python
"""DART API로 한국 주식 재무제표 조회."""
import OpenDartReader

from app.config import settings


def _client() -> OpenDartReader:
    if not settings.dart_api_key:
        raise RuntimeError("DART_API_KEY not configured")
    return OpenDartReader(settings.dart_api_key)


def get_dart_financials(ticker: str, year: int | None = None) -> dict:
    """주요 재무비율 추출. ticker는 6자리 종목코드."""
    from datetime import datetime

    dart = _client()
    target_year = year or datetime.now().year - 1
    try:
        df = dart.finstate(ticker, target_year, reprt_code="11011")  # 사업보고서
    except Exception as exc:
        return {"error": str(exc)}

    if df is None or df.empty:
        return {}

    # 주요 항목 추출 (계정명 매칭)
    result: dict = {"year": target_year}
    for _, row in df.iterrows():
        acc_nm = row.get("account_nm", "")
        amount = row.get("thstrm_amount")
        try:
            value = float(str(amount).replace(",", "")) if amount else None
        except (ValueError, TypeError):
            value = None

        if "매출액" == acc_nm:
            result["revenue"] = value
        elif "영업이익" == acc_nm:
            result["operating_income"] = value
        elif "당기순이익" == acc_nm:
            result["net_income"] = value
        elif "자산총계" == acc_nm:
            result["total_assets"] = value
        elif "부채총계" == acc_nm:
            result["total_liabilities"] = value
        elif "자본총계" == acc_nm:
            result["total_equity"] = value

    # 비율 계산
    if result.get("total_equity") and result.get("net_income"):
        result["ROE"] = result["net_income"] / result["total_equity"]
    if result.get("total_assets") and result.get("net_income"):
        result["ROA"] = result["net_income"] / result["total_assets"]
    if result.get("revenue") and result.get("operating_income"):
        result["operating_margin"] = result["operating_income"] / result["revenue"]
    if result.get("revenue") and result.get("net_income"):
        result["net_margin"] = result["net_income"] / result["revenue"]
    if result.get("total_equity") and result.get("total_liabilities"):
        result["debt_ratio"] = result["total_liabilities"] / result["total_equity"]

    return result
```

- [ ] **Step 3: `kr_stocks.py` 라우터에 펀더멘털 통합**

```python
from app.sources.dart_source import get_dart_financials
from app.sources.pykrx_source import get_kr_stock_fundamental, get_kr_stock_ohlcv


@router.get("/{ticker}/fundamental")
def get_kr_fundamental(ticker: str):
    pykrx_data = get_kr_stock_fundamental(ticker)
    dart_data = get_dart_financials(ticker)
    return {**pykrx_data, **dart_data}
```

- [ ] **Step 4: 동작 확인**

```powershell
curl http://localhost:8000/kr-stocks/005930/fundamental
```

기대: PER/PBR/EPS + ROE/ROA/매출 등 모두 포함.

- [ ] **Step 5: 커밋**

```bash
git add backend/app/
git commit -m "feat(backend): add DART API source for Korean fundamentals"
```

---

### Task 8: 사용자 업로드 라우터 (CSV/JSON 파싱 + 자동 감지 위임)

**Files:**
- Create: `backend/app/routers/upload.py`
- Modify: `backend/app/main.py`

> 자동 감지 로직 자체는 Plan 07 (csv-upload.md)에서 상세 구현. 본 단계에서는 endpoint와 골격만.

- [ ] **Step 1: `app/routers/upload.py` 작성**

```python
import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/")
async def upload_data(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".csv", ".json")):
        raise HTTPException(400, "Only CSV / JSON files are supported")

    content = await file.read()

    try:
        if file.filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_json(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(400, f"Failed to parse file: {exc}")

    return {
        "filename": file.filename,
        "row_count": len(df),
        "columns": df.columns.tolist(),
        "preview": df.head(10).to_dict(orient="records"),
        "type": "unknown",  # Plan 07에서 자동 감지로 채움
    }
```

- [ ] **Step 2: main.py에 등록**

```python
from app.routers import crypto, etfs, indices, kr_stocks, upload, us_stocks
app.include_router(upload.router)
```

- [ ] **Step 3: 동작 확인**

샘플 CSV 만들어서 업로드 테스트.

- [ ] **Step 4: 커밋**

```bash
git add backend/app/
git commit -m "feat(backend): add upload router skeleton"
```

---

### Task 9: 통합 테스트

**Files:**
- Create: `backend/tests/test_sources.py`

- [ ] **Step 1: 테스트 작성**

```python
"""실제 외부 API에 의존. CI에서는 스킵 또는 마킹."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_kr_stock_samsung():
    r = client.get("/kr-stocks/005930?days=30")
    assert r.status_code == 200
    data = r.json()
    assert data["symbol"] == "005930"
    assert data["source"] == "kr_stocks"
    assert len(data["candles"]) > 0


def test_us_stock_aapl():
    r = client.get("/us-stocks/AAPL?period=1mo")
    assert r.status_code == 200
    assert r.json()["source"] == "us_stocks"


def test_crypto_btc():
    r = client.get("/crypto/BTCUSDT?interval=1d&limit=30")
    assert r.status_code == 200
    assert r.json()["source"] == "crypto"


def test_top_coins():
    r = client.get("/crypto/top?limit=5")
    assert r.status_code == 200
    assert len(r.json()) == 5
```

- [ ] **Step 2: 테스트 실행**

```powershell
cd backend
pytest -v
```

기대: 모든 테스트 통과.

- [ ] **Step 3: 커밋**

```bash
git add backend/tests/
git commit -m "test(backend): integration tests for data sources"
```

---

### Task 10: README 작성 + 환경변수 안내

**Files:**
- Modify: `backend/README.md`

- [ ] **Step 1: README.md 작성**

```markdown
# Glancy Backend

FastAPI 기반 투자 데이터 API.

## 빠른 시작

\`\`\`powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
# .env 파일에 DART_API_KEY 입력
uvicorn app.main:app --reload --port 8000
\`\`\`

## 엔드포인트

| 경로 | 설명 |
|------|------|
| GET /health | 헬스체크 |
| GET /kr-stocks/{ticker} | 한국 주식 OHLCV |
| GET /kr-stocks/{ticker}/fundamental | 한국 주식 펀더멘털 (pykrx + DART) |
| GET /us-stocks/{symbol} | 미국 주식 OHLCV |
| GET /us-stocks/{symbol}/fundamental | 미국 주식 펀더멘털 (yfinance) |
| GET /etfs/{symbol} | ETF OHLCV |
| GET /indices/{symbol} | 글로벌 지수 OHLCV |
| GET /crypto/top | CoinGecko 시총 상위 |
| GET /crypto/{symbol} | Binance OHLCV (예: BTCUSDT) |
| POST /upload | CSV/JSON 업로드 |

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| DART_API_KEY | (없음) | 한국 재무제표 (https://opendart.fss.or.kr/) |
| ALLOWED_ORIGINS | http://localhost:5173 | CORS 허용 도메인 |
| PORT | 8000 | 서버 포트 |
\`\`\`

- [ ] **Step 2: 커밋**

\`\`\`bash
git add backend/README.md
git commit -m "docs(backend): add README with usage and env vars"
\`\`\`

---

## Self-Review

- [ ] 6개 데이터 소스 모두 라우터 + 테스트 있는가?
  - 한국 주식 (pykrx + DART) ✓
  - 미국 주식 (yfinance) ✓
  - ETF (yfinance) ✓
  - 암호화폐 (Binance + CoinGecko) ✓
  - 글로벌 지수 (yfinance) ✓
  - 사용자 업로드 (스켈레톤) ✓
- [ ] MarketData 표준 모델 일관 적용?
- [ ] CORS 설정으로 프론트 도메인 허용?
- [ ] DART API 키가 환경변수로 분리됐는가?
- [ ] 모든 라우터에서 외부 API 실패 시 502 반환?

## 완료 조건

`pytest`로 전체 통합 테스트 통과 + 6개 라우터가 정상 응답.
