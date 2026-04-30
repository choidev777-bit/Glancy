import React from 'react';
import { ChevronRight } from 'lucide-react';
import Gauge from '../common/Gauge';
import { technicalSummary } from '../../data/mockData';

interface SummaryViewProps {
  onNavigate: (tab: 'summary' | 'technical' | 'fundamental') => void;
  fundamentalDisabled?: boolean;
}

const SummaryView: React.FC<SummaryViewProps> = ({ onNavigate, fundamentalDisabled = false }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-6 pb-12 duration-500">
      <div className="card flex flex-col items-center gap-10 p-8 lg:flex-row">
        <div className="flex-shrink-0">
          <Gauge score={technicalSummary.score} label={technicalSummary.overall} title="종합 시그널" size={280} />
        </div>
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <h3 className="text-xl font-bold text-text-primary">종합 인사이트</h3>
          <p className="max-w-2xl leading-relaxed text-text-secondary">{technicalSummary.insights}</p>
          <div className="flex flex-wrap justify-center gap-4 pt-2 lg:justify-start">
            <div className="rounded-card bg-positive/10 px-4 py-2 text-sm font-semibold text-positive">
              골든크로스 감지
            </div>
            <div className="rounded-card bg-info/10 px-4 py-2 text-sm font-semibold text-info">
              외국인 순매수 흐름
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card flex h-full flex-col p-6">
          <div className="mb-6 flex items-start justify-between">
            <h3 className="text-lg font-bold">기술적 분석 요약</h3>
            <div className="font-mono text-2xl font-bold text-brand-primary">{technicalSummary.technical.score}%</div>
          </div>

          <div className="mb-6 flex flex-col gap-8 sm:flex-row sm:items-center">
            <Gauge score={technicalSummary.technical.score} size={140} />
            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
              {technicalSummary.technical.indicators.map((item) => (
                <div key={item.name} className="flex flex-col">
                  <span className="mb-0.5 text-xs text-text-tertiary">{item.name}</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold">{item.value}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        item.signal === '매수'
                          ? 'text-positive'
                          : item.signal === '매도'
                            ? 'text-negative'
                            : 'text-neutral'
                      }`}
                    >
                      {item.signal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex justify-end">
            <button
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
            <div className="font-mono text-2xl font-bold text-warning">{technicalSummary.fundamental.score}%</div>
          </div>

          <div className="mb-8 mt-4 grid grid-cols-2 gap-6">
            {technicalSummary.fundamental.values.map((item) => (
              <div key={item.name} className="flex flex-col rounded-card border border-border/50 bg-surface-1 p-4">
                <span className="mb-1 text-xs text-text-tertiary">{item.name}</span>
                <span className="font-mono text-xl font-bold">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex justify-end">
            <button
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
