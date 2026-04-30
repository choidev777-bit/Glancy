# Plan 02 — Skills.md 7개 모듈 작성

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skills.md 7개 모듈을 5/7 09:59까지 완성하여 제출. 각 모듈이 단일 책임을 명확히 하면서, main.md orchestrator가 전체를 묶는 구조.

**Architecture:** 7개 마크다운 파일 + README.md(설명서) + ZIP 패키지. 각 모듈은 "입력/출력/규칙/예시" 형식의 일관된 구조. main.md가 의존성 그래프와 호출 순서를 명시.

**Tech Stack:** Markdown only.

**예상 소요:** 12~16시간 (스켈레톤 4시간 + 정식판 8~12시간)

---

## File Structure

```
skills/
├── README.md           # 패키지 설명, 사용법, 의존성 그래프
├── main.md             # Orchestrator
├── data.md             # Data Source Registry
├── indicators.md       # 지표 계산 규칙
├── insights.md         # 인사이트 생성 규칙 (외부 LLM 미사용)
├── charts.md           # 차트 종류 매핑 규칙
├── layout.md           # 페이지 배치 / 반응형 / 상태 처리
└── theme.md            # 디자인 토큰 (다크/라이트)
```

제출 시: `skills.zip` (위 폴더 전체 압축)

---

## Tasks

### Task 1: 디렉터리 + README.md 부트스트랩

**Files:**
- Create: `skills/README.md`

- [ ] **Step 1: 디렉터리 생성**

```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\thisi\Documents\Glancy\skills" | Out-Null
```

- [ ] **Step 2: README.md 작성**

```markdown
# Glancy Skills.md 패키지

## 패키지 구성

| 파일 | 역할 |
|------|------|
| main.md | 시스템 진입점, 모듈 호출 순서 |
| data.md | 6개 데이터 소스 통합 + 표준화 |
| indicators.md | 기술/기본 지표 계산 규칙 |
| insights.md | 규칙 기반 자연어 해석 (외부 LLM API 미사용) |
| charts.md | 데이터/지표 → 차트 종류 매핑 |
| layout.md | 페이지 배치, 반응형, 상태 처리 |
| theme.md | 색/폰트/간격 등 디자인 토큰 |

## 의존성 그래프

\`\`\`
main.md
  └─ data.md
       └─ indicators.md
            └─ insights.md
                 └─ charts.md
                      └─ layout.md ← theme.md (횡주입)
                           └─ Final Dashboard
\`\`\`

## 사용법

본 패키지는 두 가지 방식으로 활용된다.

### 방식 1 — 개발 시 가이드 (Build-time)
Cursor / Claude / Windsurf 등 AI 코딩 도구에 본 패키지를 컨텍스트로 제공하면, AI는 main.md를 진입점으로 읽고 의존성 순서대로 다른 모듈을 참조하여 대시보드 코드를 생성한다.

### 방식 2 — 런타임 설정 파일 (Runtime)
대시보드는 indicators.md / theme.md 등을 런타임 설정 파일로 사용한다. 사용자가 RSI 기간을 변경하면 indicators.md의 기본값이 오버라이드되어 대시보드 전체가 재계산된다. 이는 "Skills.md가 시스템을 구동한다"의 직접적 증명이다.

## 라이선스

MIT
```

- [ ] **Step 3: 커밋**

```bash
git add skills/README.md
git commit -m "feat(skills): scaffold skills package + README"
```

---

### Task 2: main.md (Orchestrator) 작성

**Files:**
- Create: `skills/main.md`

- [ ] **Step 1: main.md 작성**

