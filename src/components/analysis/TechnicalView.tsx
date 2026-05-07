import React from 'react';
import ChartContainer from '../charts/ChartContainer';
import Gauge from '../common/Gauge';
import SignalBadge from '../common/SignalBadge';
import { mockCandles } from '../../data/mockData';
import type { Candle, IndicatorsResponse, RuntimeIndicatorParams } from '../../lib/api';
import { buildTechnicalFallbackAnalysis } from '../../lib/asset-analysis';
import { aggregateCandlesForTimeframe } from '../../lib/candle-timeframe';
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
  timeframe?: ChartTimeframe;
  onTimeframeChange?: (timeframe: ChartTimeframe) => void;
  availableTimeframes?: ChartTimeframe[];
  enableRealtimeCandle?: boolean;
  allowMockCandles?: boolean;
  emptyMessage?: string;
}

const DEFAULT_EMPTY_MESSAGE =
  '업로드 데이터에 해당 자산의 OHLCV 섹션이 없어 캔들 차트를 생성하지 못했습니다.';

const TechnicalView: React.FC<TechnicalViewProps> = ({
  candles,
  indicators,
  category,
  symbol,
  theme = 'dark',
  loading = false,
  error,
  runtimeParams,
  timeframe = DEFAULT_CHART_TIMEFRAME,
  onTimeframeChange,
  availableTimeframes = CHART_TIMEFRAMES,
  enableRealtimeCandle = true,
  allowMockCandles = true,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
}) => {
  const chartCandles = candles && candles.length > 0 ? candles : allowMockCandles ? mockCandles : [];
  const timeframeCandles = aggregateCandlesForTimeframe(chartCandles, timeframe);
  const fallbackAnalysis = buildTechnicalFallbackAnalysis(indicators, error);
  const technicalGauge = indicators?.gauges?.technical?.percent ?? fallbackAnalysis.technicalGauge;
  const overallGauge = indicators?.gauges?.overall?.percent ?? fallbackAnalysis.overallGauge;
  const movingAverageGauge = indicators?.gauges?.moving_average?.percent ?? fallbackAnalysis.movingAverageGauge;
  const technicalSignal = indicators?.gauges?.technical?.signal ?? '기술';
  const overallSignal = indicators?.gauges?.overall?.signal ?? '중립';
  const maSignal = indicators?.gauges?.moving_average?.signal ?? 'MA';
  const insight = indicators?.insights?.summary ?? fallbackAnalysis.insight;
  const indicatorRows = indicators?.indicators ?? [];
  const movingAverageRows = indicators?.moving_averages ?? [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 px-6 pb-12 duration-500">
      <div className="flex w-fit gap-2 rounded-pill border border-border bg-surface-1 p-1">
        {availableTimeframes.map((tf) => (
          <button
            key={tf}
            type="button"
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
          <Gauge score={technicalGauge} label={technicalSignal} title="기술 지표 점수" size={180} />
        </div>
        <div className="card flex flex-col items-center border-brand-primary/20 bg-surface-3/30 p-6">
          <Gauge score={overallGauge} label={overallSignal} title="종합 시그널" size={200} />
        </div>
        <div className="card flex flex-col items-center p-6">
          <Gauge score={movingAverageGauge} label={maSignal} title="이동평균 점수" size={180} />
        </div>
      </div>

      <div className={`card border-info/20 p-4 ${error ? 'bg-warning/5' : 'bg-info/5'}`}>
        <p className="text-center text-sm text-text-secondary">
          {loading && '시장 데이터를 불러오는 중입니다...'}
          {!loading && error && `데이터 공급이 불안정합니다: ${error}. ${insight}`}
          {!loading && !error && insight}
        </p>
      </div>

      {timeframeCandles.length > 0 ? (
        <ChartContainer
          candles={timeframeCandles}
          category={category}
          symbol={symbol}
          theme={theme}
          runtimeParams={runtimeParams}
          timeframe={timeframe}
          enableRealtimeCandle={enableRealtimeCandle}
        />
      ) : (
        <div className="card p-8 text-center text-sm text-text-secondary">{emptyMessage}</div>
      )}

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
                {indicatorRows.length > 0 ? (
                  indicatorRows.map((item) => (
                    <tr key={item.name} className="transition-colors hover:bg-surface-3">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{item.value}</td>
                      <td className="flex justify-center px-4 py-2.5">
                        <SignalBadge signal={item.signal} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-text-secondary">
                      지표 데이터 부족으로 계산 결과를 표시할 수 없습니다.
                    </td>
                  </tr>
                )}
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
                {movingAverageRows.length > 0 ? (
                  movingAverageRows.map((item) => (
                    <tr key={item.period} className="transition-colors hover:bg-surface-3">
                      <td className="px-4 py-2.5 font-medium">{item.period}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{item.sma ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{item.ema ?? '-'}</td>
                      <td className="flex justify-center px-4 py-2.5">
                        <SignalBadge signal={item.signal} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-secondary">
                      이동평균 데이터 부족으로 계산 결과를 표시할 수 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalView;
