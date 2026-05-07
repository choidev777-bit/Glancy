import type { Candle } from './api';
import type { ChartTimeframe } from './timeframes';

function utcDayStart(time: number) {
  const date = new Date(time * 1000);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 1000;
}

function utcWeekStart(time: number) {
  const date = new Date(utcDayStart(time) * 1000);
  const day = date.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.getTime() / 1000;
}

function utcMonthStart(time: number) {
  const date = new Date(time * 1000);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / 1000;
}

function bucketStart(time: number, timeframe: Exclude<ChartTimeframe, '1H'>) {
  if (timeframe === '1D') return utcDayStart(time);
  if (timeframe === '1W') return utcWeekStart(time);
  return utcMonthStart(time);
}

export function aggregateCandlesForTimeframe(candles: Candle[], timeframe: ChartTimeframe): Candle[] {
  const sorted = [...candles].sort((a, b) => a.time - b.time);
  if (timeframe === '1H') return sorted;

  const aggregated: Candle[] = [];
  let current: Candle | null = null;
  let currentBucket = Number.NaN;

  for (const candle of sorted) {
    const nextBucket = bucketStart(candle.time, timeframe);
    if (!current || nextBucket !== currentBucket) {
      if (current) aggregated.push(current);
      currentBucket = nextBucket;
      current = {
        time: nextBucket,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      };
      continue;
    }

    current.high = Math.max(current.high, candle.high);
    current.low = Math.min(current.low, candle.low);
    current.close = candle.close;
    current.volume += candle.volume;
  }

  if (current) aggregated.push(current);
  return aggregated;
}
