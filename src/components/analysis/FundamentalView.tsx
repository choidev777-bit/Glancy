import React, { useState } from 'react';
import EmptyState from '../common/EmptyState';
import {
  fundamentalAnnualHistory,
  fundamentalDetails,
  fundamentalQuarterHistory,
  type FundamentalHistoryMetric,
} from '../../data/mockData';
import type { InsightProfile } from '../../lib/api';
import InsightProfilePanel from './InsightProfilePanel';

export interface FundamentalViewItem {
  label: string;
  value: string | number;
  position?: number;
}

export interface FundamentalViewCategory {
  title: string;
  items: FundamentalViewItem[];
}

export interface FundamentalViewData {
  title?: string;
  description?: string;
  supported?: boolean;
  emptyMessage?: string;
  categories: FundamentalViewCategory[];
  history?: FundamentalHistoryMetric[];
  insightProfile?: InsightProfile;
}

interface FundamentalViewProps {
  market?: 'kr' | 'us';
  data?: FundamentalViewData;
  loading?: boolean;
  error?: string | null;
}

type TrendRange = 'annual' | 'quarterly';

const DEFAULT_DESCRIPTION =
  '최신 지표 요약과 추이 데이터를 함께 확인합니다. 업로드/샘플 데이터가 있으면 해당 기간의 기초 지표 흐름을 표시합니다.';

const fundamentalDefaultHistory = [...fundamentalAnnualHistory, ...fundamentalQuarterHistory];

const isAnnualLabel = (label: string) => /^\d{4}$/.test(label);
const isQuarterLabel = (label: string) => /^\d{4}\sQ[1-4]$/.test(label) || /^\d{2}\sQ[1-4]$/.test(label);

function filterHistoryByRange(history: FundamentalHistoryMetric[], range: TrendRange) {
  const matchesRange = range === 'annual' ? isAnnualLabel : isQuarterLabel;
  return history
    .map((metric) => ({
      ...metric,
      history: metric.history.filter((point) => matchesRange(point.quarter)),
    }))
    .filter((metric) => metric.history.length > 0);
}

function historyCue(hasAnnual: boolean, hasQuarterly: boolean) {
  if (hasAnnual && hasQuarterly) return '연간/분기 데이터 있음';
  if (hasAnnual) return '연간 데이터 있음';
  if (hasQuarterly) return '분기 데이터 있음';
  return '';
}