```markdown
# main.md — System Orchestrator

## 1. 시스템 개요
본 시스템은 사용자가 다양한 투자 데이터를 한 곳에서 분석할 수 있는 범용 대시보드다. 분석 규칙, 시각화 기준, UI 레이아웃, 디자인 토큰이 모두 본 패키지의 .md 파일에 정의되어 있다.

## 2. 사용자 시나리오 라우팅

| 사용자 행동 | 라우팅 |
|-----------|--------|
| 카테고리 탭 클릭 (한국주식/미국주식/ETF/암호화폐/글로벌지수) | data.md → 해당 소스 호출 |
| 종목 검색 | data.md → 검색 결과 → 선택 시 해당 소스 호출 |
| CSV/JSON 업로드 | data.md → 자동 감지 분기 → 유형별 분석 |

## 3. 모듈 호출 순서

\`\`\`
[1] data.md      : 입력 → MarketData 표준 구조
[2] indicators.md: MarketData → 지표값 + 시그널
[3] insights.md  : 지표/시그널 → 자연어 텍스트 (한국어)
[4] charts.md    : 데이터/지표 → ChartSpec[]
[5] layout.md    : ChartSpec + Insights → 페이지 구성
[6] theme.md     : layout 결과에 디자인 토큰 적용
\`\`\`

## 4. 의존성 명세

| 모듈 | 의존 | 설명 |
|------|------|------|
| main.md | (없음) | 진입점 |
| data.md | main.md | 라우팅에 따라 호출됨 |
| indicators.md | data.md | MarketData를 입력으로 받음 |
| insights.md | indicators.md | 지표값을 입력으로 받음 |
| charts.md | indicators.md, insights.md | 시각화 결정 |
| layout.md | charts.md, insights.md | 페이지 구성 |
| theme.md | (없음, 횡주입) | 모든 시각 요소에 토큰 주입 |

## 5. 에러 처리 정책

| 상황 | 처리 |
|------|------|
| 데이터 소스 응답 실패 | layout.md의 에러 상태 카드 표시, 재시도 버튼 |
| 지표 계산 실패 (데이터 부족) | 해당 지표만 N/A 표시, 나머지는 정상 진행 |
| 인사이트 매칭 실패 | "추가 분석 필요" 기본 텍스트 사용 |
| 데이터 유형 감지 실패 | 사용자에게 유형 선택 UI 표시 |

## 6. 런타임 설정 오버라이드
사용자가 indicators.md / theme.md의 파라미터를 UI에서 변경하면, 해당 변경값이 런타임에 우선 적용된다. main.md는 이 오버라이드 메커니즘의 전제다.

## 7. 코드 생성 시 시스템 권장사항 (바이브 코딩 가이드)

본 .md 패키지를 AI 코딩 도구에 입력할 때 권장 순서:
1. README.md를 시스템 메시지에 포함
2. main.md를 항상 컨텍스트에 유지
3. 작업 중인 모듈의 .md 파일을 추가 컨텍스트로 제공
4. 다른 모듈은 필요시 lazy-load
```

- [ ] **Step 2: 커밋**

```bash
git add skills/main.md
git commit -m "feat(skills): add main.md orchestrator"
```

---

### Task 3: data.md (Data Source Registry) 작성

**Files:**
- Create: `skills/data.md`

- [ ] **Step 1: data.md 작성**

다음 섹션 모두 포함:
1. 입력 / 출력 인터페이스 (`MarketData` 표준 구조 정의)
2. 6개 데이터 소스 레지스트리 (각 소스별 엔드포인트, 컬럼 매핑, 시간 정규화)
3. CSV/JSON 자동 감지 규칙 5종 (OHLCV / portfolio / multi_asset / returns / price_series)
4. 결측치 처리 규칙
5. 검증 실패 시 사용자 메시지 포맷
6. 시간대 처리 (KST/UTC 변환)

상세 내용은 `HACKATHON_DESIGN.md` 7-4 섹션을 참조하여 정확히 옮겨 적기.

(분량이 많아 본 플랜에서는 코드 블록 생략. HACKATHON_DESIGN.md 7-4를 그대로 참조하여 작성하면 됨.)

- [ ] **Step 2: 핵심 인터페이스 명세 추가**

