import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

for (const file of [
  'backend/app/reliability/__init__.py',
  'backend/app/reliability/cache.py',
  'backend/app/reliability/fallback.py',
  'backend/app/reliability/status.py',
  'backend/app/reliability/wrappers.py',
  'backend/app/sample_data/kr_005930.json',
  'backend/app/sample_data/us_aapl.json',
  'backend/app/sample_data/etf_spy.json',
  'backend/app/sample_data/crypto_btcusdt.json',
  'backend/app/sample_data/index_gspc.json',
  'src/components/common/DataStatusBadge.tsx',
  'backend/tests/test_reliability.py',
]) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
}

const api = read('src/lib/api.ts');
assert.match(api, /MarketDataMeta/);
assert.match(api, /data_status\?: 'live' \| 'cached' \| 'sample'/);

const assetHeader = read('src/components/dashboard/AssetHeader.tsx');
assert.match(assetHeader, /DataStatusBadge/);

const krRouter = read('backend/app/routers/kr_stocks.py');
assert.match(krRouter, /reliable_market_data/);
assert.match(krRouter, /def get_kr_stock[\s\S]*return reliable_market_data/);

const qa = read('docs/deployment/qa-checklist.md');
assert.match(qa, /Sample fallback/);
assert.match(qa, /Cached/);
assert.match(qa, /Live/);
