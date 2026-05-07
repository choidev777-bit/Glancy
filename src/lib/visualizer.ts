import type { ChartSpec, VisualizationBundle, VisualizationDataType } from './chart-spec';

const chart = (spec: ChartSpec): ChartSpec => spec;

export function createVisualizationBundle(dataType: VisualizationDataType): VisualizationBundle {
  switch (dataType) {
    case 'OHLCV':
      return {
        dataType,
        summary: 'OHLCV 데이터는 가격 움직임, 추세, 모멘텀, 거래 확신도를 함께 볼 수 있는 차트 묶음으로 구성됩니다.',
        charts: [
          chart({
            id: 'ohlcv-candle',
            type: 'candle',
            title: '캔들 + 이동평균',
            priority: 'primary',
            dataKey: 'market_data',
            encoding: { x: 'time', y: 'OHLC', color: 'direction' },
            reason: '시가, 고가, 저가, 종가가 모두 있으므로 캔들 차트가 기간 안의 가격 구조를 가장 잘 보존합니다.',
            skillsRule: 'charts.md: OHLCV -> 캔들 + 이동평균 오버레이',
          }),
          chart({
            id: 'ohlcv-rsi-macd',
            type: 'metrics',
            title: '모멘텀 요약 지표',
            priority: 'secondary',
            dataKey: 'analysis',
            encoding: { y: 'gauges' },
            reason: '심사위원이 상세 표를 보기 전에 기술적 신호의 방향을 빠르게 파악할 수 있습니다.',
            skillsRule: 'charts.md: OHLCV -> RSI, MACD, 게이지',
          }),
        ],
      };
    case 'price_series':
      return {
        dataType,
        summary: '가격 시계열 데이터는 캔들 구조보다 추세와 하락 위험을 중심으로 해석합니다.',
        charts: [
          chart({
            id: 'price-area',
            type: 'area',
            title: '가격 흐름',
            priority: 'primary',
            dataKey: 'analysis',
            encoding: { x: 'time', y: 'close' },
            reason: '단일 가격 시계열에는 고가/저가 범위가 없으므로 선형 흐름이 가장 명확합니다.',
            skillsRule: 'charts.md: price_series -> 영역/라인 차트',
          }),
          chart({
            id: 'price-drawdown',
            type: 'drawdown',
            title: '낙폭',
            priority: 'secondary',
            dataKey: 'analysis',
            encoding: { x: 'time', y: 'drawdown' },
            reason: '투자자는 가격 방향과 함께 하락 위험을 함께 확인해야 합니다.',
            skillsRule: 'charts.md: price_series -> 낙폭',
          }),
        ],
      };
    case 'portfolio':
      return {
        dataType,
        summary: '포트폴리오 데이터는 자산 배분과 보유 비중을 중심으로 시각화합니다.',
        charts: [
          chart({
            id: 'portfolio-donut',
            type: 'donut',
            title: '자산 배분 도넛',
            priority: 'primary',
            dataKey: 'analysis.holdings',
            encoding: { color: 'ticker', size: 'weight' },
            reason: '포트폴리오 비중은 전체 대비 구성 비율이므로 도넛 차트가 자산 배분을 직관적으로 보여줍니다.',
            skillsRule: 'charts.md: portfolio -> 도넛/트리맵',
          }),
        ],
      };
    case 'multi_asset':
      return {
        dataType,
        summary: '다중 자산 데이터는 상대 성과, 상관관계, 변동성을 함께 비교합니다.',
        charts: [
          chart({
            id: 'multi-normalized',
            type: 'normalized_comparison',
            title: '정규화 성과 비교',
            priority: 'primary',
            dataKey: 'analysis.normalized_series',
            encoding: { x: 'date', y: 'value', series: 'ticker' },
            reason: '각 자산을 100 기준으로 정규화하면 가격 단위가 달라도 성과를 공정하게 비교할 수 있습니다.',
            skillsRule: 'charts.md: multi_asset -> 정규화 비교',
          }),
          chart({
            id: 'multi-correlation',
            type: 'correlation',
            title: '상관관계 히트맵',
            priority: 'secondary',
            dataKey: 'analysis.correlation',
            encoding: { x: 'asset', y: 'asset', color: 'correlation' },
            reason: '상관관계는 수익률뿐 아니라 분산 효과의 질을 보여줍니다.',
            skillsRule: 'charts.md: multi_asset -> 상관관계 히트맵',
          }),
          chart({
            id: 'multi-volatility',
            type: 'bar',
            title: '연율화 변동성',
            priority: 'supporting',
            dataKey: 'analysis.annualized_volatility',
            encoding: { x: 'ticker', y: 'volatility' },
            reason: '변동성 막대는 어떤 자산이 전체 위험을 키우는지 보여줍니다.',
            skillsRule: 'charts.md: multi_asset -> 변동성 막대',
          }),
        ],
      };
    case 'returns':
      return {
        dataType,
        summary: '수익률 데이터는 성과, 위험, 월별 패턴을 중심으로 시각화합니다.',
        charts: [
          chart({
            id: 'returns-metrics',
            type: 'metrics',
            title: '수익률 핵심 지표',
            priority: 'primary',
            dataKey: 'analysis',
            encoding: { y: 'metrics' },
            reason: '수익률 데이터는 Sharpe, 연율 수익률, 변동성, 최대 낙폭을 먼저 보여주는 것이 적합합니다.',
            skillsRule: 'charts.md: returns -> 지표 카드',
          }),
          chart({
            id: 'returns-drawdown',
            type: 'drawdown',
            title: '최대 낙폭 맥락',
            priority: 'secondary',
            dataKey: 'analysis',
            encoding: { y: 'max_drawdown' },
            reason: '낙폭은 수익률 뒤에 숨어 있는 투자자의 체감 손실 구간을 보여줍니다.',
            skillsRule: 'charts.md: returns -> 낙폭',
          }),
          chart({
            id: 'returns-monthly',
            type: 'monthly_returns',
            title: '월간 수익률 히트맵',
            priority: 'secondary',
            dataKey: 'analysis.monthly_returns',
            encoding: { x: 'month', y: 'year', color: 'return' },
            reason: '월간 히트맵은 계절성과 손익이 몰리는 구간을 드러냅니다.',
            skillsRule: 'charts.md: returns -> 월간 수익률 히트맵',
          }),
        ],
      };
    case 'composite_portfolio':
      return {
        dataType,
        summary: '종합 포트폴리오 데이터는 성과, 위험, 자산 배분, 개별 자산 분석을 하나의 대시보드 셸로 보여줍니다.',
        charts: [
          chart({
            id: 'composite-metrics',
            type: 'metrics',
            title: '종합 포트폴리오 핵심 지표',
            priority: 'primary',
            dataKey: 'performance',
            encoding: { y: 'value' },
            reason: '성과와 위험을 먼저 요약해 포트폴리오의 전체 상태를 빠르게 판단합니다.',
            skillsRule: 'charts.md: composite_portfolio -> performance, risk, allocation',
          }),
        ],
      };
  }
}

export function isVisualizationDataType(value: unknown): value is VisualizationDataType {
  return value === 'OHLCV' || value === 'price_series' || value === 'portfolio' || value === 'multi_asset' || value === 'returns' || value === 'composite_portfolio';
}