```markdown
## 표준 출력 — MarketData

\`\`\`typescript
interface MarketData {
  source: 'kr_stocks' | 'us_stocks' | 'etfs' | 'crypto' | 'global_indices' | 'user_upload'
  symbol: string
  name: string
  type: 'OHLCV' | 'price_series' | 'portfolio' | 'multi_asset' | 'returns'
  timezone: 'KST' | 'UTC'
  currency: 'KRW' | 'USD' | 'KRW_BTC' | 'USDT'
  candles: Array<{
    time: number          // Unix timestamp (seconds)
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  // 보조 필드 (유형별 추가)
  weights?: Array<{ ticker: string; weight: number; cost?: number }>
  returns?: Array<{ time: number; return: number }>
}
\`\`\`

이 구조는 indicators.md, charts.md, layout.md 모두의 입력 표준이 된다.
```

- [ ] **Step 3: 커밋**

```bash
git add skills/data.md
git commit -m "feat(skills): add data.md — data source registry"
```

---

### Task 4: indicators.md 작성

**Files:**
- Create: `skills/indicators.md`

- [ ] **Step 1: 지표 카테고리 + 기본값 + 허용 범위 작성**

`HACKATHON_DESIGN.md` 7-2-1, 7-2-4 내용을 그대로 옮겨 적기. 추가로 다음 인터페이스 명세 포함:

```markdown
## 출력 인터페이스 — IndicatorResult

\`\`\`typescript
interface IndicatorResult {
  name: string                                    // "RSI(14)"
  value: number | string                          // 58.32
  signal: '강한 매수' | '매수' | '중립' | '매도' | '강한 매도'
                                                  // 또는 '과매수' / '과매도' / '덜 변동적' / '변동적'
  score: number                                   // -2 ~ +2 (게이지 가중치)
  raw?: Record<string, number>                    // 보조 데이터 (예: MACD signal line)
}

interface IndicatorBundle {
  trend: IndicatorResult[]      // MA series
  momentum: IndicatorResult[]   // RSI, MACD, Stoch 등
  volatility: IndicatorResult[] // BB, ATR
  strength: IndicatorResult[]   // ADX, Williams %R, CCI 등
  volume: IndicatorResult[]     // OBV
  pivots: PivotPoint[]          // Classic, Fib, ...
  gauges: {
    technical: number           // -20 ~ +20
    movingAverage: number       // -24 ~ +24
    overall: number             // -44 ~ +44
  }
}
\`\`\`
```

- [ ] **Step 2: 사용자 파라미터 오버라이드 명세 추가**

```markdown
## 사용자 파라미터 오버라이드

UI에서 사용자가 변경 가능한 항목 (런타임 설정 파일로 작동):

\`\`\`yaml
rsi:
  period: 14         # default
  range: [5, 50]
  overbought: 70
  oversold: 30

macd:
  fast: 12
  slow: 26
  signal: 9

bollinger:
  period: 20
  std: 2.0

stochastic:
  k_period: 9
  d_period: 6

moving_averages:
  display: [5, 20, 60, 200]   # 기본 표시
  available: [5, 10, 20, 50, 60, 100, 120, 200, 240]
\`\`\`

UI에서 변경 → 즉시 재계산 → IndicatorBundle 갱신 → 차트/테이블/게이지 즉시 반영.
```

- [ ] **Step 3: 커밋**

```bash
git add skills/indicators.md
git commit -m "feat(skills): add indicators.md — calculation rules"
```

---

### Task 5: insights.md (외부 LLM 미사용) 작성

**Files:**
- Create: `skills/insights.md`

- [ ] **Step 1: 외부 LLM 미사용 선언 + 작동 원리 명시**

