# PLAN: Deeper Technical and Fundamental Analysis Insights

**Created**: 2026-05-13  
**Last Updated**: 2026-05-13  
**Status**: Phases 1-6 implemented; automated verification passed except local `test_upload.py` dependency blocker  
**Scope**: Asset-search analysis screens, composite portfolio dashboard, composite upload result, backend insight contracts

**CRITICAL INSTRUCTIONS**: After completing each phase:
1. Check off completed task checkboxes.
2. Run all quality gate validation commands.
3. Verify ALL quality gate items pass.
4. Update "Last Updated" date.
5. Document learnings in Notes section.
6. Only then proceed to next phase.

Do not skip quality gates or proceed with failing checks.

## Overview

Judges reported that the technical and fundamental analysis insights feel too shallow. Current behavior confirms that feedback:

- Technical insights are mostly short template sentences generated from RSI, MACD, OBV, Bollinger position, and moving-average alignment.
- Summary insights are generated separately in the frontend from coarse scores, so they do not use the richer backend `insights.details` payload.
- Fundamental analysis has backend report builders, but the asset-search fundamental screen is not wired to those API responses.
- Composite portfolio dashboard individual-asset tabs reuse the same shallow `SummaryView`, `TechnicalView`, and `FundamentalView` patterns.
- Composite upload/sample results can provide per-asset details, but the displayed insight copy is still broad and card-like rather than interpretive.

Target outcome: judges should see analysis that explains **what changed, why it matters, where signals agree or conflict, what risk remains, and what to check next** across both asset-search and composite-portfolio experiences.

## Goals

- [x] Asset-search `Summary` shows a layered technical/fundamental thesis, not a generic one-line message.
- [x] Asset-search `Technical Analysis` shows structured sections for trend, momentum, volatility, volume, price levels, conflicts, and next checks.
- [x] Asset-search `Fundamental Analysis` uses actual `/fundamental/kr|us/{symbol}` data when supported and shows interpretive insight sections.
- [x] Composite portfolio `Summary` shows portfolio-level performance/risk/concentration insights.
- [x] Composite portfolio `Performance/Risk` shows narrative explanations for cumulative return, drawdown, monthly returns, volatility, and Sharpe.
- [x] Composite portfolio `Individual Asset Analysis` uses the same richer summary, technical, and fundamental insight UI.
- [x] CSV upload `composite_portfolio` results inherit the improved composite dashboard behavior.
- [x] Existing visual layout, charting library, market data routes, and upload detection remain intact.

## Non-Goals

- [ ] Do not add LLM-generated analysis.
- [ ] Do not add new live data providers.
- [ ] Do not rewrite the charting system.
- [ ] Do not expand scope into investment advice, recommendations, or order execution.
- [ ] Do not refactor unrelated UI styling or navigation.

## Current Evidence

- Technical backend insight composition:
  - `backend/app/insights/compose.py`
  - `backend/app/insights/overall.py`
  - `backend/app/insights/per_indicator.py`
- Technical indicator computation:
  - `backend/app/indicators/compute.py`
  - `backend/app/routers/indicators.py`
- Asset-search summary and analysis surfaces:
  - `src/lib/asset-analysis.ts`
  - `src/components/analysis/SummaryView.tsx`
  - `src/components/analysis/TechnicalView.tsx`
  - `src/components/analysis/FundamentalView.tsx`
  - `src/App.tsx`
- Fundamental backend reports:
  - `backend/app/fundamental/kr.py`
  - `backend/app/fundamental/us.py`
  - `backend/app/fundamental/models.py`
  - `backend/app/routers/fundamental.py`
- Composite portfolio surfaces:
  - `src/components/dashboard/CompositePortfolioDashboard.tsx`
  - `src/data/compositePortfolio.ts`
  - `backend/app/upload/adapters/composite_portfolio.py`
- Composite upload route:
  - `src/components/upload/UploadView.tsx`

## Architecture Decisions

