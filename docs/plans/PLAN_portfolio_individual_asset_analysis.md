# Implementation Plan: Portfolio Individual Asset Analysis

**Status**: In Progress
**Started**: 2026-05-04
**Last Updated**: 2026-05-06
**Estimated Completion**: 2026-05-05

---

**CRITICAL INSTRUCTIONS**: After completing each phase:
1. Check off completed task checkboxes.
2. Run all quality gate validation commands.
3. Verify all quality gate items pass.
4. Update "Last Updated" above.
5. Document learnings in Notes section.
6. Only then proceed to the next phase.

**Do not skip quality gates or proceed with failing checks.**

---

## Overview

### Feature Description

Upgrade `Dashboard > Individual Asset Analysis` inside the composite portfolio dashboard from shallow score cards into a full per-asset analysis surface with `Summary`, `Technical Analysis`, and `Fundamental Analysis` tabs.

This must reuse the existing asset-search analysis experience where practical, while preserving the core product distinction:

- Asset search is provider-backed live or delayed market analysis.
- Portfolio dashboard is sample/API/upload-data snapshot BI analysis.

### Success Criteria

- [ ] The composite portfolio `Individual Asset Analysis` tab supports Samsung Electronics, AAPL, MSFT, SPY, BTC, and GLD.
- [ ] Each selected asset shows an embedded `Summary / Technical Analysis / Fundamental Analysis` flow.
- [ ] Technical analysis uses uploaded/sample `ohlcv` data when present.
- [ ] Uploaded composite data without `ohlcv` does not silently show mock candles.
- [ ] BTC technical analysis does not attach realtime Binance WebSocket data inside the portfolio dashboard.
- [ ] SPY, GLD, and BTC keep a `Fundamental Analysis` tab, but show asset-type fundamentals rather than stock financial statements.
- [ ] Existing asset-search dashboard behavior remains unchanged.
- [ ] Backend upload tests and frontend build pass.

### User Impact

Judges can open the first dashboard screen and immediately inspect portfolio-level and per-asset analysis without preparing their own CSV/JSON files. The dashboard demonstrates analysis, visualization, and insight generation from a comprehensive investment dataset.

---

## Architecture Decisions

| Decision | Rationale | Trade-offs |
| --- | --- | --- |
| Reuse existing analysis components instead of building a separate portfolio-only analysis UI | Keeps asset-search and portfolio analysis visually consistent and reduces duplicated UI logic | Existing components need small prop-based generalization |
| Extend backend composite upload output with per-asset detail | Prevents frontend from fabricating charts from mock data when the uploaded CSV already contains OHLCV rows | Requires backend parsing and tests before UI work |
| Disable realtime behavior in portfolio embedded technical views | Portfolio dashboard represents uploaded/sample snapshots, not live market monitoring | BTC chart will not update live inside portfolio view |
| Preserve current response fields and add detail fields | Avoids breaking existing upload visualizations and tests | Response shape becomes richer, so conversion helpers must stay defensive |
| Show asset-type fundamentals for ETF/crypto | Avoids misleading "unsupported" or stock-only financial metrics for SPY, GLD, BTC | Requires separate labels and metric groups by asset kind |

---

## Dependencies

### Required Before Starting

- [ ] Existing commit `27f6bf2 feat: add composite portfolio dashboard` is present.
- [ ] Backend virtual environment works with `backend\.venv\Scripts\python.exe`.
- [ ] Frontend dependencies are installed for `npm run build`.
- [ ] Local code still has `CompositePortfolioDashboard`, `TechnicalView`, `SummaryView`, and `FundamentalView`.

### External Dependencies

- No new package or service dependency is required.
- Existing libraries used:
  - React + TypeScript
  - Vite
  - FastAPI
  - pandas
  - Lightweight Charts

---

## Test Strategy

### Testing Approach

Follow TDD where the backend/data contract changes first:

1. Add failing backend tests for composite per-asset details.
2. Implement backend parsing until tests pass.
3. Add/adjust frontend types and components.
4. Validate with build and browser checks.

### Test Pyramid for This Feature

| Test Type | Coverage Target | Purpose |
| --- | --- | --- |
| Unit/adapter tests | Composite upload parsing paths | Verify OHLCV, fundamental, and missing-data conversion |
| Integration tests | Upload sample endpoint | Verify `/upload/samples/composite-portfolio-csv` returns dashboard-ready detail |
| Manual UI tests | Critical judge flows | Verify first-screen dashboard and individual asset tabs |

### Test File Organization

