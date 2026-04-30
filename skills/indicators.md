# indicators.md — Computation Layer

## 1. Purpose

Compute technical, fundamental, and portfolio indicators from standardized data. Every indicator returns both a value and an explainable signal.

## 2. Output Interface

```typescript
interface IndicatorResult {
  name: string
  value: number | string
  signal: '강한 매수' | '매수' | '중립' | '매도' | '강한 매도' | '과매수' | '과매도' | '보통'
  score: -2 | -1 | 0 | 1 | 2
  raw?: Record<string, number>
}

interface IndicatorBundle {
  trend: IndicatorResult[]
  momentum: IndicatorResult[]
  volatility: IndicatorResult[]
  strength: IndicatorResult[]
  volume: IndicatorResult[]
  pivots: Record<string, Record<string, number | null>>
  gauges: {
    moving_average: { percent: number; signal: string }
    technical: { percent: number; signal: string }
    overall: { percent: number; signal: string }
  }
}
```

## 3. Runtime Parameters

These fields can be edited in the Skills Runtime Demo.

```yaml
rsi_period: 14
rsi_overbought: 70
rsi_oversold: 30
macd_fast: 12
macd_slow: 26
macd_signal: 9
bb_period: 20
bb_std: 2.0
```

Validation:
- `rsi_oversold < rsi_overbought`
- `macd_fast < macd_slow`
- all periods must be positive integers
- invalid values keep last valid config

## 4. Technical Indicator Rules

### Trend

| Indicator | Default | Signal rule |
|-----------|---------|-------------|
| SMA | 5, 10, 20, 50, 100, 200 | close > SMA = 매수, close < SMA = 매도 |
| EMA | 5, 10, 20, 50, 100, 200 | close > EMA = 매수, close < EMA = 매도 |
| MA alignment | MA5/20/60 | MA5 > MA20 > MA60 = 정배열 |
| Cross | SMA5/SMA20 | recent upward cross = 골든크로스 |

### Momentum

| Indicator | Default | Signal rule |
|-----------|---------|-------------|
| RSI | 14 | <20 강한 매수, <30 매수, >70 매도, >80 강한 매도 |
| MACD | 12/26/9 | MACD crosses signal upward = 매수, downward = 매도 |
| Stochastic | 9/6 | <20 매수, >80 매도 |
| StochRSI | 14 | <0.2 매수, >0.8 매도 |

### Volatility

| Indicator | Default | Signal rule |
|-----------|---------|-------------|
| Bollinger Bands | 20, 2.0 | below lower = 매수, above upper = 매도 |
| ATR | 14 | directionless, used for risk context |

### Strength

| Indicator | Default | Signal rule |
|-----------|---------|-------------|
| ADX | 14 | >25 confirms trend direction via +DI/-DI |
| Williams %R | 14 | <= -80 매수, >= -20 매도 |
| CCI | 14 | < -100 매수, > 100 매도 |
| ROC | 12 | >0 매수, <0 매도 |
| Ultimate Oscillator | 7/14/28 | <30 매수, >70 매도 |

### Volume

| Indicator | Default | Signal rule |
|-----------|---------|-------------|
| OBV | n/a | OBV and price rising = 매수 |
| Volume MA | 20 | volume spike marks confidence |

## 5. Pivot Point Rules

Compute all variants when OHLC data exists:
- Classic
- Fibonacci
- Camarilla
- Woodie's
- DeMark's

## 6. Gauge Scoring

Each signal maps to score:

| Signal | Score |
|--------|-------|
| 강한 매수 | 2 |
| 매수 | 1 |
| 중립 | 0 |
| 매도 | -1 |
| 강한 매도 | -2 |

Percent conversion:

```text
percent = ((score_sum + max_abs_score) / (2 * max_abs_score)) * 100
```

| Percent | Label |
|---------|-------|
| 80-100 | 강한 매수 |
| 60-79 | 매수 |
| 40-59 | 중립 |
| 20-39 | 매도 |
| 0-19 | 강한 매도 |

## 7. Data Sufficiency

| Data length | Handling |
|-------------|----------|
| < 30 candles | show insufficient data message |
| 30-199 candles | compute short/medium indicators only |
| >= 200 candles | compute full MA set |

## 8. Upload-Specific Indicators

| Upload type | Indicators |
|-------------|------------|
| portfolio | top1/top3/top5 concentration, weight distribution |
| multi_asset | normalized return, correlation, annualized volatility |
| returns | cumulative return, annualized return, volatility, Sharpe, MDD, monthly returns |
| price_series | return, rolling return, drawdown |
