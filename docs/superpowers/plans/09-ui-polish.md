# Plan 09 — UI 마무리 (버그 수정 + 미구현 기능 + 폴리싱)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gemini 3 Flash가 만든 첫 패스 UI에서 발견된 버그/미구현 기능을 모두 해결하고, 반응형/상태 처리/접근성을 마무리한다.

**Architecture:** 기존 컴포넌트 구조 유지. 데이터 소스를 mockData → 백엔드 API로 전환. "자세히 보기" 탭 전환 콜백, ETF/지수 더미 데이터 보강, 업로드 탭 UI, 한국 주식에서 미국 전용 항목 숨김 처리.

**Tech Stack:** React 18 + TypeScript + TailwindCSS (기존)

**예상 소요:** 4~6시간

---

## File Structure

수정 대상 파일:
- `src/App.tsx`
- `src/components/analysis/SummaryView.tsx`
- `src/components/analysis/TechnicalView.tsx`
- `src/components/analysis/FundamentalView.tsx`
- `src/components/dashboard/CategoryTabs.tsx`
- `src/components/layout/Header.tsx`
- `src/data/mockData.ts`

새로 생성:
- `src/components/upload/UploadView.tsx`
- `src/components/common/Skeleton.tsx`
- `src/components/common/ErrorState.tsx`
- `src/components/common/EmptyState.tsx`
- `src/hooks/useToast.ts` (선택)

---

## Tasks

### Task 1: "자세히 보기" 버튼 탭 전환 연결

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/analysis/SummaryView.tsx`

- [ ] **Step 1: SummaryView가 setActiveTab을 prop으로 받도록 수정**

`SummaryView.tsx` 인터페이스에 추가:

```tsx
interface SummaryViewProps {
  onNavigate: (tab: "summary" | "technical" | "fundamental") => void;
  fundamentalDisabled?: boolean;
}

const SummaryView: React.FC<SummaryViewProps> = ({ onNavigate, fundamentalDisabled }) => {
  // ...
  // 기존 "자세히 보기" 버튼:
  <button
    onClick={() => onNavigate("technical")}
    className="flex items-center gap-1 text-text-secondary hover:text-brand-primary text-sm font-medium transition-colors"
  >
    자세히 보기 <ChevronRight size={16} />
  </button>

  // 기본적 분석 카드의 "자세히 보기":
  <button
    onClick={() => !fundamentalDisabled && onNavigate("fundamental")}
    disabled={fundamentalDisabled}
    className={`flex items-center gap-1 text-sm font-medium transition-colors ${
      fundamentalDisabled
        ? "text-text-disabled cursor-not-allowed"
        : "text-text-secondary hover:text-brand-primary"
    }`}
  >
    {fundamentalDisabled ? "지원하지 않음" : "자세히 보기"} <ChevronRight size={16} />
  </button>
};
```

- [ ] **Step 2: App.tsx에서 콜백 전달**

```tsx
{activeAnalysisTab === "summary" && (
  <SummaryView
    onNavigate={setActiveAnalysisTab}
    fundamentalDisabled={isFundamentalDisabled}
  />
)}
```

- [ ] **Step 3: 동작 확인**

요약 탭 → "자세히 보기" → 기술적 분석 탭으로 전환되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/App.tsx src/components/analysis/SummaryView.tsx
git commit -m "fix(ui): wire 자세히 보기 to tab navigation"
```

---

### Task 2: ETF / 글로벌지수 더미 데이터 추가

**Files:**
- Modify: `src/data/mockData.ts`

- [ ] **Step 1: mockAssets 배열에 추가**

`mockData.ts`의 `mockAssets`에 다음 4개 항목 추가:

