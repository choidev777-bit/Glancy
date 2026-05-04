import type { UploadAnalysisResult, VisualizationDataType } from '../../lib/chart-spec';
import { createVisualizationBundle, isVisualizationDataType } from '../../lib/visualizer';
import ChartRenderer from './ChartRenderer';

interface VisualizationDashboardProps {
  result: UploadAnalysisResult;
}

const DATA_TYPE_LABELS: Record<VisualizationDataType, string> = {
  OHLCV: 'OHLCV 캔들',
  price_series: '가격 시계열',
  portfolio: '포트폴리오',
  multi_asset: '다중 자산',
  returns: '수익률',
  composite_portfolio: '종합 포트폴리오',
};

export default function VisualizationDashboard({ result }: VisualizationDashboardProps) {
  if (!isVisualizationDataType(result.type)) {
    return null;
  }

  const bundle = createVisualizationBundle(result.type);
  const summary = result.market_data_summary as Record<string, unknown> | undefined;
  const countLabel = summary?.n_candles ? `${summary.n_candles}개 캔들` : `${bundle.charts.length}개 차트 규칙`;
  const dataTypeLabel = DATA_TYPE_LABELS[result.type];

  return (
    <div className="space-y-4">
      <div className="card border-brand-primary/20 bg-brand-primary/5 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="text-[11px] font-bold uppercase text-brand-primary">시각화 자동 구성</div>
            <h3 className="mt-1 text-lg font-bold">{dataTypeLabel} 자동 대시보드 묶음</h3>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">{bundle.summary}</p>
          </div>
          <div className="rounded-card bg-surface-2 px-3 py-2 text-xs text-text-secondary">
            {countLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bundle.charts.map((spec) => (
          <ChartRenderer key={spec.id} spec={spec} result={result} />
        ))}
      </div>
    </div>
  );
}
