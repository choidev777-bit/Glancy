import assert from 'node:assert/strict';
import fs from 'node:fs';

const dashboard = fs.readFileSync('src/components/dashboard/CompositePortfolioDashboard.tsx', 'utf8');
const api = fs.readFileSync('src/lib/api.ts', 'utf8');

assert.match(
  dashboard,
  /내장 심사용 샘플 표시 중/,
  'judge fallback copy should be calm and explicit',
);

assert.doesNotMatch(
  dashboard,
  /샘플 API 응답 지연/,
  'judge-facing copy should not look like an API failure warning',
);

assert.match(
  dashboard,
  /console\.(warn|debug|error)/,
  'development should still log sample API failures outside the judge-facing UI',
);

assert.match(
  api,
  /AbortController|timeoutMs|setTimeout/,
  'sample API loading should have a bounded timeout so fallback can settle predictably',
);

console.log('judge fallback behavior checks passed');