```text
backend/tests/test_upload.py
src/components/dashboard/CompositePortfolioDashboard.tsx
src/components/analysis/TechnicalView.tsx
src/components/analysis/SummaryView.tsx
src/components/analysis/FundamentalView.tsx
src/data/compositePortfolio.ts
```

### Coverage Requirements by Phase

- Phase 1: Backend tests prove `assets[].technical.candles` exists for composite sample data.
- Phase 2: Frontend build proves type compatibility after prop generalization.
- Phase 3: Browser checks prove the embedded 3-tab UI works for all six assets.
- Phase 4: Upload/missing OHLCV tests prove no silent mock chart substitution.

---

## Implementation Phases

### Phase 1: Backend Composite Asset Detail Contract

**Goal**: Make composite upload/sample results include per-asset analysis data that the frontend can render without inventing chart data.
**Estimated Time**: 2-3 hours
**Status**: Complete

#### Tasks

**RED: Write Failing Tests First**

- [x] **Test 1.1**: Add composite sample detail assertions.
  - File: `backend/tests/test_upload.py`
  - Add assertions to `test_composite_portfolio_sample_has_dashboard_sections` or a new test:
    - `body["assets"][0]["technical"]["candles"]` exists.
    - Every candle contains `time`, `open`, `high`, `low`, `close`, `volume`.
    - All six expected tickers are still present.
    - `technical.has_ohlcv` is true for the bundled sample.
  - Expected: FAIL because current backend `assets` only contains shallow card fields.

- [x] **Test 1.2**: Add missing-OHLCV composite behavior test.
  - File: `backend/tests/test_upload.py`
  - Build a composite dataframe with `portfolio_weight`, `return`, `fundamental`, and `metadata`, but no `ohlcv`.
  - Assert upload returns `200`, type `composite_portfolio`, `assets[].technical.has_ohlcv` false, and at least one `data_quality.warnings` entry mentions missing OHLCV.
  - Expected: FAIL until adapter adds explicit missing-data output.

**GREEN: Implement to Make Tests Pass**

- [x] **Task 1.3**: Parse `ohlcv` section by asset.
  - File: `backend/app/upload/adapters/composite_portfolio.py`
  - Add helper that pivots rows where `section == "ohlcv"` into candles:
    - group by `asset` and `date`
    - read metrics `open`, `high`, `low`, `close`, `volume`
    - output Unix seconds or ISO-compatible time matching frontend `Candle.time` expectations
    - sort by date ascending
    - drop incomplete rows only when required fields cannot be converted to finite numbers

- [x] **Task 1.4**: Add per-asset technical payload.
  - File: `backend/app/upload/adapters/composite_portfolio.py`
  - Extend `_asset_cards()` inputs to include OHLCV and returns.
  - Add `technical` object:
    - `candles`
    - `has_ohlcv`
    - `gauges`
    - `indicators`
    - `moving_averages`
    - `insight`
  - Use simple deterministic calculations from uploaded rows; do not call live providers.

- [x] **Task 1.5**: Add per-asset summary and fundamental payload.
  - File: `backend/app/upload/adapters/composite_portfolio.py`
  - Add `summary` object with signal, insight, and tags.
  - Add `fundamental` object with categories/history derived from `fundamental` rows where possible.
  - For `stock`, `etf`, and `crypto`, choose labels appropriate to the asset kind.

- [x] **Task 1.6**: Add warnings for missing per-asset OHLCV.
  - File: `backend/app/upload/adapters/composite_portfolio.py`
  - If an asset has no candles, set `technical.has_ohlcv = false` and add a warning.

**REFACTOR: Clean Up Code**

- [x] **Task 1.7**: Keep adapter helpers small.
  - File: `backend/app/upload/adapters/composite_portfolio.py`
  - Keep helpers focused on:
    - section extraction
    - candle conversion
    - indicator summary
    - fundamental conversion
  - Do not add external services or new dependencies.

#### Quality Gate

**STOP: Do not proceed to Phase 2 until all checks pass.**

- [x] Tests were written before backend implementation.
- [x] `backend\.venv\Scripts\python.exe -m pytest backend\tests\test_upload.py -v` passes.
- [x] Existing assertions for `portfolio.total_weight == 1` still pass.
- [x] No existing upload type is broken.

Validation command:

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_upload.py -v
```

Manual check:

- [x] Open `http://localhost:8000/upload/samples/composite-portfolio-csv`.
- [x] Confirm each asset has `technical.candles` or explicit missing OHLCV metadata.

---

### Phase 2: Frontend Data Types and Reusable Analysis Components

