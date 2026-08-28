import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('data.json exists and adheres to the production schema', () => {
  assert.ok(fs.existsSync('./data.json'), 'data.json must exist');
  
  const raw = fs.readFileSync('./data.json', 'utf-8');
  const data = JSON.parse(raw);

  // Root fields
  assert.ok(data.updatedAt, 'updatedAt must be present');
  assert.ok(data.updatedAtFormatted, 'updatedAtFormatted must be present');
  assert.ok(data.marketSession, 'marketSession must be present');
  assert.ok(data.indices, 'indices must be present');
  assert.ok(data.stocks, 'stocks must be present');
  assert.ok(data.currencies, 'currencies must be present');
  assert.ok(data.sectorStats, 'sectorStats must be present');
  assert.ok(Array.isArray(data.topGainers), 'topGainers must be an array');
  assert.ok(Array.isArray(data.topLosers), 'topLosers must be an array');
  assert.ok(Array.isArray(data.mostActive), 'mostActive must be an array');

  // Validate XU100
  const xu100 = data.indices.XU100;
  assert.ok(xu100, 'XU100 index must exist');
  assert.ok(typeof xu100.price === 'number' && xu100.price > 0, 'XU100 price must be a positive number');
  assert.ok(typeof xu100.changePercent === 'number', 'XU100 changePercent must be numeric');
  assert.ok(Array.isArray(xu100.history) && xu100.history.length > 0, 'XU100 history must have items');

  // Validate Gram Altın
  const altin = data.indices.ALTIN;
  assert.ok(altin, 'ALTIN must exist');
  assert.ok(typeof altin.price === 'number' && altin.price > 0, 'ALTIN price must be positive');

  // Validate Stocks
  const stockKeys = Object.keys(data.stocks);
  assert.ok(stockKeys.length >= 30, `Expected at least 30 stocks, found ${stockKeys.length}`);

  // Test individual stock schema
  const thyao = data.stocks.THYAO;
  assert.ok(thyao, 'THYAO must exist');
  assert.ok(typeof thyao.price === 'number' && thyao.price > 0, 'THYAO price must be valid');
  assert.ok(thyao.name, 'THYAO name must exist');
  assert.ok(thyao.sector, 'THYAO sector must exist');
  assert.ok(Array.isArray(thyao.history) && thyao.history.length > 5, 'THYAO history must be populated');
  assert.ok(typeof thyao.rsi14 === 'number' || thyao.rsi14 === null, 'rsi14 must be numeric or null');
  assert.ok(typeof thyao.sma20 === 'number' || thyao.sma20 === null, 'sma20 must be numeric or null');
  assert.ok(thyao.pivots, 'pivots must exist');
  assert.ok(thyao.returns, 'returns object must exist');
});
