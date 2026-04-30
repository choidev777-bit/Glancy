# Judge Demo Script

Use this as the 3-minute happy path for the submitted production URL.

## 0:00-0:30 First Screen

- Open the production Vercel URL in an incognito browser.
- Confirm the KR Stocks default asset loads.
- Point out the current price, overall gauge, and natural-language insight.

## 0:30-1:00 Multi-Asset Coverage

- Switch through `US Stocks`, `ETF`, `Crypto`, and `Global Indices`.
- Confirm the same dashboard frame handles different asset classes.
- Mention that the API layer supports fallback so the demo remains available during provider failures.

## 1:00-1:40 Technical Analysis Automation

- Enter the `기술적 분석` tab.
- Show the candle chart, moving averages, RSI, MACD, gauges, and indicator tables.
- Explain that `skills/charts.md` defines why each visualization is selected.

## 1:40-2:20 Skills Runtime Demo

- Open the Skills Runtime Demo surface when available.
- Change a theme token or indicator threshold.
- Show that the UI/chart interpretation changes without rewriting app code.

## 2:20-3:00 CSV Upload

- Switch to `CSV Upload`.
- Drag or choose a sample OHLCV, portfolio, returns, or price-series CSV.
- Confirm auto-detection and the Visualization Intelligence bundle.
- Point out that the app chooses a chart family based on the detected data type, then shows the reason from `skills/charts.md`.

## Visualization Wow Moment

- Portfolio CSV becomes an allocation donut plus concentration view.
- Multi-asset CSV becomes normalized comparison plus correlation heatmap.
- Returns CSV becomes risk metrics, drawdown, and monthly returns heatmap.
- Each generated panel includes a visible `charts.md driven` explanation so judges can see the Skills.md-to-UI chain.

## Backup Line

If any external API is slow, say: "The app is intentionally demo-safe: failed live providers fall back to cached/sample data while preserving the visualization workflow."