**Goal**: Make existing asset-search analysis components accept portfolio snapshot data without changing default asset-search behavior.
**Estimated Time**: 2-3 hours
**Status**: In Progress

#### Tasks

**RED: Write Failing/Type-Driven Checks First**

- [x] **Test 2.1**: Add or rely on TypeScript build failures for new props.
  - Files:
    - `src/components/analysis/TechnicalView.tsx`
    - `src/components/analysis/SummaryView.tsx`
    - `src/components/analysis/FundamentalView.tsx`
  - Expected: Before implementation, attempted use from `CompositePortfolioDashboard` would fail type checking.

**GREEN: Implement to Make Checks Pass**

- [x] **Task 2.2**: Add portfolio-friendly props to `TechnicalView`.
  - File: `src/components/analysis/TechnicalView.tsx`
  - Add:
    - `showRuntimePanel?: boolean`
    - `allowMockCandles?: boolean`
    - `emptyMessage?: string`
  - Defaults:
    - `showRuntimePanel = true`
    - `allowMockCandles = true`
  - If `allowMockCandles=false` and `candles` is empty, show empty state instead of `mockCandles`.

- [x] **Task 2.3**: Keep realtime off when requested.
  - File: `src/components/analysis/TechnicalView.tsx`
  - Continue passing `enableRealtimeCandle` into `ChartContainer`.
  - Portfolio caller will pass `false`.

- [x] **Task 2.4**: Add data prop to `SummaryView`.
  - File: `src/components/analysis/SummaryView.tsx`
  - Add optional `summary` data prop.
  - If omitted, keep using existing mock summary.
  - Keep `onNavigate` behavior intact.

- [x] **Task 2.5**: Add data prop to `FundamentalView`.
  - File: `src/components/analysis/FundamentalView.tsx`
  - Add optional `data` prop for categories and history.
  - If omitted, keep existing `market` behavior.
  - Do not mark BTC/SPY/GLD unsupported when portfolio data provides asset-type fundamentals.

**REFACTOR: Clean Up Code**

- [x] **Task 2.6**: Avoid broad rewrites.
  - Keep existing component layout and class names.
  - Remove only imports or variables made unused by these changes.

#### Quality Gate

**STOP: Do not proceed to Phase 3 until all checks pass.**

- [x] `npm run build` passes.
- [ ] Asset-search route still renders summary, technical, and fundamental tabs.
- [ ] No runtime panel disappearance in asset-search technical tab.

Validation command:

```powershell
npm run build
```

Manual check:

- [x] Open `http://localhost:5173/`.
- [ ] Go to `자산검색`.
- [ ] Confirm existing analysis tabs still behave as before.

---

### Phase 3: Embedded Individual Asset Analysis UI

**Goal**: Replace shallow asset cards inside the composite portfolio dashboard with embedded per-asset `Summary / Technical Analysis / Fundamental Analysis` tabs.
**Estimated Time**: 3-4 hours
**Status**: Implementation complete, browser check pending

#### Tasks

**RED: Define Expected UI Behavior**

- [x] **Test 3.1**: Use build/type checks as the first guard.
  - File: `src/components/dashboard/CompositePortfolioDashboard.tsx`
  - Expected before implementation: new data access and component props do not exist or are not wired.

**GREEN: Implement UI**

- [x] **Task 3.2**: Extend `CompositeHolding` frontend type.
  - File: `src/data/compositePortfolio.ts`
  - Add fields:
    - `assetHeader`
    - `summary`
    - `technical`
    - `fundamental`
  - Add generated static fallback analysis for all six bundled assets when the sample API is unavailable.

- [x] **Task 3.3**: Update backend result conversion.
  - File: `src/components/dashboard/CompositePortfolioDashboard.tsx`
  - Update `toHolding()` so backend-provided `summary`, `technical`, and `fundamental` are used when present.
  - Preserve static fallback for sample API failure.

- [x] **Task 3.4**: Add nested asset analysis tab state.
  - File: `src/components/dashboard/CompositePortfolioDashboard.tsx`
  - Add internal state:
    - selected asset ticker
    - selected asset analysis tab: `summary | technical | fundamental`

- [x] **Task 3.5**: Render selected asset header and tabs.
  - File: `src/components/dashboard/CompositePortfolioDashboard.tsx`
  - Header includes:
    - name
    - ticker
    - market
    - data basis text
    - portfolio weight
    - return
    - volatility