const FundamentalView: React.FC<FundamentalViewProps> = ({ market = 'us', data, loading = false, error }) => {
  const [activeView, setActiveView] = useState<'summary' | 'trend'>('summary');
  const [trendRange, setTrendRange] = useState<TrendRange>('annual');
  const filteredCategories = data
    ? data.categories
    : fundamentalDetails.map((category) => ({
        ...category,
        items: category.items.filter((item) => market === 'us' || item.koreanAvailable),
      }));
  const history = data?.history ?? fundamentalDefaultHistory;
  const hasCategories = filteredCategories.some((category) => category.items.length > 0);
  const annualHistory = filterHistoryByRange(history, 'annual');
  const quarterlyHistory = filterHistoryByRange(history, 'quarterly');
  const hasAnnualHistory = annualHistory.length > 0;
  const hasQuarterlyHistory = quarterlyHistory.length > 0;
  const selectedRange: TrendRange = trendRange === 'annual' && !hasAnnualHistory && hasQuarterlyHistory ? 'quarterly' : trendRange;
  const selectedHistory = selectedRange === 'annual' ? annualHistory : quarterlyHistory;
  const trendCue = historyCue(hasAnnualHistory, hasQuarterlyHistory);

  if (data?.supported === false || !hasCategories) {
    return <EmptyState message={data?.emptyMessage ?? '이 자산은 표시할 기본적 분석 데이터가 없습니다.'} />;
  }

  if (loading) {
    return <div className="card mx-6 p-8 text-center text-sm text-text-secondary">기본적 분석 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-6 pb-12 duration-500">
      <InsightProfilePanel
        profile={data?.insightProfile ?? null}
        fallback={error ? `기본적 분석 데이터 수신이 불안정합니다: ${error}` : data?.description ?? DEFAULT_DESCRIPTION}
        title="기본적 분석 인사이트"
      />

      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-1 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-bold text-text-primary">{data?.title ?? '기본적 분석'}</h3>
          <p className="text-xs text-text-tertiary">{data?.description ?? DEFAULT_DESCRIPTION}</p>
          {trendCue && <p className="mt-1 text-[11px] font-bold text-brand-primary">{trendCue}</p>}
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
            추이
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
                {category.items.map((item) => {
                  const position = typeof item.position === 'number' ? item.position : 0.5;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-text-secondary">{item.label}</span>
                        <span className="font-mono text-sm font-bold">{item.value}</span>
                      </div>
                      <div className="relative h-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-brand-primary transition-[width] duration-1000"
                          style={{ width: `${Math.min(1, Math.max(0, position)) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-text-tertiary">
                        <span>낮음</span>
                        <span>평균</span>
                        <span>높음</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex w-fit gap-2 rounded-pill border border-border bg-surface-2 p-1">
            <button
              type="button"
              onClick={() => setTrendRange('annual')}
              disabled={!hasAnnualHistory}
              className={`rounded-pill px-4 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selectedRange === 'annual' ? 'bg-surface-4 text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              연간
            </button>
            <button
              type="button"
              onClick={() => setTrendRange('quarterly')}
              disabled={!hasQuarterlyHistory}
              className={`rounded-pill px-4 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selectedRange === 'quarterly' ? 'bg-surface-4 text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              분기
            </button>
          </div>
          {selectedHistory.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {selectedHistory.map((metric) => (
                <FundamentalTrendCard key={metric.label} metric={metric} range={selectedRange} />
              ))}
            </div>
          ) : (
            <EmptyState message="이 자산은 선택한 범위의 추이 데이터가 없습니다." />
          )}
        </div>
      )}
    </div>
  );
};

function FundamentalTrendCard({ metric, range }: { metric: FundamentalHistoryMetric; range: TrendRange }) {
  const visibleHistory = range === 'annual' ? metric.history.slice(-5) : metric.history.slice(-20);
  const values = visibleHistory.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rangeValue = max - min || 1;
  const points = visibleHistory
    .map((point, index) => {
      const x = 16 + index * (268 / Math.max(visibleHistory.length - 1, 1));
      const y = 92 - ((point.value - min) / rangeValue) * 64;
      return `${x},${y}`;
    })
    .join(' ');
  const first = visibleHistory[0].value;
  const last = visibleHistory[visibleHistory.length - 1].value;
  const change = last - first;
  const isImproving = metric.direction === 'higher-better' ? change >= 0 : change <= 0;
  const description = range === 'annual' ? `최근 ${visibleHistory.length}개 연도 비교` : `최근 ${visibleHistory.length}개 분기 비교`;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-text-primary">{metric.label}</h4>
          <p className="text-[11px] text-text-tertiary">{description}</p>
        </div>
        <div className={`rounded-pill px-3 py-1 text-xs font-bold ${isImproving ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'}`}>
          {isImproving ? '개선' : '주의'}
        </div>
      </div>
      <svg viewBox="0 0 300 120" className="h-32 w-full overflow-visible">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" className="text-brand-primary" />
        {visibleHistory.map((point, index) => {
          const x = 16 + index * (268 / Math.max(visibleHistory.length - 1, 1));
          const y = 92 - ((point.value - min) / rangeValue) * 64;
          const isFirst = index === 0;
          const isLast = index === visibleHistory.length - 1;
          const isYearStart = /Q1$/.test(point.quarter);
          const showLabel = range === 'annual' || isFirst || isYearStart || isLast;
          const showValueLabel = range === 'annual' || isFirst || isLast;
          const tooltipLabel = `${metric.label} ${point.quarter}: ${point.value}${metric.unit}`;
          return (
            <g key={point.quarter} aria-label={tooltipLabel} role="img" tabIndex={0}>
              <title>{tooltipLabel}</title>
              <circle cx={x} cy={y} r={8} className="fill-transparent" />
              <circle cx={x} cy={y} r={range === 'annual' ? 4 : 3} className="fill-brand-primary" />
              {showLabel && (
                <text x={x} y="114" textAnchor="middle" className="fill-text-tertiary text-[9px]">
                  {point.quarter}
                </text>
              )}
              {showValueLabel && (
                <text x={x} y={Math.max(12, y - 8)} textAnchor="middle" className="fill-text-secondary text-[9px]">
                  {point.value}
                  {metric.unit}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(visibleHistory.length, 5)}, minmax(0, 1fr))` }}>
        {visibleHistory.slice(-5).map((point) => (
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
