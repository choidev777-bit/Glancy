interface VisualizationReasonProps {
  reason: string;
  rule: string;
}

export default function VisualizationReason({ reason, rule }: VisualizationReasonProps) {
  return (
    <div className="mt-3 rounded-card border border-border bg-surface-1 px-3 py-2 text-[11px] text-text-tertiary">
      <span className="font-bold text-brand-primary">charts.md driven</span>
      <span className="mx-2 text-border">|</span>
      <span>{reason}</span>
      <span className="mx-2 text-border">|</span>
      <code className="font-mono text-text-secondary">{rule}</code>
    </div>
  );
}

