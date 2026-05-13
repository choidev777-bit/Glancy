import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const app = read('src/App.tsx');
const api = read('src/lib/api.ts');
const summaryView = read('src/components/analysis/SummaryView.tsx');
const technicalView = read('src/components/analysis/TechnicalView.tsx');
const fundamentalView = read('src/components/analysis/FundamentalView.tsx');
const dashboard = read('src/components/dashboard/CompositePortfolioDashboard.tsx');

assert.match(api, /interface\s+InsightProfile/, 'frontend API types must define a structured InsightProfile contract');

assert.match(
  summaryView,
  /InsightProfilePanel/,
  'SummaryView must render the shared structured insight panel',
);

assert.match(
  technicalView,
  /InsightProfilePanel/,
  'TechnicalView must render structured technical insight sections instead of only one paragraph',
);

assert.match(
  fundamentalView,
  /InsightProfilePanel/,
  'FundamentalView must render structured fundamental insight sections',
);

assert.match(
  app,
  /api\.fundamental|useFundamentalData/,
  'asset-search fundamental tab must be wired to the fundamental API or a hook that calls it',
);

assert.doesNotMatch(
  app,
  /<FundamentalView\s+market=\{activeCategory === KR_CATEGORY \? 'kr' : 'us'\}\s*\/>/,
  'asset-search FundamentalView must not be rendered with only a static market prop',
);

assert.match(
  dashboard,
  /portfolioInsight|InsightProfilePanel/,
  'CompositePortfolioDashboard must render portfolio-level structured insights',
);

assert.match(
  dashboard,
  /performanceInsight|riskInsight/,
  'CompositePortfolioDashboard performance/risk tab must include narrative risk insight data',
);
