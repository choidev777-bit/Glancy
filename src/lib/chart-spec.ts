export type ChartType =
  | 'candle'
  | 'line'
  | 'area'
  | 'bar'
  | 'donut'
  | 'heatmap'
  | 'correlation'
  | 'drawdown'
  | 'monthly_returns'
  | 'normalized_comparison'
  | 'metrics'
  | 'table';

export type VisualizationDataType = 'OHLCV' | 'price_series' | 'portfolio' | 'multi_asset' | 'returns';

export interface ChartSpec {
  id: string;
  type: ChartType;
  title: string;
  priority: 'primary' | 'secondary' | 'supporting';
  dataKey: string;
  encoding: {
    x?: string;
    y?: string;
    color?: string;
    size?: string;
    series?: string;
  };
  reason: string;
  skillsRule: string;
}

export interface VisualizationBundle {
  dataType: VisualizationDataType;
  summary: string;
  charts: ChartSpec[];
}

export interface UploadAnalysisResult {
  type?: VisualizationDataType | 'unknown';
  analysis?: Record<string, unknown>;
  market_data_summary?: Record<string, unknown>;
  [key: string]: unknown;
}
