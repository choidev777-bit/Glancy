import type { ChartSpec, UploadAnalysisResult } from '../../lib/chart-spec';
import { numberEntries, percent } from '../../lib/visual-transforms';
import CorrelationHeatmap from './CorrelationHeatmap';
import DrawdownChart from './DrawdownChart';
import MonthlyReturnsHeatmap from './MonthlyReturnsHeatmap';
import NormalizedComparisonChart from './NormalizedComparisonChart';
import PortfolioDonut from './PortfolioDonut';
import VisualizationReason from './VisualizationReason';

interface ChartRendererProps {
  spec: ChartSpec;
  result: UploadAnalysisResult;
}

function analysisOf(result: UploadAnalysisResult): Record<string, unknown> {
  return (result.analysis ?? {}) as Record<string, unknown>;
}

export default function ChartRenderer({ spec, result }: ChartRendererProps) {
  const analysis = analysisOf(result);
  let body: JSX.Element;

  if (spec.type === 'donut') {
    body = <PortfolioDonut holdings={(analysis.holdings as Array<{ ticker: string; weight: number }>) ?? []} />;
  } else if (spec.type === 'correlation') {
    body = <CorrelationHeatmap correlation={analysis.correlation as Record<string, Record<string, number>>} />;
  } else if (spec.type === 'monthly_returns') {
    body = <MonthlyReturnsHeatmap monthlyReturns={analysis.monthly_returns as Array<{ period: string; return: number }>} />;
  } else if (spec.type === 'drawdown') {
    body = <DrawdownChart maxDrawdown={Number(analysis.max_drawdown ?? analysis.maxDrawdown ?? 0)} />;
  } else if (spec.type === 'normalized_comparison') {
    body = <NormalizedComparisonChart series={analysis.normalized_series as Array<Record<string, number | string>>} />;
  } else if (spec.type === 'bar') {
    const entries = numberEntries(spec.dataKey.includes('concentration') ? analysis.concentration : analysis.annualized_volatility);
    body = (
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-bold">{entry.key}</span>
              <span className="font-mono text-text-secondary">{percent(entry.value)}</span>
            </div>
            <div className="h-3 rounded-pill bg-surface-1">
              <div className="h-full rounded-pill bg-brand-primary" style={{ width: `${Math.min(100, Math.abs(entry.value) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (spec.type === 'metrics') {
    const metricKeys = ['cumulative_return', 'annualized_return', 'annualized_volatility', 'sharpe_ratio', 'max_drawdown'];
    body = (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metricKeys.filter((key) => key in analysis).map((key) => (
          <div key={key} className="rounded-card bg-surface-1 p-4">
            <div className="text-[11px] uppercase text-text-tertiary">{key.replace(/_/g, ' ')}</div>
            <div className="mt-1 font-mono text-xl font-bold">
              {key === 'sharpe_ratio' ? Number(analysis[key]).toFixed(2) : percent(analysis[key])}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="rounded-card bg-surface-1 p-6 text-sm text-text-secondary">
        {spec.type} visualization is represented by the existing technical chart system or source analysis table.
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="font-bold">{spec.title}</h3>
        <span className="rounded-pill bg-surface-3 px-2 py-1 text-[10px] font-bold uppercase text-text-tertiary">
          {spec.priority}
        </span>
      </div>
      {body}
      <VisualizationReason spec={spec} />
    </div>
  );
}
