# Plan 14 — Visualization Intelligence Layer

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 해커톤 주제인 "투자 데이터를 시각화하라"를 가장 강하게 증명하기 위해, 데이터 유형과 Skills.md 규칙에 따라 적절한 차트가 자동 선택되는 Visualization Intelligence Layer를 구현한다. 단순히 캔들차트를 보여주는 수준을 넘어, OHLCV / portfolio / multi_asset / returns / price_series 각각에 최적화된 시각화 조합을 자동 생성한다.

**Architecture:** `charts.md`가 ChartSpec 생성 규칙을 정의하고, visualizer가 데이터 유형별 `VisualizationBundle`을 만든다. 프론트는 `ChartRenderer`가 ChartSpec을 받아 candle, line, bar, heatmap, donut, drawdown, correlation matrix 등을 렌더링한다. CSV 업로드 결과도 raw JSON이 아니라 동일한 시각화 시스템으로 표시한다.

**Tech Stack:** React 18 / TypeScript / Lightweight Charts / SVG or CSS grid heatmap / ChartSpec schema

**예상 소요:** 6~9시간

---

## Why This Matters

이 해커톤에서 시각화는 장식이 아니라 평가 기준의 중심 증거다.

| 평가 항목 | Visualization Layer가 주는 증거 |
|-----------|----------------------------------|
| 범용성 | 서로 다른 데이터 유형을 각기 다른 차트로 자동 처리 |
| Skills.md 설계 | `charts.md` 규칙이 실제 차트 선택을 지배 |
| 대시보드 자동 생성 | 업로드 후 ChartSpec 기반 화면 자동 구성 |
| 바이브코딩 활용 | 문서 규칙 -> 시각화 코드로 변환된 추적 가능성 |
| 실용성/창의성 | 투자자가 3초 안에 상태를 판단하는 화면 |

---

## Required Visualization Bundles

| 데이터 유형 | Primary visualization | Secondary visualizations | 투자 판단 목적 |
|-------------|-----------------------|--------------------------|----------------|
| OHLCV | 캔들 + MA | RSI, MACD, volume bar, signal gauges | 가격/추세/모멘텀 판단 |
| price_series | line/area | rolling return, drawdown | 가격 흐름과 낙폭 판단 |
| portfolio | donut/treemap | concentration bar, holdings table | 비중 쏠림 판단 |
| multi_asset | normalized comparison line | correlation heatmap, volatility bar | 상대 성과/상관관계 판단 |
| returns | cumulative return line | drawdown, monthly returns heatmap, metric cards | 성과/위험/계절성 판단 |

---

## File Structure

```
src/
├── lib/
│   ├── chart-spec.ts
│   ├── visualizer.ts
│   └── visual-transforms.ts
├── components/
│   └── visualization/
│       ├── ChartRenderer.tsx
│       ├── VisualizationDashboard.tsx
│       ├── PortfolioDonut.tsx
│       ├── CorrelationHeatmap.tsx
│       ├── MonthlyReturnsHeatmap.tsx
│       ├── DrawdownChart.tsx
│       ├── NormalizedComparisonChart.tsx
│       └── VisualizationReason.tsx
└── components/upload/
    └── UploadView.tsx
```

---

## Core Schema

```typescript
export type ChartType =
  | "candle"
  | "line"
  | "area"
  | "bar"
  | "donut"
  | "heatmap"
  | "correlation"
  | "drawdown"
  | "monthly_returns"
  | "normalized_comparison";

export interface ChartSpec {
  id: string;
  type: ChartType;
  title: string;
  priority: "primary" | "secondary" | "supporting";
  dataKey: string;
  encoding: {
    x?: string;
    y?: string;
    color?: string;
    size?: string;
    series?: string;
  };
  reason: string;
  skillsRule: string;
}

export interface VisualizationBundle {
  dataType: "OHLCV" | "price_series" | "portfolio" | "multi_asset" | "returns";
  summary: string;
  charts: ChartSpec[];
}
```

---

