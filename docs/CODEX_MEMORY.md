# Codex Project Memory

Updated: 2026-05-04

This file is the quick-start memory for new Codex sessions. Read this before making changes. The older `HACKATHON_DESIGN.md` is useful history, but this file is the current operational truth unless local code proves otherwise.

## Hackathon Context

- Competition: monthly hackathon, "Visualize Investment Data".
- Platform/organizer context: DAKER/DACON.
- Public page: `https://daker.ai/public/hackathons/hackathon-investment-data-skills-dashboard`
- Required submissions:
  - Proposal PDF.
  - Skills.md documents or zip.
  - Final deployed service URL.
- Core assignment: build a general-purpose investment dashboard service driven by Skills.md documents.
- Expected content in proposal/skills:
  - service overview,
  - analysis flow design,
  - dashboard composition,
  - Skills.md design direction,
  - expansion feature ideas.
- Evaluation themes to optimize:
  - generality across investment data types,
  - quality of Skills.md design,
  - automatic dashboard generation,
  - evidence of vibe coding / AI-assisted implementation,
  - practicality and creativity.

## Our Strategy

- Project name: Glancy.
- Proposal team name: weekend.
- Core thesis: Skills.md is not just documentation. It is an executable operational spec that tells AI how to implement, analyze, visualize, recover from data failures, and guide user setup.
- The demo should show that changing skills/config-like markdown can alter dashboard behavior or explain generation choices.
- The judge demo must remain usable without mandatory paid/account-bound APIs.
- Optional brokerage integrations such as Kiwoom are valuable, but they must have fallback behavior and clear user setup instructions.

## Current Product Direction

- Frontend: Vite + React + TypeScript.
- Backend: FastAPI.
- Charting: Lightweight Charts.
- UX target: Korean-optimized investment dashboard with TradingView-like chart interactions.
- Current top-level navigation:
  - `대시보드`: first screen; judge-facing composite portfolio dashboard.
  - `자산검색`: opens a market/category selector for Korean stocks, US stocks, ETF, crypto, and global indices.
  - `CSV 업로드`: upload/sample dashboard flow.
- Search target: one search bar across Korean stocks, US stocks, ETFs, crypto, and global indices.
- Korean search must cover full KOSPI/KOSDAQ, not just sample tickers.

## Latest Implemented Milestone

Commit saved:

```text
27f6bf2 feat: add composite portfolio dashboard
```

This commit implemented the judge-facing composite portfolio direction discussed in the session:

- The first screen now shows a comprehensive BI-style portfolio dashboard instead of separate sample cards.
- Portfolio universe is fixed for the demo as:
  - Samsung Electronics,
  - AAPL,
  - MSFT,
  - SPY,
  - BTC,
  - GLD.
- The dashboard is designed to satisfy the hackathon's `analysis`, `visualization`, and `insight` expectations in one coherent flow.
- CSV/JSON upload and sample data use the same backend analysis path for `composite_portfolio` where applicable.
- The upload sample is no longer meant to be a set of isolated tiny chart demos. The intended direction is a comprehensive uploaded-data dashboard that can include:
  - portfolio weights,
  - per-asset OHLCV,
  - per-asset technical analysis,
  - per-asset fundamental/asset-specific analysis where meaningful,
  - return series,
  - price time series,
  - correlation analysis,
  - risk/performance metrics,
  - Korean insight summaries.

Important product judgment:

- CSV upload dashboards do not need to be pixel-identical to Korean stock/US stock/crypto dashboards, because uploaded datasets can contain different scopes and schemas.
- They should still feel consistent: same design language, same analysis/visualization/insight structure, same Korean UX quality, and same evidence that Skills.md rules are driving dashboard composition.
- For the hackathon demo, the best default is a comprehensive portfolio dashboard because it immediately proves generality and automatic dashboard generation without requiring judges to prepare files.

Implementation evidence:

- Static demo data: `src/data/compositePortfolio.ts`.
- Main composite dashboard UI: `src/components/dashboard/CompositePortfolioDashboard.tsx`.
- First-screen routing/navigation: `src/App.tsx`, `src/components/dashboard/CategoryTabs.tsx`.
- Upload rendering branch: `src/components/upload/UploadView.tsx`.
- Backend detection: `backend/app/upload/detector.py`.
- Backend analysis dispatch: `backend/app/upload/analysis.py`.
- Composite adapter: `backend/app/upload/adapters/composite_portfolio.py`.
- Sample endpoint/data wiring: `backend/app/routers/upload.py`, `backend/app/upload/sample_inputs/composite_portfolio.csv`.
- Tests: `backend/tests/test_upload.py`.

