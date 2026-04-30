import React, { useState } from 'react';
import EmptyState from '../common/EmptyState';
import { fundamentalDetails, fundamentalQuarterHistory, type FundamentalHistoryMetric } from '../../data/mockData';

interface FundamentalViewProps {
  market?: 'kr' | 'us';
}

const FundamentalView: React.FC<FundamentalViewProps> = ({ market = 'us' }) => {
  const [activeView, setActiveView] = useState<'summary' | 'trend'>('summary');
  const filteredCategories = fundamentalDetails.map((category) => ({
    ...category,
    items: category.items.filter((item) => market === 'us' || item.koreanAvailable),
  }));

  if (filteredCategories.every((category) => category.items.length === 0)) {
    return <EmptyState message="이 시장에서는 표시할 기본적 분석 데이터가 없습니다." />;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-6 pb-12 duration-500">
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-1 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-bold text-text-primary">기본적 분석</h3>
          <p className="text-xs text-text-tertiary">
            최신 지표 요약과 최근 4개 분기 추이를 함께 확인합니다. 분기 추이는 데모 안정성을 위한 샘플 히스토리입니다.
          </p>
        </div>
        <div className="flex w-fit gap-2 rounded-pill border border-border bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setActiveView('summary')}
            className={`rounded-pill px-4 py-1.5 text-xs font-bold transition-colors ${
              activeView === 'summary' ? 'bg-surface-4 text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            요약
          </button>
          <button
            type="button"
            onClick={() => setActiveView('trend')}
            className={`rounded-pill px-4 py-1.5 text-xs font-bold transition-colors ${
              activeView === 'trend' ? 'bg-surface-4 text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            분기 추이
          </button>
        </div>
      </div>

      {activeView === 'summary' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <div key={category.title} className="card flex flex-col">
              <div className="border-b border-border bg-surface-1/50 p-4">
                <h3 className="text-sm font-bold">{category.title}</h3>
              </div>
              <div className="flex-1 space-y-6 p-6">
                {category.items.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-text-secondary">{item.label}</span>
                      <span className="font-mono text-sm font-bold">{item.value}</span>
                    </div>
                    <div className="relative h-1 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-brand-primary transition-[width] duration-1000"
                        style={{ width: `${item.position * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-text-tertiary">
                      <span>낮음</span>
                      <span>평균</span>
                      <span>높음</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {fundamentalQuarterHistory.map((metric) => (
            <FundamentalTrendCard key={metric.label} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
};

function FundamentalTrendCard({ metric }: { metric: FundamentalHistoryMetric }) {
  const values = metric.history.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = metric.history
    .map((point, index) => {
      const x = 16 + index * (268 / Math.max(metric.history.length - 1, 1));
      const y = 92 - ((point.value - min) / range) * 64;
      return `${x},${y}`;
    })
    .join(' ');
  const first = metric.history[0].value;
  const last = metric.history[metric.history.length - 1].value;
  const change = last - first;
  const isImproving = metric.direction === 'higher-better' ? change >= 0 : change <= 0;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-text-primary">{metric.label}</h4>
          <p className="text-[11px] text-text-tertiary">최근 4개 분기 비교</p>
        </div>
        <div className={`rounded-pill px-3 py-1 text-xs font-bold ${isImproving ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'}`}>
          {isImproving ? '개선' : '주의'}
        </div>
      </div>
      <svg viewBox="0 0 300 120" className="h-32 w-full overflow-visible">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" className="text-brand-primary" />
        {metric.history.map((point, index) => {
          const x = 16 + index * (268 / Math.max(metric.history.length - 1, 1));
          const y = 92 - ((point.value - min) / range) * 64;
          return (
            <g key={point.quarter}>
              <circle cx={x} cy={y} r="4" className="fill-brand-primary" />
              <text x={x} y="114" textAnchor="middle" className="fill-text-tertiary text-[10px]">
                {point.quarter}
              </text>
              <text x={x} y={Math.max(12, y - 8)} textAnchor="middle" className="fill-text-secondary text-[10px]">
                {point.value}
                {metric.unit}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {metric.history.map((point) => (
          <div key={point.quarter} className="rounded-card bg-surface-1 p-2 text-center">
            <div className="text-[10px] text-text-tertiary">{point.quarter}</div>
            <div className="font-mono text-xs font-bold">
              {point.value}
              {metric.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FundamentalView;