```markdown
# insights.md — Rule-Based Narrative Layer

## 핵심 원칙
**외부 LLM API를 호출하지 않는다.** 모든 인사이트 텍스트는 본 문서의 IF/THEN 규칙 + 텍스트 템플릿 + 변수 치환으로 생성된다.

이는 다음을 직접 증명한다.
- Skills.md 자체가 지능 (Skills.md 설계 25점)
- 문서가 시스템을 구동 (바이브코딩 15점)

## 출력 인터페이스 — Insight

\`\`\`typescript
interface Insight {
  category: 'trend' | 'momentum' | 'volatility' | 'risk' | 'opportunity' | 'overall'
  signal: '강한 매수' | '매수' | '중립' | '매도' | '강한 매도'
  text: string             // 한국어 자연어
  confidence: number       // 0 ~ 1
  source_indicators: string[]  // 근거 지표명들
}
\`\`\`
```

- [ ] **Step 2: 지표별 인사이트 규칙 (HACKATHON_DESIGN.md 7-2-1 그대로 옮김)**

RSI / MACD / Stochastic / 볼린저밴드 / ADX / Williams %R / CCI / ROC / Bull/Bear Power / Ultimate Oscillator / OBV / ATR / 이동평균 시그널 모두 포함.

- [ ] **Step 3: 종합 인사이트 생성 알고리즘 작성**

`HACKATHON_DESIGN.md` 7-2-3 그대로 옮기되, 다음 추가:

```markdown
## 멀티 타임프레임 종합 (선택)

\`\`\`
입력: { hourly: signals, daily: signals, weekly: signals, monthly: signals }

규칙:
  if all_align('매수') → "전 시간대 매수 정렬. 추세 신뢰도 높음."
  if daily=매수 + weekly=중립 → "단기(일) 매수 우위, 중기(주) 추가 확인 필요."
  if conflicting → "{shortest_tf} {signal_short}, {longest_tf} {signal_long}. 시간대별 시각 차 큼."
\`\`\`
```

- [ ] **Step 4: 한국어 톤 가이드**

```markdown
## 톤 가이드

- 객관적 어조 ("~로 보입니다", "~가능성이 있습니다")
- 단정 금지 ("반드시 오릅니다" / "확실합니다" 사용 금지)
- 투자 권유 어휘 회피 ("매수하세요" → "매수 시그널이 확인됩니다")
- 짧은 문장 (한 문장 25자 이하 권장)
- 단락 길이: 요약은 1문장, 상세는 3문장 이내
```

- [ ] **Step 5: 커밋**

```bash
git add skills/insights.md
git commit -m "feat(skills): add insights.md — rule-based narrative"
```

---

### Task 6: charts.md 작성

**Files:**
- Create: `skills/charts.md`

- [ ] **Step 0: 압도적 1등용 시각화 원칙 추가**

`charts.md`는 단순 차트 목록이 아니라, 데이터 유형을 읽고 가장 적절한 시각화를 자동 선택하는 **Visualization Intelligence 규칙**이어야 한다.

반드시 포함할 원칙:
- 모든 차트는 `reason`(사용자 설명)과 `skillsRule`(charts.md 규칙 출처)을 가진다
- OHLCV는 candle/MA/volume/RSI/MACD/gauge 조합을 기본으로 한다
- portfolio는 donut + concentration bar를 기본으로 한다
- multi_asset은 normalized comparison + correlation heatmap을 기본으로 한다
- returns는 cumulative return + drawdown + monthly returns heatmap을 기본으로 한다
- price_series는 area/line + drawdown을 기본으로 한다
- 업로드 데이터도 raw JSON이 아니라 ChartSpec 기반 시각화 대시보드로 렌더링한다

- [ ] **Step 1: 차트 매핑 규칙**

