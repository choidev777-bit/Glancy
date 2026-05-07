import assert from 'node:assert/strict';
import fs from 'node:fs';

const dashboard = fs.readFileSync('src/components/dashboard/CompositePortfolioDashboard.tsx', 'utf8');
const compositeData = fs.readFileSync('src/data/compositePortfolio.ts', 'utf8');
const snapshotPath = 'src/data/compositePortfolioOhlcvSnapshot.json';

assert.doesNotMatch(
  dashboard,
  /createCompositeSampleCandles|syntheticCandles/,
  'CompositePortfolioDashboard must not use generated synthetic candles for portfolio charts',
);

assert.doesNotMatch(
  compositeData,
  /createCompositeSampleCandles|Math\.sin|Math\.cos/,
  'composite portfolio data module must not keep generated candle formulas',
);

assert.ok(fs.existsSync(snapshotPath), 'portfolio charts need a committed real OHLCV snapshot JSON');

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
for (const ticker of ['005930', 'AAPL', 'MSFT', 'SPY', 'BTC', 'GLD']) {
  const candles = snapshot[ticker];
  assert.ok(Array.isArray(candles), `${ticker} snapshot must be an array`);
  assert.ok(candles.length >= 200, `${ticker} must have at least 200 real daily candles`);
}

const samsungCloses = snapshot['005930'].map((candle) => Number(candle.close));
assert.ok(
  samsungCloses.some((close) => close > 100000),
  'Samsung snapshot must not be the old generated 70,000 KRW range',
);

console.log('composite real OHLCV snapshot checks passed');
