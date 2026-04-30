# data.md — Data Source Registry

## 1. Purpose

Normalize all investment inputs into a common shape so the rest of the system can analyze any supported source with the same pipeline.

## 2. Input Types

| Source | Input | Expected output |
|--------|-------|-----------------|
| `kr_stocks` | Korean ticker, e.g. `005930` | OHLCV MarketData + optional fundamentals |
| `us_stocks` | US symbol, e.g. `AAPL` | OHLCV MarketData + fundamentals |
| `etfs` | ETF symbol, e.g. `SPY` | OHLCV MarketData |
| `crypto` | Binance symbol, e.g. `BTCUSDT` | OHLCV MarketData + realtime updates |
| `global_indices` | Index symbol, e.g. `^GSPC` | OHLCV MarketData |
| `user_upload` | CSV/JSON | Auto-detected upload analysis |

## 3. Standard Output — MarketData

```typescript
interface MarketData {
  source: 'kr_stocks' | 'us_stocks' | 'etfs' | 'crypto' | 'global_indices' | 'user_upload'
  symbol: string
  name: string
  type: 'OHLCV' | 'price_series' | 'portfolio' | 'multi_asset' | 'returns'
  timezone: 'KST' | 'UTC'
  currency: 'KRW' | 'USD' | 'USDT' | 'UNKNOWN'
  candles: Array<{
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  weights?: Array<{ ticker: string; weight: number; cost?: number }>
  returns?: Array<{ time: number; value: number }>
  meta: {
    data_status?: 'live' | 'cached' | 'sample'
    source_name?: string
    fetched_at?: string
    fallback_reason?: string | null
  }
}
```

## 4. Data Source Registry

| Registry key | Primary source | Secondary source | Notes |
|--------------|----------------|------------------|-------|
| `kr_stocks` | pykrx | DART | pykrx for OHLCV/PER/PBR, DART for statements |
| `us_stocks` | yfinance | sample fallback | OHLCV and fundamentals |
| `etfs` | yfinance | sample fallback | Technical analysis only |
| `crypto` | Binance | CoinGecko | Binance OHLCV/realtime, CoinGecko metadata |
| `global_indices` | yfinance | sample fallback | Technical analysis only |
| `user_upload` | local parser | manual guidance | No external key |

## 4-1. Korean Stock Provider Mode

`kr_stocks.provider_mode` controls how Korean stock market data is fetched.

| Value | Meaning | Default? |
|-------|---------|----------|
| `pykrx` | Use account-free KRX KIND search and pykrx OHLCV. This is the safe default. | Yes |
| `kiwoom_rest` | Use Kiwoom REST API for Korean quote/chart when credentials are configured. | No |
| `auto` | Prefer Kiwoom REST if env is complete; fallback to pykrx/KRX if missing or failing. | Recommended for demos with Kiwoom keys |

Rules:

- Korean stock search must remain KRX KIND based so every KOSPI/KOSDAQ ticker can be searched without a brokerage account.
- Kiwoom REST may enhance quote/current-price freshness and chart data, but it must not be required for the judge demo.
- If Kiwoom credentials are missing or invalid, AI must continue implementation with `pykrx` mode rather than stopping.
- Never put Kiwoom App Secret in frontend `.env.local`, public Skills files, screenshots, or chat logs.

## 5. Column Mapping Rules

| Standard | English aliases | Korean aliases |
|----------|-----------------|----------------|
| `time` | date, time, datetime | 날짜, 일자, 시간 |
| `open` | open, o | 시가 |
| `high` | high, h | 고가 |
| `low` | low, l | 저가 |
| `close` | close, price, c | 종가, 현재가 |
| `volume` | volume, vol | 거래량 |
| `ticker` | ticker, symbol | 종목, 종목코드 |
| `weight` | weight, allocation | 비중 |
| `return` | return, returns | 수익률 |

## 6. Upload Type Detection

Detection order matters:

1. `OHLCV`: open/high/low/close columns exist.
2. `portfolio`: ticker + weight or ticker + quantity columns exist.
3. `returns`: date + return column exists.
4. `multi_asset`: date + three or more numeric asset columns exist.
5. `price_series`: date + close/price column or date + single numeric series.
6. `unknown`: show columns and ask user to adjust format.

## 7. Timezone Policy

- Korean stocks use KST.
- US stocks, ETFs, indices, crypto, and uploads default to UTC.
- Chart rendering uses Unix timestamp seconds.
- User-facing labels can be localized to KST.

## 8. Missing Data Policy

| Problem | Handling |
|---------|----------|
| Missing volume | Set volume to 0 and mark limited volume analysis |
| Missing OHLC high/low | Convert price_series to OHLC where open/high/low/close are close |
| Empty API response | Use cache, then sample fallback |
| Invalid upload values | Return row/column guidance |

## 9. Reliability Policy

Every external data response should carry `meta.data_status`.

| Status | Meaning |
|--------|---------|
| `live` | Fresh external API response |
| `cached` | Recent cached response |
| `sample` | Demo fallback response |
