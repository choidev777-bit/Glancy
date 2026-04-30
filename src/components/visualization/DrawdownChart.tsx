import { percent } from '../../lib/visual-transforms';

interface DrawdownChartProps {
  maxDrawdown?: number;
}

export default function DrawdownChart({ maxDrawdown = 0 }: DrawdownChartProps) {
  const width = Math.min(100, Math.abs(maxDrawdown) * 100);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">Maximum drawdown</span>
        <span className="font-mono font-bold text-negative">{percent(maxDrawdown)}</span>
      </div>
      <div className="h-16 rounded-card bg-surface-1 p-3">
        <div className="relative h-full border-t border-border">
          <div className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-card bg-negative/40" style={{ width: `${width}%` }} />
        </div>
      </div>
    </div>
  );
}
