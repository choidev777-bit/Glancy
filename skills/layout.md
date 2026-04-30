# layout.md — Composition Layer

## 1. Purpose

Define how ChartSpec, indicators, insights, and market data are composed into a dashboard that is usable on desktop and mobile.

## 2. Page Structure

```text
Header
  Logo / Search / Theme Toggle

Category Tabs
  Korean Stocks / US Stocks / ETF / Crypto / Global Indices / Upload

Asset Header
  Name / ticker / price / change / volume / market cap / data status

Analysis Tabs
  Summary / Technical / Fundamental

Content
  Summary View
  Technical View
  Fundamental View
  Upload Visualization View
```

## 3. Summary View

Required sections:
- overall gauge
- summary insight
- technical summary card
- fundamental summary card when supported
- data status badge: live/cached/sample

## 4. Technical View

Required sections:
- timeframe segmented control: Hourly / Daily / Weekly / Monthly
- three gauges: technical, overall, moving average
- main candle chart
- RSI/MACD panels
- indicator table
- moving average table
- pivot table
- Skills Runtime Demo panel

## 5. Fundamental View

Supported for:
- Korean stocks
- US stocks

Sections:
- valuation
- profitability
- growth
- financial health
- shareholder return

Unsupported categories should show disabled tab with tooltip or explanatory empty state.

## 6. Upload View

Upload success should not show raw JSON first. It should show:

1. detected type
2. data summary
3. automatic visualization dashboard from `charts.md`
4. insights and metrics
5. raw JSON inside developer accordion

## 7. Responsive Rules

| Breakpoint | Layout |
|------------|--------|
| < 640px | single column, horizontal category scroll |
| 640-1024px | two-column cards where possible |
| >= 1024px | dense dashboard grid |

Tables must scroll horizontally on mobile. Charts must have stable height and not collapse during loading.

## 8. State Handling

| State | UI |
|-------|----|
| loading | skeleton blocks matching final layout |
| error | error card with retry |
| empty | empty state with next action |
| sample fallback | warning/info badge, analysis still visible |
| cached | cached badge with fetched time |
| runtime invalid | warning in Skills Runtime panel |

## 9. Accessibility

- Buttons need accessible labels.
- Color cannot be the only signal; include text labels.
- Tables need readable headers.
- Focus states must be visible.
- Motion should be subtle and not required for comprehension.

## 10. Demo Priority

The first 3 minutes should highlight:

1. category switching
2. technical chart and gauges
3. Skills Runtime Demo
4. CSV upload automatic visualization
5. data reliability badge
