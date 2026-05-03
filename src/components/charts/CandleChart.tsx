import { type ChangeEvent, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  CandlestickData,
  CandlestickSeries,
  HistogramData,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  MouseEventParams,
  Time,
  createChart,
} from 'lightweight-charts';
import { ChevronDown, ChevronUp, Settings, Trash2, X } from 'lucide-react';
import type { Candle, RuntimeIndicatorParams } from '../../lib/api';
import { getCandleColors, getChartTheme, getMAColors } from '../../lib/chart-theme';
import {
  bollingerBands,
  cci,
  compactNumber,
  macd,
  obv,
  roc,
  rsi,
  sma,
  stochastic,
  williamsR,
} from '../../lib/technical-series';

export type MainIndicatorId = 'ma' | 'bollinger' | 'volume';
export type PaneIndicatorId = 'rsi' | 'macd' | 'stochastic' | 'williamsR' | 'cci' | 'roc' | 'obv';
export type IndicatorPanelId = PaneIndicatorId;

type MaIndicatorPanelId = `ma:${string}`;
type ChartIndicatorId = MainIndicatorId | PaneIndicatorId | MaIndicatorPanelId;
type SettingsTab = 'inputs' | 'style';
type ModalPosition = { x: number; y: number };
type ModalDragState = {
  startClientX: number;
  startClientY: number;
  startPosition: ModalPosition;
};

interface CandleChartProps {
  candles: Candle[];
  latestCandle?: Candle | null;
  enabledMAs?: number[];
  mainIndicators?: MainIndicatorId[];
  indicatorPanels?: PaneIndicatorId[];
  runtimeParams?: RuntimeIndicatorParams;
  theme?: 'dark' | 'light';
  height?: number;
  maAddRequestId?: number;
  onToggleMainIndicator?: (indicator: MainIndicatorId) => void;
  onTogglePaneIndicator?: (indicator: PaneIndicatorId) => void;
  onMaCountChange?: (count: number) => void;
}

interface LegendItem {
  id?: string;
  label: string;
  color: string;
  value: number | null;
}

interface IndicatorLegend {
  id: ChartIndicatorId;
  label: string;
  items: LegendItem[];
  compact?: boolean;
}

interface MaInstance {
  id: string;
  period: number;
  color: string;
  visible: boolean;
}

interface ChartIndicatorSettings {
  bollinger: { period?: number; std?: number; upperColor: string; middleColor: string; lowerColor: string };
  volume: { upColor: string; downColor: string };
  rsi: { period?: number; overbought?: number; oversold?: number; lineColor: string };
  macd: { fast?: number; slow?: number; signal?: number; macdColor: string; signalColor: string; histogramColor: string };
  stochastic: { kPeriod?: number; dPeriod?: number; overbought?: number; oversold?: number; kColor: string; dColor: string };
  williamsR: { period?: number; overbought?: number; oversold?: number; lineColor: string };
  cci: { period?: number; lineColor: string };
  roc: { period?: number; lineColor: string };
  obv: { lookback?: number; lineColor: string };
}

const DEFAULT_ENABLED_MAS = [5, 20, 60];
const DEFAULT_MAIN_INDICATORS: MainIndicatorId[] = ['bollinger', 'volume'];
const DEFAULT_PANE_INDICATORS: PaneIndicatorId[] = ['rsi', 'macd'];
const MA_PERIOD_SUGGESTIONS = [5, 10, 20, 60, 120, 240];
const SETTINGS_MODAL_WIDTH = 380;
const SETTINGS_MODAL_ESTIMATED_HEIGHT = 460;
const SETTINGS_MODAL_MARGIN = 12;
const LINE_SERIES_DISPLAY_OPTIONS = {
  crosshairMarkerVisible: false,
  lastValueVisible: false,
  priceLineVisible: false,
};
const DEFAULT_CHART_SETTINGS: ChartIndicatorSettings = {
  bollinger: { upperColor: '#f59e0b', middleColor: '#94a3b8', lowerColor: '#f59e0b' },
  volume: { upColor: '#22c55e', downColor: '#ef4444' },
  rsi: { lineColor: '#8b5cf6' },
  macd: { macdColor: '#06b6d4', signalColor: '#f59e0b', histogramColor: '#94a3b8' },
  stochastic: { kColor: '#38bdf8', dColor: '#facc15' },
  williamsR: { lineColor: '#c084fc' },
  cci: { lineColor: '#fb7185' },
  roc: { lineColor: '#2dd4bf' },
  obv: { lineColor: '#34d399' },
};

function lastValue(series: { value: number }[]): number | null {
  return series.length ? series[series.length - 1].value : null;
}

function timeKey(time: Time | undefined): string {
  return typeof time === 'undefined' ? '' : String(time);
}

function valueAt(series: { time: Time; value: number }[], time: Time | null): number | null {
  if (!series.length) return null;
  if (!time) return lastValue(series);
  const target = timeKey(time);
  return series.find((item) => timeKey(item.time) === target)?.value ?? lastValue(series);
}

function candleAt(candles: Candle[], time: Time | null): Candle | null {
  if (!candles.length) return null;
  if (!time) return candles[candles.length - 1];
  const target = timeKey(time);
  return candles.find((candle) => timeKey(candle.time as Time) === target) ?? candles[candles.length - 1];
}