```markdown
# charts.md — Visual Selection Layer

## 출력 인터페이스 — ChartSpec

\`\`\`typescript
interface ChartSpec {
  id: string
  type: 'candle' | 'line' | 'bar' | 'histogram' | 'heatmap' | 'donut' | 'scatter' | 'area' | 'box'
  title: string
  data: any[]
  options: {
    xAxis: 'time' | 'category' | 'numeric'
    yAxis: 'price' | 'percent' | 'count' | 'numeric'
    overlays?: string[]        // 메인 차트에 함께 표시할 시리즈
    colors?: string[]          // theme.md의 차트 시리즈 토큰 참조
    height: number             // 픽셀
  }
}
\`\`\`

## 데이터/분석 → 차트 매핑

| 입력 | 차트 종류 | 비고 |
|------|----------|------|
| OHLCV | candle | 메인 차트, MA 오버레이 가능 |
| price_series 단일 종목 | line | area 그라데이션 옵션 |
| price_series 다종목 (multi_asset) | line + 정규화 | 100 기준선 |
| RSI / Williams %R | line + 임계선 | 과매수 70 / 과매도 30 가이드 |
| MACD | line + histogram | 신호선 + 히스토그램 결합 |
| Stochastic | line | %K + %D 두 선 |
| 볼린저밴드 | line + area | 상단/하단 + 채움 |
| 거래량 | bar | 캔들차트 하단 |
| 포트폴리오 비중 | donut 또는 treemap | 종목 ≥ 5개일 때 treemap |
| 상관관계 매트릭스 | heatmap | -1 ~ +1 컬러 매핑 |
| 월별 수익률 | heatmap | 12 × N년 |
| 분포 | histogram 또는 box | |

## 다운샘플링 규칙

| 데이터 포인트 수 | 처리 |
|---------------|------|
| < 1,000 | 원본 그대로 |
| 1,000 ~ 10,000 | LTTB 알고리즘 또는 평균 다운샘플 |
| > 10,000 | 시간 단위 집계 (분 → 시간 → 일) |

## 사용 금지 차트
- 3D 차트 (가독성 저해)
- 도넛 4조각 미만
- 너무 많은 시리즈 (8개 초과 라인차트)
- 시계열에 막대차트 (캔들/라인 사용)

## 색상 매핑 (theme.md 참조)
- 양봉/매수/상승: \`var(--positive)\`
- 음봉/매도/하락: \`var(--negative)\`
- 중립: \`var(--neutral)\`
- 다종목 비교: \`--chart-1\` ~ \`--chart-8\` (시맨틱 색 회피)
```

- [ ] **Step 2: 커밋**

```bash
git add skills/charts.md
git commit -m "feat(skills): add charts.md — visual selection rules"
```

---

### Task 7: layout.md 작성

**Files:**
- Create: `skills/layout.md`

- [ ] **Step 1: 페이지 구조 + 반응형 + 상태 처리 작성**

