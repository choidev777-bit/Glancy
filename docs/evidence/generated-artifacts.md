# Generated Artifacts

This file lists major artifacts generated or refined through the Skills-driven implementation workflow.

## Backend

| Area | Files |
| --- | --- |
| App shell | `backend/app/main.py`, `backend/app/config.py` |
| Models and normalization | `backend/app/models.py`, `backend/app/normalize.py` |
| Data sources | `backend/app/sources/pykrx_source.py`, `backend/app/sources/yfinance_source.py`, `backend/app/sources/binance_source.py`, `backend/app/sources/coingecko_source.py` |
| API routers | `backend/app/routers/kr_stocks.py`, `us_stocks.py`, `etfs.py`, `indices.py`, `crypto.py`, `upload.py`, `indicators.py`, `fundamental.py` |
| Indicators | `backend/app/indicators/*` |
| Insights | `backend/app/insights/*` |
| Fundamentals | `backend/app/fundamental/*` |
| Upload analysis | `backend/app/upload/*` |
| Tests | `backend/tests/*` |

## Frontend

| Area | Files |
| --- | --- |
| Dashboard shell | `src/App.tsx`, `src/components/layout/Header.tsx`, `src/components/dashboard/*` |
| Analysis views | `src/components/analysis/SummaryView.tsx`, `TechnicalView.tsx`, `FundamentalView.tsx` |
| Charts | `src/components/charts/*`, `src/lib/chart-theme.ts` |
| Data/API hooks | `src/lib/api.ts`, `src/lib/market-selection.ts`, `src/hooks/useIndicatorsData.ts`, `src/hooks/useBinanceWebSocket.ts` |
| Skills runtime | `src/components/skills/*`, `src/hooks/useSkillsRuntime.ts`, `src/lib/skills-parser.ts`, `public/skills/*` |
| Upload | `src/components/upload/UploadView.tsx` |
| Common UI states | `src/components/common/Skeleton.tsx`, `ErrorState.tsx`, `EmptyState.tsx`, `Gauge.tsx`, `SignalBadge.tsx` |

## Skills Package

| Area | Files |
| --- | --- |
| Source Skills | `skills/README.md`, `skills/main.md`, `skills/data.md`, `skills/indicators.md`, `skills/insights.md`, `skills/charts.md`, `skills/layout.md`, `skills/theme.md` |
| Submission bundle | `skills.zip` |
| Runtime presets | `public/skills/theme.md`, `public/skills/indicators.md` |

## Documentation

| Area | Files |
| --- | --- |
| Plans | `docs/superpowers/plans/*.md` |
| Proposal | `docs/proposal/proposal.md`, `proposal.html`, `proposal.pdf` |
| Deployment QA | `docs/deployment/*.md`, `vercel.json`, `backend/railway.json` |
| Evidence | `docs/evidence/*.md` |
| Submission guide | `docs/submission.md` |

## Verification Artifacts

| Area | Files |
| --- | --- |
| Plan tests | `tests/plan08-market-selection.test.mjs`, `tests/plan09-ui-polish.test.mjs`, `tests/plan10-deployment-qa.test.mjs`, `tests/plan11-skills-runtime.test.mjs`, `tests/plan12-vibe-evidence.test.mjs` |
| Backend tests | `backend/tests/test_health.py`, `test_indicators.py`, `test_insights.py`, `test_fundamental_format.py`, `test_upload.py` |