## Runbook

Start backend:

```powershell
cd C:\Users\thisi\Documents\Glancy\backend
.\start-backend.ps1
```

Direct backend fallback:

```powershell
cd C:\Users\thisi\Documents\Glancy\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Start frontend:

```powershell
cd C:\Users\thisi\Documents\Glancy
npm run dev
```

Build frontend:

```powershell
npm run build
```

Backend env:

```text
backend/.env
```

Never put Kiwoom App Secret or brokerage credentials in frontend `.env.local`, committed files, or chat.

## Data Provider Matrix

| Asset type | Current provider | Freshness label intent | Notes |
| --- | --- | --- | --- |
| Korean stocks | Kiwoom REST first in local auto mode, pykrx fallback | `실시간 데이터` if Kiwoom succeeds, otherwise delayed/fallback | Search uses KRX KIND full KOSPI/KOSDAQ universe |
| US stocks | Yahoo/yfinance | `지연 데이터` | Do not claim real-time |
| ETF | Yahoo/yfinance | `지연 데이터` | Unless a future live provider is added |
| Crypto | Binance REST + Binance WebSocket | `실시간 데이터` | Best live behavior currently |
| Global indices | Yahoo/yfinance | `지연 데이터` | Korean index symbols are points, not USD/KRW |
| CSV upload | Local uploaded data pipeline | not market freshness | Do not imply live data |

## Kiwoom REST State

- Kiwoom provider file: `backend/app/sources/kiwoom_source.py`.
- Korean stock route: `backend/app/routers/kr_stocks.py`.
- Current desired local mode:

```text
KIWOOM_PROVIDER_MODE=auto
```

- In `auto`, backend tries Kiwoom first when configured, then falls back to pykrx when allowed.
- Kiwoom uses a dedicated `requests.Session()` with `trust_env = False` to avoid broken local proxy env like `HTTP_PROXY=http://127.0.0.1:9`.
- Backend start script `backend/start-backend.ps1` clears proxy env before launching Uvicorn.
- Kiwoom token is process-memory cached; backend restart creates a fresh token flow.
- User setup still matters:
  - Kiwoom REST API access,
  - mock or real App Key,
  - App Secret,
  - account number,
  - registered outbound IP.
- If deploying with Kiwoom, backend may need a stable outbound IP.

## Current Chart UX

- Main chart uses Lightweight Charts.
- OHLC values are shown at the top of the chart.
- Chart indicator categories:
  - Main price-pane indicators: independent MA instances, Bollinger Bands, Volume.
  - Bottom pane indicators: RSI, MACD, Stochastic, Williams %R, CCI, ROC, OBV.
- MA is independent now:
  - not one bundled `MA 5/20/60` setting,
  - each MA has one period, one color, one visibility state,
  - each MA has its own settings modal,
  - `차트 지표 -> MA 추가` adds another MA.
- Indicator settings modal is TradingView-inspired:
  - opens around chart center,
  - can be dragged inside chart area,
  - has `입력 / 모습 / 보임` tabs,
  - supports confirm/cancel.
- Gear icon opens settings.
- Trash icon should delete/hide the selected indicator where applicable.
- Important UX requirement from user:
  - even when the chart legend is collapsed, bottom indicator names should remain visible.

## Current UI/Freshness Wording

Use these labels unless code/data semantics change:

- Korean stocks: `실시간 데이터` or `지연 데이터`.
- US stocks: `지연 데이터`.
- ETF: `지연 데이터`.
- Crypto: `실시간 데이터`.
- Global indices: `지연 데이터`.

Avoid showing `캐시 데이터` as the main label when the real meaning is delayed provider data. Cache is an implementation detail, not a good user-facing explanation.

## Skills.md / Hackathon Story

The submitted skills should say that AI offers two Korean data modes:

- Option 1: pykrx/KRX default mode.
  - Works without brokerage credentials.
  - Good for reliable judge demo and fallback.
- Option 2: Kiwoom REST advanced mode.
  - User must issue App Key/App Secret, register IP, and store env vars.
  - AI can implement provider code, health checks, fallback, and user guidance.
  - AI must not ask the user to paste secrets in chat.

This framing is important: human setup is not a weakness if Skills.md explicitly defines the boundary between what AI implements and what the user must configure.

## Skills Document Structure

Current skills files:

```text
skills/
  README.md
  main.md
  data.md
  indicators.md
  insights.md
  charts.md
  layout.md
  theme.md
  providers/
    kiwoom.md
```

Module roles:

