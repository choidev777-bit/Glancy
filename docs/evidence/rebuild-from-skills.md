# Rebuild From Skills.md

This document explains how to rebuild Glancy from the Skills package as the source of truth.

## Inputs

- `skills/README.md`
- `skills/main.md`
- `skills/data.md`
- `skills/indicators.md`
- `skills/insights.md`
- `skills/charts.md`
- `skills/layout.md`
- `skills/theme.md`

## Recommended Prompt Order

1. Load `skills/README.md` and `skills/main.md`.
2. Generate the backend project skeleton and `/health` route.
3. Generate `MarketData`, `Candle`, normalization, and data-source adapters from `skills/data.md`.
4. Generate the indicator engine from `skills/indicators.md`.
5. Generate insight composition rules from `skills/insights.md`.
6. Generate chart components and chart reasoning labels from `skills/charts.md`.
7. Generate dashboard layout, tabs, upload surface, and responsive states from `skills/layout.md`.
8. Apply typography, colors, and chart token mapping from `skills/theme.md`.
9. Add the Skills Runtime Demo using editable copies of `theme.md` and `indicators.md`.
10. Run tests and compare against this repository's evidence matrix.

## Success Criteria

- Backend exposes the same standardized `MarketData` shape.
- Indicator responses include indicators, moving averages, pivots, gauges, and insights.
- Frontend renders market categories, summary/technical/fundamental tabs, charts, and upload UI.
- Runtime demo can override at least RSI thresholds and theme accent colors.
- Build and backend tests pass.

## Minimal Rebuild Prompt

```text
Use skills/README.md and skills/main.md as the implementation contract.
Implement Glancy as a FastAPI + Vite React dashboard.
Follow skills/data.md for normalized market data.
Follow skills/indicators.md for technical indicator params and signals.
Follow skills/insights.md for natural-language explanations.
Follow skills/charts.md for visualization choices.
Follow skills/layout.md and skills/theme.md for UI structure and visual tokens.
Add a runtime demo proving theme.md and indicators.md can change dashboard behavior.
```

## Comparison Checklist

- Compare API route names.
- Compare indicator response shape.
- Compare chart panels and `charts.md driven` labels.
- Compare runtime parser fields.
- Compare deployment QA docs.
