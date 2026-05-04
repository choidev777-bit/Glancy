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

interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

function analysisOf(result: UploadAnalysisResult): Record<string, unknown> {
  return (result.analysis ?? {}) as Record<string, unknown>;
}

function pricePointsOf(analysis: Record<string, unknown>): PricePoint[] {
  return ((analysis.price_points as PricePoint[] | undefined) ?? []).filter((point) => Number.isFinite(point.close));
}

const PRIORITY_LABELS: Record<ChartSpec['priority'], string> = {
  primary: '핵심',
  secondary: '보조',
  supporting: '참고',
};

const METRIC_LABELS: Record<string, string> = {
  cumulative_return: '누적 수익률',
  annualized_return: '연율 수익률',
  annualized_volatility: '연율 변동성',
  sharpe_ratio: 'Sharpe 비율',
  max_drawdown: '최대 낙폭',
};

function PricePathPreview({ points }: { points: PricePoint[] }) {
  if (points.length === 0) {
    return <div className="rounded-card bg-surface-1 p-6 text-sm text-text-secondary">표시할 가격 데이터가 없습니다.</div>;
  }

  const values = points.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * 100;
      const y = 90 - ((point.close - min) / range) * 80;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <div className="rounded-card bg-surface-1 p-4">
      <svg viewBox="0 0 100 100" className="h-48 w-full" preserveAspectRatio="none" role="img" aria-label="가격 흐름 미리보기">
        <polyline points={path} fill="none" stroke="#06b6d4" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function CandlePreview({ points }: { points: PricePoint[] }) {
  const visible = points.slice(-32);
  if (visible.length === 0) {
    return <div className="rounded-card bg-surface-1 p-6 text-sm text-text-secondary">표시할 캔들 데이터가 없습니다.</div>;
  }

  const values = visible.flatMap((point) => [point.high, point.low]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = 100 / visible.length;

  return (
    <div className="rounded-card bg-surface-1 p-4">
      <svg viewBox="0 0 100 100" className="h-48 w-full" preserveAspectRatio="none" role="img" aria-label="캔들 미리보기">
        {visible.map((point, index) => {
          const x = index * xStep + xStep / 2;
          const high = 90 - ((point.high - min) / range) * 80;
          const low = 90 - ((point.low - min) / range) * 80;
          const open = 90 - ((point.open - min) / range) * 80;
          const close = 90 - ((point.close - min) / range) * 80;
          const top = Math.min(open, close);
          const height = Math.max(1, Math.abs(close - open));
          const color = point.close >= point.open ? '#22c55e' : '#ef4444';
          return (
            <g key={`${point.time}-${index}`}>
              <line x1={x} x2={x} y1={high} y2={low} stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              <rect x={x - xStep * 0.28} y={top} width={xStep * 0.56} height={height} fill={color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ChartRenderer({ spec, result }: ChartRendererProps) {
  const analysis = analysisOf(result);
  let body: JSX.Element;

  if (spec.type === 'candle') {
    body = <CandlePreview points={pricePointsOf(analysis)} />;
  } else if (spec.type === 'area') {
    body = <PricePathPreview points={pricePointsOf(analysis)} />;
  } else if (spec.type === 'donut') {
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
            <div className="text-[11px] uppercase text-text-tertiary">{METRIC_LABELS[key] ?? key.replace(/_/g, ' ')}</div>
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
        이 시각화 유형은 기존 기술 차트 또는 원본 분석 표로 표시됩니다.
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="font-bold">{spec.title}</h3>
        <span className="rounded-pill bg-surface-3 px-2 py-1 text-[10px] font-bold uppercase text-text-tertiary">
          {PRIORITY_LABELS[spec.priority]}
        </span>
      </div>
      {body}
      <VisualizationReason spec={spec} />
    </div>
  );
}
