interface NormalizedComparisonChartProps {
  series?: Array<Record<string, number | string>>;
}

const COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'];

export default function NormalizedComparisonChart({ series = [] }: NormalizedComparisonChartProps) {
  const latest = series[series.length - 1] ?? {};
  const tickers = Object.keys(latest).filter((key) => key !== 'date');
  const max = Math.max(120, ...tickers.map((ticker) => Number(latest[ticker]) || 0));

  return (
    <div className="space-y-3">
      {tickers.map((ticker, index) => {
        const value = Number(latest[ticker]) || 0;
        return (
          <div key={ticker} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-bold">{ticker}</span>
              <span className="font-mono text-text-secondary">{value.toFixed(1)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-pill bg-surface-1">
              <div className="h-full rounded-pill" style={{ width: `${(value / max) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
