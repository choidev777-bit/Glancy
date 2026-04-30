import { useEffect, useRef } from 'react';
import { HistogramData, HistogramSeries, LineData, LineSeries, Time, createChart } from 'lightweight-charts';
import type { Candle } from '../../lib/api';
import { getChartTheme } from '../../lib/chart-theme';

interface MACDChartProps {
  candles: Candle[];
  fast?: number;
  slow?: number;
  signal?: number;
  theme?: 'dark' | 'light';
  height?: number;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const output: number[] = [];
  values.forEach((value, index) => {
    output.push(index === 0 ? value : value * k + output[index - 1] * (1 - k));
  });
  return output;
}

export default function MACDChart({
  candles,
  fast = 12,
  slow = 26,
  signal = 9,
  theme = 'dark',
  height = 160,
}: MACDChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...getChartTheme(theme),
      width: containerRef.current.clientWidth,
      height,
    });

    const closes = candles.map((candle) => candle.close);
    const fastEma = ema(closes, fast);
    const slowEma = ema(closes, slow);
    const macd = fastEma.map((value, index) => value - slowEma[index]);
    const signalLine = ema(macd, signal);
    const histogram = macd.map((value, index) => value - signalLine[index]);

    chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, title: 'MACD' }).setData(
      macd.map((value, index) => ({ time: candles[index].time as Time, value })) as LineData<Time>[],
    );
    chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, title: 'Signal' }).setData(
      signalLine.map((value, index) => ({ time: candles[index].time as Time, value })) as LineData<Time>[],
    );
    chart.addSeries(HistogramSeries).setData(
      histogram.map((value, index) => ({
        time: candles[index].time as Time,
        value,
        color: value >= 0 ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)',
      })) as HistogramData<Time>[],
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles, fast, height, signal, slow, theme]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