- [x] **Task 3.6**: Render reused analysis components.
  - File: `src/components/dashboard/CompositePortfolioDashboard.tsx`
  - Summary tab uses `SummaryView` with selected asset summary.
  - Technical tab uses `TechnicalView` with selected asset technical data:
    - `showRuntimePanel={false}`
    - `allowMockCandles={false}`
    - `enableRealtimeCandle={false}`
  - Fundamental tab uses `FundamentalView` with selected asset fundamental data.

**REFACTOR: Clean Up Code**

- [x] **Task 3.7**: Remove obsolete shallow asset-card markup.
  - File: `src/components/dashboard/CompositePortfolioDashboard.tsx`
  - Keep only pieces still needed in the new embedded analysis UI.

#### Quality Gate

**STOP: Do not proceed to Phase 4 until all checks pass.**

- [x] `npm run build` passes.
- [ ] `대시보드 > 개별 자산 분석` shows six asset buttons.
- [ ] Each asset has `요약`, `기술적 분석`, `기본적 분석`.
- [ ] BTC does not show realtime or stock-financial-statement language.
- [ ] Technical tab uses uploaded/sample candles when present.

Validation command:

```powershell
npm run build
```

Manual test checklist:

- [ ] Samsung Electronics summary/technical/fundamental render.
- [ ] AAPL summary/technical/fundamental render.
- [ ] MSFT summary/technical/fundamental render.
- [ ] SPY shows ETF fundamentals.
- [ ] BTC shows crypto fundamentals and no realtime WebSocket behavior.
- [ ] GLD shows gold ETF fundamentals.

---

### Phase 4: Upload Edge Cases and Final Polish

**Goal**: Ensure uploaded composite data behaves honestly and the Korean UX is judge-ready.
**Estimated Time**: 2-3 hours
**Status**: Implementation complete, browser visual check pending

#### Tasks

**RED: Verify Edge Cases**

- [x] **Test 4.1**: Backend missing-OHLCV test from Phase 1 remains passing.
  - File: `backend/tests/test_upload.py`
  - Confirms no silent mock chart requirement from backend perspective.

**GREEN: Polish Behavior**

- [x] **Task 4.2**: Make empty technical state explicit.
  - File: `src/components/analysis/TechnicalView.tsx`
  - Empty state text:
    - "업로드 데이터에 이 자산의 OHLCV 섹션이 없어 캔들 차트를 생성하지 않았습니다."

- [x] **Task 4.3**: Fix Korean text visible in touched components.
  - Files:
    - `src/components/dashboard/CompositePortfolioDashboard.tsx`
    - `src/components/analysis/TechnicalView.tsx`
    - `src/components/analysis/SummaryView.tsx`
    - `src/components/analysis/FundamentalView.tsx`
  - Only fix text in touched UI paths.
  - Do not perform unrelated full-app copy rewrite.

- [x] **Task 4.4**: Clarify data basis labels.
  - Portfolio dashboard text must use:
    - "샘플 API 기준"
    - "업로드 CSV 기준"
    - "스냅샷 분석"
  - Avoid:
    - "실시간 데이터"
    - "라이브"
    - "현재 시장 데이터"

**REFACTOR: Clean Up Code**

- [x] **Task 4.5**: Remove unused imports and dead local state introduced by this feature.

#### Quality Gate

**STOP: Do not mark complete until all checks pass.**

- [x] Frontend build passes.
- [x] Backend upload tests pass.
- [ ] Browser manual checks pass.
- [x] No unrelated files are modified except existing dirty user files that were already dirty before this work.

Validation commands:

```powershell
npm run build
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_upload.py -v
git status --short
```

Manual test checklist:

- [ ] First screen is composite portfolio dashboard.
- [ ] `개별 자산 분석` tab supports all six assets.
- [ ] Technical chart appears when OHLCV exists.
- [x] Missing OHLCV shows explicit empty state.
- [x] Upload sample `composite-portfolio-csv` uses the same embedded analysis structure.
- [ ] Existing `자산검색` dashboard still works.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
| --- | --- | --- | --- |
| Frontend accidentally shows mock chart for uploaded data | Medium | High | Add `allowMockCandles=false` and missing-OHLCV empty state |
| BTC portfolio view attaches realtime WebSocket | Medium | Medium | Always pass `enableRealtimeCandle={false}` from portfolio technical view |
| Backend detail response breaks existing upload tests | Low | Medium | Preserve existing top-level fields and add detail fields only |
| Component reuse changes asset-search behavior | Medium | High | Keep prop defaults matching current behavior; manually verify asset-search |
| Korean mojibake remains in touched UI | High | Medium | Fix visible strings in modified components during Phase 4 |
| Plan scope grows into full provider/live data rewrite | Medium | High | Do not call market provider hooks from portfolio dashboard |

