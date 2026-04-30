import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const read = (file) => fs.readFileSync(file, 'utf8');

for (const file of [
  'public/skills/theme.md',
  'public/skills/indicators.md',
  'src/lib/skills-parser.ts',
  'src/hooks/useSkillsRuntime.ts',
  'src/components/skills/SkillsRuntimePanel.tsx',
  'src/components/skills/SkillsEditor.tsx',
  'src/components/skills/RuntimeDiff.tsx',
  'src/components/skills/RuntimeApplyBar.tsx',
]) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
}

assert.match(read('public/skills/theme.md'), /runtime-demo: true/);
assert.match(read('public/skills/indicators.md'), /editable-fields:/);
assert.match(read('src/components/analysis/TechnicalView.tsx'), /SkillsRuntimePanel/);
assert.match(read('src/lib/api.ts'), /RuntimeIndicatorParams/);
assert.match(read('src/hooks/useIndicatorsData.ts'), /runtimeParams/);
assert.match(read('docs/deployment/qa-checklist.md'), /Skills Runtime Demo/);

const sourcePath = path.resolve('src/lib/skills-parser.ts');
const source = read(sourcePath);
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const sandbox = { exports: {}, module: { exports: {} }, URLSearchParams };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(transpiled.outputText, sandbox, { filename: sourcePath });

const { parseSkillsRuntime, runtimeParamsToQuery } = sandbox.module.exports;
const parsed = parseSkillsRuntime(`
ma_periods: 5,15,30
ma_cross_short: 5
ma_cross_long: 30
rsi_period: 9
rsi_overbought: 60
rsi_oversold: 25
macd_fast: 8
macd_slow: 21
macd_signal: 5
stoch_k_period: 7
stoch_d_period: 4
stoch_overbought: 75
stoch_oversold: 25
bb_period: 18
bb_std: 1.8
wr_period: 10
wr_overbought: -15
wr_oversold: -85
cci_period: 20
cci_strong_buy: -220
cci_buy: -120
cci_sell: 120
cci_strong_sell: 220
atr_period: 7
roc_period: 6
obv_lookback: 3
brand_primary: "#ffcc00"
positive: "#00ffaa"
negative: "#ff3366"
`);

assert.equal(parsed.indicators.ma_periods, '5,15,30');
assert.equal(parsed.indicators.ma_cross_short, 5);
assert.equal(parsed.indicators.rsi_period, 9);
assert.equal(parsed.indicators.rsi_overbought, 60);
assert.equal(parsed.indicators.stoch_k_period, 7);
assert.equal(parsed.indicators.bb_std, 1.8);
assert.equal(parsed.indicators.wr_oversold, -85);
assert.equal(parsed.indicators.cci_strong_sell, 220);
assert.equal(parsed.indicators.atr_period, 7);
assert.equal(parsed.indicators.roc_period, 6);
assert.equal(parsed.indicators.obv_lookback, 3);
assert.equal(parsed.theme.brand_primary, '#ffcc00');
assert.equal(parsed.theme.positive, '#00ffaa');
assert.match(runtimeParamsToQuery(parsed.indicators), /ma_periods=5%2C15%2C30/);
assert.match(runtimeParamsToQuery(parsed.indicators), /wr_oversold=-85/);

const invalid = parseSkillsRuntime(`
rsi_overbought: 20
rsi_oversold: 40
macd_fast: 30
macd_slow: 12
ma_cross_short: 60
ma_cross_long: 20
stoch_overbought: 20
stoch_oversold: 40
wr_overbought: -80
wr_oversold: -20
cci_strong_buy: -100
cci_buy: -200
cci_sell: 100
cci_strong_sell: 200
`);
assert.ok(invalid.warnings.some((warning) => warning.includes('RSI')));
assert.ok(invalid.warnings.some((warning) => warning.includes('MACD')));
assert.ok(invalid.warnings.some((warning) => warning.includes('MA cross')));
assert.ok(invalid.warnings.some((warning) => warning.includes('Stochastic')));
assert.ok(invalid.warnings.some((warning) => warning.includes('Williams')));
assert.ok(invalid.warnings.some((warning) => warning.includes('CCI')));
