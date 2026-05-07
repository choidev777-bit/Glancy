# data.md - Data Source and Upload Detection

## 목적

모든 투자 입력을 대시보드가 이해할 수 있는 표준 구조로 바꾼다. 시장 API, 샘플 데이터, CSV, JSON 모두 같은 분석 파이프라인에 들어가야 한다.

## 지원 데이터 유형

| 유형 | 감지 조건 | 대시보드 |
| --- | --- | --- |
| `composite_portfolio` | 여러 ticker의 weight 또는 quantity와 수익률, 가격, 지표 데이터가 함께 있음 | 종합 포트폴리오 |
| `OHLCV` | Date, Open, High, Low, Close 컬럼 | 캔들 차트 기반 기술 분석 |
| `portfolio` | Ticker와 Weight 또는 Quantity 컬럼 | 비중, 보유 자산, 집중 위험 |
| `multi_asset` | Date와 여러 자산 가격 컬럼 | 정규화 가격 비교, 상관관계 |
| `returns` | Date와 Return 컬럼 | 누적 성과, 낙폭, 월별 수익률 |
| `price_series` | Date와 Close 또는 Price 컬럼 | 가격 흐름, 수익률, 낙폭 |

## 표준 출력

```typescript
interface MarketData {
  source: 'kr_stocks' | 'us_stocks' | 'etfs' | 'crypto' | 'indices' | 'user_upload'
  symbol: string
  name: string
  type: 'OHLCV' | 'price_series' | 'portfolio' | 'multi_asset' | 'returns' | 'composite_portfolio'
  currency: 'KRW' | 'USD' | 'USDT' | 'UNKNOWN'
  candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>
  meta: { data_status: 'live' | 'cached' | 'sample' | 'unavailable'; source_name?: string; fallback_reason?: string | null }
}
```

`composite_portfolio`는 추가로 `summary`, `holdings`, `monthlyReturns`, 자산별 `technical`, `fundamental`, `summary` 블록을 포함한다.

## 업로드 감지 순서

1. `composite_portfolio`: ticker와 weight 또는 quantity가 있고, 다중 자산 성과를 만들 수 있음
2. `OHLCV`: open, high, low, close가 모두 있음
3. `portfolio`: ticker와 weight 또는 quantity가 있음
4. `returns`: date와 return이 있음
5. `multi_asset`: date와 세 개 이상의 숫자형 자산 컬럼이 있음
6. `price_series`: date와 close 또는 price가 있음
7. `unknown`: 감지 실패 안내 표시

## 컬럼 별칭

| 표준 컬럼 | 허용 별칭 |
| --- | --- |
| `date` | date, time, datetime, 날짜, 일자 |
| `open` | open, o, 시가 |
| `high` | high, h, 고가 |
| `low` | low, l, 저가 |
| `close` | close, price, c, 종가, 현재가 |
| `volume` | volume, vol, 거래량 |
| `ticker` | ticker, symbol, 종목, 종목코드 |
| `weight` | weight, allocation, 비중 |
| `quantity` | quantity, shares, 수량, 보유수량 |
| `return` | return, returns, 수익률 |

## 데이터 보강과 fallback

- 외부 API 실패 시 캐시를 먼저 쓰고, 없으면 샘플 기준 데이터를 사용한다.
- 샘플 기준 데이터는 UI와 인사이트에서 명시한다.
- Volume이 없으면 0으로 채우되 거래량 분석은 제한한다.
- Price series는 close를 open, high, low, close에 복제하여 간이 OHLC로 변환할 수 있다.
- 한국 주식 이름은 ticker보다 종목명을 우선한다. quote 응답의 name이 ticker와 같으면 기존 이름을 유지한다.
