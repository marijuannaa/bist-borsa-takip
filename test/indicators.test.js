import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateSMA, 
  calculateRSI, 
  calculatePivotPoints, 
  calculateReturns, 
  getMarketSessionStatus 
} from '../src/indicators.js';

test('calculateSMA correctly computes Simple Moving Average', () => {
  const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const sma5 = calculateSMA(prices, 5);
  // Last 5 prices: 16, 17, 18, 19, 20 -> sum = 90 / 5 = 18.00
  assert.equal(sma5, 18);

  const sma10 = calculateSMA(prices, 10);
  // Last 10 prices: 11..20 -> sum = 155 / 10 = 15.50
  assert.equal(sma10, 15.5);

  // Insufficient data
  assert.equal(calculateSMA([10, 20], 5), null);
  assert.equal(calculateSMA([], 5), null);
  assert.equal(calculateSMA(null, 5), null);
});

test('calculateRSI returns values between 0 and 100', () => {
  // Constant prices
  const flatPrices = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
  const flatRsi = calculateRSI(flatPrices, 14);
  assert.equal(flatRsi, 100);

  // Upward trending prices
  const upPrices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const upRsi = calculateRSI(upPrices, 14);
  assert.ok(upRsi > 70, `RSI for strong uptrend should be > 70, got ${upRsi}`);
  assert.ok(upRsi <= 100, 'RSI must be <= 100');

  // Downward trending prices
  const downPrices = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
  const downRsi = calculateRSI(downPrices, 14);
  assert.ok(downRsi < 30, `RSI for strong downtrend should be < 30, got ${downRsi}`);
  assert.ok(downRsi >= 0, 'RSI must be >= 0');

  // Insufficient data
  assert.equal(calculateRSI([10, 12, 14], 14), null);
});

test('calculatePivotPoints computes standard Floor pivot levels', () => {
  const high = 310;
  const low = 295;
  const close = 305;

  const pivots = calculatePivotPoints(high, low, close);
  assert.ok(pivots);
  // Pivot = (310 + 295 + 305) / 3 = 910 / 3 = 303.33
  assert.equal(pivots.pivot, 303.33);
  // R1 = 2 * 303.33 - 295 = 606.66 - 295 = 311.66
  assert.equal(pivots.r1, 311.66);
  // S1 = 2 * 303.33 - 310 = 606.66 - 310 = 296.66
  assert.equal(pivots.s1, 296.66);

  // Edge cases
  assert.equal(calculatePivotPoints(null, null, null), null);
});

test('calculateReturns accurately calculates multi-period % changes', () => {
  const history = [
    { date: '01.01.2026', close: 100, timestamp: 1767225600 },
    { date: '02.01.2026', close: 105, timestamp: 1767312000 },
    { date: '03.01.2026', close: 110, timestamp: 1767398400 },
    { date: '04.01.2026', close: 120, timestamp: 1767484800 }
  ];

  const returns = calculateReturns(history);
  assert.ok(returns);
  // 1D: (120 - 110) / 110 * 100 = 9.09%
  assert.equal(returns.d1, 9.09);
  // 1Y (full history start): (120 - 100) / 100 * 100 = 20.00%
  assert.equal(returns.y1, 20);
});

test('getMarketSessionStatus returns a valid status object', () => {
  const status = getMarketSessionStatus();
  assert.ok(typeof status.isOpen === 'boolean');
  assert.ok(typeof status.status === 'string');
  assert.ok(typeof status.sessionName === 'string');
  assert.ok(typeof status.timeStr === 'string');
  assert.ok(typeof status.dateStr === 'string');
  assert.ok(typeof status.countdownStr === 'string');
});

test('getMarketSessionStatus correctly identifies Continuous Trading (Open)', () => {
  // Wednesday 11:30:00 UTC+3
  const openTime = new Date('2026-09-02T11:30:00+03:00');
  const status = getMarketSessionStatus(openTime);
  assert.equal(status.isOpen, true);
  assert.equal(status.sessionName, 'Canlı Seans Açık');
  assert.equal(status.statusColor, 'emerald');
  assert.ok(status.countdownStr.includes('Kapanışa'));
});

test('getMarketSessionStatus correctly identifies Opening Auction (Pre-market)', () => {
  // Wednesday 09:45:00 UTC+3
  const preTime = new Date('2026-09-02T09:45:00+03:00');
  const status = getMarketSessionStatus(preTime);
  assert.equal(status.isOpen, false);
  assert.equal(status.isPrePost, true);
  assert.equal(status.sessionName, 'Açılış Emir Toplama');
  assert.equal(status.statusColor, 'amber');
});

test('getMarketSessionStatus correctly identifies Closing Auction', () => {
  // Wednesday 18:02:00 UTC+3
  const closingTime = new Date('2026-09-02T18:02:00+03:00');
  const status = getMarketSessionStatus(closingTime);
  assert.equal(status.isOpen, false);
  assert.equal(status.isPrePost, true);
  assert.equal(status.sessionName, 'Kapanış Emir Toplama');
  assert.equal(status.statusColor, 'amber');
});

test('getMarketSessionStatus correctly identifies Weekend as Closed', () => {
  // Sunday 14:00:00 UTC+3
  const weekendTime = new Date('2026-09-06T14:00:00+03:00');
  const status = getMarketSessionStatus(weekendTime);
  assert.equal(status.isOpen, false);
  assert.equal(status.sessionName, 'Borsa Kapalı');
  assert.equal(status.status, 'Hafta Sonu - Kapalı');
  assert.equal(status.statusColor, 'rose');
});

test('getMarketSessionStatus correctly identifies National Holiday as Closed', () => {
  // 29 October Republic Day
  const holidayTime = new Date('2026-10-29T12:00:00+03:00');
  const status = getMarketSessionStatus(holidayTime);
  assert.equal(status.isOpen, false);
  assert.equal(status.sessionName, 'Borsa Kapalı');
  assert.ok(status.status.includes('Cumhuriyet Bayramı'));
  assert.equal(status.statusColor, 'rose');
});
