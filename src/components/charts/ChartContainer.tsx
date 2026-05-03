import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Candle, RuntimeIndicatorParams } from '../../lib/api';
import { useBinanceWebSocket } from '../../hooks/useBinanceWebSocket';
import { CRYPTO_CATEGORY } from '../../lib/market-selection';
import { binanceIntervalForTimeframe, DEFAULT_CHART_TIMEFRAME, type ChartTimeframe } from '../../lib/timeframes';
import CandleChart, { MainIndicatorId, PaneIndicatorId } from './CandleChart';
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

const MAIN_INDICATOR_OPTIONS: { id: MainIndicatorId; label: string; description: string }[] = [
  { id: 'ma', label: 'MA 추가', description: '이동평균선 1개 추가' },
  { id: 'bollinger', label: 'Bollinger Bands', description: '변동성 밴드' },
  { id: 'volume', label: 'Volume', description: '거래량 pane' },
];

const PANE_INDICATOR_OPTIONS: { id: PaneIndicatorId; label: string; description: string }[] = [
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
  const [isIndicatorPickerOpen, setIsIndicatorPickerOpen] = useState(false);
  const [activeMainIndicators, setActiveMainIndicators] = useState<MainIndicatorId[]>(['bollinger', 'volume']);
  const [activePanels, setActivePanels] = useState<PaneIndicatorId[]>(['rsi', 'macd']);
  const [maAddRequestId, setMaAddRequestId] = useState(0);
  const [maCount, setMaCount] = useState(0);
  const liveCandle = useBinanceWebSocket(
    enableRealtimeCandle && category === CRYPTO_CATEGORY && symbol ? symbol : null,
    binanceIntervalForTimeframe(timeframe),
  );
  const maPeriods = parseMaPeriods(runtimeParams?.ma_periods)?.slice(0, 4);
  const volumeHeight = activeMainIndicators.includes('volume') ? 96 : 0;
  const chartHeight = 420 + volumeHeight + activePanels.length * 120;

  const toggleMainIndicator = (indicatorId: MainIndicatorId) => {
    if (indicatorId === 'ma') return;
    setActiveMainIndicators((current) =>
      current.includes(indicatorId) ? current.filter((item) => item !== indicatorId) : [...current, indicatorId],
    );
  };

  const togglePaneIndicator = (panelId: PaneIndicatorId) => {
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsIndicatorPickerOpen((value) => !value)}
              className="flex items-center gap-2 rounded-pill border border-border bg-surface-1 px-3 py-1 text-[11px] font-bold text-text-secondary transition-colors hover:border-brand-primary hover:text-text-primary"
            >
              차트 지표 {isIndicatorPickerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
        {isIndicatorPickerOpen && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-card border border-border bg-surface-1 p-3 md:grid-cols-5">
            {[...MAIN_INDICATOR_OPTIONS, ...PANE_INDICATOR_OPTIONS].map((option) => {
              const isMain = MAIN_INDICATOR_OPTIONS.some((item) => item.id === option.id);
              const isActive = isMain
                ? option.id === 'ma'
                  ? maCount > 0
                  : activeMainIndicators.includes(option.id as MainIndicatorId)
                : activePanels.includes(option.id as PaneIndicatorId);
              const label = option.id === 'ma' && maCount > 0 ? `MA 추가 (${maCount}개)` : option.label;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    option.id === 'ma'
                      ? setMaAddRequestId((value) => value + 1)
                      : isMain
                        ? toggleMainIndicator(option.id as MainIndicatorId)
                        : togglePaneIndicator(option.id as PaneIndicatorId)
                  }
                  className={`rounded-card border px-3 py-2 text-left transition-colors ${
                    isActive
                      ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                      : 'border-border bg-surface-2 text-text-secondary hover:border-brand-primary/60'
                  }`}
                >
                  <span className="block text-xs font-bold">{label}</span>
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
          mainIndicators={activeMainIndicators}
          indicatorPanels={activePanels}
          runtimeParams={runtimeParams}
          theme={theme}
          height={chartHeight}
          maAddRequestId={maAddRequestId}
          onToggleMainIndicator={toggleMainIndicator}
          onTogglePaneIndicator={togglePaneIndicator}
          onMaCountChange={setMaCount}
        />
        <VisualizationReason
          reason="OHLCV 데이터는 가격 흐름과 지표를 같은 시간축에서 비교해야 하므로, 메인 차트 지표와 하단 pane 지표를 함께 보여줍니다."
          rule="charts.md: OHLCV -> candle"
        />
      </div>
    </div>
  );
}
