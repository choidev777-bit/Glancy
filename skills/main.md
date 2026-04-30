# main.md — System Orchestrator

## 1. System Overview

Glancy is a general-purpose investment dashboard driven by Skills.md rules. It accepts connected market sources or user uploads, converts all inputs into a standard structure, computes indicators, generates rule-based Korean insights, selects visualizations, and renders a responsive dashboard.

## 2. User Scenario Routing

| User action | Route |
|-------------|-------|
| Select Korean stock tab | `data.md -> kr_stocks -> MarketData` |
| Select US stock tab | `data.md -> us_stocks -> MarketData` |
| Select ETF tab | `data.md -> etfs -> MarketData` |
| Select crypto tab | `data.md -> crypto -> MarketData` |
| Select global index tab | `data.md -> global_indices -> MarketData` |
| Upload CSV/JSON | `data.md -> user_upload detector -> type adapter` |
| Edit runtime Skills | `indicators.md/theme.md override -> recompute/restyle` |

## 3. Module Execution Order

```text
1. data.md        Input -> standardized MarketData or upload analysis
2. indicators.md  MarketData -> indicators, signals, gauges
3. insights.md    indicators/signals -> Korean insights
4. charts.md      data type + indicators -> ChartSpec[]
5. layout.md      ChartSpec + insights -> LayoutSpec
6. theme.md       design tokens -> CSS/chart tokens
```

## 4. Error Handling Policy

| Situation | Handling |
|-----------|----------|
| External API fails | Use cached response, then sample fallback |
| Insufficient candles | Display partial indicators and explain limitation |
| Upload type unknown | Show detected columns and manual guidance |
| Fundamental data unavailable | Show `-` with source-specific note |
| Runtime Skills invalid | Keep last valid settings and show warning |

## 5. Runtime Override Policy

Runtime overrides are allowed only for safe, explainable parameters:

| Module | Runtime fields |
|--------|----------------|
| `indicators.md` | RSI, MACD, Bollinger Band parameters |
| `theme.md` | brand, positive, negative, warning, info colors |
| `charts.md` | chart preference presets where compatible |

Invalid overrides must not break the dashboard. They should be ignored or shown as warnings.

## 6. Vibe Coding Guide

Recommended order for AI implementation:

1. Load `README.md` and `main.md`.
2. Implement `data.md` as backend models, sources, and upload detector.
3. Implement `indicators.md` as computation engine.
4. Implement `insights.md` as rule-based narrative engine.
5. Implement `charts.md` as ChartSpec and visualization components.
6. Implement `layout.md` and `theme.md` as frontend dashboard.
7. Document evidence in `docs/evidence/`.
