import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/components/analysis/FundamentalView.tsx', 'utf8');
const mockData = fs.readFileSync('src/data/mockData.ts', 'utf8');

assert.doesNotMatch(
  source,
  /5년 추이/,
  'fundamental top-level trend tab must be labeled 추이, not 5년 추이',
);

assert.match(
  source,
  /연간/,
  'fundamental trend view must expose an annual range selector',
);

assert.match(
  source,
  /분기/,
  'fundamental trend view must expose a quarterly range selector',
);

assert.match(
  source,
  /2021-2025|최근/,
  'annual trend cards must explain their visible comparison range',
);

assert.doesNotMatch(
  source,
  /최근 20개 분기 비교/,
  'quarterly trend cards must not hard-code a 20-quarter label',
);

assert.ok(
  source.includes('^\\d{4}\\sQ[1-4]$'),
  'quarterly history must be detected from labels such as 2025 Q4',
);

assert.match(
  source,
  /visibleHistory/,
  'trend cards must render a bounded visible history instead of the entire metric history',
);

assert.match(
  source,
  /slice\(-20\)/,
  'quarterly charts must be limited to the latest 20 quarters',
);

assert.match(
  source,
  /slice\(-5\)/,
  'annual charts and summary tiles must be limited to the latest 5 periods',
);

assert.match(
  source,
  /visibleHistory\.length/,
  'trend labels must describe the actual number of visible points',
);

assert.match(
  source,
  /showValueLabel/,
  'quarterly value labels must be conditionally rendered to avoid overlap',
);

assert.match(
  source,
  /<title>/,
  'each trend point must expose its value through a hover tooltip',
);

assert.match(
  source,
  /aria-label/,
  'each trend point must expose its value to assistive technology',
);

assert.match(
  mockData,
  /fundamentalAnnualHistory/,
  'asset-search fallback data must include annual fundamental history',
);

assert.match(
  source,
  /fundamentalAnnualHistory/,
  'FundamentalView fallback must include annual fundamental history when data.history is absent',
);

assert.match(
  source,
  /fundamentalDefaultHistory/,
  'FundamentalView must use a combined annual and quarterly default history',
);

assert.match(
  mockData,
  /quarter: '2021'/,
  'annual fallback history must include a 2021 label',
);

assert.match(
  mockData,
  /quarter: '2025'/,
  'annual fallback history must include a 2025 label',
);

console.log('fundamental history UX checks passed');
