import assert from 'node:assert/strict';
import fs from 'node:fs';

const technicalView = fs.readFileSync('src/components/analysis/TechnicalView.tsx', 'utf8');
const dashboard = fs.readFileSync('src/components/dashboard/CompositePortfolioDashboard.tsx', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');

assert.match(
  technicalView,
  /availableTimeframes\?:\s*ChartTimeframe\[\]/,
  'TechnicalView must accept a caller-provided timeframe list so asset-search can keep 1H while portfolio can remove it',
);

assert.match(
  dashboard,
  /PORTFOLIO_CHART_TIMEFRAMES:\s*ChartTimeframe\[\]\s*=\s*\[\s*'1D'\s*,\s*'1W'\s*,\s*'1M'\s*\]/,
  'CompositePortfolioDashboard must define portfolio-only timeframes without 1H',
);

assert.doesNotMatch(
  dashboard,
  /PORTFOLIO_CHART_TIMEFRAMES[\s\S]*'1H'/,
  'Portfolio dashboard timeframe list must not include 1H',
);

assert.match(
  dashboard,
  /availableTimeframes=\{PORTFOLIO_CHART_TIMEFRAMES\}/,
  'CompositePortfolioDashboard must pass the portfolio-only timeframe list into TechnicalView',
);

assert.doesNotMatch(
  dashboard,
  /집중도|상위 3개 비중|topConcentrationHoldings|PORTFOLIO_COLORS/,
  'Allocation tab must not render the removed concentration card or keep its helper code',
);

assert.match(
  dashboard,
  /theme\?:\s*'dark'\s*\|\s*'light'/,
  'CompositePortfolioDashboard must accept the current app theme',
);

assert.match(
  app,
  /<CompositePortfolioDashboard\s+loadSample\s+theme=\{theme\}\s*\/>/,
  'App must pass the current theme into the portfolio dashboard',
);

assert.doesNotMatch(
  dashboard,
  /theme="dark"/,
  'CompositePortfolioDashboard must not hard-code a dark chart theme',
);

console.log('portfolio timeframe UI checks passed');
