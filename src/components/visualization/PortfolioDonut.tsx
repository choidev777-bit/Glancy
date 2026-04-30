import { percent } from '../../lib/visual-transforms';

interface Holding {
  ticker: string;
  weight: number;
}

interface PortfolioDonutProps {
  holdings?: Holding[];
}

const COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#f97316'];

export default function PortfolioDonut({ holdings = [] }: PortfolioDonutProps) {
  const top = holdings.slice(0, 7);
  const gradient = top
    .reduce(
      (parts, holding, index) => {
        const start = parts.offset;
        const end = start + holding.weight * 100;
        parts.segments.push(`${COLORS[index % COLORS.length]} ${start}% ${end}%`);
        parts.offset = end;
        return parts;
      },
      { offset: 0, segments: [] as string[] },
    )
    .segments.join(', ');

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center">
      <div
        className="mx-auto h-44 w-44 rounded-full"
        style={{ background: `conic-gradient(${gradient || 'var(--surface-3) 0% 100%'})` }}
      >
        <div className="relative left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-2" />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        {top.map((holding, index) => (
          <div key={holding.ticker} className="flex items-center justify-between rounded-card bg-surface-1 px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {holding.ticker}
            </span>
            <span className="font-mono">{percent(holding.weight)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