```tsx
{
  id: "spy",
  name: "SPDR S&P 500 ETF Trust",
  ticker: "SPY",
  category: "ETF",
  price: 587.34,
  change: 4.21,
  changePercent: 0.72,
  volume: "32,450,123",
  marketCap: "$580B",
  high52: 590.50,
  low52: 480.20,
  currency: "$"
},
{
  id: "qqq",
  name: "Invesco QQQ Trust",
  ticker: "QQQ",
  category: "ETF",
  price: 502.10,
  change: -1.85,
  changePercent: -0.37,
  volume: "21,300,000",
  marketCap: "$320B",
  high52: 510.00,
  low52: 410.50,
  currency: "$"
},
{
  id: "kospi",
  name: "코스피 종합지수",
  ticker: "^KS11",
  category: "글로벌지수",
  price: 2674.32,
  change: 12.45,
  changePercent: 0.47,
  volume: "-",
  marketCap: "-",
  high52: 2750.0,
  low52: 2420.0,
  currency: ""
},
{
  id: "sp500",
  name: "S&P 500",
  ticker: "^GSPC",
  category: "글로벌지수",
  price: 5870.43,
  change: 22.15,
  changePercent: 0.38,
  volume: "-",
  marketCap: "-",
  high52: 5920.0,
  low52: 4800.0,
  currency: ""
},
```

- [ ] **Step 2: 커밋**

```bash
git add src/data/mockData.ts
git commit -m "feat(data): add ETF and index mock entries"
```

---

### Task 3: 한국 주식에서 PSR / EV/EBITDA / 미국 전용 항목 숨김

**Files:**
- Modify: `src/components/analysis/FundamentalView.tsx`
- Modify: `src/data/mockData.ts`

- [ ] **Step 1: mockData에 시장 정보 추가**

각 펀더멘털 아이템에 `koreanAvailable: boolean` 플래그 추가:

```tsx
export const fundamentalDetails = [
  {
    title: "밸류에이션",
    items: [
      { label: "PER", value: "14.2배", position: 0.6, koreanAvailable: true },
      { label: "Forward PER", value: "12.5배", position: 0.5, koreanAvailable: false },
      { label: "PBR", value: "1.32배", position: 0.4, koreanAvailable: true },
      { label: "PSR", value: "1.8배", position: 0.7, koreanAvailable: false },
      { label: "EV/EBITDA", value: "8.4배", position: 0.3, koreanAvailable: false },
    ]
  },
  // ... 다른 카테고리도 동일하게 koreanAvailable 추가
];
```

- [ ] **Step 2: FundamentalView가 market prop 받도록 수정**

```tsx
interface FundamentalViewProps {
  market: "kr" | "us";
}

const FundamentalView: React.FC<FundamentalViewProps> = ({ market }) => {
  return (
    <div className="...">
      {fundamentalDetails.map((category) => (
        <div key={category.title} className="card flex flex-col">
          <div className="p-4 border-b border-border bg-surface-1/50">
            <h3 className="font-bold text-sm">{category.title}</h3>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {category.items
              .filter((item) => market === "us" || item.koreanAvailable)
              .map((item) => (
                // 기존 렌더링
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 3: App.tsx에서 market prop 전달**

```tsx
const market = activeCategory === "한국주식" ? "kr" : "us";
{activeAnalysisTab === "fundamental" && <FundamentalView market={market} />}
```

- [ ] **Step 4: 커밋**

```bash
git add src/data/mockData.ts src/components/analysis/FundamentalView.tsx src/App.tsx
git commit -m "fix(fundamental): hide US-only metrics for Korean stocks"
```

---

### Task 4: 업로드 탭 UI 구현

**Files:**
- Create: `src/components/upload/UploadView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `UploadView.tsx` 작성**