## Tasks

### Task 1: charts.md 규칙 강화

**Files:**
- Modify: `skills/charts.md`
- Modify: `docs/superpowers/plans/02-skills-md-modules.md`

- [ ] **Step 1: ChartSpec에 설명 가능성 필드 추가**

모든 ChartSpec은 다음 필드를 포함한다.

```typescript
reason: string      // 왜 이 차트가 선택됐는지 사용자에게 보여주는 설명
skillsRule: string  // charts.md의 어떤 규칙 때문에 선택됐는지
```

- [ ] **Step 2: 데이터 유형별 필수 차트 조합 추가**

```markdown
## Required Visualization Bundles

| Data type | Required charts |
|-----------|-----------------|
| OHLCV | candle, MA overlay, volume bar, RSI, MACD, gauge |
| price_series | area/line, rolling return, drawdown |
| portfolio | donut, concentration bar, holdings table |
| multi_asset | normalized comparison, correlation heatmap, volatility bar |
| returns | cumulative return, drawdown, monthly returns heatmap, metrics |
```

- [ ] **Step 3: 커밋**

```bash
git add skills/charts.md docs/superpowers/plans/02-skills-md-modules.md
git commit -m "docs(skills): strengthen charts.md visualization rules"
```

---

### Task 2: ChartSpec 타입과 visualizer 구현

**Files:**
- Create: `src/lib/chart-spec.ts`
- Create: `src/lib/visualizer.ts`

- [ ] **Step 1: `chart-spec.ts` 작성**

Core Schema 섹션의 타입을 그대로 구현한다.

- [ ] **Step 2: `visualizer.ts` 작성**

`createVisualizationBundle(dataType)` 함수가 데이터 유형별 ChartSpec 배열을 반환한다.

필수 rules:
- `OHLCV -> candle + volume + RSI + MACD`
- `portfolio -> donut + concentration bar`
- `multi_asset -> normalized comparison + correlation heatmap`
- `returns -> cumulative area + drawdown + monthly returns heatmap`
- `price_series -> area + drawdown`

- [ ] **Step 3: 커밋**

```bash
git add src/lib/chart-spec.ts src/lib/visualizer.ts
git commit -m "feat(visualization): add ChartSpec and data-type visualizer"
```

---

### Task 3: 업로드 결과를 시각화 대시보드로 렌더링

**Files:**
- Create: `src/components/visualization/VisualizationDashboard.tsx`
- Create: `src/components/visualization/ChartRenderer.tsx`
- Modify: `src/components/upload/UploadView.tsx`

- [ ] **Step 1: 업로드 성공 화면 순서 변경**

업로드 성공 후 화면은 다음 순서로 보인다.

1. 감지 유형 + 데이터 요약
2. 자동 시각화 대시보드
3. raw JSON은 "개발자 보기" accordion에 숨김

- [ ] **Step 2: `VisualizationDashboard` 구현**

`result.type`을 기준으로 `createVisualizationBundle()`을 호출하고 ChartSpec별 renderer를 배치한다.

- [ ] **Step 3: 커밋**

```bash
git add src/components/visualization/ src/components/upload/UploadView.tsx
git commit -m "feat(visualization): render upload results as auto charts"
```

---

### Task 4: 투자 전용 시각화 컴포넌트 구현

**Files:**
- Create: `src/components/visualization/PortfolioDonut.tsx`
- Create: `src/components/visualization/CorrelationHeatmap.tsx`
- Create: `src/components/visualization/MonthlyReturnsHeatmap.tsx`
- Create: `src/components/visualization/DrawdownChart.tsx`
- Create: `src/components/visualization/NormalizedComparisonChart.tsx`
- Create: `src/components/visualization/VisualizationReason.tsx`

- [ ] **Step 1: PortfolioDonut**

보유비중을 도넛으로 표시하고 top holdings legend를 붙인다.

- [ ] **Step 2: CorrelationHeatmap**

상관계수 -1~1을 색상 scale로 표시한다.

