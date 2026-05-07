import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const app = read('src/App.tsx');
const summary = read('src/components/analysis/SummaryView.tsx');
const fundamental = read('src/components/analysis/FundamentalView.tsx');
const gauge = read('src/components/common/Gauge.tsx');
const header = read('src/components/layout/Header.tsx');
const dashboard = read('src/components/dashboard/CompositePortfolioDashboard.tsx');
const upload = read('src/components/upload/UploadView.tsx');
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
assert.doesNotMatch(dashboard, /function MetricCard[\s\S]*border-l-4/);
assert.match(dashboard, /function MetricCard[\s\S]*shadow-subtle/);
assert.match(upload, /className="[^"]*\bmt-6\b[^"]*space-y-6/);
assert.match(upload, /key:\s*'composite_portfolio'[\s\S]*종합 포트폴리오/);
assert.match(upload, /Ticker(?:와|\/)Weight\/Quantity|Weight\/Quantity/);
assert.match(upload, /Open,\s*High,\s*Low,\s*Close/);
assert.match(css, /\.no-scrollbar/);
assert.match(index, /pretendard/i);
assert.match(index, /JetBrains\+Mono/);
