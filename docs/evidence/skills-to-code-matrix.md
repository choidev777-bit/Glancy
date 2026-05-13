# Skills-to-Code Traceability Matrix

| Skills module | Rule responsibility | Implemented files | User-visible proof |
| --- | --- | --- | --- |
| `main.md` | Execution order, app scope, demo reliability, routing expectations | `src/App.tsx`, `backend/app/main.py`, `docs/deployment/*` | Category navigation, health endpoint, deployment QA docs |
| `data.md` | MarketData shape, source coverage, normalization, upload detection | `backend/app/models.py`, `backend/app/normalize.py`, `backend/app/sources/*`, `backend/app/upload/*`, `backend/app/routers/upload.py` | KR/US/ETF/Crypto/Index routes and CSV Upload auto-detect |
| `indicators.md` | Technical indicator parameters, signals, gauge scoring | `backend/app/indicators/*`, `backend/app/routers/indicators.py`, `src/lib/skills-parser.ts` | RSI/MACD/MA/Bollinger gauges and Runtime Demo indicator params |
| `insights.md` | Rule-based natural-language summaries, structured evidence, conflicts, next checks, and data-quality notes | `backend/app/insights/*`, `backend/app/fundamental/insights.py`, `src/components/analysis/InsightProfilePanel.tsx` | Summary, technical, fundamental, and composite portfolio screens show stance, confidence, section evidence, conflicts, and next checks |
| `charts.md` | Visualization choice, chart panels, chart reasoning, Visualization Intelligence | `src/components/charts/*`, `src/components/visualization/*`, `src/lib/chart-theme.ts`, `src/lib/chart-spec.ts`, `src/lib/visualizer.ts`, `src/lib/visual-transforms.ts` | Candle/MA/RSI/MACD panels plus upload-specific donut, correlation, drawdown, monthly returns, and normalized comparison views with `charts.md driven` explanations |
| `layout.md` | Dashboard shell, category tabs, analysis tabs, upload view, responsive layout | `src/components/dashboard/*`, `src/components/analysis/*`, `src/components/upload/UploadView.tsx` | Summary/technical/fundamental/upload routes and mobile-friendly tabs |
| `theme.md` | Typography, design tokens, financial colors, runtime-editable tokens | `tailwind.config.js`, `src/index.css`, `src/lib/chart-theme.ts`, `src/components/skills/*` | Dark/light mode, chart colors, High Contrast Runtime Demo preset |

## Runtime Proof

`Plan 11` added a Skills Runtime Demo that uses:

- `public/skills/indicators.md`
- `public/skills/theme.md`
- `src/lib/skills-parser.ts`
- `src/hooks/useSkillsRuntime.ts`
- `src/components/skills/*`

This proves a traceable path:

`Skills markdown -> parser -> runtime state -> API query params / CSS variables -> visible dashboard behavior`

## Visualization Intelligence

`Plan 14` extends the same evidence chain to uploaded investment datasets:

- `skills/charts.md` defines the chart-selection rules and required explanations.
- `src/lib/visualizer.ts` converts detected data types into explainable `ChartSpec[]` bundles.
- `src/components/visualization/*` renders those bundles as allocation, risk, correlation, drawdown, and seasonality views.
- `src/components/upload/UploadView.tsx` puts the visual explanation before raw JSON so the judging path is visual-first.

## Deeper Analysis Insights

The insight layer now keeps the old natural-language summary for compatibility while adding structured profiles:

- Technical profiles are generated in `backend/app/insights/technical_profile.py` and returned as `insights.insight_profile`.
- Fundamental profiles are generated in `backend/app/fundamental/insights.py` and attached to KR/US fundamental reports.
- Composite portfolio uploads attach the same shape to portfolio summary, technical detail, and fundamental detail payloads.
- `src/components/analysis/InsightProfilePanel.tsx` renders the shared evidence/conflict/next-check UI across summary, technical, fundamental, and composite portfolio dashboard screens.

## Evaluation Relevance

This matrix supports the hackathon's likely evaluation focus on:

- data visualization quality
- Skills-based workflow evidence
- reproducibility
- demo reliability
- breadth of supported investment data