- [ ] **Step 3: MonthlyReturnsHeatmap**

월별 수익률을 `year x month` grid로 표시한다.

- [ ] **Step 4: DrawdownChart**

0 아래로 내려가는 낙폭 area chart를 표시한다.

- [ ] **Step 5: NormalizedComparisonChart**

여러 종목을 시작값 100으로 정규화해 multi-line chart로 표시한다.

- [ ] **Step 6: VisualizationReason**

각 차트 하단에 `reason`과 `skillsRule`을 표시한다.

- [ ] **Step 7: 커밋**

```bash
git add src/components/visualization/
git commit -m "feat(visualization): add investment-specific chart components"
```

---

### Task 5: 본 대시보드 차트에도 charts.md 선택 이유 표시

**Files:**
- Modify: `src/components/charts/ChartContainer.tsx`
- Modify: `src/components/analysis/TechnicalView.tsx`

- [ ] **Step 1: 캔들차트에 `charts.md driven` 배지 추가**

기술적 분석 차트 영역에 다음 정보를 표시한다.

- chart type: `candle`
- reason: `OHLCV 데이터는 시가/고가/저가/종가를 모두 표현해야 하므로 캔들차트를 사용`
- rule: `charts.md: OHLCV -> candle`

- [ ] **Step 2: RSI/MACD에도 선택 이유 표시**

보조지표 차트 하단에 작게 표시한다.

- [ ] **Step 3: 커밋**

```bash
git add src/components/charts/ChartContainer.tsx src/components/analysis/TechnicalView.tsx
git commit -m "feat(visualization): show charts.md reasoning in technical view"
```

---

### Task 6: 데모 시나리오에 시각화 와우 모먼트 추가

**Files:**
- Modify: `docs/deployment/judge-demo-script.md`
- Modify: `docs/deployment/qa-checklist.md`
- Modify: `docs/evidence/skills-to-code-matrix.md`

- [ ] **Step 1: judge demo script에 시각화 루트 추가**

```markdown
## Visualization Wow Moment

- portfolio 샘플 업로드 -> 도넛 + 집중도 막대 자동 생성
- multi_asset 샘플 업로드 -> 정규화 수익률 + 상관관계 히트맵 자동 생성
- returns 샘플 업로드 -> 누적수익률 + MDD + 월별 히트맵 자동 생성
- 각 차트 하단에서 `charts.md` 규칙 설명 확인
```

- [ ] **Step 2: QA 체크리스트에 차트별 검수 추가**

```markdown
## Visualization Intelligence
- [ ] OHLCV -> candle/MA/RSI/MACD 자동 선택
- [ ] portfolio -> donut/concentration bar 자동 선택
- [ ] multi_asset -> normalized comparison/correlation heatmap 자동 선택
- [ ] returns -> cumulative/drawdown/monthly heatmap 자동 선택
- [ ] 각 차트에 선택 이유와 charts.md rule 표시
```

- [ ] **Step 3: 커밋**

```bash
git add docs/deployment/ docs/evidence/skills-to-code-matrix.md
git commit -m "docs(demo): add visualization intelligence proof route"
```

---

## Self-Review

- [ ] 데이터 유형별 최적 차트가 자동 선택되는가?
- [ ] 업로드 결과가 raw JSON이 아니라 시각화 대시보드로 보이는가?
- [ ] `charts.md` 규칙이 실제 UI에 설명으로 드러나는가?
- [ ] portfolio / multi_asset / returns가 각각 다른 와우 모먼트를 갖는가?
- [ ] 모바일에서 heatmap과 donut이 깨지지 않는가?
- [ ] 심사자가 "시각화를 정말 잘했다"고 느낄 수 있는가?

## 완료 조건

심사자가 3개 샘플 CSV(portfolio, multi_asset, returns)를 업로드했을 때, 각각 도넛/상관관계 히트맵/월별 수익률 히트맵이 자동 생성되고, 각 차트에 `charts.md` 기반 선택 이유가 표시된다.
