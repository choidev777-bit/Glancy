import type { HistogramData, LineData, Time } from 'lightweight-charts';
import type { Candle } from './api';

export type OscillatorSeries = LineData<Time>[];

function safePeriod(period: number | undefined, fallback: number): number {
  return Number.isFinite(period) && period && period > 0 ? Math.floor(period) : fallback;
}

export function sma(candles: Candle[], periodInput: number): LineData<Time>[] {
  const period = safePeriod(periodInput, 14);
  const output: LineData<Time>[] = [];
  for (let index = period - 1; index < candles.length; index += 1) {
    const slice = candles.slice(index - period + 1, index + 1);
    const value = slice.reduce((sum, candle) => sum + candle.close, 0) / period;
    output.push({ time: candles[index].time as Time, value });
  }
  return output;
}

export function ema(values: number[], periodInput: number): number[] {
  const period = safePeriod(periodInput, 14);
  const multiplier = 2 / (period + 1);
  const output: number[] = [];
  values.forEach((value, index) => {
    output.push(index === 0 ? value : value * multiplier + output[index - 1] * (1 - multiplier));
  });
  return output;
}

export function rsi(candles: Candle[], periodInput = 14): OscillatorSeries {
  const period = safePeriod(periodInput, 14);
  const output: LineData<Time>[] = [];
  for (let index = period; index < candles.length; index += 1) {
    const slice = candles.slice(index - period + 1, index + 1);
    let gains = 0;
    let losses = 0;
    for (let inner = 1; inner < slice.length; inner += 1) {
      const diff = slice[inner].close - slice[inner - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const rs = gains / (losses || 1);
    output.push({ time: candles[index].time as Time, value: 100 - 100 / (1 + rs) });
  }
  return output;
}

export function macd(candles: Candle[], fastInput = 12, slowInput = 26, signalInput = 9) {
  const closes = candles.map((candle) => candle.close);
  const fast = ema(closes, fastInput);
  const slow = ema(closes, slowInput);
  const macdLine = fast.map((value, index) => value - slow[index]);
  const signalLine = ema(macdLine, signalInput);
  const histogram = macdLine.map((value, index) => value - signalLine[index]);

  return {
    macd: macdLine.map((value, index) => ({ time: candles[index].time as Time, value })) as LineData<Time>[],
    signal: signalLine.map((value, index) => ({ time: candles[index].time as Time, value })) as LineData<Time>[],
    histogram: histogram.map((value, index) => ({
      time: candles[index].time as Time,
      value,
      color: value >= 0 ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)',
    })) as HistogramData<Time>[],
  };
}

export function stochastic(candles: Candle[], kInput = 9, dInput = 6) {
  const kPeriod = safePeriod(kInput, 9);
  const dPeriod = safePeriod(dInput, 6);
  const kValues: LineData<Time>[] = [];
  const rawK: number[] = [];

  for (let index = kPeriod - 1; index < candles.length; index += 1) {
    const slice = candles.slice(index - kPeriod + 1, index + 1);
    const highest = Math.max(...slice.map((candle) => candle.high));
    const lowest = Math.min(...slice.map((candle) => candle.low));
    const range = highest - lowest || 1;
    const value = ((candles[index].close - lowest) / range) * 100;
    rawK.push(value);
    kValues.push({ time: candles[index].time as Time, value });
  }

  const dValues: LineData<Time>[] = [];
  for (let index = dPeriod - 1; index < rawK.length; index += 1) {
    const slice = rawK.slice(index - dPeriod + 1, index + 1);
    const value = slice.reduce((sum, item) => sum + item, 0) / dPeriod;
    dValues.push({ time: kValues[index].time, value });
  }

  return { k: kValues, d: dValues };
}

export function bollingerBands(candles: Candle[], periodInput = 20, stdInput = 2) {
  const period = safePeriod(periodInput, 20);
  const stdMultiplier = Number.isFinite(stdInput) && stdInput > 0 ? stdInput : 2;
  const upper: LineData<Time>[] = [];
  const middle: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];

  for (let index = period - 1; index < candles.length; index += 1) {
    const slice = candles.slice(index - period + 1, index + 1);
    const avg = slice.reduce((sum, candle) => sum + candle.close, 0) / period;
    const variance = slice.reduce((sum, candle) => sum + (candle.close - avg) ** 2, 0) / period;
    const band = Math.sqrt(variance) * stdMultiplier;
    const time = candles[index].time as Time;
    upper.push({ time, value: avg + band });
    middle.push({ time, value: avg });
    lower.push({ time, value: avg - band });
  }

  return { upper, middle, lower };
}

export function williamsR(candles: Candle[], periodInput = 14): OscillatorSeries {
  const period = safePeriod(periodInput, 14);
  const output: LineData<Time>[] = [];
  for (let index = period - 1; index < candles.length; index += 1) {
    const slice = candles.slice(index - period + 1, index + 1);
    const highest = Math.max(...slice.map((candle) => candle.high));
    const lowest = Math.min(...slice.map((candle) => candle.low));
    const value = ((highest - candles[index].close) / (highest - lowest || 1)) * -100;
    output.push({ time: candles[index].time as Time, value });
  }
  return output;
}

export function cci(candles: Candle[], periodInput = 14): OscillatorSeries {
  const period = safePeriod(periodInput, 14);
  const typical = candles.map((candle) => (candle.high + candle.low + candle.close) / 3);
  const output: LineData<Time>[] = [];

  for (let index = period - 1; index < candles.length; index += 1) {
    const slice = typical.slice(index - period + 1, index + 1);
    const avg = slice.reduce((sum, value) => sum + value, 0) / period;
    const meanDeviation = slice.reduce((sum, value) => sum + Math.abs(value - avg), 0) / period || 1;
    output.push({ time: candles[index].time as Time, value: (typical[index] - avg) / (0.015 * meanDeviation) });
  }

  return output;
}

export function roc(candles: Candle[], periodInput = 12): OscillatorSeries {
  const period = safePeriod(periodInput, 12);
  const output: LineData<Time>[] = [];
  for (let index = period; index < candles.length; index += 1) {
    const base = candles[index - period].close || 1;
    output.push({ time: candles[index].time as Time, value: ((candles[index].close - base) / base) * 100 });
  }
  return output;
}

export function obv(candles: Candle[]): OscillatorSeries {
  const output: LineData<Time>[] = [];
  let total = 0;
  candles.forEach((candle, index) => {
    if (index > 0) {
      if (candle.close > candles[index - 1].close) total += candle.volume;
      if (candle.close < candles[index - 1].close) total -= candle.volume;
    }
    output.push({ time: candle.time as Time, value: total });
  });
  return output;
}

export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}
