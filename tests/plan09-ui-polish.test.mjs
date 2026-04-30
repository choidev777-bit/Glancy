import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const app = read('src/App.tsx');
const summary = read('src/components/analysis/SummaryView.tsx');
const fundamental = read('src/components/analysis/FundamentalView.tsx');
const gauge = read('src/components/common/Gauge.tsx');
const header = read('src/components/layout/Header.tsx');
const css = read('src/index.css');
const index = read('index.html');

assert.match(summary, /onNavigate/);
assert.match(summary, /fundamentalDisabled/);
assert.match(app, /<SummaryView[\s\S]*onNavigate=/);
assert.match(app, /<UploadView/);

for (const file of [
  'src/components/upload/UploadView.tsx',
  'src/components/common/Skeleton.tsx',
  'src/components/common/ErrorState.tsx',
  'src/components/common/EmptyState.tsx',
]) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
}

assert.match(fundamental, /koreanAvailable/);
assert.match(fundamental, /market/);
assert.match(gauge, /viewBox="0 0 200 110"/);
assert.match(header, /mobileSearchOpen/);
assert.match(css, /\.no-scrollbar/);
assert.match(index, /pretendard/i);
assert.match(index, /JetBrains\+Mono/);