```tsx
import { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

const SUPPORTED_TYPES = [
  { key: "OHLCV", label: "OHLCV 캔들 데이터", desc: "Date / Open / High / Low / Close / Volume 컬럼" },
  { key: "portfolio", label: "포트폴리오 비중", desc: "Ticker / Weight 또는 종목 / 비중 컬럼" },
  { key: "multi_asset", label: "다종목 비교", desc: "Date + 3개 이상의 종목 가격 컬럼" },
  { key: "returns", label: "수익률 시계열", desc: "Date + Return 컬럼" },
  { key: "price_series", label: "가격 시계열", desc: "Date + Close 컬럼" },
];

export default function UploadView() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (f: File) => {
    setFile(f);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/upload/`, {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
      setResult(await r.json());
    } catch (e: any) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="px-6 pb-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className={`card p-12 text-center border-2 border-dashed transition-colors ${
          dragOver ? "border-brand-primary bg-brand-primary/5" : "border-border"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Upload size={48} className="mx-auto text-text-tertiary mb-4" />
        <h3 className="text-lg font-bold mb-2">CSV 또는 JSON 파일을 업로드하세요</h3>
        <p className="text-text-secondary text-sm mb-6">
          데이터 유형을 자동으로 감지하여 분석합니다 (최대 10MB)
        </p>
        <label className="btn-primary inline-flex cursor-pointer">
          <input
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          파일 선택
        </label>
      </div>

      <div className="card p-6">
        <h3 className="font-bold mb-4">지원 형식</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUPPORTED_TYPES.map((t) => (
            <div key={t.key} className="p-3 bg-surface-1 rounded-card">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-brand-primary" />
                <span className="font-bold text-sm">{t.label}</span>
              </div>
              <div className="text-xs text-text-tertiary">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card p-8 text-center">
          <div className="text-text-secondary">분석 중...</div>
        </div>
      )}

      {error && (
        <div className="card p-6 border-negative/30 bg-negative/5">
          <div className="flex items-center gap-2 text-negative">
            <AlertCircle size={20} />
            <span className="font-bold">오류</span>
          </div>
          <div className="mt-2 text-sm text-text-secondary">{error}</div>
        </div>
      )}

      {result && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-positive" />
            <span className="font-bold">감지된 유형: {result.type}</span>
          </div>
          <pre className="text-xs bg-surface-1 p-4 rounded-card overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: App.tsx에서 업로드 탭 분기**

```tsx
{activeCategory === "내 데이터 업로드" ? (
  <UploadView />
) : (
  <>
    <AssetHeader asset={currentAsset} />
    <AnalysisTabs ... />
    {/* ... */}
  </>
)}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/upload/ src/App.tsx
git commit -m "feat(upload): add upload view with drag-drop + auto-detect display"
```

---

### Task 5: 공통 상태 컴포넌트 (Skeleton / Error / Empty)

**Files:**
- Create: `src/components/common/Skeleton.tsx`
- Create: `src/components/common/ErrorState.tsx`
- Create: `src/components/common/EmptyState.tsx`

- [ ] **Step 1: `Skeleton.tsx`**

```tsx
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({ width = "100%", height = "20px", className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-surface-3 rounded-card animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
}
```

- [ ] **Step 2: `ErrorState.tsx`**

```tsx
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = "데이터를 불러오는 중 오류가 발생했습니다", onRetry }: Props) {
  return (
    <div className="card p-8 text-center">
      <AlertCircle size={32} className="mx-auto text-negative mb-3" />
      <p className="text-text-secondary mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw size={16} />
          다시 시도
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `EmptyState.tsx`**

```tsx
import { Inbox } from "lucide-react";

interface Props {
  message?: string;
}

export default function EmptyState({ message = "표시할 데이터가 없습니다" }: Props) {
  return (
    <div className="card p-12 text-center">
      <Inbox size={32} className="mx-auto text-text-tertiary mb-3" />
      <p className="text-text-secondary">{message}</p>
    </div>
  );
}
```

- [ ] **Step 4: TechnicalView / FundamentalView / SummaryView에 적용**

각 뷰에서 loading / error 상태를 처리:

```tsx
if (loading) return <SkeletonView />;
if (error) return <ErrorState message={error} onRetry={refetch} />;
if (!data) return <EmptyState />;
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/common/
git commit -m "feat(ui): common Skeleton / ErrorState / EmptyState"
```

---

### Task 6: 모바일 검색바 + 카테고리 탭 가로 스크롤 강화

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/dashboard/CategoryTabs.tsx`
- Modify: `src/index.css` (no-scrollbar 클래스 추가)

- [ ] **Step 1: `index.css`에 no-scrollbar 유틸 추가**

```css
@layer utilities {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

- [ ] **Step 2: 모바일 검색 토글 — Header.tsx 수정**

```tsx
const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

// 데스크톱 검색바는 hidden md:block 유지
// 모바일용 추가:
<button
  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
  className="md:hidden p-2 rounded-lg hover:bg-surface-3"
>
  <Search size={20} />
</button>

{mobileSearchOpen && (
  <div className="absolute top-full left-0 right-0 p-3 bg-surface-1 border-b border-border md:hidden">
    <input type="text" placeholder="종목 검색..." className="w-full bg-surface-3 rounded-pill px-4 py-2" />
  </div>
)}
```

- [ ] **Step 3: 커밋**

```bash
git add src/index.css src/components/layout/Header.tsx
git commit -m "fix(ui): mobile search toggle + no-scrollbar utility"
```

---

### Task 7: 게이지 SVG 좌표 안정화 + 시그널 라벨 표시

**Files:**
- Modify: `src/components/common/Gauge.tsx`

- [ ] **Step 1: 고정 viewBox + scale transform 제거**

```tsx
const Gauge: React.FC<GaugeProps> = ({ score, label, title, size = 200 }) => {
  // 고정된 viewBox 200x110, size로는 컨테이너만 조정
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      {title && <h4 className="text-text-secondary text-sm font-semibold mb-4">{title}</h4>}
      <div className="relative" style={{ width: size, height: size * 0.55 }}>
        <svg viewBox="0 0 200 110" width={size} height={size * 0.55}>
          <path d="M 20,100 A 80,80 0 0 1 180,100" fill="none" stroke="var(--border-default)" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M 20,100 A 80,80 0 0 1 180,100"
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          {label && (
            <span className="text-base font-bold" style={{ color: getStrokeColor() }}>
              {label}
            </span>
          )}
          <span className="text-xs font-mono text-text-tertiary mt-0.5">{score}%</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/common/Gauge.tsx
git commit -m "fix(gauge): stabilize SVG coordinates + show signal label primarily"
```

---

### Task 8: 폰트 로딩 (Pretendard + JetBrains Mono)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: index.html `<head>`에 폰트 추가**

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: 커밋**

```bash
git add index.html
git commit -m "chore(fonts): add Pretendard + JetBrains Mono via CDN"
```

---

### Task 9: 최종 시각 검수 — 데스크톱 / 태블릿 / 모바일

**Files:** N/A (시각 검수)

- [ ] **Step 1: `npm run dev` 후 브라우저 개발자도구로 각 viewport 검수**

체크 항목:
- [ ] 데스크톱(1440px): 카드 그리드 균형, 차트 폭
- [ ] 태블릿(768px): 게이지 가로 배치, 테이블 그대로
- [ ] 모바일(375px): 카테고리 탭 가로 스크롤, 게이지 세로 적층, 테이블 가로 스크롤
- [ ] 다크 ↔ 라이트 모드 전환 시 모든 색상 정상
- [ ] "자세히 보기" 클릭 → 탭 전환 정상
- [ ] 업로드 탭 진입 시 UploadView 렌더
- [ ] 비활성 탭(기본적 분석) 호버 툴팁
- [ ] 한국 주식 펀더멘털에서 PSR / EV/EBITDA / Forward PER 숨김

- [ ] **Step 2: 발견된 잔여 이슈 수정 + 커밋**

```bash
git add -A
git commit -m "fix(ui): post-review polish"
```

---

## Self-Review

- [ ] "자세히 보기" 버튼 정상 작동?
- [ ] ETF / 글로벌지수 더미 데이터 보강?
- [ ] 한국 주식에서 미국 전용 항목 숨김?
- [ ] 업로드 탭 UI 완성?
- [ ] Skeleton / Error / Empty 공통 컴포넌트 적용?
- [ ] 모바일 검색 토글 + 가로 스크롤?
- [ ] 게이지 SVG 좌표 안정화?
- [ ] Pretendard + JetBrains Mono 폰트 로딩?

## 완료 조건

`npm run dev` 후 6개 카테고리 탭 + 3개 분석 탭 + 업로드 탭이 모두 정상 작동, 데스크톱/태블릿/모바일 모두 깨짐 없이 렌더링.
