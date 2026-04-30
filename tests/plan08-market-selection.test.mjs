import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const sourcePath = path.resolve('src/lib/market-selection.ts');
assert.ok(fs.existsSync(sourcePath), 'market-selection.ts should exist');

const source = fs.readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const sandbox = {
  exports: {},
  module: { exports: {} },
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(transpiled.outputText, sandbox, { filename: sourcePath });

const {
  CRYPTO_CATEGORY,
  getDefaultAssetForCategory,
  getMarketRequest,
  supportsFundamental,
} = sandbox.module.exports;

assert.equal(getDefaultAssetForCategory('ETF').ticker, 'SPY');
assert.equal(getDefaultAssetForCategory(CRYPTO_CATEGORY).ticker, 'BTCUSDT');
assert.equal(JSON.stringify(getMarketRequest('US Stocks', 'NVDA')), JSON.stringify({
  kind: 'us',
  symbol: 'NVDA',
  label: 'US Stocks',
}));
assert.equal(JSON.stringify(getMarketRequest(CRYPTO_CATEGORY, 'BTCUSDT')), JSON.stringify({
  kind: 'crypto',
  symbol: 'BTCUSDT',
  label: 'Crypto',
}));
assert.equal(supportsFundamental('ETF'), false);
assert.equal(supportsFundamental(CRYPTO_CATEGORY), false);
assert.equal(supportsFundamental('US Stocks'), true);