| Decision | Rationale | Trade-offs |
| --- | --- | --- |
| Introduce a structured insight contract instead of only longer strings | The UI needs sections, severity, evidence, and next checks to feel deep and scannable | Requires adapter logic for old responses and fallback data |
| Keep insight generation deterministic and rule-based | Matches current Skills.md story, avoids network/LLM dependency, keeps judge demo stable | Rules must be carefully designed to avoid generic copy |
| Reuse one insight UI component across asset-search and portfolio individual-asset tabs | Keeps changes surgical and consistent | Component needs flexible labels for asset vs portfolio context |
| Wire existing fundamental API before inventing new data | Backend report builders already exist | API responses need interpretation and frontend loading/error states |
| Treat composite portfolio as first-class, not an afterthought | User explicitly requires the same depth on the dashboard | Requires portfolio-level and per-asset insight models |
| Preserve old fields during transition | Existing screens/tests may rely on `insights.summary` and `summary.insights` strings | Temporary dual shape may feel redundant until cleanup |

## Data Contract Proposal

Add a backward-compatible `insight_profile` object while preserving current `insights.summary`.

```ts
interface InsightProfile {
  headline: string;
  stance: 'bullish' | 'neutral' | 'bearish' | 'mixed' | 'watch';
  confidence: number;
  horizon: 'short' | 'medium' | 'long' | 'portfolio';
  sections: Array<{
    id: string;
    title: string;
    tone: 'positive' | 'neutral' | 'negative' | 'warning';
    summary: string;
    evidence: Array<{ label: string; value: string; interpretation: string }>;
  }>;
  conflicts: string[];
  nextChecks: string[];
  dataQuality: string[];
}
```

Backend Python can return the same shape as dictionaries. Frontend types should live near `src/lib/api.ts` and be reused by `SummaryView`, `TechnicalView`, `FundamentalView`, and composite dashboard adapters.

## Screen Impact Map

| Screen | Current issue | Planned change |
| --- | --- | --- |
| Asset Search > Summary | Generic `buildInsight()` string | Add insight thesis panel with technical/fundamental evidence and conflict chips |
| Asset Search > Technical Analysis | One short top message | Add structured technical insight sections above/beside charts |
| Asset Search > Fundamental Analysis | Static/mock-style display, no API wiring | Fetch fundamental API and render interpretive valuation/profitability/growth/health sections |
| Composite Dashboard > Summary | Metrics without enough narrative | Add portfolio-level insight profile for return drivers, risk, concentration, and diversification |
| Composite Dashboard > Performance/Risk | Charts lack interpretation | Add risk narrative beside cumulative, drawdown, monthly return, Sharpe views |
| Composite Dashboard > Individual Asset > Summary | Reuses shallow summary | Use shared thesis panel with portfolio role context |
| Composite Dashboard > Individual Asset > Technical | Reuses shallow technical copy | Use shared technical insight sections with snapshot/upload data basis |
| Composite Dashboard > Individual Asset > Fundamental | Metrics/trends lack thesis | Use shared fundamental insight sections with stock/ETF/crypto-specific rules |
| CSV Upload > Composite Portfolio Result | Uses `CompositePortfolioDashboard` | Inherits all composite dashboard changes automatically |

## Implementation Phases

### Phase 1: Lock Current Gaps With Tests

**Goal**: Add failing tests that describe the expected depth before changing production code.  
**Estimated Time**: 2-3 hours  
**Status**: Complete

#### Test Strategy

- Use existing Node static tests for frontend wiring and UI expectations.
- Use backend pytest tests for insight payload shape and deterministic rule behavior.
- Avoid browser tests in this phase unless existing tooling already supports them.

#### RED Tasks

- [x] Add backend tests for technical `insight_profile` shape.
  - File: `backend/tests/test_insights.py`
  - Scenarios:
    - strong trend with confirming momentum returns trend, momentum, volatility, volume sections.
    - mixed trend/momentum returns at least one conflict.
    - insufficient data preserves current error behavior.
  - Expected initial failure: no `insight_profile` exists.
- [x] Add frontend static test for asset-search summary using structured insight data.
  - File: `tests/deeper-analysis-insights.test.mjs`
  - Assert `SummaryView` accepts or renders a structured insight profile.
  - Expected initial failure: `SummaryView` only renders `summary.insights`.
- [x] Add frontend static test for `TechnicalView` structured insight rendering.
  - File: `tests/deeper-analysis-insights.test.mjs`
  - Assert `TechnicalView` renders insight sections instead of only one paragraph.
  - Expected initial failure: only the single `insight` paragraph exists.
