import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const read = (file) => fs.readFileSync(file, 'utf8');

for (const file of [
  'src/lib/chart-spec.ts',
  'src/lib/visualizer.ts',
  'src/lib/visual-transforms.ts',
  'src/components/visualization/VisualizationDashboard.tsx',
  'src/components/visualization/ChartRenderer.tsx',
  'src/components/visualization/PortfolioDonut.tsx',
  'src/components/visualization/CorrelationHeatmap.tsx',
  'src/components/visualization/MonthlyReturnsHeatmap.tsx',
  'src/components/visualization/DrawdownChart.tsx',
  'src/components/visualization/NormalizedComparisonChart.tsx',
  'src/components/visualization/VisualizationReason.tsx',
]) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
}

const sourcePath = path.resolve('src/lib/visualizer.ts');
const chartSpec = read('src/lib/chart-spec.ts').replace(/export /g, '');
const visualizerSource = read(sourcePath)
  .replace(/import type[\s\S]*?;\n/g, '')
  .replace(/export /g, '');
const transpiled = ts.transpileModule(`${chartSpec}\n${visualizerSource}\nmodule.exports = { createVisualizationBundle };`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

const sandbox = { module: { exports: {} }, exports: {} };
vm.runInNewContext(transpiled.outputText, sandbox, { filename: sourcePath });
const { createVisualizationBundle } = sandbox.module.exports;

const portfolio = createVisualizationBundle('portfolio');
assert.equal(portfolio.dataType, 'portfolio');
assert.ok(portfolio.charts.some((chart) => chart.type === 'donut'));
assert.ok(!portfolio.charts.some((chart) => chart.id === 'portfolio-concentration'));
assert.ok(!portfolio.charts.some((chart) => /집중도/.test(`${chart.title} ${chart.skillsRule}`)));
assert.ok(portfolio.charts.every((chart) => chart.reason && chart.skillsRule));

const multiAsset = createVisualizationBundle('multi_asset');
assert.ok(multiAsset.charts.some((chart) => chart.type === 'normalized_comparison'));
assert.ok(multiAsset.charts.some((chart) => chart.type === 'correlation'));

const returns = createVisualizationBundle('returns');
assert.ok(returns.charts.some((chart) => chart.type === 'drawdown'));
assert.ok(returns.charts.some((chart) => chart.type === 'monthly_returns'));

assert.match(read('src/components/upload/UploadView.tsx'), /VisualizationDashboard/);
assert.match(read('src/components/upload/UploadView.tsx'), /result\.type === 'composite_portfolio'[\s\S]*CompositePortfolioDashboard/);
assert.match(read('src/components/upload/UploadView.tsx'), /result\.type === 'composite_portfolio'[\s\S]*VisualizationDashboard/);
assert.doesNotMatch(read('src/components/visualization/ChartRenderer.tsx'), /VisualizationReason/);
assert.match(read('docs/deployment/qa-checklist.md'), /Visualization Intelligence/);
assert.match(read('docs/deployment/judge-demo-script.md'), /Visualization Wow Moment/);
assert.match(read('docs/evidence/skills-to-code-matrix.md'), /Visualization Intelligence/);
