# Final QA Checklist

## Submission

- [ ] Production URL is the Vercel URL.
- [ ] Production URL opens in an incognito browser without login.
- [ ] Desktop first screen renders without layout breakage.
- [ ] Mobile first screen renders without horizontal page overflow.
- [ ] Footer/documentation links do not distract from the demo route.

## Data

- [ ] KR Stocks default asset loads.
- [ ] US Stocks default asset loads.
- [ ] ETF default asset loads.
- [ ] Crypto default asset loads.
- [ ] Global Indices default asset loads.
- [ ] Failed external API shows sample fallback messaging instead of a blank screen.

## Insight Depth

- [ ] Summary screen shows a structured insight panel with stance, confidence, section evidence, conflicts, and next checks.
- [ ] Technical Analysis screen shows trend, momentum, volatility, volume, and level evidence instead of only a one-line comment.
- [ ] Fundamental Analysis screen shows valuation, profitability, growth, financial-health, and shareholder-return evidence.
- [ ] Composite Portfolio Dashboard shows portfolio-level insight and the same deeper per-asset technical/fundamental insight shape.
- [ ] Missing provider fields produce data-quality notes rather than silent overconfidence.

## Skills Proof

- [ ] Skills Runtime Demo entry is visible or documented.
- [ ] `skills/indicators.md` threshold changes can be explained.
- [ ] `skills/theme.md` token changes can be explained.
- [ ] Generated-code mapping is available in the evidence docs.

## Skills Runtime Demo

- [ ] Change RSI overbought from `70` to `60`; indicator params preview updates.
- [ ] Change `brand_primary`; dashboard accent color changes immediately after Apply.
- [ ] Apply Conservative, Aggressive, and High Contrast presets.
- [ ] Reset restores original theme and indicator params.
- [ ] Invalid RSI thresholds show a warning and disable Apply.

## Upload

- [ ] OHLCV CSV auto-detects.
- [ ] Portfolio CSV auto-detects.
- [ ] Returns CSV auto-detects.
- [ ] Unknown CSV receives a helpful error.

## Visualization Intelligence

- [ ] Uploaded portfolio data renders a donut allocation chart.
- [ ] Uploaded multi-asset data renders normalized comparison and correlation views.
- [ ] Uploaded returns data renders drawdown and monthly returns heatmap views.
- [ ] Every generated visualization shows a user-facing reason and `skills/charts.md` rule.
- [ ] Raw JSON remains available in a collapsible details panel without replacing the visual-first demo.

## Stability

- [ ] `npm run build` passes.
- [ ] Backend tests pass.
- [ ] Railway `/health` returns `status: ok`.
- [ ] Vercel production URL works.
- [ ] `VITE_API_BASE_URL` points to the Railway backend.

## Reliability

- [ ] Force an API failure and confirm `Sample fallback` appears.
- [ ] Confirm charts, indicators, and insights still render in sample fallback mode.
- [ ] Load the same route twice and confirm `Cached` can appear.
- [ ] Confirm normal provider responses show `Live`.

## Judge Demo

- [ ] 3-minute route from `judge-demo-script.md` can be completed without dead ends.
- [ ] If live data fails, fallback/sample mode keeps charts visible.
- [ ] The app clearly communicates that it is an investment data visualization dashboard, not investment advice.