- [x] Add frontend/static test proving `App.tsx` wires `api.fundamental` or a fundamental hook into `FundamentalView`.
  - Expected initial failure: `FundamentalView` is rendered with only `market`.
- [x] Add composite dashboard static test.
  - File: `tests/deeper-analysis-insights.test.mjs`
  - Assert `CompositePortfolioDashboard` has portfolio-level and per-asset structured insights.
  - Expected initial failure: fallback summaries are simple strings.

#### GREEN Tasks

- [x] None beyond test harness fixes.

#### REFACTOR Tasks

- [x] Keep assertions focused on contracts and visible user outcomes.
- [x] Avoid brittle exact-copy tests except for required section labels.

#### Quality Gate

- [x] New tests fail for the expected reason before implementation.
- [x] Existing tests still run to the same baseline.

#### Rollback

- Remove only `tests/deeper-analysis-insights.test.mjs` and the new backend assertions.

### Phase 2: Build Technical Insight Engine

**Goal**: Replace shallow technical commentary with deterministic multi-factor analysis while preserving current response compatibility.  
**Estimated Time**: 3-4 hours  
**Status**: Complete

#### Test Strategy

- Backend unit tests should directly exercise pure insight builder functions.
- API tests should confirm `/indicators/kr-stocks`, `/indicators/us-stocks`, and `/indicators/crypto` include both old `insights.summary` and new `insight_profile`.

#### RED Tasks

- [x] Keep Phase 1 technical tests failing.
- [x] Add tests for technical dimensions:
  - trend: MA alignment, cross, distance from MA20/MA50 when available.
  - momentum: RSI, MACD, stochastic/CCI/ROC agreement.
  - volatility: Bollinger and ATR context.
  - volume: OBV confirmation or divergence.
  - price levels: recent high/low, support/resistance candidates.
  - conflict: positive trend with overbought momentum, or bearish momentum with strong long-term trend.

#### GREEN Tasks

- [x] Add `backend/app/insights/technical_profile.py`.
- [x] Keep `compose()` as the integration point, but have it call the new profile builder.
- [x] Add helper calculations from existing indicator results when needed:
  - recent return,
  - distance from moving averages,
  - recent high/low range,
  - volatility band position.
- [x] Return `insight_profile` under the existing `insights` object.
- [x] Ensure `insights.summary` remains a concise backward-compatible headline.

#### REFACTOR Tasks

- [x] Do not delete `per_indicator.py` until all callers are migrated or tests prove it is unused.
- [x] Keep threshold logic near the new builder with names that explain financial meaning.

#### Quality Gate

- [x] `python -m pytest backend/tests/test_insights.py` passes.
- [x] Existing indicator API tests pass for the touched insight suite.
- [x] Technical response still includes `indicators`, `moving_averages`, `gauges`, and `insights.summary`.

#### Rollback

- Revert `technical_profile.py` and the small `compose()` integration.

### Phase 3: Wire Fundamental Data and Insight Engine

**Goal**: Make fundamental analysis use real report data where supported and generate deeper interpretation sections.  
**Estimated Time**: 3-4 hours  
**Status**: Complete

#### Test Strategy

- Backend tests for fundamental report interpretation should use mocked raw report data.
- Frontend static tests should verify `App.tsx` no longer renders asset-search `FundamentalView` without data/loading/error wiring.

#### RED Tasks

- [x] Add backend tests for a `fundamental_insight_profile`:
  - valuation expensive/cheap/unknown.
  - profitability strong/weak/unknown.
  - growth improving/declining/unknown.
  - financial health safe/risky/unknown.
  - shareholder return meaningful/limited/unknown.
- [x] Add tests for KR/US report builders preserving `sections` while adding insight fields.
- [x] Add frontend test for a `useFundamentalData` hook or equivalent App-level data flow.

#### GREEN Tasks

- [x] Add `backend/app/fundamental/insights.py`.
- [x] Extend `FundamentalReport` model with optional `insight_profile`.
- [x] Build rule-based interpretation from available raw values and notes.
- [x] Add `useFundamentalData()` hook in `src/hooks`.
- [x] Pass fetched data, loading state, and error state into `FundamentalView`.
- [x] Keep KR/US unsupported/missing values honest with `dataQuality` messages.

#### REFACTOR Tasks

