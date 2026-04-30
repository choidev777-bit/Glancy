import type { ChartSpec, VisualizationBundle, VisualizationDataType } from './chart-spec';

const chart = (spec: ChartSpec): ChartSpec => spec;

export function createVisualizationBundle(dataType: VisualizationDataType): VisualizationBundle {
  switch (dataType) {
    case 'OHLCV':
      return {
        dataType,
        summary: 'OHLCV data is visualized as price action plus trend, momentum, and conviction panels.',
        charts: [
          chart({
            id: 'ohlcv-candle',
            type: 'candle',
            title: 'Candle + Moving Averages',
            priority: 'primary',
            dataKey: 'market_data',
            encoding: { x: 'time', y: 'OHLC', color: 'direction' },
            reason: 'OHLCV contains open, high, low, and close, so candle charts preserve intraperiod price structure.',
            skillsRule: 'charts.md: OHLCV -> candle + MA overlay',
          }),
          chart({
            id: 'ohlcv-rsi-macd',
            type: 'metrics',
            title: 'Momentum Gauges',
            priority: 'secondary',
            dataKey: 'analysis',
            encoding: { y: 'gauges' },
            reason: 'Technical signals need a fast summary for judges before they inspect the full table.',
            skillsRule: 'charts.md: OHLCV -> RSI, MACD, gauge',
          }),
        ],
      };
    case 'price_series':
      return {
        dataType,
        summary: 'Price series data emphasizes trend and downside risk rather than candle microstructure.',
        charts: [
          chart({
            id: 'price-area',
            type: 'area',
            title: 'Price Path',
            priority: 'primary',
            dataKey: 'analysis',
            encoding: { x: 'time', y: 'close' },
            reason: 'A simple price series lacks OHLC ranges, so a line/area chart is the clearest encoding.',
            skillsRule: 'charts.md: price_series -> area/line',
          }),
          chart({
            id: 'price-drawdown',
            type: 'drawdown',
            title: 'Drawdown',
            priority: 'secondary',
            dataKey: 'analysis',
            encoding: { x: 'time', y: 'drawdown' },
            reason: 'Investors need downside risk beside price direction.',
            skillsRule: 'charts.md: price_series -> drawdown',
          }),
        ],
      };
    case 'portfolio':
      return {
        dataType,
        summary: 'Portfolio data is visualized around allocation and concentration risk.',
        charts: [
          chart({
            id: 'portfolio-donut',
            type: 'donut',
            title: 'Allocation Donut',
            priority: 'primary',
            dataKey: 'analysis.holdings',
            encoding: { color: 'ticker', size: 'weight' },
            reason: 'Portfolio weights are parts of a whole, so a donut makes allocation concentration obvious.',
            skillsRule: 'charts.md: portfolio -> donut/treemap',
          }),
          chart({
            id: 'portfolio-concentration',
            type: 'bar',
            title: 'Concentration Risk',
            priority: 'secondary',
            dataKey: 'analysis.concentration',
            encoding: { x: 'bucket', y: 'weight' },
            reason: 'Top 1/3/5 concentration quickly reveals whether risk is diversified or crowded.',
            skillsRule: 'charts.md: portfolio -> concentration bar',
          }),
        ],
      };
    case 'multi_asset':
      return {
        dataType,
        summary: 'Multi-asset data compares relative performance, correlation, and volatility.',
        charts: [
          chart({
            id: 'multi-normalized',
            type: 'normalized_comparison',
            title: 'Normalized Performance',
            priority: 'primary',
            dataKey: 'analysis.normalized_series',
            encoding: { x: 'date', y: 'value', series: 'ticker' },
            reason: 'Normalizing every asset to 100 makes relative performance comparable across price scales.',
            skillsRule: 'charts.md: multi_asset -> normalized comparison',
          }),
          chart({
            id: 'multi-correlation',
            type: 'correlation',
            title: 'Correlation Heatmap',
            priority: 'secondary',
            dataKey: 'analysis.correlation',
            encoding: { x: 'asset', y: 'asset', color: 'correlation' },
            reason: 'Correlation shows diversification quality, not just return.',
            skillsRule: 'charts.md: multi_asset -> correlation heatmap',
          }),
          chart({
            id: 'multi-volatility',
            type: 'bar',
            title: 'Annualized Volatility',
            priority: 'supporting',
            dataKey: 'analysis.annualized_volatility',
            encoding: { x: 'ticker', y: 'volatility' },
            reason: 'Volatility bars reveal which asset drives portfolio risk.',
            skillsRule: 'charts.md: multi_asset -> volatility bar',
          }),
        ],
      };
    case 'returns':
      return {
        dataType,
        summary: 'Returns data is visualized as performance, risk, and seasonality.',
        charts: [
          chart({
            id: 'returns-metrics',
            type: 'metrics',
            title: 'Return Metrics',
            priority: 'primary',
            dataKey: 'analysis',
            encoding: { y: 'metrics' },
            reason: 'Return series should first show Sharpe, annualized return, volatility, and max drawdown.',
            skillsRule: 'charts.md: returns -> metric cards',
          }),
          chart({
            id: 'returns-drawdown',
            type: 'drawdown',
            title: 'Max Drawdown Context',
            priority: 'secondary',
            dataKey: 'analysis',
            encoding: { y: 'max_drawdown' },
            reason: 'Drawdown is the investor-facing pain curve behind return.',
            skillsRule: 'charts.md: returns -> drawdown',
          }),
          chart({
            id: 'returns-monthly',
            type: 'monthly_returns',
            title: 'Monthly Returns Heatmap',
            priority: 'secondary',
            dataKey: 'analysis.monthly_returns',
            encoding: { x: 'month', y: 'year', color: 'return' },
            reason: 'Monthly heatmaps expose seasonality and clusters of gains/losses.',
            skillsRule: 'charts.md: returns -> monthly returns heatmap',
          }),
        ],
      };
  }
}

export function isVisualizationDataType(value: unknown): value is VisualizationDataType {
  return value === 'OHLCV' || value === 'price_series' || value === 'portfolio' || value === 'multi_asset' || value === 'returns';
}