- `skills/README.md`: entry guide for the submitted skills package.
- `skills/main.md`: orchestrator; defines the overall execution flow and which module is called when.
- `skills/data.md`: data layer; defines CSV/API input handling, provider registry, MarketData normalization, and provider mode decisions.
- `skills/indicators.md`: computation layer; defines technical/fundamental/portfolio indicator rules and default parameter values.
- `skills/insights.md`: narrative layer; defines rule-based insight text generation without relying on an external LLM API.
- `skills/charts.md`: visual selection layer; maps data types and indicators to chart types and visualization rules.
- `skills/layout.md`: composition layer; defines dashboard sections, cards, grid layout, responsive behavior, and UI states.
- `skills/theme.md`: design token layer; defines colors, typography, light/dark mode, and chart color tokens.
- `skills/providers/kiwoom.md`: optional advanced provider guide; separates AI implementation tasks from user-required Kiwoom setup steps.

Expected module flow:

```text
main.md
  -> data.md
    -> indicators.md
      -> insights.md
        -> charts.md
          -> layout.md
            -> theme.md
```

Important positioning:

- `skills/main.md` should make the package feel like an executable spec, not a loose documentation bundle.
- `skills/data.md` should keep Kiwoom optional and define fallback to KRX/pykrx.
- `skills/indicators.md` should stay aligned with chart UI parameter controls.
- `skills/charts.md` should justify TradingView-style pane visualization and rich data visualization choices.
- `skills/providers/kiwoom.md` should explicitly say secrets belong in `backend/.env`, not chat or frontend env.

## Known Risks

- Kiwoom can fail after reboot if env/proxy/IP/token setup is wrong. Use `backend/start-backend.ps1` first.
- Kiwoom mock API behavior may differ by market day, holiday, account status, or portal permission.
- Yahoo/yfinance is delayed and should not be described as real-time.
- Global Korean indices like `^KS11` must not show `$`.
- Do not overclaim that every asset provider is live.
- The project has a dirty working tree from ongoing work. Never revert unrelated changes.

## Verification Expectations

Before claiming a code change is complete:

- Run `npm run build` for frontend changes.
- For backend/provider changes, run the relevant backend tests if practical.
- If browser behavior matters, manually check `http://localhost:5173/` or the active Vite port.
- If a command fails due to sandbox/permission issues, distinguish environment failure from code failure.

Latest known frontend verification:

- `npm run build` passed after composite portfolio dashboard work.

Latest known backend verification:

- `backend\.venv\Scripts\python.exe -m pytest backend\tests\test_upload.py -v` passed with 12 tests.

Latest known local service checks:

- `http://localhost:8000/upload/samples/composite-portfolio-csv` returned `200`, `type = composite_portfolio`, 6 assets, total portfolio weight 1.0.
- `http://localhost:5173/` returned `200`.

## Key Files

- Frontend app root: `src/App.tsx`
- Composite portfolio dashboard: `src/components/dashboard/CompositePortfolioDashboard.tsx`
- Composite portfolio static data: `src/data/compositePortfolio.ts`
- Upload UI: `src/components/upload/UploadView.tsx`
- Upload visualization renderer: `src/components/visualization/ChartRenderer.tsx`
- Upload visualization rules: `src/lib/visualizer.ts`
- Upload API types/client: `src/lib/api.ts`
- Chart container: `src/components/charts/ChartContainer.tsx`
- Main chart: `src/components/charts/CandleChart.tsx`
- Data badge: `src/components/common/DataStatusBadge.tsx`
- Market hooks: `src/hooks/useIndicatorsData.ts`
- Binance WebSocket hook: `src/hooks/useBinanceWebSocket.ts`
- Upload route: `backend/app/routers/upload.py`
- Upload detector: `backend/app/upload/detector.py`
- Upload analysis dispatcher: `backend/app/upload/analysis.py`
- Composite upload adapter: `backend/app/upload/adapters/composite_portfolio.py`
- Composite sample CSV: `backend/app/upload/sample_inputs/composite_portfolio.csv`
- Upload tests: `backend/tests/test_upload.py`
- Korean stock route: `backend/app/routers/kr_stocks.py`
- Kiwoom source: `backend/app/sources/kiwoom_source.py`
- Korean search source: `backend/app/sources/search_source.py`
- Backend start script: `backend/start-backend.ps1`

## Collaboration Notes

- User is detail-oriented and often compares UI behavior to TradingView or Kiwoom HeroMoon HTS.
- If the user asks whether something is understood, answer honestly and ask only if the ambiguity affects implementation.
- Prefer Korean responses.
- For implementation, use `karpathy-guidelines` when requested and keep changes surgical.
- Always provide concrete code evidence when the user asks for hallucination prevention.
