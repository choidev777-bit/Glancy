import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Candle, RuntimeIndicatorParams } from '../../lib/api';
import { useBinanceWebSocket } from '../../hooks/useBinanceWebSocket';
import { CRYPTO_CATEGORY } from '../../lib/market-selection';
import { binanceIntervalForTimeframe, DEFAULT_CHART_TIMEFRAME, type ChartTimeframe } from '../../lib/timeframes';
import CandleChart, { IndicatorPanelId } from './CandleChart';
import VisualizationReason from './VisualizationReason';

interface ChartContainerProps {
  candles: Candle[];
  category?: string;
  symbol?: string;
  theme?: 'dark' | 'light';
  runtimeParams?: RuntimeIndicatorParams;
  timeframe?: ChartTimeframe;
  enableRealtimeCandle?: boolean;
}

const INDICATOR_PANEL_OPTIONS: { id: IndicatorPanelId; label: string; description: string }[] = [
  { id: 'rsi', label: 'RSI', description: '과매수/과매도' },
  { id: 'macd', label: 'MACD', description: '추세 전환' },
  { id: 'stochastic', label: 'Stochastic', description: '단기 모멘텀' },
  { id: 'williamsR', label: 'Williams %R', description: '반전 구간' },
  { id: 'cci', label: 'CCI', description: '추세 강도' },
  { id: 'roc', label: 'ROC', description: '변화율' },
  { id: 'obv', label: 'OBV', description: '거래량 누적' },
];

function parseMaPeriods(value?: string): number[] | undefined {
  if (!value) return undefined;
  const periods = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
  return periods.length ? periods : undefined;
}

export default function ChartContainer({
  candles,
  category,
  symbol,
  theme = 'dark',
  runtimeParams,
  timeframe = DEFAULT_CHART_TIMEFRAME,
  enableRealtimeCandle = true,
}: ChartContainerProps) {
  const [isPanelPickerOpen, setIsPanelPickerOpen] = useState(false);
  const [activePanels, setActivePanels] = useState<IndicatorPanelId[]>(['rsi', 'macd']);
  const liveCandle = useBinanceWebSocket(
    enableRealtimeCandle && category === CRYPTO_CATEGORY && symbol ? symbol : null,
    binanceIntervalForTimeframe(timeframe),
  );
  const isRealtime = Boolean(liveCandle);
  const maPeriods = parseMaPeriods(runtimeParams?.ma_periods)?.slice(0, 4);
  const maLabel = maPeriods?.length ? maPeriods.map((period) => `MA${period}`).join(' / ') : 'MA5 / MA20 / MA60';
  const chartHeight = 420 + 96 + activePanels.length * 120;

  const togglePanel = (panelId: IndicatorPanelId) => {
    setActivePanels((current) =>
      current.includes(panelId) ? current.filter((item) => item !== panelId) : [...current, panelId],
    );
  };

  if (candles.length === 0) {
    return <div className="card p-8 text-center text-text-secondary">차트 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-bold">캔들 차트</h3>
            <p className="text-[11px] text-text-tertiary">
              캔들 + {maLabel} + 볼린저 밴드, 거래량과 보조지표 {activePanels.length}개 표시
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-pill bg-surface-3 px-3 py-1 text-[11px] font-bold text-text-tertiary">
              {isRealtime ? 'Binance 실시간' : '일봉 데이터'}
            </div>
            <button
              type="button"
              onClick={() => setIsPanelPickerOpen((value) => !value)}
              className="flex items-center gap-2 rounded-pill border border-border bg-surface-1 px-3 py-1 text-[11px] font-bold text-text-secondary transition-colors hover:border-brand-primary hover:text-text-primary"
            >
              보조지표 {isPanelPickerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
        {isPanelPickerOpen && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-card border border-border bg-surface-1 p-3 md:grid-cols-4">
            {INDICATOR_PANEL_OPTIONS.map((option) => {
              const isActive = activePanels.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => togglePanel(option.id)}
                  className={`rounded-card border px-3 py-2 text-left transition-colors ${
                    isActive
                      ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                      : 'border-border bg-surface-2 text-text-secondary hover:border-brand-primary/60'
                  }`}
                >
                  <span className="block text-xs font-bold">{option.label}</span>
                  <span className="text-[10px] text-text-tertiary">{option.description}</span>
                </button>
              );
            })}
          </div>
        )}
        <CandleChart
          candles={candles}
          latestCandle={liveCandle}
          enabledMAs={maPeriods}
          indicatorPanels={activePanels}
          runtimeParams={runtimeParams}
          theme={theme}
          height={chartHeight}
        />
        <VisualizationReason
          reason="OHLCV 데이터는 가격 흐름과 보조지표를 같은 시간축에서 비교해야 하므로, 캔들 아래에 RSI/MACD 등 보조지표 pane을 쌓아 보여줍니다."
          rule="charts.md: OHLCV -> candle"
        />
      </div>
    </div>
  );
}