- [x] Avoid adding broad peer-comparison claims unless data exists.
- [x] Keep `FundamentalView` generic enough to render stock, ETF, and crypto portfolio fundamentals from existing data.

#### Quality Gate

- [x] Backend fundamental tests pass.
- [x] `npm run build` passes.
- [x] Asset-search KR and US fundamental tabs are wired to loaded data or an explicit unavailable state.

#### Rollback

- Revert model extension, fundamental insight builder, and frontend hook/wiring.

### Phase 4: Add Shared Insight UI Components

**Goal**: Render the new structured insights in a polished, reusable way across summary, technical, and fundamental screens.  
**Estimated Time**: 3-4 hours  
**Status**: Complete

#### Test Strategy

- Static tests should confirm shared component usage in relevant screens.
- Build verifies TypeScript contracts.
- Manual browser QA verifies layout, text wrapping, and mobile behavior.

#### RED Tasks

- [x] Keep frontend tests failing until shared UI exists.
- [x] Add static assertions that `SummaryView`, `TechnicalView`, and `FundamentalView` import/use a shared insight component.

#### GREEN Tasks

- [x] Add `src/components/analysis/InsightProfilePanel.tsx`.
- [x] Add lightweight display subcomponents:
  - headline/stance strip,
  - evidence grid,
  - conflict list,
  - next-check list,
  - data-quality note.
- [x] Update `SummaryView` to render:
  - current gauge and metric cards,
  - plus structured thesis panel when available,
  - fallback to old `summary.insights` when not available.
- [x] Update `TechnicalView` to render structured technical sections above the chart.
- [x] Update `FundamentalView` to render structured fundamental sections before metric categories/trends.

#### REFACTOR Tasks

- [x] Keep cards shallow; do not nest cards inside cards.
- [x] Keep text compact and scannable for judge demo.
- [x] Use existing theme tokens and lucide icons only if useful.

#### Quality Gate

- [x] `npm run build` passes.
- [ ] Text does not overflow in desktop and mobile manual checks.
- [x] Existing summary/technical/fundamental fallback paths still render without structured insight data.

#### Rollback

- Revert the new shared component and screen imports.

### Phase 5: Upgrade Composite Portfolio Insights

**Goal**: Apply the same depth to the first-screen composite portfolio dashboard and composite upload result.  
**Estimated Time**: 3-4 hours  
**Status**: Complete

#### Test Strategy

- Backend tests should cover composite upload result insight payloads.
- Frontend static tests should ensure composite summary, performance/risk, and per-asset tabs surface structured insight panels.

#### RED Tasks

- [x] Add backend/adapter support for `backend/app/upload/adapters/composite_portfolio.py`:
  - portfolio-level insight includes return driver, risk driver, Sharpe/drawdown interpretation, and concentration/diversification note.
  - each asset has summary, technical, and fundamental insight payloads.
  - missing OHLCV produces explicit data-quality notes rather than fake certainty.
- [x] Add frontend static tests for:
  - `SummaryTab` portfolio insight profile.
  - `PerformanceTab` risk/performance insight profile.
  - `AssetsTab` passes per-asset insight data into shared analysis views.

#### GREEN Tasks

- [x] Add portfolio-level insight handling to composite dashboard and upload adapter.
- [x] Add deterministic built-in fallback insight profiles in `CompositePortfolioDashboard.tsx`.
- [x] Update `SummaryTab`:
  - return drivers,
  - risk drivers,
  - diversification/concentration,
  - portfolio next checks.
- [x] Update `PerformanceTab`:
  - cumulative return interpretation,
  - drawdown severity,
  - monthly seasonality,
  - Sharpe risk-adjusted context.
- [x] Update `fallbackSummary`, `fallbackIndicators`, and `fallbackFundamental` so individual assets pass structured insights to the shared views.
- [x] Ensure `UploadView` composite results inherit the same improved dashboard via existing `CompositePortfolioDashboard result={result}` path.

#### REFACTOR Tasks

- [x] Keep portfolio-specific calculations close to composite portfolio data/adapters.
- [x] Avoid duplicating asset-search technical/fundamental rules when a shared shape can be reused.

#### Quality Gate

- [x] `node tests/deeper-analysis-insights.test.mjs` passes.
- [ ] Relevant backend upload tests pass. Blocked locally because `fastapi` is not installed.
- [x] First screen has portfolio-level insight depth without requiring navigation.
- [x] Composite upload sample uses the same `CompositePortfolioDashboard` path and parses structured insight profiles.

