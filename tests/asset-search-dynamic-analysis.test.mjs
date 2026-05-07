import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const app = read('src/App.tsx');
const summaryView = read('src/components/analysis/SummaryView.tsx');
const technicalView = read('src/components/analysis/TechnicalView.tsx');
const analysis = read('src/lib/asset-analysis.ts');

assert.doesNotMatch(
  summaryView,
  /technicalSummary/,
  'asset-search summary must not silently fall back to the hardcoded mock technicalSummary',
);

assert.match(
  app,
  /buildAssetSummary\([\s\S]*indicators:\s*indicators\.data[\s\S]*fundamentalDisabled:\s*isFundamentalDisabled/,
  'App must build asset-search summary from the selected asset and live indicator state',
);

assert.match(
  technicalView,
  /buildTechnicalFallbackAnalysis\(/,
  'TechnicalView must derive fallback gauges and insight from indicator rows rather than fixed 72/85/78 constants',
);

assert.doesNotMatch(
  technicalView,
  /\?\?\s*72|\?\?\s*85|\?\?\s*78/,
  'technical gauges must not use unexplained fixed fallback percentages',
);

assert.match(
  analysis,
  /export function buildAssetSummary/,
  'shared analysis helper must expose buildAssetSummary',
);

assert.match(
  analysis,
  /export function buildTechnicalFallbackAnalysis/,
  'shared analysis helper must expose buildTechnicalFallbackAnalysis',
);

assert.match(
  analysis,
  /데이터 수신 실패|샘플 기준|지표 데이터 부족/,
  'dynamic insight copy must explicitly disclose fallback or missing-data states',
);
