import { useEffect, useRef } from 'react';
import { IChartApi, LineData, LineSeries, Time, createChart } from 'lightweight-charts';
import type { Candle } from '../../lib/api';
import { getChartTheme } from '../../lib/chart-theme';

interface RSIChartProps {
  candles: Candle[];
  period?: number;
  overbought?: number;
  oversold?: number;
  theme?: 'dark' | 'light';
  height?: number;
}

function calculateRsi(candles: Candle[], period: number): LineData<Time>[] {
  const closes = candles.map((candle) => candle.close);
  const output: LineData<Time>[] = [];

  for (let index = period; index < closes.length; index += 1) {
    const slice = closes.slice(index - period + 1, index + 1);
    let gains = 0;
    let losses = 0;
    for (let inner = 1; inner < slice.length; inner += 1) {
      const diff = slice[inner] - slice[inner - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const rs = gains / (losses || 1);
    output.push({ time: candles[index].time as Time, value: 100 - 100 / (1 + rs) });
  }

  return output;
}

export default function RSIChart({
  candles,
  period = 14,
  overbought = 70,
  oversold = 30,
  theme = 'dark',
  height = 160,
}: RSIChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...getChartTheme(theme),
      width: containerRef.current.clientWidth,
      height,
    });
    chartRef.current = chart;

    const rsiSeries = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2, title: `RSI(${period})` });
    rsiSeries.setData(calculateRsi(candles, period));

    const overboughtLine = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: 2 });
    overboughtLine.setData(candles.map((candle) => ({ time: candle.time as Time, value: overbought })));

    const oversoldLine = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, lineStyle: 2 });
    oversoldLine.setData(candles.map((candle) => ({ time: candle.time as Time, value: oversold })));

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, height, overbought, oversold, period, theme]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
