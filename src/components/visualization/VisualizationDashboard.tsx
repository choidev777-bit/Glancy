import type { UploadAnalysisResult } from '../../lib/chart-spec';
import { createVisualizationBundle, isVisualizationDataType } from '../../lib/visualizer';
import ChartRenderer from './ChartRenderer';

interface VisualizationDashboardProps {
  result: UploadAnalysisResult;
}

export default function VisualizationDashboard({ result }: VisualizationDashboardProps) {
  if (!isVisualizationDataType(result.type)) {
    return null;
  }

  const bundle = createVisualizationBundle(result.type);
  const summary = result.market_data_summary as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4">
      <div className="card border-brand-primary/20 bg-brand-primary/5 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="text-[11px] font-bold uppercase text-brand-primary">Visualization Intelligence</div>
            <h3 className="mt-1 text-lg font-bold">{bundle.dataType} auto-visualization bundle</h3>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">{bundle.summary}</p>
          </div>
          <div className="rounded-card bg-surface-2 px-3 py-2 text-xs text-text-secondary">
            {summary?.n_candles ? `${summary.n_candles} candles` : `${bundle.charts.length} chart specs`}
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
