import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const dashboard = read('src/components/dashboard/CompositePortfolioDashboard.tsx');
const app = read('src/App.tsx');
const technicalView = read('src/components/analysis/TechnicalView.tsx');
const chartContainer = read('src/components/charts/ChartContainer.tsx');
const compositeData = read('src/data/compositePortfolio.ts');

assert.doesNotMatch(
  dashboard,
  /Array\.from\(\{\s*length:\s*24\s*\}/,
  'judge fallback must not use the old 24-candle synthetic sample',
);

assert.doesNotMatch(
  dashboard,
  /function fallbackFundamental[\s\S]*?history:\s*\[\]/,
  'fallbackFundamental must include visible 2021-2025 history for API-failure demos',
);

assert.match(
  dashboard,
  /parseFundamentalHistory\(record\.history,\s*fallback\.history\s*\?\?\s*\[\]\)/,
  'uploaded/API fundamental history must be parsed from the response instead of ignored',
);

assert.match(
  compositeData,
  /fundamental(?:\?:|\s*:)[\s\S]*history/,
  'built-in composite fallback holdings must carry fundamental history, not only current summary metrics',
);

assert.match(
  dashboard,
  /STOCH\(9,6\)[\s\S]*STOCHRSI\(14\)[\s\S]*ADX\(14\)[\s\S]*Ultimate Oscillator[\s\S]*Bull\/Bear Power/,
  'built-in composite technical fallback must expose the same broad indicator set as asset-search technical analysis',
);

assert.match(
  dashboard,
  /\[5,\s*10,\s*20,\s*50,\s*100,\s*200\]\.map/,
  'built-in composite technical fallback must include MA5 through MA200 like asset-search technical analysis',
);

assert.doesNotMatch(
  dashboard,
  /label="OHLCV"/,
  'individual asset metric cards must omit low-value OHLCV count metadata',
);

assert.doesNotMatch(
  dashboard,
  /border-l-4|border-l-positive|border-l-negative|border-l-brand-primary/,
  'individual asset metric cards must not use colored accent borders',
);

assert.match(
  technicalView,
  /aggregate|resample|timeframeCandles|candle-timeframe/,
  'TechnicalView must aggregate uploaded/sample candles when 1H, 1D, 1W, or 1M changes',
);

assert.doesNotMatch(
  chartContainer,
  /<CandleChart[\s\S]*candles=\{candles\}/,
  'ChartContainer or its caller must pass timeframe-adjusted candles rather than the unchanged raw series',
);

assert.doesNotMatch(
  chartContainer,
  /VisualizationReason|charts\.md driven|charts\.md: OHLCV/,
  'technical chart must not render developer-facing charts.md rationale copy',
);

assert.doesNotMatch(
  technicalView,
  /SkillsRuntimePanel|Skills Runtime Demo|dashboard state/,
  'technical analysis screen must not render the skills runtime demo panel',
);

assert.doesNotMatch(
  dashboard,
  /RequirementCard/,
  'dashboard summary must not render the low-value analysis/visualization/insight explainer cards',
);

assert.doesNotMatch(
  dashboard,
  /data\.summary\.status/,
  'dashboard header must not render status badges under the title',
);

assert.match(
  dashboard,
  /분석 기간 \{data\.summary\.period\}/,
  'dashboard header must render the portfolio analysis period from summary.period',
);

assert.match(
  dashboard,
  /period:\s*compositeSummary\.period/,
  'built-in fallback summary must preserve the default portfolio analysis period',
);

assert.match(
  dashboard,
  /valueFormatter\?:\s*\(value:\s*number\)\s*=>\s*string/,
  'Sparkline must support visible value formatting so risk charts can show percent labels',
);

assert.match(
  dashboard,
  /dateLabels\?:\s*string\[\]/,
  'Sparkline must support date labels so users can read chart timing',
);

assert.match(
  dashboard,
  /const PORTFOLIO_SPARKLINE_DATE_LABELS = \['01-01', '02-15', '03-31'\]/,
  'portfolio performance sparklines must use visible date anchors for the analysis period',
);

assert.match(
  dashboard,
  /function PerformanceTab[\s\S]*<Sparkline\s+values=\{cumulativePortfolioSeries\}\s+label="[^"]+"\s+annotated\s+dateLabels=\{PORTFOLIO_SPARKLINE_DATE_LABELS\}\s*\/>/,
  'performance tab cumulative performance chart must show numeric start, end, and date labels',
);

assert.match(
  dashboard,
  /function PerformanceTab[\s\S]*<Sparkline\s+values=\{drawdownSeries\}\s+positive=\{false\}\s+label="[^"]+"\s+annotated\s+valueFormatter=\{formatSparklinePercent\}\s+showExtremum\s+dateLabels=\{PORTFOLIO_SPARKLINE_DATE_LABELS\}\s*\/>/,
  'drawdown chart must show percent labels and mark the deepest drawdown value',
);

assert.doesNotMatch(
  dashboard,
  /sampleError/,
  'dashboard header must not render the built-in sample warning chip',
);

assert.doesNotMatch(
  app,
  /<footer[\s\S]*Glancy 2026/,
  'app must not render the generic Glancy footer copy',
);
