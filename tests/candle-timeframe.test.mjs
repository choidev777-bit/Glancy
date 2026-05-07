import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync('src/lib/candle-timeframe.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const module = { exports: {} };
vm.runInNewContext(compiled.outputText, { module, exports: module.exports });

const { aggregateCandlesForTimeframe } = module.exports;
const time = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const candle = (iso, open, high, low, close, volume) => ({
  time: time(iso),
  open,
  high,
  low,
  close,
  volume,
});

const unsorted = [
  candle('2024-01-02T10:00:00Z', 12, 18, 11, 16, 120),
  candle('2024-01-01T10:00:00Z', 10, 15, 9, 14, 100),
  candle('2024-01-01T11:00:00Z', 14, 17, 13, 15, 80),
  candle('2024-01-08T09:00:00Z', 20, 22, 19, 21, 200),
  candle('2024-02-01T09:00:00Z', 30, 33, 28, 32, 300),
];

assert.equal(
  JSON.stringify(aggregateCandlesForTimeframe(unsorted, '1H').map((row) => row.time)),
  JSON.stringify(unsorted.map((row) => row.time).sort((a, b) => a - b)),
  '1H must preserve the raw candles sorted by time',
);

assert.equal(
  JSON.stringify(aggregateCandlesForTimeframe(unsorted, '1D').map((row) => ({
    time: row.time,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }))),
  JSON.stringify([
    { time: time('2024-01-01T00:00:00Z'), open: 10, high: 17, low: 9, close: 15, volume: 180 },
    { time: time('2024-01-02T00:00:00Z'), open: 12, high: 18, low: 11, close: 16, volume: 120 },
    { time: time('2024-01-08T00:00:00Z'), open: 20, high: 22, low: 19, close: 21, volume: 200 },
    { time: time('2024-02-01T00:00:00Z'), open: 30, high: 33, low: 28, close: 32, volume: 300 },
  ]),
  '1D must aggregate OHLCV by UTC date',
);

assert.equal(
  JSON.stringify(aggregateCandlesForTimeframe(unsorted, '1W').map((row) => ({
    time: row.time,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }))),
  JSON.stringify([
    { time: time('2024-01-01T00:00:00Z'), open: 10, high: 18, low: 9, close: 16, volume: 300 },
    { time: time('2024-01-08T00:00:00Z'), open: 20, high: 22, low: 19, close: 21, volume: 200 },
    { time: time('2024-01-29T00:00:00Z'), open: 30, high: 33, low: 28, close: 32, volume: 300 },
  ]),
  '1W must aggregate by UTC week starting Monday',
);

assert.equal(
  JSON.stringify(aggregateCandlesForTimeframe(unsorted, '1M').map((row) => ({
    time: row.time,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }))),
  JSON.stringify([
    { time: time('2024-01-01T00:00:00Z'), open: 10, high: 22, low: 9, close: 21, volume: 500 },
    { time: time('2024-02-01T00:00:00Z'), open: 30, high: 33, low: 28, close: 32, volume: 300 },
  ]),
  '1M must aggregate by UTC month',
);

console.log('candle timeframe tests passed');