---

## Rollback Strategy

### If Phase 1 Fails

Steps to revert:

- Restore `backend/app/upload/adapters/composite_portfolio.py`.
- Restore `backend/tests/test_upload.py`.
- Keep existing composite dashboard frontend unchanged.

### If Phase 2 Fails

Steps to revert:

- Restore `src/components/analysis/TechnicalView.tsx`.
- Restore `src/components/analysis/SummaryView.tsx`.
- Restore `src/components/analysis/FundamentalView.tsx`.
- Keep backend detail output if tests pass; it is additive.

### If Phase 3 Fails

Steps to revert:

- Restore `src/components/dashboard/CompositePortfolioDashboard.tsx`.
- Restore `src/data/compositePortfolio.ts`.
- Keep Phase 1 and Phase 2 only if asset-search build remains green.

### If Phase 4 Fails

Steps to revert:

- Revert only the polish/empty-state copy changes from touched files.
- Keep backend and structural UI changes if validation remains green.

---

## Progress Tracking

### Completion Status

- **Phase 1**: 100%
- **Phase 2**: 80%
- **Phase 3**: 85%
- **Phase 4**: 85%

**Overall Progress**: 90% complete

### Time Tracking

| Phase | Estimated | Actual | Variance |
| --- | --- | --- | --- |
| Phase 1 | 2-3 hours | Completed | - |
| Phase 2 | 2-3 hours | Implementation complete, browser check pending | - |
| Phase 3 | 3-4 hours | Implementation complete, browser check pending | - |
| Phase 4 | 2-3 hours | Implementation complete, browser visual check pending | - |
| **Total** | 9-13 hours | - | - |

---

## Notes & Learnings

### Implementation Notes

- Current `TechnicalView` falls back to `mockCandles` when `candles` is empty. This is useful for asset-search fallback, but dangerous for uploaded-data truthfulness.
- Current `ChartContainer` can attach Binance WebSocket when crypto category and realtime are enabled. Portfolio callers must disable it.
- Current backend composite adapter returns shallow `assets` and needs per-asset OHLCV detail before the UI can honestly show technical charts.
- Phase 1 added backend per-asset technical, summary, and fundamental payloads. The bundled composite sample now has 5 OHLCV candles for all six assets.
- Phase 2 generalized `TechnicalView`, `SummaryView`, and `FundamentalView` with optional props while preserving default asset-search behavior.
- Phase 3 wired `CompositePortfolioDashboard` individual asset analysis to reused `SummaryView`, lazy `TechnicalView`, and `FundamentalView`; portfolio technical views pass `enableRealtimeCandle={false}` and `allowMockCandles={false}`.
- Phase 4 replaced visible mojibake in touched analysis/dashboard components, clarified snapshot labels, and verified the missing-OHLCV empty state remains explicit.

### Blockers Encountered

- None at plan creation time.

### Improvements for Future Plans

- Consider moving shared analysis data types into a dedicated frontend module if more dashboard surfaces reuse them.
- Consider adding frontend component tests later if the project adds a test runner.

---

## References

### Project Code Evidence

- `src/components/dashboard/CompositePortfolioDashboard.tsx`
- `src/components/analysis/TechnicalView.tsx`
- `src/components/analysis/SummaryView.tsx`
- `src/components/analysis/FundamentalView.tsx`
- `src/components/charts/ChartContainer.tsx`
- `src/data/compositePortfolio.ts`
- `backend/app/upload/adapters/composite_portfolio.py`
- `backend/app/routers/upload.py`
- `backend/tests/test_upload.py`

### Skill/Template Evidence

- `C:\Users\thisi\.codex\skills\cc-feature-implementer\SKILL.md`
- `C:\Users\thisi\.codex\skills\cc-feature-implementer\plan-template.md`
- `C:\Users\thisi\.codex\skills\karpathy-guidelines\SKILL.md`

---

## Final Checklist

Before marking plan as complete:

- [ ] All phases completed with quality gates passed.
- [ ] Backend upload tests pass.
- [ ] Frontend build passes.
- [ ] Browser manual testing completed.
- [ ] Data-source wording distinguishes snapshot portfolio data from realtime asset search.
- [ ] No silent mock chart is shown for uploaded composite assets missing OHLCV.
- [ ] Existing asset-search analysis remains functional.
- [ ] Plan document updated with actual completion notes.

---

**Plan Status**: Pending
**Next Action**: Complete browser visual checklist in the running app, then finalize or commit.
**Blocked By**: None
