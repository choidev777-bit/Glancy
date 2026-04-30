# Plan 13 — Demo Reliability Layer

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 외부 API가 느리거나 실패해도 심사 데모가 끊기지 않도록 cache, timeout, retry, sample fallback, UI 상태 배지를 구현한다. "실시간 데이터"와 "항상 작동하는 데모"를 동시에 만족한다.

**Architecture:** 백엔드는 모든 외부 데이터 소스 호출에 timeout/retry/cache를 적용하고, 실패 시 `backend/app/sample_data/`의 샘플 MarketData를 반환한다. 응답 meta에는 `data_status: live | cached | sample`을 포함한다. 프론트는 이 상태를 배지로 보여주고, sample fallback이어도 지표/인사이트/차트 분석은 동일하게 수행한다.

**Tech Stack:** Python stdlib cache 또는 cachetools / FastAPI / JSON fixtures / frontend status badges

**예상 소요:** 5~7시간

---

## File Structure

```
backend/app/
├── reliability/
│   ├── __init__.py
│   ├── cache.py              # TTL cache
│   ├── fallback.py           # sample data loader
│   ├── status.py             # live/cached/sample metadata
│   └── wrappers.py           # timeout/retry helpers
└── sample_data/
    ├── kr_005930.json
    ├── us_aapl.json
    ├── etf_spy.json
    ├── crypto_btcusdt.json
    └── index_gspc.json

src/components/common/
└── DataStatusBadge.tsx
```

---

## Tasks

### Task 1: data status 모델 확장

**Files:**
- Modify: `backend/app/models.py`
- Modify: `src/lib/api.ts`

- [ ] **Step 1: backend MarketData meta 규칙 추가**

`MarketData.meta`에 다음 키를 표준화한다.

```json
{
  "data_status": "live",
  "source_name": "yfinance",
  "fetched_at": "2026-04-29T00:00:00Z",
  "fallback_reason": null
}
```

- [ ] **Step 2: frontend type에 `meta` 추가**

```typescript
export interface MarketDataMeta {
  data_status?: "live" | "cached" | "sample";
  source_name?: string;
  fetched_at?: string;
  fallback_reason?: string | null;
}

export interface MarketData {
  source: string;
  symbol: string;
  name: string;
  type: string;
  currency: string;
  candles: Candle[];
  meta?: MarketDataMeta;
}
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/models.py src/lib/api.ts
git commit -m "feat(reliability): standardize data status metadata"
```

---

### Task 2: TTL cache 구현

**Files:**
- Create: `backend/app/reliability/__init__.py`
- Create: `backend/app/reliability/cache.py`

- [ ] **Step 1: cache helper 작성**

```python
from datetime import datetime, timedelta
from typing import Any, Callable

_CACHE: dict[str, tuple[datetime, Any]] = {}


def get_or_set(key: str, ttl_seconds: int, loader: Callable[[], Any]) -> tuple[Any, bool]:
    now = datetime.utcnow()
    if key in _CACHE:
      created_at, value = _CACHE[key]
      if now - created_at < timedelta(seconds=ttl_seconds):
          return value, True

    value = loader()
    _CACHE[key] = (now, value)
    return value, False
```

- [ ] **Step 2: cache key 규칙 문서화**

```python
# Examples:
# market:kr_stocks:005930:365
# market:us_stocks:AAPL:1y
# market:crypto:BTCUSDT:1d:365
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/reliability/cache.py backend/app/reliability/__init__.py
git commit -m "feat(reliability): add TTL cache helper"
```

---

### Task 3: sample fallback 데이터 생성

**Files:**
- Create: `backend/app/sample_data/*.json`
- Create: `backend/app/reliability/fallback.py`

- [ ] **Step 1: 샘플 MarketData 저장**

각 기본 데모 종목에 대해 정상 API 응답을 JSON fixture로 저장한다.

Required fixtures:
- `kr_005930.json`
- `us_aapl.json`
- `etf_spy.json`
- `crypto_btcusdt.json`
- `index_gspc.json`

- [ ] **Step 2: fallback loader 작성**

```python
import json
from pathlib import Path

from app.models import MarketData

SAMPLE_DIR = Path(__file__).resolve().parents[1] / "sample_data"

SAMPLE_MAP = {
    ("kr_stocks", "005930"): "kr_005930.json",
    ("us_stocks", "AAPL"): "us_aapl.json",
    ("etfs", "SPY"): "etf_spy.json",
    ("crypto", "BTCUSDT"): "crypto_btcusdt.json",
    ("global_indices", "^GSPC"): "index_gspc.json",
}


def load_sample(source: str, symbol: str, reason: str) -> MarketData:
    filename = SAMPLE_MAP.get((source, symbol.upper()))
    if not filename:
        raise FileNotFoundError(f"No sample fallback for {source}:{symbol}")

    data = json.loads((SAMPLE_DIR / filename).read_text(encoding="utf-8"))
    data.setdefault("meta", {})
    data["meta"].update({
        "data_status": "sample",
        "fallback_reason": reason,
    })
    return MarketData(**data)
```

- [ ] **Step 3: 커밋**

```bash
git add backend/app/sample_data/ backend/app/reliability/fallback.py
git commit -m "feat(reliability): add sample MarketData fallback loader"
```

---

### Task 4: timeout/retry wrapper 구현

