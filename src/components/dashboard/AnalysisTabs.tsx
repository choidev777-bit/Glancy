import React from 'react';

interface AnalysisTabsProps {
  activeTab: 'summary' | 'technical' | 'fundamental';
  setActiveTab: (tab: 'summary' | 'technical' | 'fundamental') => void;
  isFundamentalDisabled?: boolean;
}

const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  activeTab,
  setActiveTab,
  isFundamentalDisabled = false,
}) => {
  return (
    <div className="mb-6 overflow-x-auto px-6 no-scrollbar">
      <div className="flex w-fit gap-2 rounded-pill border border-border bg-surface-1 p-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`tab-pill whitespace-nowrap ${activeTab === 'summary' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
        >
          요약
        </button>
        <button
          onClick={() => setActiveTab('technical')}
          className={`tab-pill whitespace-nowrap ${activeTab === 'technical' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
        >
          기술적 분석
        </button>
        <button
          onClick={isFundamentalDisabled ? undefined : () => setActiveTab('fundamental')}
          disabled={isFundamentalDisabled}
          className={`tab-pill whitespace-nowrap ${
            activeTab === 'fundamental' ? 'tab-pill-active' : 'tab-pill-inactive'
          } ${isFundamentalDisabled ? 'cursor-not-allowed opacity-50 grayscale' : ''}`}
          title={isFundamentalDisabled ? '이 자산은 기본적 분석을 지원하지 않습니다.' : ''}
        >
          기본적 분석
        </button>
      </div>
    </div>
  );
};

export default AnalysisTabs;