function formatChartValue(value: number | null, compact = false): string {
  if (value === null || !Number.isFinite(value)) return '-';
  if (compact) return compactNumber(value);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatSignedChartValue(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatSignedPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '(-)';
  const sign = value > 0 ? '+' : '';
  return `(${sign}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%)`;
}

function numericOverride(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getModalWidth(containerWidth: number): number {
  return Math.min(SETTINGS_MODAL_WIDTH, Math.max(0, containerWidth - SETTINGS_MODAL_MARGIN * 2));
}

function clampModalPosition(position: ModalPosition, containerWidth: number, chartHeight: number): ModalPosition {
  const modalWidth = getModalWidth(containerWidth);
  return {
    x: clamp(position.x, SETTINGS_MODAL_MARGIN, containerWidth - modalWidth - SETTINGS_MODAL_MARGIN),
    y: clamp(position.y, SETTINGS_MODAL_MARGIN, chartHeight - SETTINGS_MODAL_ESTIMATED_HEIGHT - SETTINGS_MODAL_MARGIN),
  };
}

function getCenteredModalPosition(containerWidth: number, chartHeight: number): ModalPosition {
  const modalWidth = getModalWidth(containerWidth);
  return clampModalPosition(
    {
      x: (containerWidth - modalWidth) / 2,
      y: (chartHeight - SETTINGS_MODAL_ESTIMATED_HEIGHT) / 2,
    },
    containerWidth,
    chartHeight,
  );
}

function eventNumber(event: ChangeEvent<HTMLInputElement>): number | undefined {
  const next = Number(event.target.value);
  return Number.isFinite(next) ? next : undefined;
}

function cloneChartSettings(settings: ChartIndicatorSettings): ChartIndicatorSettings {
  return {
    bollinger: { ...settings.bollinger },
    volume: { ...settings.volume },
    rsi: { ...settings.rsi },
    macd: { ...settings.macd },
    stochastic: { ...settings.stochastic },
    williamsR: { ...settings.williamsR },
    cci: { ...settings.cci },
    roc: { ...settings.roc },
    obv: { ...settings.obv },
  };
}

function defaultSettingsFor(indicator: NonMaSettingsIndicator) {
  const defaults = cloneChartSettings(DEFAULT_CHART_SETTINGS);
  return defaults[indicator];
}

function indicatorTitle(indicator: ChartIndicatorId): string {
  if (isMaSettingsPanel(indicator)) return 'MA';
  const titles: Record<MainIndicatorId | PaneIndicatorId, string> = {
    ma: 'MA',
    bollinger: 'Bollinger Bands',
    volume: 'Volume',
    rsi: 'RSI',
    macd: 'MACD',
    stochastic: 'Stochastic',
    williamsR: 'Williams %R',
    cci: 'CCI',
    roc: 'ROC',
    obv: 'OBV',
  };
  return titles[indicator];
}

type NonMaSettingsIndicator = Exclude<ChartIndicatorId, MaIndicatorPanelId | 'ma'>;

function isMaSettingsPanel(indicator: ChartIndicatorId | null): indicator is MaIndicatorPanelId {
  return typeof indicator === 'string' && indicator.startsWith('ma:');
}

function isNonMaSettingsIndicator(indicator: ChartIndicatorId): indicator is NonMaSettingsIndicator {
  return !isMaSettingsPanel(indicator) && indicator !== 'ma';
}

function maPanelId(id: string): MaIndicatorPanelId {
  return `ma:${id}`;
}

function maIdFromPanel(indicator: MaIndicatorPanelId): string {
  return indicator.slice(3);
}

function normalizeMaPeriods(periods: number[] | undefined): number[] {
  if (!periods) return [];
  const unique = new Set<number>();
  periods.forEach((period) => {
    const normalized = Math.trunc(period);
    if (Number.isFinite(normalized) && normalized >= 1 && normalized <= 365) unique.add(normalized);
  });
  return Array.from(unique).slice(0, 4);
}

function normalizeMaPeriod(period: number | undefined, fallback: number): number {
  if (!Number.isFinite(period)) return fallback;
  return clamp(Math.trunc(period as number), 1, 365);
}

function createMaInstance(id: string, period: number, color: string): MaInstance {
  return {
    id,
    period: normalizeMaPeriod(period, 5),
    color,
    visible: true,
  };
}

function createInitialMaInstances(periods: number[] | undefined, colors: string[]): MaInstance[] {
  const normalized = normalizeMaPeriods(periods).length ? normalizeMaPeriods(periods) : DEFAULT_ENABLED_MAS;
  return normalized.map((period, index) => createMaInstance(`ma-${period}-${index}`, period, colors[index % colors.length]));
}

function getNextMaPeriod(instances: MaInstance[]): number {
  const usedPeriods = new Set(instances.map((instance) => instance.period));
  const suggested = MA_PERIOD_SUGGESTIONS.find((period) => !usedPeriods.has(period));
  if (suggested) return suggested;
  return normalizeMaPeriod((instances[instances.length - 1]?.period ?? 0) + 20, 365);
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-[12px] text-text-secondary">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(eventNumber(event))}
        className="h-9 w-24 rounded-lg border border-border bg-background px-3 text-right font-mono text-text-primary outline-none focus:border-accent"
      />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[12px] text-text-secondary">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
      />
    </label>
  );
}

function LegendRow({
  top,
  title,
  items,
  panelId,
  compact = false,
  isSettingsOpen = false,
  onOpenSettings,
  onRemove,
}: {
  top: number;
  title: string;
  items: LegendItem[];
  panelId?: ChartIndicatorId;
  compact?: boolean;
  isSettingsOpen?: boolean;
  onOpenSettings?: (panel: ChartIndicatorId) => void;
  onRemove?: (panel: ChartIndicatorId) => void;
}) {
  return (
    <div
      className="pointer-events-none absolute left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium"
      style={{ top }}
    >
      <span className="text-text-tertiary">{title}</span>
      {panelId && (
        <button
          type="button"
          aria-label={`${title} 설정`}
          className={`pointer-events-auto rounded border px-1 py-0.5 transition-colors ${
            isSettingsOpen
              ? 'border-accent text-accent'
              : 'border-border/80 bg-surface/80 text-text-tertiary hover:border-accent/70 hover:text-accent'
          }`}
          onClick={() => onOpenSettings?.(panelId)}
        >
          <Settings size={12} />
        </button>
      )}
      {panelId && onRemove && (
        <button
          type="button"
          aria-label={`${title} 제거`}
          title={`${title} 제거`}
          className="pointer-events-auto rounded border border-border/80 bg-surface/80 px-1 py-0.5 text-text-tertiary transition-colors hover:border-state-negative hover:text-state-negative"
          onClick={() => onRemove(panelId)}
        >
          <Trash2 size={12} />
        </button>
      )}
      {items.map((item) => (
        <span key={`${title}-${item.label}`} className="font-mono font-bold" style={{ color: item.color }}>
          {item.label} {formatChartValue(item.value, compact)}
        </span>
      ))}
    </div>
  );
}

export default function CandleChart({
  candles,
  latestCandle,
  enabledMAs = DEFAULT_ENABLED_MAS,
  mainIndicators = DEFAULT_MAIN_INDICATORS,
  indicatorPanels = DEFAULT_PANE_INDICATORS,
  runtimeParams,
  theme = 'dark',
  height = 560,
  maAddRequestId = 0,
  onToggleMainIndicator,
  onTogglePaneIndicator,
  onMaCountChange,
}: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null);
  const modalDragStateRef = useRef<ModalDragState | null>(null);
  const nextMaInstanceIdRef = useRef(1);
  const lastMaAddRequestIdRef = useRef(maAddRequestId);
  const [hoveredTime, setHoveredTime] = useState<Time | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [chartSettings, setChartSettings] = useState<ChartIndicatorSettings>(cloneChartSettings(DEFAULT_CHART_SETTINGS));
  const [maInstances, setMaInstances] = useState<MaInstance[]>(() => createInitialMaInstances(enabledMAs, getMAColors(theme)));
  useEffect(() => {
    onMaCountChange?.(maInstances.length);
  }, [maInstances.length, onMaCountChange]);
  const [draftMaInstances, setDraftMaInstances] = useState<MaInstance[]>([]);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<ChartIndicatorId | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('inputs');
  const [draftSettings, setDraftSettings] = useState<ChartIndicatorSettings | null>(null);
  const [draftMainIndicators, setDraftMainIndicators] = useState<MainIndicatorId[]>(mainIndicators);
  const [draftPaneIndicators, setDraftPaneIndicators] = useState<PaneIndicatorId[]>(indicatorPanels);
  const [modalPosition, setModalPosition] = useState<ModalPosition | null>(null);
  const [isDraggingSettingsModal, setIsDraggingSettingsModal] = useState(false);

  const themeMaColors = useMemo(() => getMAColors(theme), [theme]);
  const visibleMaInstances = useMemo(() => maInstances.filter((instance) => instance.visible), [maInstances]);
  const bbPeriod = numericOverride(chartSettings.bollinger.period, runtimeParams?.bb_period ?? 20);
  const bbStd = numericOverride(chartSettings.bollinger.std, runtimeParams?.bb_std ?? 2);
  const rsiPeriod = numericOverride(chartSettings.rsi.period, runtimeParams?.rsi_period ?? 14);
  const rsiOverbought = numericOverride(chartSettings.rsi.overbought, runtimeParams?.rsi_overbought ?? 70);
  const rsiOversold = numericOverride(chartSettings.rsi.oversold, runtimeParams?.rsi_oversold ?? 30);
  const macdFast = numericOverride(chartSettings.macd.fast, runtimeParams?.macd_fast ?? 12);
  const macdSlow = numericOverride(chartSettings.macd.slow, runtimeParams?.macd_slow ?? 26);
  const macdSignal = numericOverride(chartSettings.macd.signal, runtimeParams?.macd_signal ?? 9);
  const stochKPeriod = numericOverride(chartSettings.stochastic.kPeriod, runtimeParams?.stoch_k_period ?? 9);
  const stochDPeriod = numericOverride(chartSettings.stochastic.dPeriod, runtimeParams?.stoch_d_period ?? 6);
  const stochOverbought = numericOverride(chartSettings.stochastic.overbought, runtimeParams?.stoch_overbought ?? 80);
  const stochOversold = numericOverride(chartSettings.stochastic.oversold, runtimeParams?.stoch_oversold ?? 20);
  const wrPeriod = numericOverride(chartSettings.williamsR.period, runtimeParams?.wr_period ?? 14);
  const wrOverbought = numericOverride(chartSettings.williamsR.overbought, runtimeParams?.wr_overbought ?? -20);
  const wrOversold = numericOverride(chartSettings.williamsR.oversold, runtimeParams?.wr_oversold ?? -80);
  const cciPeriod = numericOverride(chartSettings.cci.period, runtimeParams?.cci_period ?? 14);
  const rocPeriod = numericOverride(chartSettings.roc.period, runtimeParams?.roc_period ?? 12);

  const isMaEnabled = visibleMaInstances.length > 0;
  const isBollingerEnabled = mainIndicators.includes('bollinger');
  const isVolumeEnabled = mainIndicators.includes('volume');
  const volumePaneHeight = isVolumeEnabled ? 96 : 0;
  const pricePaneHeight = Math.max(300, height - volumePaneHeight - indicatorPanels.length * 120);

  const candleData = useMemo(
    () =>
      candles.map((candle) => ({
        time: candle.time as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })) as CandlestickData<Time>[],
    [candles],
  );

  const currentCandle = candleAt(candles, hoveredTime);
  const previousCandle = currentCandle
    ? candles[Math.max(0, candles.findIndex((candle) => candle.time === currentCandle.time) - 1)]
    : null;
  const candleChange = currentCandle && previousCandle ? currentCandle.close - previousCandle.close : null;
  const candleChangePercent =
    candleChange !== null && previousCandle?.close ? (candleChange / previousCandle.close) * 100 : null;
  const ohlcColor = candleChange !== null && candleChange >= 0 ? '#22c55e' : '#ef4444';

  const maSeries = useMemo(
    () => visibleMaInstances.map((instance) => ({ instance, data: sma(candles, instance.period) })),
    [candles, visibleMaInstances],
  );
  const maLegendItems = maSeries.map(({ instance, data }) => ({
    id: instance.id,
    label: `MA ${instance.period} close`,
    color: instance.color,
    value: valueAt(data, hoveredTime),
  }));
  const bandData = useMemo(() => bollingerBands(candles, bbPeriod, bbStd), [candles, bbPeriod, bbStd]);
  const bollingerLegendItems = [
    { label: '상단', color: chartSettings.bollinger.upperColor, value: valueAt(bandData.upper, hoveredTime) },
    { label: '중심', color: chartSettings.bollinger.middleColor, value: valueAt(bandData.middle, hoveredTime) },
    { label: '하단', color: chartSettings.bollinger.lowerColor, value: valueAt(bandData.lower, hoveredTime) },
  ];
  const volumeValue = currentCandle?.volume ?? null;

  const rsiData = useMemo(() => rsi(candles, rsiPeriod), [candles, rsiPeriod]);
  const macdData = useMemo(() => macd(candles, macdFast, macdSlow, macdSignal), [candles, macdFast, macdSignal, macdSlow]);
  const stochData = useMemo(() => stochastic(candles, stochKPeriod, stochDPeriod), [candles, stochDPeriod, stochKPeriod]);
  const williamsData = useMemo(() => williamsR(candles, wrPeriod), [candles, wrPeriod]);
  const cciData = useMemo(() => cci(candles, cciPeriod), [candles, cciPeriod]);
  const rocData = useMemo(() => roc(candles, rocPeriod), [candles, rocPeriod]);
  const obvData = useMemo(() => obv(candles), [candles]);
  const paneLegendItems: IndicatorLegend[] = indicatorPanels.map((panel) => {
    if (panel === 'rsi') {
      return {
        id: panel,
        label: `RSI(${rsiPeriod})`,
        items: [{ label: '', color: chartSettings.rsi.lineColor, value: valueAt(rsiData, hoveredTime) }],
      };
    }
    if (panel === 'macd') {
      return {
        id: panel,
        label: `MACD(${macdFast},${macdSlow},${macdSignal})`,
        items: [
          { label: 'MACD', color: chartSettings.macd.macdColor, value: valueAt(macdData.macd, hoveredTime) },
          { label: 'Signal', color: chartSettings.macd.signalColor, value: valueAt(macdData.signal, hoveredTime) },
        ],
      };
    }
    if (panel === 'stochastic') {
      return {
        id: panel,
        label: `STOCH(${stochKPeriod},${stochDPeriod})`,
        items: [
          { label: '%K', color: chartSettings.stochastic.kColor, value: valueAt(stochData.k, hoveredTime) },
          { label: '%D', color: chartSettings.stochastic.dColor, value: valueAt(stochData.d, hoveredTime) },
        ],
      };
    }
    if (panel === 'williamsR') {
      return {
        id: panel,
        label: `Williams %R(${wrPeriod})`,
        items: [{ label: '', color: chartSettings.williamsR.lineColor, value: valueAt(williamsData, hoveredTime) }],
      };
    }
    if (panel === 'cci') {
      return {
        id: panel,
        label: `CCI(${cciPeriod})`,
        items: [{ label: '', color: chartSettings.cci.lineColor, value: valueAt(cciData, hoveredTime) }],
      };
    }
    if (panel === 'roc') {
      return {
        id: panel,
        label: `ROC(${rocPeriod})`,
        items: [{ label: '', color: chartSettings.roc.lineColor, value: valueAt(rocData, hoveredTime) }],
      };
    }
    return {
      id: panel,
      label: 'OBV',
      compact: true,
      items: [{ label: '', color: chartSettings.obv.lineColor, value: valueAt(obvData, hoveredTime) }],
    };
  });

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      ...getChartTheme(theme),
      width: containerRef.current.clientWidth,
      height,
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    const colors = getCandleColors(theme);
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.upWick,
      wickDownColor: colors.downWick,
      priceLineVisible: true,
      lastValueVisible: true,
    });
    candleSeriesRef.current = candleSeries;
    candleSeries.setData(candleData);

    if (isMaEnabled) {
      maSeries.forEach(({ instance, data }) => {
        chart
          .addSeries(LineSeries, { color: instance.color, lineWidth: 1, ...LINE_SERIES_DISPLAY_OPTIONS })
          .setData(data);
      });
    }

    if (isBollingerEnabled) {
      chart
        .addSeries(LineSeries, { color: chartSettings.bollinger.upperColor, lineWidth: 1, ...LINE_SERIES_DISPLAY_OPTIONS })
        .setData(bandData.upper);
      chart
        .addSeries(LineSeries, { color: chartSettings.bollinger.middleColor, lineWidth: 1, ...LINE_SERIES_DISPLAY_OPTIONS })
        .setData(bandData.middle);
      chart
        .addSeries(LineSeries, { color: chartSettings.bollinger.lowerColor, lineWidth: 1, ...LINE_SERIES_DISPLAY_OPTIONS })
        .setData(bandData.lower);
    }

    let nextPaneIndex = 1;
    if (isVolumeEnabled) {
      const volumePaneIndex = nextPaneIndex;
      chart.addPane(true);
      chart.panes()[volumePaneIndex]?.setHeight(96);
      chart
        .addSeries(
          HistogramSeries,
          { priceFormat: { type: 'custom', formatter: compactNumber }, lastValueVisible: false, priceLineVisible: false },
          volumePaneIndex,
        )
        .setData(
          candles.map((candle) => ({
            time: candle.time as Time,
            value: candle.volume,
            color: candle.close >= candle.open ? `${chartSettings.volume.upColor}66` : `${chartSettings.volume.downColor}66`,
          })) as HistogramData<Time>[],
        );
      nextPaneIndex += 1;
    }

    indicatorPanels.forEach((panel, index) => {
      const paneIndex = nextPaneIndex + index;
      chart.addPane(true);
      chart.panes()[paneIndex]?.setHeight(120);

      if (panel === 'rsi') {
        chart.addSeries(LineSeries, { color: chartSettings.rsi.lineColor, lineWidth: 2, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex).setData(rsiData);
        chart
          .addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex)
          .setData(candles.map((candle) => ({ time: candle.time as Time, value: rsiOverbought })));
        chart
          .addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex)
          .setData(candles.map((candle) => ({ time: candle.time as Time, value: rsiOversold })));
      }

      if (panel === 'macd') {
        chart.addSeries(LineSeries, { color: chartSettings.macd.macdColor, lineWidth: 2, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex).setData(macdData.macd);
        chart.addSeries(LineSeries, { color: chartSettings.macd.signalColor, lineWidth: 1, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex).setData(macdData.signal);
        chart
          .addSeries(HistogramSeries, { lastValueVisible: false, priceLineVisible: false }, paneIndex)
          .setData(macdData.histogram.map((item) => ({ ...item, color: chartSettings.macd.histogramColor })));
      }

      if (panel === 'stochastic') {
        chart.addSeries(LineSeries, { color: chartSettings.stochastic.kColor, lineWidth: 2, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex).setData(stochData.k);
        chart.addSeries(LineSeries, { color: chartSettings.stochastic.dColor, lineWidth: 1, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex).setData(stochData.d);
        chart
          .addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex)
          .setData(candles.map((candle) => ({ time: candle.time as Time, value: stochOverbought })));
        chart
          .addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex)
          .setData(candles.map((candle) => ({ time: candle.time as Time, value: stochOversold })));
      }

      if (panel === 'williamsR') {
        chart.addSeries(LineSeries, { color: chartSettings.williamsR.lineColor, lineWidth: 2, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex).setData(williamsData);
        chart
          .addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex)
          .setData(candles.map((candle) => ({ time: candle.time as Time, value: wrOverbought })));
        chart
          .addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex)
          .setData(candles.map((candle) => ({ time: candle.time as Time, value: wrOversold })));
      }

      if (panel === 'cci') {
        chart.addSeries(LineSeries, { color: chartSettings.cci.lineColor, lineWidth: 2, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex).setData(cciData);
        [-100, 100].forEach((value) => {
          chart
            .addSeries(LineSeries, { color: '#94a3b8', lineWidth: 1, lineStyle: LineStyle.Dashed, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex)
            .setData(candles.map((candle) => ({ time: candle.time as Time, value })));
        });
      }

      if (panel === 'roc') {
        chart.addSeries(LineSeries, { color: chartSettings.roc.lineColor, lineWidth: 2, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex).setData(rocData);
        chart
          .addSeries(LineSeries, { color: '#94a3b8', lineWidth: 1, lineStyle: LineStyle.Dashed, ...LINE_SERIES_DISPLAY_OPTIONS }, paneIndex)
          .setData(candles.map((candle) => ({ time: candle.time as Time, value: 0 })));
      }

      if (panel === 'obv') {
        chart
          .addSeries(
            LineSeries,
            { color: chartSettings.obv.lineColor, lineWidth: 2, priceFormat: { type: 'custom', formatter: compactNumber }, ...LINE_SERIES_DISPLAY_OPTIONS },
            paneIndex,
          )
          .setData(obvData);
      }
    });

    chart.panes()[0]?.setHeight(pricePaneHeight);
    chart.timeScale().fitContent();

    const handleCrosshairMove = (param: MouseEventParams<Time>) => setHoveredTime(param.time ?? null);
    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth, height });
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    window.addEventListener('resize', handleResize);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [
    bandData.lower,
    bandData.middle,
    bandData.upper,
    candleData,
    candles,
    cciData,
    height,
    indicatorPanels,
    isBollingerEnabled,
    isMaEnabled,
    isVolumeEnabled,
    maSeries,
    macdData.histogram,
    macdData.macd,
    macdData.signal,
    obvData,
    pricePaneHeight,
    rocData,
    rsiData,
    rsiOverbought,
    rsiOversold,
    stochData.d,
    stochData.k,
    stochOverbought,
    stochOversold,
    theme,
    chartSettings,
    williamsData,
    wrOverbought,
    wrOversold,
  ]);

  useEffect(() => {
    if (!latestCandle || !candleSeriesRef.current) return;
    candleSeriesRef.current.update({
      time: latestCandle.time as Time,
      open: latestCandle.open,
      high: latestCandle.high,
      low: latestCandle.low,
      close: latestCandle.close,
    });
  }, [latestCandle]);

  useEffect(() => {
    if (!activeSettingsPanel) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveSettingsPanel(null);
        setDraftSettings(null);
        setIsDraggingSettingsModal(false);
        modalDragStateRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSettingsPanel]);

  useEffect(() => {
    if (!activeSettingsPanel) return;

    const handleResize = () => {
      const containerWidth = containerRef.current?.clientWidth;
      if (!containerWidth) return;
      setModalPosition((current) => (current ? clampModalPosition(current, containerWidth, height) : current));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeSettingsPanel, height]);

  useEffect(() => {
    if (!isDraggingSettingsModal) return;

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = modalDragStateRef.current;
      const containerWidth = containerRef.current?.clientWidth;
      if (!dragState || !containerWidth) return;

      setModalPosition(
        clampModalPosition(
          {
            x: dragState.startPosition.x + event.clientX - dragState.startClientX,
            y: dragState.startPosition.y + event.clientY - dragState.startClientY,
          },
          containerWidth,
          height,
        ),
      );
    };

    const handlePointerUp = () => {
      setIsDraggingSettingsModal(false);
      modalDragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [height, isDraggingSettingsModal]);

  useEffect(() => {
    if (maAddRequestId === lastMaAddRequestIdRef.current) return;
    lastMaAddRequestIdRef.current = maAddRequestId;
    setMaInstances((current) => {
      const nextPeriod = getNextMaPeriod(current);
      const nextInstance = createMaInstance(
        `ma-custom-${nextMaInstanceIdRef.current}`,
        nextPeriod,
        themeMaColors[current.length % themeMaColors.length],
      );
      nextMaInstanceIdRef.current += 1;
      return [...current, nextInstance];
    });
    setIsLegendExpanded(true);
  }, [maAddRequestId, themeMaColors]);

  const openSettingsPanel = (panel: ChartIndicatorId) => {
    const containerWidth = containerRef.current?.clientWidth ?? SETTINGS_MODAL_WIDTH + SETTINGS_MODAL_MARGIN * 2;
    setActiveSettingsPanel(panel);
    setSettingsTab('inputs');
    setDraftSettings(cloneChartSettings(chartSettings));
    setDraftMaInstances(maInstances.map((instance) => ({ ...instance })));
    setDraftMainIndicators(mainIndicators);
    setDraftPaneIndicators(indicatorPanels);
    setModalPosition(getCenteredModalPosition(containerWidth, height));
  };

  const closeSettingsModal = () => {
    setActiveSettingsPanel(null);
    setDraftSettings(null);
    setDraftMaInstances([]);
    setIsDraggingSettingsModal(false);
    modalDragStateRef.current = null;
  };

  const handleSettingsModalPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!modalPosition) return;
    event.preventDefault();
    modalDragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosition: modalPosition,
    };
    setIsDraggingSettingsModal(true);
  };

  const toggleLegendExpanded = () => {
    setIsLegendExpanded((current) => !current);
  };

  const updateDraft = (updater: (settings: ChartIndicatorSettings) => ChartIndicatorSettings) => {
    setDraftSettings((current) => (current ? updater(current) : current));
  };

  const updateDraftMaInstance = (id: string, updater: (instance: MaInstance) => MaInstance) => {
    setDraftMaInstances((current) => current.map((instance) => (instance.id === id ? updater(instance) : instance)));
  };

  const deleteActiveMaInstance = (id: string) => {
    setMaInstances((current) => current.filter((instance) => instance.id !== id));
    closeSettingsModal();
  };

  const resetIndicatorSettings = (panel: ChartIndicatorId) => {
    if (isMaSettingsPanel(panel)) {
      const maId = maIdFromPanel(panel);
      setDraftMaInstances((current) =>
        current.map((instance, index) =>
          instance.id === maId
            ? createMaInstance(instance.id, Number(instance.id.match(/ma-(\d+)/)?.[1]) || instance.period, themeMaColors[index % themeMaColors.length])
            : instance,
        ),
      );
      return;
    }
    if (isNonMaSettingsIndicator(panel)) {
      setDraftSettings((current) => (current ? { ...current, [panel]: defaultSettingsFor(panel) } : current));
    }
  };

  const confirmSettingsModal = () => {
    if (draftSettings) setChartSettings(cloneChartSettings(draftSettings));
    if (draftMaInstances.length) setMaInstances(draftMaInstances.map((instance) => ({ ...instance })));
    DEFAULT_MAIN_INDICATORS.forEach((indicator) => {
      if (mainIndicators.includes(indicator) !== draftMainIndicators.includes(indicator)) {
        onToggleMainIndicator?.(indicator);
      }
    });
    const allPaneIndicators: PaneIndicatorId[] = ['rsi', 'macd', 'stochastic', 'williamsR', 'cci', 'roc', 'obv'];
    allPaneIndicators.forEach((indicator) => {
      if (indicatorPanels.includes(indicator) !== draftPaneIndicators.includes(indicator)) {
        onTogglePaneIndicator?.(indicator);
      }
    });
    closeSettingsModal();
  };

  const modalSettings = draftSettings ?? chartSettings;
  const activeMaId = isMaSettingsPanel(activeSettingsPanel) ? maIdFromPanel(activeSettingsPanel) : null;
  const activeDraftMa = activeMaId ? draftMaInstances.find((instance) => instance.id === activeMaId) : null;
  const modalBbPeriod = numericOverride(modalSettings.bollinger.period, runtimeParams?.bb_period ?? 20);
  const modalBbStd = numericOverride(modalSettings.bollinger.std, runtimeParams?.bb_std ?? 2);
  const modalRsiPeriod = numericOverride(modalSettings.rsi.period, runtimeParams?.rsi_period ?? 14);
  const modalRsiOverbought = numericOverride(modalSettings.rsi.overbought, runtimeParams?.rsi_overbought ?? 70);
  const modalRsiOversold = numericOverride(modalSettings.rsi.oversold, runtimeParams?.rsi_oversold ?? 30);
  const modalMacdFast = numericOverride(modalSettings.macd.fast, runtimeParams?.macd_fast ?? 12);
  const modalMacdSlow = numericOverride(modalSettings.macd.slow, runtimeParams?.macd_slow ?? 26);
  const modalMacdSignal = numericOverride(modalSettings.macd.signal, runtimeParams?.macd_signal ?? 9);
  const modalStochKPeriod = numericOverride(modalSettings.stochastic.kPeriod, runtimeParams?.stoch_k_period ?? 9);
  const modalStochDPeriod = numericOverride(modalSettings.stochastic.dPeriod, runtimeParams?.stoch_d_period ?? 6);
  const modalStochOverbought = numericOverride(modalSettings.stochastic.overbought, runtimeParams?.stoch_overbought ?? 80);
  const modalStochOversold = numericOverride(modalSettings.stochastic.oversold, runtimeParams?.stoch_oversold ?? 20);
  const modalWrPeriod = numericOverride(modalSettings.williamsR.period, runtimeParams?.wr_period ?? 14);
  const modalWrOverbought = numericOverride(modalSettings.williamsR.overbought, runtimeParams?.wr_overbought ?? -20);
  const modalWrOversold = numericOverride(modalSettings.williamsR.oversold, runtimeParams?.wr_oversold ?? -80);
  const modalCciPeriod = numericOverride(modalSettings.cci.period, runtimeParams?.cci_period ?? 14);
  const modalRocPeriod = numericOverride(modalSettings.roc.period, runtimeParams?.roc_period ?? 12);

  const settingsModal =
    activeSettingsPanel && draftSettings ? (
      <div
        className="absolute z-30 w-[min(380px,calc(100%-24px))] overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-2xl backdrop-blur"
        style={{
          left: modalPosition?.x ?? SETTINGS_MODAL_MARGIN,
          top: modalPosition?.y ?? SETTINGS_MODAL_MARGIN,
        }}
      >
        <div className="flex cursor-move touch-none select-none items-center justify-between px-5 py-4" onPointerDown={handleSettingsModalPointerDown}>
          <h4 className="text-lg font-bold text-text-primary">
            {activeDraftMa ? `MA ${activeDraftMa.period}` : indicatorTitle(activeSettingsPanel)}
          </h4>
          <button
            type="button"
            aria-label="설정 닫기"
            className="text-text-tertiary transition-colors hover:text-text-primary"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={closeSettingsModal}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex gap-6 border-b border-border px-5 text-sm font-bold text-text-secondary">
          {[
            ['inputs', '입력'],
            ['style', '모습'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`border-b-4 pb-3 transition-colors ${
                settingsTab === id ? 'border-text-primary text-text-primary' : 'border-transparent hover:text-text-primary'
              }`}
              onClick={() => setSettingsTab(id as SettingsTab)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-[260px] space-y-3 px-5 py-5">
          {settingsTab === 'inputs' && (
            <>
              {activeDraftMa && (
                <NumberField
                  label="기간"
                  min={1}
                  max={365}
                  value={activeDraftMa.period}
                  onChange={(value) =>
                    updateDraftMaInstance(activeDraftMa.id, (instance) => ({
                      ...instance,
                      period: normalizeMaPeriod(value, instance.period),
                    }))
                  }
                />
              )}
              {activeSettingsPanel === 'bollinger' && (
                <>
                  <NumberField
                    label="기간"
                    min={1}
                    max={365}
                    value={modalBbPeriod}
                    onChange={(value) => updateDraft((current) => ({ ...current, bollinger: { ...current.bollinger, period: value } }))}
                  />
                  <NumberField
                    label="표준편차"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={modalBbStd}
                    onChange={(value) => updateDraft((current) => ({ ...current, bollinger: { ...current.bollinger, std: value } }))}
                  />
                </>
              )}
              {activeSettingsPanel === 'volume' && <p className="text-sm text-text-tertiary">거래량은 입력 파라미터가 없습니다.</p>}
              {activeSettingsPanel === 'rsi' && (
                <>
                  <NumberField label="기간" min={2} value={modalRsiPeriod} onChange={(value) => updateDraft((current) => ({ ...current, rsi: { ...current.rsi, period: value } }))} />
                  <NumberField label="과매수" min={1} max={100} value={modalRsiOverbought} onChange={(value) => updateDraft((current) => ({ ...current, rsi: { ...current.rsi, overbought: value } }))} />
                  <NumberField label="과매도" min={0} max={99} value={modalRsiOversold} onChange={(value) => updateDraft((current) => ({ ...current, rsi: { ...current.rsi, oversold: value } }))} />
                </>
              )}
              {activeSettingsPanel === 'macd' && (
                <>
                  <NumberField label="빠른 EMA" min={1} value={modalMacdFast} onChange={(value) => updateDraft((current) => ({ ...current, macd: { ...current.macd, fast: value } }))} />
                  <NumberField label="느린 EMA" min={2} value={modalMacdSlow} onChange={(value) => updateDraft((current) => ({ ...current, macd: { ...current.macd, slow: value } }))} />
                  <NumberField label="Signal" min={1} value={modalMacdSignal} onChange={(value) => updateDraft((current) => ({ ...current, macd: { ...current.macd, signal: value } }))} />
                </>
              )}
              {activeSettingsPanel === 'stochastic' && (
                <>
                  <NumberField label="%K 기간" min={1} value={modalStochKPeriod} onChange={(value) => updateDraft((current) => ({ ...current, stochastic: { ...current.stochastic, kPeriod: value } }))} />
                  <NumberField label="%D 기간" min={1} value={modalStochDPeriod} onChange={(value) => updateDraft((current) => ({ ...current, stochastic: { ...current.stochastic, dPeriod: value } }))} />
                  <NumberField label="과매수" min={1} max={100} value={modalStochOverbought} onChange={(value) => updateDraft((current) => ({ ...current, stochastic: { ...current.stochastic, overbought: value } }))} />
                  <NumberField label="과매도" min={0} max={99} value={modalStochOversold} onChange={(value) => updateDraft((current) => ({ ...current, stochastic: { ...current.stochastic, oversold: value } }))} />
                </>
              )}
              {activeSettingsPanel === 'williamsR' && (
                <>
                  <NumberField label="기간" min={2} value={modalWrPeriod} onChange={(value) => updateDraft((current) => ({ ...current, williamsR: { ...current.williamsR, period: value } }))} />
                  <NumberField label="과매수" max={0} value={modalWrOverbought} onChange={(value) => updateDraft((current) => ({ ...current, williamsR: { ...current.williamsR, overbought: value } }))} />
                  <NumberField label="과매도" max={0} value={modalWrOversold} onChange={(value) => updateDraft((current) => ({ ...current, williamsR: { ...current.williamsR, oversold: value } }))} />
                </>
              )}
              {activeSettingsPanel === 'cci' && <NumberField label="기간" min={2} value={modalCciPeriod} onChange={(value) => updateDraft((current) => ({ ...current, cci: { ...current.cci, period: value } }))} />}
              {activeSettingsPanel === 'roc' && <NumberField label="기간" min={1} value={modalRocPeriod} onChange={(value) => updateDraft((current) => ({ ...current, roc: { ...current.roc, period: value } }))} />}
              {activeSettingsPanel === 'obv' && <p className="text-sm text-text-tertiary">OBV는 누적 거래량 기반이라 입력 파라미터가 없습니다.</p>}
            </>
          )}
          {settingsTab === 'style' && (
            <>
              {activeDraftMa && (
                <ColorField
                  label="선 색상"
                  value={activeDraftMa.color}
                  onChange={(value) => updateDraftMaInstance(activeDraftMa.id, (instance) => ({ ...instance, color: value }))}
                />
              )}
              {activeSettingsPanel === 'bollinger' && (
                <>
                  <ColorField label="상단 색상" value={modalSettings.bollinger.upperColor} onChange={(value) => updateDraft((current) => ({ ...current, bollinger: { ...current.bollinger, upperColor: value } }))} />
                  <ColorField label="중심 색상" value={modalSettings.bollinger.middleColor} onChange={(value) => updateDraft((current) => ({ ...current, bollinger: { ...current.bollinger, middleColor: value } }))} />
                  <ColorField label="하단 색상" value={modalSettings.bollinger.lowerColor} onChange={(value) => updateDraft((current) => ({ ...current, bollinger: { ...current.bollinger, lowerColor: value } }))} />
                </>
              )}
              {activeSettingsPanel === 'volume' && (
                <>
                  <ColorField label="상승 색상" value={modalSettings.volume.upColor} onChange={(value) => updateDraft((current) => ({ ...current, volume: { ...current.volume, upColor: value } }))} />
                  <ColorField label="하락 색상" value={modalSettings.volume.downColor} onChange={(value) => updateDraft((current) => ({ ...current, volume: { ...current.volume, downColor: value } }))} />
                </>
              )}
              {activeSettingsPanel === 'rsi' && <ColorField label="선 색상" value={modalSettings.rsi.lineColor} onChange={(value) => updateDraft((current) => ({ ...current, rsi: { ...current.rsi, lineColor: value } }))} />}
              {activeSettingsPanel === 'macd' && (
                <>
                  <ColorField label="MACD 색상" value={modalSettings.macd.macdColor} onChange={(value) => updateDraft((current) => ({ ...current, macd: { ...current.macd, macdColor: value } }))} />
                  <ColorField label="Signal 색상" value={modalSettings.macd.signalColor} onChange={(value) => updateDraft((current) => ({ ...current, macd: { ...current.macd, signalColor: value } }))} />
                  <ColorField label="Histogram 색상" value={modalSettings.macd.histogramColor} onChange={(value) => updateDraft((current) => ({ ...current, macd: { ...current.macd, histogramColor: value } }))} />
                </>
              )}
              {activeSettingsPanel === 'stochastic' && (
                <>
                  <ColorField label="%K 색상" value={modalSettings.stochastic.kColor} onChange={(value) => updateDraft((current) => ({ ...current, stochastic: { ...current.stochastic, kColor: value } }))} />
                  <ColorField label="%D 색상" value={modalSettings.stochastic.dColor} onChange={(value) => updateDraft((current) => ({ ...current, stochastic: { ...current.stochastic, dColor: value } }))} />
                </>
              )}
              {activeSettingsPanel === 'williamsR' && <ColorField label="선 색상" value={modalSettings.williamsR.lineColor} onChange={(value) => updateDraft((current) => ({ ...current, williamsR: { ...current.williamsR, lineColor: value } }))} />}
              {activeSettingsPanel === 'cci' && <ColorField label="선 색상" value={modalSettings.cci.lineColor} onChange={(value) => updateDraft((current) => ({ ...current, cci: { ...current.cci, lineColor: value } }))} />}
              {activeSettingsPanel === 'roc' && <ColorField label="선 색상" value={modalSettings.roc.lineColor} onChange={(value) => updateDraft((current) => ({ ...current, roc: { ...current.roc, lineColor: value } }))} />}
              {activeSettingsPanel === 'obv' && <ColorField label="선 색상" value={modalSettings.obv.lineColor} onChange={(value) => updateDraft((current) => ({ ...current, obv: { ...current.obv, lineColor: value } }))} />}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border bg-surface-2 px-5 py-4">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
            onClick={() => resetIndicatorSettings(activeSettingsPanel)}
          >
            초기화
          </button>
          {activeDraftMa && (
            <button
              type="button"
              className="ml-2 rounded-lg border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
              onClick={() => deleteActiveMaInstance(activeDraftMa.id)}
            >
              삭제
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
              onClick={closeSettingsModal}
            >
              취소
            </button>
            <button
              type="button"
              className="rounded-lg bg-text-primary px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-85"
              onClick={confirmSettingsModal}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-col gap-1 text-[11px] font-medium">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-text-tertiary">
            시 <span className="font-mono font-bold" style={{ color: ohlcColor }}>{formatChartValue(currentCandle?.open ?? null)}</span>
          </span>
          <span className="text-text-tertiary">
            고 <span className="font-mono font-bold" style={{ color: ohlcColor }}>{formatChartValue(currentCandle?.high ?? null)}</span>
          </span>
          <span className="text-text-tertiary">
            저 <span className="font-mono font-bold" style={{ color: ohlcColor }}>{formatChartValue(currentCandle?.low ?? null)}</span>
          </span>
          <span className="text-text-tertiary">
            종 <span className="font-mono font-bold" style={{ color: ohlcColor }}>{formatChartValue(currentCandle?.close ?? null)}</span>
          </span>
          <span className="font-mono font-bold" style={{ color: ohlcColor }}>
            {formatSignedChartValue(candleChange)} {formatSignedPercent(candleChangePercent)}
          </span>
        </div>
        <button
          type="button"
          aria-label={isLegendExpanded ? '지표값 접기' : '지표값 펼치기'}
          className="pointer-events-auto flex h-6 w-7 items-center justify-center rounded border border-border/80 bg-surface/85 text-text-secondary transition-colors hover:border-accent/70 hover:text-accent"
          onClick={toggleLegendExpanded}
        >
          {isLegendExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
      {isLegendExpanded && (
        <>
          {isMaEnabled &&
            maLegendItems.map((item, index) => (
              <LegendRow
                key={item.id}
                top={62 + index * 24}
                title={item.label}
                items={[{ label: '', color: item.color, value: item.value }]}
                panelId={maPanelId(item.id ?? '')}
                isSettingsOpen={activeSettingsPanel === maPanelId(item.id ?? '')}
                onOpenSettings={openSettingsPanel}
                onRemove={() => deleteActiveMaInstance(item.id ?? '')}
              />
            ))}
          {isBollingerEnabled && (
            <LegendRow
              top={62 + maLegendItems.length * 24}
              title={`BB ${bbPeriod} SMA close ${bbStd}`}
              items={bollingerLegendItems}
              panelId="bollinger"
              isSettingsOpen={activeSettingsPanel === 'bollinger'}
              onOpenSettings={openSettingsPanel}
              onRemove={() => onToggleMainIndicator?.('bollinger')}
            />
          )}
        </>
      )}
      {isVolumeEnabled && (
        <LegendRow
          top={pricePaneHeight + 10}
          title="거래량"
          compact
          items={[{ label: '', color: '#22c55e', value: volumeValue }]}
          panelId="volume"
          isSettingsOpen={activeSettingsPanel === 'volume'}
          onOpenSettings={openSettingsPanel}
          onRemove={() => onToggleMainIndicator?.('volume')}
        />
      )}
      {paneLegendItems.map((legend, index) => (
        <LegendRow
          key={legend.id}
          top={pricePaneHeight + volumePaneHeight + index * 120 + 10}
          title={legend.label}
          compact={legend.compact}
          items={legend.items}
          panelId={legend.id}
          isSettingsOpen={activeSettingsPanel === legend.id}
          onOpenSettings={openSettingsPanel}
          onRemove={() => onTogglePaneIndicator?.(legend.id as PaneIndicatorId)}
        />
      ))}
      {settingsModal}
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
}
