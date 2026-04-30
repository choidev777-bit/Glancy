# charts.md — Visualization Intelligence Layer

## 1. Purpose

Select the most appropriate chart bundle for each investment data type. The output is not just a chart list; it is an explainable `ChartSpec[]` that tells the dashboard what to draw and why.

## 2. Output Interface — ChartSpec

```typescript
type ChartType =
  | 'candle'
  | 'line'
  | 'area'
  | 'bar'
  | 'histogram'
  | 'heatmap'
  | 'donut'
  | 'treemap'
  | 'scatter'
  | 'drawdown'
  | 'monthly_returns'
  | 'normalized_comparison'
  | 'correlation'

interface ChartSpec {
  id: string
  type: ChartType
  title: string
  priority: 'primary' | 'secondary' | 'supporting'
  dataKey: string
  encoding: {
    x?: string
    y?: string
    color?: string
    size?: string
    series?: string
    overlays?: string[]
  }
  reason: string
  skillsRule: string
}

interface VisualizationBundle {
  dataType: 'OHLCV' | 'price_series' | 'portfolio' | 'multi_asset' | 'returns'
  summary: string
  charts: ChartSpec[]
}
```

## 3. Required Visualization Bundles

| Data type | Required charts | Reason |
|-----------|-----------------|--------|
| OHLCV | candle, MA overlay, volume bar, RSI, MACD, gauge | Price, trend, momentum, and conviction |
| price_series | area/line, rolling return, drawdown | Price flow and downside risk |
| portfolio | donut or treemap, concentration bar, holdings table | Allocation and concentration risk |
| multi_asset | normalized comparison, correlation heatmap, volatility bar | Relative performance and diversification |
| returns | cumulative return, drawdown, monthly returns heatmap, metric cards | Performance, risk, and seasonality |

## 4. Mapping Rules

### OHLCV

Primary:
- `candle` with MA overlays
- `volume bar`

Secondary:
- RSI line with 70/30 threshold
- MACD line + signal + histogram
- pivot table
- technical gauges

Required explanation:

```text
reason: OHLCV 데이터는 시가/고가/저가/종가를 모두 표현해야 하므로 캔들차트가 가장 적합합니다.
skillsRule: charts.md: OHLCV -> candle
```

### Portfolio

If holdings count < 5:
- Use `donut`.

If holdings count >= 5:
- Use `treemap` or donut + scrollable legend.

Always include:
- top1/top3/top5 concentration bar
- holdings table

### Multi Asset

Always normalize each asset to 100 at the first timestamp. Use:
- normalized comparison line chart
- correlation heatmap
- annualized volatility bar

### Returns

Use:
- cumulative return area chart
- drawdown chart below zero
- monthly returns heatmap
- metric cards for Sharpe, MDD, annualized return, annualized volatility

### Price Series

Use:
- area or line chart for close/price
- drawdown chart
- rolling return line if enough data exists

## 5. Color Rules

| Meaning | Token |
|---------|-------|
| 상승/매수/양수 | `var(--positive)` |
| 하락/매도/음수 | `var(--negative)` |
| 중립 | `var(--neutral)` |
| 정보 | `var(--info)` |
| 경고 | `var(--warning)` |
| Multi-series | `--chart-1` through `--chart-8` |

Do not use positive/negative colors for arbitrary series identity. Reserve red/green semantics for financial direction.

## 6. Downsampling Rules

| Point count | Handling |
|-------------|----------|
| < 1,000 | Render original |
| 1,000-10,000 | LTTB or average downsample |
| > 10,000 | Aggregate by time bucket |

## 7. Forbidden Patterns

- No 3D charts.
- No donut chart with fewer than 4 slices unless it has clear allocation value.
- No more than 8 simultaneous line series.
- No bar chart for dense time-series price movement.
- No chart without a user-facing reason.

## 8. Runtime Explainability

Every rendered chart should show a subtle explanation:

```text
charts.md driven
선택 이유: {reason}
규칙: {skillsRule}
```

This directly proves that Skills.md controls visualization decisions.
