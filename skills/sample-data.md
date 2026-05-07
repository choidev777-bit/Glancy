# sample-data.md - Judge Demo Data Contract

## 목적

AI가 같은 샘플 데이터로 현재 Glancy 대시보드를 재현하도록 핵심 값과 표시 형식을 고정한다.

## Portfolio Summary

| Field | Value |
| --- | --- |
| Title | 종합 포트폴리오 분석 |
| Subtitle | 삼성전자 · AAPL · MSFT · SPY · BTC · GLD |
| Period | 2025-01-01 ~ 2025-03-31 |
| KRW Value | 128,450,000원 |
| USD Value | $92,400 |
| Total Return | +11.8% |
| Volatility | 16.4% |
| Max Drawdown | -8.2% |
| Sharpe | 1.18 |
| Signal Score | 72 |
| Signal Label | 균형 |

## Holdings

| Ticker | Name | Type | Weight | Return | Contribution | Volatility | Technical Score | Fundamental Score |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 005930 | 삼성전자 | 주식형 | 25.0% | +9.2% | +2.3% | 18.5% | 68 | 74 |
| AAPL | Apple | 주식형 | 20.0% | +13.4% | +2.7% | 20.1% | 75 | 79 |
| MSFT | Microsoft | 주식형 | 18.0% | +12.6% | +2.3% | 17.6% | 78 | 83 |
| SPY | SPDR S&P 500 ETF | ETF형 | 22.0% | +8.1% | +1.8% | 13.2% | 66 | 71 |
| BTC | Bitcoin | 암호자산형 | 7.0% | +24.8% | +1.7% | 51.2% | 64 | 58 |
| GLD | SPDR Gold Shares | ETF형 | 8.0% | +6.4% | +0.5% | 11.8% | 61 | 69 |

## Portfolio Weight Colors

Use the same asset color for donut, legend, segmented bars, and comparison series.

| Ticker | Role |
| --- | --- |
| 005930 | chart_1 |
| AAPL | chart_2 |
| MSFT | chart_3 |
| SPY | chart_4 |
| BTC | chart_5 |
| GLD | chart_6 |

## Cumulative Portfolio Series

Values:

```text
100.0, 101.8, 103.5, 105.9, 104.7, 108.4, 110.2, 109.6, 113.1, 111.8
```

Required labels:

- start: 100.0
- current: 111.8
- change: +11.8%
- date anchors: 01-01, 02-15, 03-31

## Drawdown Series

Values:

```text
-1.0%, -2.5%, -1.8%, -4.1%, -8.2%, -5.2%, -3.6%, -2.1%, -1.5%, -0.8%
```

Required labels:

- start: -1.0%
- minimum: -8.2%
- end: -0.8%
- date anchors: 01-01, 02-15, 03-31

## Normalized Comparison

| Date | 005930 | AAPL | MSFT | SPY | BTC | GLD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 01-01 | 100 | 100 | 100 | 100 | 100 | 100 |
| 01-15 | 104 | 105 | 106 | 102 | 112 | 101 |
| 02-01 | 108 | 111 | 110 | 105 | 125 | 103 |
| 02-15 | 103 | 109 | 114 | 107 | 118 | 106 |
| 03-01 | 111 | 116 | 118 | 110 | 133 | 108 |
| 03-31 | 109.2 | 113.4 | 112.6 | 108.1 | 124.8 | 106.4 |

## Monthly Returns

| Month | Return |
| --- | ---: |
| 2025-01 | +3.2% |
| 2025-02 | +4.1% |
| 2025-03 | +3.9% |
| 2025-04 to 2025-12 | - |

## OHLCV Snapshot Counts

These counts are evidence and data availability metadata, not primary dashboard KPI cards.

| Ticker | Daily Candles |
| --- | ---: |
| 005930 | 244 |
| AAPL | 251 |
| MSFT | 251 |
| SPY | 251 |
| BTC | 365 |
| GLD | 251 |
