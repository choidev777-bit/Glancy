import React from 'react';
import { ChevronRight } from 'lucide-react';
import Gauge from '../common/Gauge';
import type { AssetSummaryViewData } from '../../lib/asset-analysis';
import InsightProfilePanel from './InsightProfilePanel';

export type SummaryViewData = AssetSummaryViewData;

interface SummaryViewProps {
  onNavigate: (tab: 'summary' | 'technical' | 'fundamental') => void;
  fundamentalDisabled?: boolean;
  summary: SummaryViewData;
}

function signalTone(signal: string) {
  if (signal.includes('매수') || signal.includes('상승') || signal.includes('긍정')) return 'text-positive';
  if (signal.includes('매도') || signal.includes('하락') || signal.includes('부정')) return 'text-negative';
  return 'text-neutral';
}

const SummaryView: React.FC<SummaryViewProps> = ({ onNavigate, fundamentalDisabled = false, summary }) => {
  const tags = summary.tags ?? [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-6 pb-12 duration-500">
      <InsightProfilePanel profile={summary.insightProfile} fallback={summary.insights} title="종합 인사이트" />

      <div className="card flex flex-col items-center gap-10 p-8 lg:flex-row">
        <div className="flex-shrink-0">
          <Gauge score={summary.score} label={summary.overall} title="종합 시그널" size={280} />
        </div>
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <h3 className="text-xl font-bold text-text-primary">종합 시그널</h3>
          <p className="max-w-2xl leading-relaxed text-text-secondary">{summary.insights}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 pt-2 lg:justify-start">
              {tags.map((tag, index) => (
                <div
                  key={tag}
                  className={`rounded-card px-4 py-2 text-sm font-semibold ${
                    index === 0 ? 'bg-positive/10 text-positive' : 'bg-info/10 text-info'
                  }`}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card flex h-full flex-col p-6">
          <div className="mb-6 flex items-start justify-between">
            <h3 className="text-lg font-bold">기술적 분석 요약</h3>
            <div className="font-mono text-2xl font-bold text-brand-primary">{summary.technical.score}%</div>
          </div>

          <div className="mb-6 flex flex-col gap-8 sm:flex-row sm:items-center">
            <Gauge score={summary.technical.score} size={140} />
            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
              {summary.technical.indicators.length > 0 ? (
                summary.technical.indicators.map((item) => (
                  <div key={item.name} className="flex flex-col">
                    <span className="mb-0.5 text-xs text-text-tertiary">{item.name}</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold">{item.value}</span>
                      <span className={`text-[10px] font-bold ${signalTone(item.signal)}`}>{item.signal}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 rounded-card bg-surface-1 p-4 text-sm text-text-secondary">
                  지표 데이터 부족으로 요약 지표를 표시할 수 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate('technical')}
              className="flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-brand-primary"
            >
              자세히 보기 <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="card flex h-full flex-col p-6">
          <div className="mb-6 flex items-start justify-between">
            <h3 className="text-lg font-bold">기본적 분석 요약</h3>
            <div className="font-mono text-2xl font-bold text-warning">{summary.fundamental.score}%</div>
          </div>

          <div className="mb-8 mt-4 grid grid-cols-2 gap-6">
            {summary.fundamental.values.map((item) => (
              <div key={item.name} className="flex flex-col rounded-card border border-border/50 bg-surface-1 p-4">
                <span className="mb-1 text-xs text-text-tertiary">{item.name}</span>
                <span className="font-mono text-xl font-bold">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!fundamentalDisabled) onNavigate('fundamental');
              }}
              disabled={fundamentalDisabled}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                fundamentalDisabled
                  ? 'cursor-not-allowed text-text-tertiary opacity-50'
                  : 'text-text-secondary hover:text-brand-primary'
              }`}
            >
              {fundamentalDisabled ? '지원하지 않음' : '자세히 보기'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