**Files:**
- Create: `backend/app/reliability/wrappers.py`

- [ ] **Step 1: wrapper 작성**

```python
import time
from typing import Callable, TypeVar

T = TypeVar("T")


def with_retry(loader: Callable[[], T], retries: int = 1, delay_seconds: float = 0.3) -> T:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return loader()
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(delay_seconds)
    assert last_error is not None
    raise last_error
```

Note: HTTP-level timeout은 각 source module의 `requests.get(..., timeout=10)` 또는 yfinance/pykrx 호출 wrapper에서 처리한다.

- [ ] **Step 2: 커밋**

```bash
git add backend/app/reliability/wrappers.py
git commit -m "feat(reliability): add retry wrapper"
```

---

### Task 5: data source 라우터에 reliability 적용

**Files:**
- Modify: `backend/app/routers/kr_stocks.py`
- Modify: `backend/app/routers/us_stocks.py`
- Modify: `backend/app/routers/etfs.py`
- Modify: `backend/app/routers/indices.py`
- Modify: `backend/app/routers/crypto.py`
- Modify: `backend/app/routers/indicators.py`

- [ ] **Step 1: 공통 패턴 적용**

```python
from app.reliability.cache import get_or_set
from app.reliability.fallback import load_sample
from app.reliability.wrappers import with_retry


def reliable_market_data(cache_key: str, source: str, symbol: str, loader):
    try:
        data, from_cache = get_or_set(cache_key, ttl_seconds=300, loader=lambda: with_retry(loader, retries=1))
        data.meta = {
            **(data.meta or {}),
            "data_status": "cached" if from_cache else "live",
            "source_name": source,
        }
        return data
    except Exception as exc:
        return load_sample(source, symbol, reason=str(exc))
```

- [ ] **Step 2: 각 router에서 loader 감싸기**

각 endpoint가 외부 source를 직접 호출하지 않고 `reliable_market_data`를 사용하도록 수정한다.

- [ ] **Step 3: indicators endpoint도 fallback MarketData로 계산**

sample fallback이어도 `compute_all()`과 `compose()`는 동일하게 수행한다.

- [ ] **Step 4: 커밋**

```bash
git add backend/app/routers/
git commit -m "feat(reliability): apply cache and fallback to market routes"
```

---

### Task 6: DataStatusBadge 구현

**Files:**
- Create: `src/components/common/DataStatusBadge.tsx`
- Modify: `src/components/dashboard/AssetHeader.tsx`

- [ ] **Step 1: badge component 작성**

```tsx
import { CheckCircle2, Clock3, DatabaseBackup } from "lucide-react";
import type { MarketDataMeta } from "../../lib/api";

interface Props {
  meta?: MarketDataMeta;
}

export default function DataStatusBadge({ meta }: Props) {
  const status = meta?.data_status || "live";

  if (status === "sample") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-pill bg-warning/15 text-warning">
        <DatabaseBackup size={13} />
        Sample fallback
      </span>
    );
  }

  if (status === "cached") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-pill bg-info/15 text-info">
        <Clock3 size={13} />
        Cached
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-pill bg-positive/15 text-positive">
      <CheckCircle2 size={13} />
      Live
    </span>
  );
}
```

- [ ] **Step 2: AssetHeader에 표시**

종목명/현재가 영역 근처에 `DataStatusBadge`를 표시한다.

- [ ] **Step 3: 커밋**

```bash
git add src/components/common/DataStatusBadge.tsx src/components/dashboard/AssetHeader.tsx
git commit -m "feat(ui): show live/cached/sample data status"
```

---

### Task 7: fallback QA 테스트

**Files:**
- Create: `backend/tests/test_reliability.py`
- Modify: `docs/deployment/qa-checklist.md`

- [ ] **Step 1: backend fallback 테스트**

```python
from app.reliability.fallback import load_sample


def test_load_sample_crypto():
    data = load_sample("crypto", "BTCUSDT", reason="test")
    assert data.source == "crypto"
    assert data.meta["data_status"] == "sample"
    assert len(data.candles) > 0
```

- [ ] **Step 2: QA 체크리스트 추가**

```markdown
## Reliability
- [ ] API 실패를 강제로 발생시켜도 sample fallback 표시
- [ ] fallback 상태에서도 차트/지표/인사이트 렌더
- [ ] cached 상태 배지 표시
- [ ] live 상태 배지 표시
```

- [ ] **Step 3: 커밋**

```bash
git add backend/tests/test_reliability.py docs/deployment/qa-checklist.md
git commit -m "test(reliability): sample fallback test and QA checks"
```

---

## Self-Review

- [ ] 모든 외부 API route에 timeout/retry/cache/fallback이 적용됐는가?
- [ ] fallback 데이터가 최소 5개 핵심 데모 자산을 커버하는가?
- [ ] sample fallback이어도 지표/인사이트/차트가 동일하게 작동하는가?
- [ ] UI에서 live/cached/sample 상태가 명확하게 보이는가?
- [ ] 심사자가 API 장애를 오류가 아니라 안정성 기능으로 이해할 수 있는가?

## 완료 조건

외부 API가 실패해도 제출 URL에서 기본 데모 루트가 끊기지 않고, UI가 `Sample fallback` 상태를 표시하며 분석 결과를 계속 렌더링한다.
