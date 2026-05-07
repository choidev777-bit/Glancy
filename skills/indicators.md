# indicators.md - Computation Layer

## 목적

표준화된 가격, 포트폴리오, 재무 데이터에서 지표와 점수를 계산한다. 모든 점수는 값과 근거 신호를 함께 제공해야 하며, 화면에 보이는 숫자는 하드코딩하지 않는다.

## 기술 지표 표준 세트

자산검색과 종합 포트폴리오의 개별 자산 분석은 같은 기술 지표 세트를 사용한다.

표준 노출 순서는 RSI(14), STOCH(9,6), STOCHRSI(14), MACD(12,26), ADX(14), Williams %R, CCI(14), ATR(14), Highs/Lows(14), Ultimate Oscillator, ROC(12), Bull/Bear Power다.

| 그룹 | 지표 |
| --- | --- |
| 이동평균 | MA5, MA10, MA20, MA50, MA100, MA200의 SMA와 EMA |
| 모멘텀 | RSI(14), STOCH(9,6), STOCHRSI(14), MACD(12,26), ROC(12), Ultimate Oscillator |
| 추세 강도 | ADX(14), Williams %R, CCI(14), Highs/Lows(14), Bull/Bear Power |
| 변동성 | Bollinger Bands, ATR(14) |
| 거래량 | OBV, 거래 확산도 또는 Volume MA |

## 출력 구조

```typescript
interface Indicator {
  name: string
  value: number | string
  signal: '강한 매수' | '매수' | '중립' | '매도' | '강한 매도' | '과매수' | '과매도' | '변동성 보통'
  score?: number
}

interface IndicatorsResponse {
  indicators: Indicator[]
  moving_averages: Array<{ period: number; sma: number | null; ema: number | null; signal: string; score: number }>
  gauges: {
    moving_average: { percent: number; signal: string }
    technical: { percent: number; signal: string }
    overall: { percent: number; signal: string }
  }
  insights: { summary: string; details?: Array<{ category: string; text: string }> }
}
```

## 점수 규칙

| 신호 | 점수 |
| --- | --- |
| 강한 매수 | 100 |
| 매수 | 75 |
| 중립 | 50 |
| 매도 | 25 |
| 강한 매도 | 0 |

- `technical.percent`는 기술 지표 점수 평균이다.
- `moving_average.percent`는 MA5, MA10, MA20, MA50, MA100, MA200 신호 평균이다.
- `overall.percent`는 technical과 moving_average를 함께 반영한다.
- 지표가 없으면 점수는 0으로 두고 `지표 데이터 부족` 문구를 표시한다.
- API 실패 시 고정값 72, 85, 78 같은 fallback 숫자를 쓰지 않는다.

## 주요 신호 기준

| 지표 | 매수 또는 긍정 | 매도 또는 경고 |
| --- | --- | --- |
| RSI(14) | 30 미만은 과매도 반등 가능성 | 70 초과는 과매수 조정 가능성 |
| STOCH(9,6) | 20 미만 또는 상향 전환 | 80 초과 또는 하향 전환 |
| STOCHRSI(14) | 0.2 미만 | 0.8 초과 |
| MACD(12,26) | MACD가 signal 위 또는 상향 돌파 | MACD가 signal 아래 또는 하향 돌파 |
| ADX(14) | 25 이상이면 추세 강도 확인 | 20 미만이면 방향성 약함 |
| ROC(12) | 0 초과 | 0 미만 |
| CCI(14) | -100 미만은 과매도, 100 초과는 강한 모멘텀 | 200 초과는 과열 경고 |

## 포트폴리오 지표

`composite_portfolio`는 다음을 계산한다.

- 총 평가금액, 총 수익률, 변동성, 최대 낙폭, Sharpe 비율
- 자산별 비중, 수익률, 기여도, 변동성
- 포트폴리오 누적 성과
- 최대 낙폭 흐름
- 월별 수익률
- 보유 자산 요약

집중도 전용 카드나 상위 3개 비중 바는 현재 UI에서 삭제한다. 필요하면 인사이트 문장 안에서만 집중 위험을 언급한다.

## 기본적 분석 점수

기본적 분석은 PER, PBR, ROE, 배당수익률, 성장성, 재무건전성 데이터가 있을 때만 점수화한다. 데이터가 부족하면 임의 점수 대신 `기초 데이터 부족` 또는 `기본 분석 미지원`을 표시한다.