```markdown
# layout.md — Composition Layer

## 출력 인터페이스 — LayoutSpec

\`\`\`typescript
interface LayoutSpec {
  header: HeaderSpec
  categoryTabs: CategoryTabSpec[]
  assetHeader: AssetHeaderSpec
  analysisTabs: AnalysisTabSpec[]
  activeView: 'summary' | 'technical' | 'fundamental'
  views: {
    summary: SummaryViewSpec
    technical: TechnicalViewSpec
    fundamental: FundamentalViewSpec
  }
  states: {
    loading: boolean
    error: string | null
    empty: boolean
  }
}
\`\`\`

## 페이지 계층

\`\`\`
[헤더 sticky]
  로고 + 검색 + 다크/라이트 토글 + 새로고침

[카테고리 탭] (헤더 바로 아래, 좌측 정렬)
  6개 탭 (한국주식 / 미국주식 / ETF / 암호화폐 / 글로벌지수 / 업로드)

[종목 정보 영역]
  종목명 / 현재가 / 등락률 / 거래량 / 시가총액 / 52주

[분석 탭] (SPA, 리로드 없음)
  요약 / 기술적 분석 / 기본적 분석
  비활성 처리: ETF/암호화폐/지수 → 기본적 분석 탭 disabled + 툴팁

[탭 콘텐츠]
  요약 뷰 / 기술적 분석 뷰 / 기본적 분석 뷰
\`\`\`

## 그리드 시스템

- 데스크톱 (≥1024px): 12-column, gap 24px
- 태블릿 (640~1024px): 6-column, gap 16px
- 모바일 (<640px): 1-column, gap 12px

## 정보 우선순위 (요약 뷰 기준)

1. 종합 게이지 (가장 큼, 좌측 또는 상단)
2. 종합 인사이트 텍스트 (게이지 옆 또는 아래)
3. 기술적 분석 요약 카드 (좌하단)
4. 기본적 분석 요약 카드 (우하단)

## 반응형 변환 규칙

| 영역 | 데스크톱 | 태블릿 | 모바일 |
|------|---------|--------|--------|
| 카테고리 탭 | 가로 6개 | 가로 6개 | 가로 스크롤 |
| 검색바 | 헤더 중앙 표시 | 헤더 중앙 표시 | 숨김 (아이콘 클릭으로 펼침) |
| 게이지 3개 (기술적) | 가로 배치 | 가로 배치 (축소) | 세로 적층 |
| 카드 그리드 | 2~3열 | 2열 | 1열 |
| 차트 높이 | 400~500px | 350px | 250px |
| 테이블 | 그대로 | 그대로 | 가로 스크롤 |

## 상태 처리 사양

| 상태 | UI |
|------|-----|
| 로딩 | 스켈레톤 (theme.md surface 색 + shimmer 애니메이션) |
| 에러 | 카드 내부 에러 메시지 + [재시도] 버튼 |
| 빈 데이터 | "표시할 데이터가 없습니다" 메시지 + 첫 행동 안내 |
| 비활성 탭 | opacity 50% + cursor not-allowed + 호버 툴팁 |

## 인터랙션

- 분석 탭 클릭: SPA 전환 (페이지 리로드 없음)
- "자세히 보기" 클릭: 해당 분석 탭으로 SPA 이동 + 스크롤 상단으로
- 파라미터 변경: 즉시 indicators.md 오버라이드 → 전체 재렌더링
- 다크/라이트 토글: theme.md 모드 전환
```

- [ ] **Step 2: 커밋**

```bash
git add skills/layout.md
git commit -m "feat(skills): add layout.md — composition rules"
```

---

### Task 8: theme.md 작성

**Files:**
- Create: `skills/theme.md`

- [ ] **Step 1: 디자인 토큰 + 다크/라이트 모드**

`DESIGN.md` 전체를 참조하여 다음 구조로 작성:

```markdown
# theme.md — Design Token Layer

본 문서는 Glancy 대시보드의 디자인 토큰 단일 진실 공급원이다.
DESIGN.md 전체 명세를 토큰 형식으로 정리한 결과물.

## 출력 인터페이스 — ThemeTokens

\`\`\`typescript
interface ThemeTokens {
  mode: 'dark' | 'light'
  colors: ColorTokens
  typography: TypographyTokens
  spacing: SpacingTokens
  radius: RadiusTokens
  shadow: ShadowTokens
}
\`\`\`

## 1. 색상 토큰 (다크 모드)

(DESIGN.md 2-1 그대로 옮김 — Page Background, Surface 1~4, Text Primary~Disabled, Positive/Negative/Neutral/Warning/Info, Brand Primary/Secondary, Chart 1~8, Candle Up/Down, Border, Shadow)

## 2. 색상 토큰 (라이트 모드)

(DESIGN.md 2-2 그대로 옮김)

## 3. 타이포 토큰

(DESIGN.md 3 그대로 옮김 — Pretendard + JetBrains Mono, Hierarchy 표 전체)

## 4. 간격 토큰

\`\`\`
spacing: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 (px)
\`\`\`

## 5. 라디우스 토큰

\`\`\`
pill:       9999px (분석 탭, 시그널 뱃지)
card-lg:    16px   (다이얼로그)
card:       8px    (카드, 버튼, 입력창)
card-sm:    6px    (차트 컨테이너)
tag:        4px    (라벨)
\`\`\`

## 6. 그림자 토큰

(DESIGN.md 6 그대로 옮김 — Subtle / Medium / Heavy / Inset)

## 7. 모드 전환 메커니즘

\`\`\`html
<html data-theme="dark">  <!-- 또는 "light" -->
\`\`\`

CSS Custom Properties가 :root[data-theme="dark"] / :root[data-theme="light"] 셀렉터로 분리됨. 토큰 한 번 변경 = 전체 UI 즉시 전환.

## 8. theme.md 교체 시연 가이드

본 문서는 와우 모먼트 시연의 핵심이다. theme.md만 교체하면:
- 다크 ↔ 라이트 즉시 전환
- 브랜드 컬러 변경
- 차트 팔레트 변경
- 폰트 패밀리 변경

→ 어떤 시각적 변화도 본 파일 한 군데로 격리된다.

## 9. CSS 변수 매핑 (구현 참고)

(DESIGN.md 10의 :root 변수 블록 그대로 옮김)
```

