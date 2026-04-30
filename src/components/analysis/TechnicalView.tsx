import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import ChartContainer from '../charts/ChartContainer';
import Gauge from '../common/Gauge';
import SignalBadge from '../common/SignalBadge';
import SkillsRuntimePanel from '../skills/SkillsRuntimePanel';
import { mockCandles, technicalDetails } from '../../data/mockData';
import type { Candle, IndicatorsResponse, RuntimeIndicatorParams } from '../../lib/api';
import type { ParsedSkillsRuntime } from '../../lib/skills-parser';
import { CHART_TIMEFRAMES, DEFAULT_CHART_TIMEFRAME, type ChartTimeframe } from '../../lib/timeframes';

interface TechnicalViewProps {
  candles?: Candle[];
  indicators?: IndicatorsResponse | null;
  category?: string;
  symbol?: string;
  theme?: 'dark' | 'light';
  loading?: boolean;
  error?: string | null;
  runtimeParams?: RuntimeIndicatorParams;
  onRuntimeChange?: (runtime: ParsedSkillsRuntime) => void;
  timeframe?: ChartTimeframe;
  onTimeframeChange?: (timeframe: ChartTimeframe) => void;
  enableRealtimeCandle?: boolean;
}

const TechnicalView: React.FC<TechnicalViewProps> = ({
  candles,
  indicators,
  category,
  symbol,
  theme = 'dark',
  loading = false,
  error,
  runtimeParams,
  onRuntimeChange,
  timeframe = DEFAULT_CHART_TIMEFRAME,
  onTimeframeChange,
  enableRealtimeCandle = true,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const chartCandles = candles && candles.length > 0 ? candles : mockCandles;
  const technicalGauge = indicators?.gauges?.technical?.percent ?? 72;
  const overallGauge = indicators?.gauges?.overall?.percent ?? 85;
  const movingAverageGauge = indicators?.gauges?.moving_average?.percent ?? 78;
  const insight = indicators?.insights?.summary;
  const indicatorRows = indicators?.indicators?.length ? indicators.indicators : technicalDetails.indicators;
  const movingAverageRows = indicators?.moving_averages?.length ? indicators.moving_averages : technicalDetails.movingAverages;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-6 pb-12 duration-500">
      <SkillsRuntimePanel onRuntimeChange={onRuntimeChange ?? (() => undefined)} />

      <div className="flex w-fit gap-2 rounded-pill border border-border bg-surface-1 p-1">
        {CHART_TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange?.(tf)}
            className={`rounded-pill px-4 py-1.5 text-xs font-bold transition-colors ${
              timeframe === tf ? 'bg-surface-4 text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card flex flex-col items-center p-6">
          <Gauge score={technicalGauge} label="기술" title="기술 지표 점수" size={180} />
        </div>
        <div className="card flex flex-col items-center border-brand-primary/20 bg-surface-3/30 p-6">
          <Gauge score={overallGauge} label="종합" title="종합 시그널" size={200} />
        </div>
        <div className="card flex flex-col items-center p-6">
          <Gauge score={movingAverageGauge} label="MA" title="이동평균 점수" size={180} />
        </div>
      </div>

      <div className={`card border-info/20 p-4 ${error ? 'bg-warning/5' : 'bg-info/5'}`}>
        <p className="text-center text-sm text-text-secondary">
          {loading && '시장 데이터를 불러오는 중입니다...'}
          {!loading && error && `데이터 공급이 불안정합니다: ${error}. 안정적인 샘플 데이터로 화면을 유지합니다.`}
          {!loading &&
            !error &&
            (insight ??
              '기술 지표 엔진이 연결되어 있습니다. 외부 데이터 공급자가 실패해도 차트는 fallback 데이터로 유지됩니다.')}
        </p>
      </div>

      <ChartContainer
        candles={chartCandles}
        category={category}
        symbol={symbol}
        theme={theme}
        runtimeParams={runtimeParams}
        timeframe={timeframe}
        enableRealtimeCandle={enableRealtimeCandle}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="border-b border-border p-4">
            <h3 className="font-bold">기술 지표</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-1 text-[10px] font-bold uppercase text-text-tertiary">
                <tr>
                  <th className="px-4 py-2 text-left">지표</th>
                  <th className="px-4 py-2 text-right">값</th>
                  <th className="px-4 py-2 text-center">신호</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {indicatorRows.map((item) => (
                  <tr key={item.name} className="transition-colors hover:bg-surface-3">
                    <td className="px-4 py-2.5 font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{item.value}</td>
                    <td className="flex justify-center px-4 py-2.5">
                      <SignalBadge signal={item.signal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="border-b border-border p-4">
            <h3 className="font-bold">이동평균</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-1 text-[10px] font-bold uppercase text-text-tertiary">
                <tr>
                  <th className="px-4 py-2 text-left">기간</th>
                  <th className="px-4 py-2 text-right">SMA</th>
                  <th className="px-4 py-2 text-right">EMA</th>
                  <th className="px-4 py-2 text-center">신호</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movingAverageRows.map((item) => (
                  <tr key={item.period} className="transition-colors hover:bg-surface-3">
                    <td className="px-4 py-2.5 font-medium">{item.period}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{item.sma ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{item.ema ?? '-'}</td>
                    <td className="flex justify-center px-4 py-2.5">
                      <SignalBadge signal={item.signal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="flex w-full items-center justify-between p-4 transition-colors hover:bg-surface-3"
        >
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-text-tertiary" />
            <span className="text-sm font-bold">지표 파라미터</span>
          </div>
          {isSettingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {isSettingsOpen && (
          <div className="grid grid-cols-1 gap-8 border-t border-border p-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-text-tertiary">RSI</h4>
              <input
                type="number"
                defaultValue={14}
                className="rounded-card bg-surface-3 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-text-tertiary">MACD</h4>
              <div className="grid grid-cols-3 gap-4">
                {[12, 26, 9].map((value) => (
                  <input
                    key={value}
                    type="number"
                    defaultValue={value}
                    className="rounded-card bg-surface-3 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                ))}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <button className="btn-primary flex-1 py-2">적용</button>
              <button className="btn-secondary flex-1 py-2">초기화</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalView;