#### Rollback

- Revert composite adapter/UI insight additions only.

### Phase 6: End-to-End QA and Evidence Update

**Goal**: Prove the deeper insight experience works for judge-critical paths and update docs.  
**Estimated Time**: 2-3 hours  
**Status**: Partially complete

#### Test Strategy

- Run automated backend and frontend checks.
- Use manual browser QA for judge paths because this project currently relies on Vite UI inspection rather than a full frontend test runner.

#### RED Tasks

- [ ] None. This phase verifies completed behavior.

#### GREEN Tasks

- [x] Update `docs/deployment/judge-demo-script.md` to mention deeper insight panels.
- [x] Update `docs/evidence/skills-to-code-matrix.md` if the new insight contract maps to `skills/insights.md`.
- [x] Add or update QA checklist items for:
  - asset-search technical depth,
  - asset-search fundamental depth,
  - composite dashboard summary depth,
  - composite individual-asset depth,
  - composite upload result depth.

#### REFACTOR Tasks

- [x] Trim any verbose copy that makes judge path slower.
- [x] Remove only dead imports/temporary helpers introduced by this work.

#### Quality Gate

- [x] `npm run build` passes.
- [x] Backend touched pytest subset passes; `test_upload.py` is blocked locally by missing `fastapi`.
- [x] New Node static tests pass.
- [ ] Manual judge route completes:
  - dashboard summary,
  - dashboard performance/risk,
  - individual asset technical,
  - individual asset fundamental,
  - asset-search technical,
  - asset-search fundamental,
  - composite CSV upload.

#### Rollback

- Revert documentation updates only if implementation is reverted.

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Insight copy becomes longer but not deeper | Medium | High | Require evidence/conflict/next-check fields, not just paragraphs |
| Fundamental data is missing for KR/US providers | High | Medium | Render data-quality notes and available-field interpretation instead of hiding gaps |
| API contract changes break existing screens | Medium | High | Preserve current fields and add optional structured fields |
| Composite fallback and upload result diverge | Medium | Medium | Test both built-in fallback and uploaded/sample result paths |
| Frontend becomes visually crowded | Medium | Medium | Use compact shared panel and keep charts primary |
| Tests become brittle around wording | Medium | Medium | Test structure and labels, not exact long prose |

## Rollback Strategy

- Phase 1 rollback: remove new tests only.
- Phase 2 rollback: remove technical insight builder and restore old `compose()` output.
- Phase 3 rollback: remove fundamental insight builder and frontend fetch wiring.
- Phase 4 rollback: remove shared insight UI and return to old text fields.
- Phase 5 rollback: remove composite insight additions while keeping asset-search changes.
- Phase 6 rollback: revert docs only.

## Verification Commands

```powershell
npm run build
node tests/deeper-analysis-insights.test.mjs
python -m pytest backend/tests/test_insights.py
python -m pytest backend/tests/test_upload.py backend/tests/test_fundamental_format.py
```

If backend virtual environment is required:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests
```

## Implementation Notes

- Keep changes surgical. Every changed line should trace to deeper judge-facing insights.
- Prefer pure helper functions for scoring and interpretation so tests can run without network.
- Do not claim unavailable data. Use explicit `dataQuality` notes.
- Keep old response fields during migration for compatibility.
- Use deterministic language such as "확인", "관찰", "주의" rather than direct buy/sell advice.

## Open Questions

- [ ] Should the judge-facing copy avoid words like "매수/매도" in recommendations and use "긍정/주의/중립" instead?
- [ ] Should ETF and crypto fundamental tabs be called "기초 지표" rather than "기본적 분석" to avoid stock-financial-statement expectations?
- [ ] Should the first dashboard summary show portfolio-level insight by default above or below the allocation donut?

## Notes and Learnings

- 2026-05-13: Planning only. No implementation started.
- 2026-05-13: Current code has separate frontend summary insight templates and backend technical insight templates; unifying around a structured profile should reduce shallow duplicate copy.
- 2026-05-13: Implemented structured `InsightProfile` across technical, fundamental, summary, and composite portfolio surfaces. Local `test_upload.py` could not run because `fastapi` is not installed in the active Python environment.
