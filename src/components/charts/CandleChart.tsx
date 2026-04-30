import { useEffect, useRef, useState } from 'react';
import {
  CandlestickData,
  CandlestickSeries,
  HistogramData,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  Time,
  createChart,
} from 'lightweight-charts';
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

export type IndicatorPanelId = 'rsi' | 'macd' | 'stochastic' | 'williamsR' | 'cci' | 'roc' | 'obv';

interface CandleChartProps {
  candles: Candle[];
  latestCandle?: Candle | null;
  enabledMAs?: number[];
  indicatorPanels?: IndicatorPanelId[];
  runtimeParams?: RuntimeIndicatorParams;
  theme?: 'dark' | 'light';
  height?: number;
}

const DEFAULT_ENABLED_MAS = [5, 20, 60];
const LINE_SERIES_DISPLAY_OPTIONS = {
  crosshairMarkerVisible: false,
  lastValueVisible: false,
  priceLineVisible: false,
};

function lastValue(series: { value: number }[]): number | null {
  return series.length ? series[series.length - 1].value : null;
}

export default function CandleChart({
  candles,
  latestCandle,
  enabledMAs = DEFAULT_ENABLED_MAS,
  indicatorPanels = ['rsi', 'macd'],
  runtimeParams,
  theme = 'dark',
  height = 420,
}: CandleChartProps) {
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const maLegend = enabledMAs.map((period) => ({ label: `MA${period}`, value: lastValue(sma(candles, period)) }));
  const bandLegend = bollingerBands(candles, runtimeParams?.bb_period ?? 20, runtimeParams?.bb_std ?? 2);
  const legendItems = [
    { label: '종가', value: candles.length ? candles[candles.length - 1].close : null },
    ...maLegend,
    { label: '볼린저 상단', value: lastValue(bandLegend.upper) },
    { label: '볼린저 중심', value: lastValue(bandLegend.middle) },
    { label: '볼린저 하단', value: lastValue(bandLegend.lower) },
  ];

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      ...getChartTheme(theme),
      width: containerRef.current.clientWidth,
      height,
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
    });
    candleSeriesRef.current = candleSeries;
    candleSeries.setData(
      candles.map((candle) => ({
        time: candle.time as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })) as CandlestickData<Time>[],
    );

    const maColors = getMAColors(theme);
    enabledMAs.forEach((period, index) => {
      chart.addSeries(LineSeries, {
        color: maColors[index % maColors.length],
        lineWidth: 1,
        ...LINE_SERIES_DISPLAY_OPTIONS,
      }).setData(sma(candles, period));
    });

    const bands = bollingerBands(candles, runtimeParams?.bb_period ?? 20, runtimeParams?.bb_std ?? 2);
    chart.addSeries(LineSeries, {
      color: 'rgba(245,158,11,0.85)',
      lineWidth: 1,
      ...LINE_SERIES_DISPLAY_OPTIONS,
    }).setData(bands.upper);
    chart.addSeries(LineSeries, {
      color: 'rgba(148,163,184,0.65)',
      lineWidth: 1,
      ...LINE_SERIES_DISPLAY_OPTIONS,
    }).setData(bands.middle);
    chart.addSeries(LineSeries, {
      color: 'rgba(245,158,11,0.85)',
      lineWidth: 1,
      ...LINE_SERIES_DISPLAY_OPTIONS,
    }).setData(bands.lower);

    chart.addPane(true);
    chart.panes()[1]?.setHeight(96);
    chart.addSeries(
      HistogramSeries,
      {
        title: '거래량',
        priceFormat: { type: 'custom', formatter: compactNumber },
      },
      1,
    ).setData(
      candles.map((candle, index) => ({
        time: candle.time as Time,
        value: candle.volume,
        color:
          index === 0 || candle.close >= candles[index - 1].close
            ? 'rgba(34,197,94,0.45)'
            : 'rgba(239,68,68,0.45)',
      })) as HistogramData<Time>[],
    );

    indicatorPanels.forEach((panel, index) => {
      const paneIndex = index + 2;
      chart.addPane(true);
      chart.panes()[paneIndex]?.setHeight(120);

      if (panel === 'rsi') {
        const period = runtimeParams?.rsi_period ?? 14;
        const overbought = runtimeParams?.rsi_overbought ?? 70;
        const oversold = runtimeParams?.rsi_oversold ?? 30;
        chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 2, title: `RSI(${period})` }, paneIndex).setData(rsi(candles, period));
        chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed }, paneIndex).setData(
          candles.map((candle) => ({ time: candle.time as Time, value: overbought })),
        );
        chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed }, paneIndex).setData(
          candles.map((candle) => ({ time: candle.time as Time, value: oversold })),
        );
      }

      if (panel === 'macd') {
        const data = macd(candles, runtimeParams?.macd_fast ?? 12, runtimeParams?.macd_slow ?? 26, runtimeParams?.macd_signal ?? 9);
        chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, title: 'MACD' }, paneIndex).setData(data.macd);
        chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, title: 'Signal' }, paneIndex).setData(data.signal);
        chart.addSeries(HistogramSeries, {}, paneIndex).setData(data.histogram);
      }

      if (panel === 'stochastic') {
        const data = stochastic(candles, runtimeParams?.stoch_k_period ?? 9, runtimeParams?.stoch_d_period ?? 6);
        chart.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 2, title: '%K' }, paneIndex).setData(data.k);
        chart.addSeries(LineSeries, { color: '#facc15', lineWidth: 1, title: '%D' }, paneIndex).setData(data.d);
        chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed }, paneIndex).setData(
          candles.map((candle) => ({ time: candle.time as Time, value: runtimeParams?.stoch_overbought ?? 80 })),
        );
        chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed }, paneIndex).setData(
          candles.map((candle) => ({ time: candle.time as Time, value: runtimeParams?.stoch_oversold ?? 20 })),
        );
      }

      if (panel === 'williamsR') {
        chart.addSeries(LineSeries, { color: '#c084fc', lineWidth: 2, title: `Williams %R(${runtimeParams?.wr_period ?? 14})` }, paneIndex).setData(
          williamsR(candles, runtimeParams?.wr_period ?? 14),
        );
        chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed }, paneIndex).setData(
          candles.map((candle) => ({ time: candle.time as Time, value: runtimeParams?.wr_overbought ?? -20 })),
        );
        chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed }, paneIndex).setData(
          candles.map((candle) => ({ time: candle.time as Time, value: runtimeParams?.wr_oversold ?? -80 })),
        );
      }

      if (panel === 'cci') {
        chart.addSeries(LineSeries, { color: '#fb7185', lineWidth: 2, title: `CCI(${runtimeParams?.cci_period ?? 14})` }, paneIndex).setData(
          cci(candles, runtimeParams?.cci_period ?? 14),
        );
        [-100, 100].forEach((value) => {
          chart.addSeries(LineSeries, { color: '#94a3b8', lineWidth: 1, lineStyle: LineStyle.Dashed }, paneIndex).setData(
            candles.map((candle) => ({ time: candle.time as Time, value })),
          );
        });
      }

      if (panel === 'roc') {
        chart.addSeries(LineSeries, { color: '#2dd4bf', lineWidth: 2, title: `ROC(${runtimeParams?.roc_period ?? 12})` }, paneIndex).setData(
          roc(candles, runtimeParams?.roc_period ?? 12),
        );
        chart.addSeries(LineSeries, { color: '#94a3b8', lineWidth: 1, lineStyle: LineStyle.Dashed }, paneIndex).setData(
          candles.map((candle) => ({ time: candle.time as Time, value: 0 })),
        );
      }

      if (panel === 'obv') {
        const obvSeries = chart.addSeries(
          LineSeries,
          {
            color: '#34d399',
            lineWidth: 2,
            title: `OBV(${runtimeParams?.obv_lookback ?? 5})`,
            priceFormat: { type: 'custom', formatter: compactNumber },
          },
          paneIndex,
        );
        obvSeries.setData(obv(candles));
      }
    });

    chart.panes()[0]?.setHeight(Math.max(300, height - 96 - indicatorPanels.length * 120));
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [candles, enabledMAs, height, indicatorPanels, runtimeParams, theme]);

  useEffect(() => {
    if (!candleSeriesRef.current || !latestCandle) return;

    candleSeriesRef.current.update({
      time: latestCandle.time as Time,
      open: latestCandle.open,
      high: latestCandle.high,
      low: latestCandle.low,
      close: latestCandle.close,
    });
  }, [latestCandle]);

  return (
    <div className="relative">
      <div className="absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] rounded-card border border-border bg-surface-1/90 p-2 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => setIsLegendOpen((value) => !value)}
          className="text-[11px] font-bold text-text-secondary transition-colors hover:text-text-primary"
        >
          {isLegendOpen ? '지표값 접기' : `지표값 ${legendItems.length}개`}
        </button>
        {isLegendOpen && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {legendItems.map((item) => (
              <span key={item.label} className="text-text-tertiary">
                {item.label}{' '}
                <span className="font-mono font-bold text-text-primary">
                  {item.value === null ? '-' : item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
}