- [ ] **Step 2: 커밋**

```bash
git add skills/theme.md
git commit -m "feat(skills): add theme.md — design tokens"
```

---

### Task 9: 자기 검수 + 보강

**Files:**
- Modify: `skills/*.md` (필요 시)

- [ ] **Step 1: 검수 체크리스트 실행**

각 .md 파일을 읽으며 다음 확인:

- [ ] main.md가 다른 모든 모듈을 1줄씩 명확히 설명하는가?
- [ ] 의존성 그래프가 main.md / README.md 양쪽에 동일하게 있는가?
- [ ] data.md가 6개 데이터 소스 + 5개 CSV 유형 모두 다루는가?
- [ ] indicators.md에 "강한 매수/매수/중립/매도/강한 매도" 5단계가 명확히 정의되었는가?
- [ ] insights.md가 "외부 LLM API 미사용"을 명시했는가?
- [ ] charts.md가 다종목 비교 시리즈 색상이 시맨틱 색을 회피한다고 명시했는가?
- [ ] layout.md가 "비활성 탭 + 툴팁" 명세를 포함하는가?
- [ ] theme.md가 다크/라이트 양쪽 토큰을 모두 정의하는가?
- [ ] 모든 모듈이 "입력 / 출력 / 규칙" 일관된 형식인가?

- [ ] **Step 2: 부족한 부분 보강**

발견된 문제는 해당 .md 직접 수정.

- [ ] **Step 3: 커밋**

```bash
git add skills/
git commit -m "docs(skills): self-review and patch"
```

---

### Task 10: ZIP 패키징 + 제출

**Files:**
- Create: `skills.zip`

- [ ] **Step 1: ZIP 생성**

```powershell
Compress-Archive -Path "C:\Users\thisi\Documents\Glancy\skills\*" -DestinationPath "C:\Users\thisi\Documents\Glancy\skills.zip" -Force
```

- [ ] **Step 2: ZIP 검증**

ZIP 파일을 별도 폴더에 풀어서 모든 .md 파일이 정상 있는지 확인.

- [ ] **Step 3: DACON 사이트 [Skills.md 제출] 페이지에서 업로드**

5/7 09:59 이전 제출.

- [ ] **Step 4: 제출 스크린샷 보관 + 커밋**

```bash
git add skills.zip docs/skills-submission-screenshot.png
git commit -m "feat(skills): submit skills.zip to DACON"
```

---

## Self-Review

- [ ] 7개 .md 파일 + README 모두 작성됐는가?
- [ ] 의존성 그래프가 main.md / README.md 동일한가?
- [ ] 외부 LLM API 미사용 명시됐는가? (insights.md)
- [ ] 사용자 파라미터 오버라이드 명세 포함? (indicators.md)
- [ ] 다크/라이트 양쪽 토큰 정의? (theme.md)
- [ ] HACKATHON_DESIGN.md / DESIGN.md 핵심 내용이 누락 없이 .md에 옮겨졌는가?
- [ ] 5/7 09:59 이전에 제출 완료했는가?

## 완료 조건

DACON 사이트에 skills.zip 제출 완료, 제출 확인 스크린샷 보관.
