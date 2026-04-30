import { percent } from '../../lib/visual-transforms';

interface MonthlyReturn {
  period: string;
  return: number;
}

interface MonthlyReturnsHeatmapProps {
  monthlyReturns?: MonthlyReturn[];
}

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

export default function MonthlyReturnsHeatmap({ monthlyReturns = [] }: MonthlyReturnsHeatmapProps) {
  const years = Array.from(new Set(monthlyReturns.map((item) => item.period.slice(0, 4))));
  const lookup = new Map(monthlyReturns.map((item) => [item.period, item.return]));

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] gap-1" style={{ gridTemplateColumns: '72px repeat(12, 1fr)' }}>
        <div />
        {MONTHS.map((month) => <div key={month} className="text-center text-[10px] font-bold text-text-tertiary">{month}</div>)}
        {years.map((year) => (
          <div key={year} className="contents">
            <div className="text-xs font-bold text-text-secondary">{year}</div>
            {MONTHS.map((month) => {
              const value = lookup.get(`${year}-${month}`);
              const bg = value === undefined ? 'var(--surface-3)' : value >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';
              return (
                <div key={`${year}-${month}`} className="rounded-card px-2 py-3 text-center font-mono text-[11px]" style={{ background: bg }}>
                  {value === undefined ? '-' : percent(value)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
