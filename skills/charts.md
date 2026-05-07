# charts.md - Visualization Intelligence Layer

## 목적

감지된 데이터 유형과 계산된 지표에 맞는 차트 묶음을 선택한다. 사용자가 보는 화면에는 developer-facing 내부 설명을 렌더링하지 않는다. 규칙 출처나 `charts.md driven` 같은 문구는 코드 검증과 문서 추적용이지 최종 대시보드 UI가 아니다.

## ChartSpec

```typescript
type ChartType =
  | 'candle'
  | 'line'
  | 'area'
  | 'bar'
  | 'heatmap'
  | 'correlation'
  | 'donut'
  | 'normalized_comparison'
  | 'drawdown'
  | 'monthly_returns'
  | 'metrics'
  | 'table'

interface ChartSpec {
  id: string
  type: ChartType
  title: string
  priority: 'primary' | 'secondary' | 'supporting'
  dataKey: string
  encoding?: Record<string, string>
  reason?: string
  skillsRule?: string
}
```

## 데이터 유형별 차트

| 유형 | 필수 차트 |
| --- | --- |
| `composite_portfolio` | 포트폴리오 비중 donut, 포트폴리오 누적 성과, 자산별 정규화 가격 비교, 최대 낙폭 흐름, 월별 수익률, 보유 자산 요약 |
| `OHLCV` | 캔들 차트, MA overlay, 거래량, RSI, MACD, 기술 지표 표 |
| `portfolio` | 비중 donut 또는 treemap, 보유 자산 table |
| `multi_asset` | 100 기준 정규화 가격 비교, 상관관계 heatmap, 변동성 bar |
| `returns` | 누적 수익률, drawdown, 월별 수익률 heatmap, 핵심 지표 카드 |
| `price_series` | 가격 line 또는 area, 수익률, drawdown |

## 종합 포트폴리오 화면 규칙

- `요약` 탭은 종합 시그널, 포트폴리오 비중, 핵심 지표 카드, 누적 성과, 보유 자산 요약을 보여준다.
- `성과/리스크` 탭은 `포트폴리오 누적 성과`, `자산별 정규화 가격 비교`, `최대 낙폭 흐름`, `월별 수익률`을 보여준다.
- `자산 배분` 탭은 포트폴리오 비중 donut과 보유 자산 요약을 보여준다.
- `개별 자산 분석` 탭은 선택 자산의 요약, 기술적 분석, 기본적 분석을 보여준다.
- `composite_portfolio`와 단순 `portfolio` 업로드 모두 집중도 카드와 단색 상위 3개 비중 bar를 렌더링하지 않는다.
- 집중 위험은 필요할 때 인사이트 문장으로만 설명하고 별도 chart card로 만들지 않는다.

## 시간축과 숫자 표시

- 성과/리스크의 선형 그래프에는 시작, 중간, 종료 날짜 앵커를 표시한다.
- 포트폴리오 누적 성과에는 시작값과 현재값을 표시한다.
- 최대 낙폭 흐름에는 시작, 종료, 최저 낙폭 값을 퍼센트로 표시한다.
- 월별 수익률은 월 레이블과 값이 함께 보이게 한다.

## 색상

- 상승, 수익, 매수는 positive 색상이다.
- 하락, 손실, 매도는 negative 색상이다.
- 자산 식별 색상은 chart series 색상을 사용한다.
- 포트폴리오 비중 donut과 관련 legend의 색상은 항상 일치해야 한다.
