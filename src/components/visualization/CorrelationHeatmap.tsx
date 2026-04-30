import { clamp } from '../../lib/visual-transforms';

interface CorrelationHeatmapProps {
  correlation?: Record<string, Record<string, number>>;
}

function color(value: number) {
  const normalized = (clamp(value, -1, 1) + 1) / 2;
  const red = Math.round(239 * (1 - normalized) + 34 * normalized);
  const green = Math.round(68 * (1 - normalized) + 197 * normalized);
  const blue = Math.round(68 * (1 - normalized) + 94 * normalized);
  return `rgb(${red}, ${green}, ${blue})`;
}

export default function CorrelationHeatmap({ correlation = {} }: CorrelationHeatmapProps) {
  const labels = Object.keys(correlation);
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[420px] gap-1" style={{ gridTemplateColumns: `100px repeat(${labels.length}, minmax(64px, 1fr))` }}>
        <div />
        {labels.map((label) => (
          <div key={label} className="text-center text-[10px] font-bold text-text-tertiary">{label}</div>
        ))}
        {labels.map((row) => (
          <div key={row} className="contents">
            <div className="text-xs font-bold text-text-secondary">{row}</div>
            {labels.map((col) => {
              const value = Number(correlation[row]?.[col] ?? 0);
              return (
                <div key={`${row}-${col}`} className="rounded-card px-2 py-3 text-center font-mono text-xs text-[#0a0a0a]" style={{ backgroundColor: color(value) }}>
                  {value.toFixed(2)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
