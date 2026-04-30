# insights.md — Rule-Based Narrative Layer

## 1. Purpose

Generate Korean natural-language insights from indicator values without calling an external LLM API. The rules must be deterministic, fast, explainable, and safe.

## 2. Output Interface

```typescript
interface Insight {
  category: '추세' | '모멘텀' | '변동성' | '거래량' | '위험' | '종합'
  severity: 'info' | 'positive' | 'warning' | 'negative'
  title: string
  text: string
  evidence: string[]
}

interface InsightBundle {
  summary: string
  details: Insight[]
}
```

## 3. Tone Rules

- Do not guarantee future returns.
- Avoid direct investment commands such as "반드시 매수".
- Prefer probability/context language: "가능성이 있습니다", "유의가 필요합니다".
- Mention conflicting signals when indicators disagree.
- Keep summary short enough for a dashboard card.

## 4. Per-Indicator Templates

### RSI

| Condition | Text |
|-----------|------|
| RSI < 20 | `RSI {value}로 극단적 과매도 구간입니다. 단기 반등 가능성이 높아 보입니다.` |
| 20 <= RSI < 30 | `RSI {value}로 과매도 구간에 진입했습니다.` |
| 70 < RSI <= 80 | `RSI {value}로 과매수 구간입니다. 단기 조정 가능성에 유의하세요.` |
| RSI > 80 | `RSI {value}로 극단적 과매수 구간입니다. 변동성 확대에 유의하세요.` |

### MACD

| Condition | Text |
|-----------|------|
| MACD crosses above signal | `MACD가 신호선을 상향 돌파하며 모멘텀 개선이 관찰됩니다.` |
| MACD crosses below signal | `MACD가 신호선을 하향 돌파하며 단기 약세 신호가 나타났습니다.` |
| MACD > signal and histogram rising | `MACD 히스토그램이 확대되며 상승 모멘텀이 강화되고 있습니다.` |

### Moving Average

| Condition | Text |
|-----------|------|
| MA5 > MA20 > MA60 | `이동평균선이 정배열을 유지하며 상승 추세가 확인됩니다.` |
| MA5 < MA20 < MA60 | `이동평균선이 역배열로 하락 추세가 진행 중입니다.` |
| Golden cross | `최근 단기선이 장기선을 상향 돌파하며 골든크로스가 발생했습니다.` |
| Death cross | `최근 단기선이 장기선을 하향 돌파하며 데드크로스가 발생했습니다.` |

### Bollinger Bands

| Condition | Text |
|-----------|------|
| price > upper | `가격이 볼린저밴드 상단을 이탈했습니다. 과열 또는 강한 돌파 국면입니다.` |
| price < lower | `가격이 볼린저밴드 하단을 이탈했습니다. 과매도 또는 추가 하락 국면입니다.` |

### ADX

| Condition | Text |
|-----------|------|
| ADX < 20 | `ADX {value}로 추세 강도가 약합니다. 횡보 가능성이 있습니다.` |
| ADX >= 25 and +DI > -DI | `ADX {value}로 상승 추세 강도가 확인됩니다.` |
| ADX >= 25 and -DI > +DI | `ADX {value}로 하락 추세 강도가 확인됩니다.` |

## 5. Overall Insight Rules

```text
buy_total = strong_buy_count * 2 + buy_count
sell_total = strong_sell_count * 2 + sell_count
```

| Condition | Summary |
|-----------|---------|
| buy_total >= sell_total * 2 and buy_total >= 4 | `전반적으로 매수 신호가 우세합니다...` |
| sell_total >= buy_total * 2 and sell_total >= 4 | `전반적으로 매도 압력이 우세합니다...` |
| both buy and sell strong signals exist | `지표가 혼재되어 있어 추가 확인이 필요합니다...` |
| otherwise | `종합 시그널은 중립 영역입니다...` |

## 6. Upload Insight Rules

### Portfolio

| Condition | Text |
|-----------|------|
| top_1 > 0.5 | `상위 1개 종목 비중이 50%를 넘어 집중 위험이 큽니다.` |
| top_3 > 0.8 | `상위 3개 종목에 포트폴리오가 크게 집중되어 있습니다.` |
| n_holdings >= 10 and top_5 < 0.6 | `보유 종목이 분산되어 특정 종목 의존도가 낮습니다.` |

### Multi Asset

| Condition | Text |
|-----------|------|
| average correlation > 0.8 | `종목 간 상관관계가 높아 분산 효과가 제한적입니다.` |
| average correlation < 0.3 | `상관관계가 낮아 분산 효과가 기대됩니다.` |

### Returns

| Condition | Text |
|-----------|------|
| sharpe > 1 | `위험 대비 성과가 양호합니다.` |
| max_drawdown < -0.2 | `최대 낙폭이 커서 손실 구간 관리가 필요합니다.` |

## 7. Safety Footer

Dashboard insights may include:

`본 분석은 데이터 기반 참고 정보이며 투자 판단의 최종 책임은 사용자에게 있습니다.`
