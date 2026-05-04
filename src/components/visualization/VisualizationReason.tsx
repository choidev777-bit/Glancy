import type { ChartSpec } from '../../lib/chart-spec';

interface VisualizationReasonProps {
  spec: ChartSpec;
}

export default function VisualizationReason({ spec }: VisualizationReasonProps) {
  return (
    <div className="mt-3 rounded-card border border-border bg-surface-1 px-3 py-2 text-[11px] text-text-tertiary">
      <span className="font-bold text-brand-primary">charts.md 규칙 기반</span>
      <span className="mx-2 text-border">|</span>
      <span>{spec.reason}</span>
      <span className="mx-2 text-border">|</span>
      <code className="font-mono text-text-secondary">{spec.skillsRule}</code>
    </div>
  );
}
