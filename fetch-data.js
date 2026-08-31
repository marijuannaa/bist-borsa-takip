import fs from 'fs';
import { 
  STOCKS_CONFIG, 
  INDICES_CONFIG, 
  CURRENCIES_CONFIG, 
  COMMODITIES_CONFIG 
} from './src/stocks-config.js';
import { 
  calculateSMA, 
  calculateRSI, 
  calculatePivotPoints, 
  calculateReturns, 
  getMarketSessionStatus 
} from './src/indicators.js';

const OUNCE_TO_GRAM = 31.1034768;

function formatDateTR(date) {
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Istanbul'
  });
}

function formatTimeTR(date) {
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
}

/**
 * Fetches ticker data with retry and parsing
 */
async function fetchTickerData(ticker, retries = 2) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });

      if (!response.ok) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data?.chart?.result?.[0];
      if (!result || !result.meta) return null;

      const meta = result.meta;
      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const closes = quote.close || [];
      const opens = quote.open || [];
      const highs = quote.high || [];
      const lows = quote.low || [];
      const volumes = quote.volume || [];

      const history = [];
      const validCloses = [];

      for (let i = 0; i < timestamps.length; i++) {
        const ts = timestamps[i];
        const c = closes[i];
        const o = opens[i] ?? c;
        const h = highs[i] ?? c;
        const l = lows[i] ?? c;
        const v = volumes[i] ?? 0;

        if (c !== null && c !== undefined && !isNaN(c) && c > 0) {
          const formattedDate = formatDateTR(new Date(ts * 1000));
          const roundedClose = Number(c.toFixed(2));
          validCloses.push(roundedClose);

          history.push({
            timestamp: ts,
            date: formattedDate,
            open: Number(o.toFixed(2)),
            high: Number(h.toFixed(2)),
            low: Number(l.toFixed(2)),
            close: roundedClose,
            volume: Math.round(v)
          });
        }
      }

      if (history.length === 0) return null;

      const latestOfficialPrice = Number((meta.regularMarketPrice ?? history[history.length - 1].close).toFixed(2));
      const lastBar = history[history.length - 1];
      lastBar.close = latestOfficialPrice;
      validCloses[validCloses.length - 1] = latestOfficialPrice;

      const currentPrice = lastBar.close;
      const previousClosePrice = history.length > 1 ? history[history.length - 2].close : (meta.chartPreviousClose || currentPrice);
      
      const change = Number((currentPrice - previousClosePrice).toFixed(2));
      const changePercent = previousClosePrice > 0 ? Number(((change / previousClosePrice) * 100).toFixed(2)) : 0;

      // Technical Indicators
      const rsi14 = calculateRSI(validCloses, 14);
      const sma20 = calculateSMA(validCloses, 20);
      const sma50 = calculateSMA(validCloses, 50);
      const returns = calculateReturns(history);

      const dayHigh = meta.regularMarketDayHigh || lastBar.high || currentPrice;
      const dayLow = meta.regularMarketDayLow || lastBar.low || currentPrice;
      const pivots = calculatePivotPoints(dayHigh, dayLow, currentPrice);

      // Mini sparkline (last 12 closes)
      const sparkline = validCloses.slice(-12);

      return {
        symbol: meta.symbol,
        shortName: meta.shortName || meta.symbol,
        price: currentPrice,
        prevClose: previousClosePrice,
        change: change,
        changePercent: changePercent,
        dayHigh: dayHigh,
        dayLow: dayLow,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || Math.max(...validCloses),
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow || Math.min(...validCloses),
        volume: meta.regularMarketVolume || lastBar.volume || 0,
        rsi14: rsi14,
        sma20: sma20,
        sma50: sma50,
        pivots: pivots,
        returns: returns,
        sparkline: sparkline,
        history: history
      };

    } catch (err) {
      if (attempt === retries) {
        console.warn(`⚠️ Veri çekilemedi: ${ticker} -> ${err.message}`);
      }
    }
  }
  return null;
}

/**
 * Concurrency helper to fetch in batches
 */
async function mapConcurrent(items, limit, asyncFn) {
  const results = [];
  const executing = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => asyncFn(item));
    results.push(p);

    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

/**
 * Calculate Precious Metals and Commodities
 */
async function calculateMetalsAndCurrencies(fetchedData) {
  const gcData = fetchedData['GC=F']; // Gold Ounce USD
  const siData = fetchedData['SI=F']; // Silver Ounce USD
  const usdData = fetchedData['USDTRY=X']; // USD/TRY

  const results = {};

  if (gcData && usdData) {
    const goldPrice = gcData.price;
    const usdPrice = usdData.price;
    const gramPrice = Number(((goldPrice * usdPrice) / OUNCE_TO_GRAM).toFixed(2));

    const prevGold = gcData.prevClose || goldPrice;
    const prevUsd = usdData.prevClose || usdPrice;
    const prevGram = Number(((prevGold * prevUsd) / OUNCE_TO_GRAM).toFixed(2));
    const change = Number((gramPrice - prevGram).toFixed(2));
    const changePercent = prevGram > 0 ? Number(((change / prevGram) * 100).toFixed(2)) : 0;

    results['ALTIN'] = {
      name: 'Gram Altın (24K)',
      price: gramPrice,
      prevClose: prevGram,
      change: change,
      changePercent: changePercent,
      unit: '₺/gr',
      history: gcData.history.map((h, i) => {
        const u = usdData.history[i]?.close || usdPrice;
        return {
          date: h.date,
          close: Number(((h.close * u) / OUNCE_TO_GRAM).toFixed(2))
        };
      })
    };

    // Çeyrek Altın (1.754 gram, 22 Ayar ~ 1.635 x Gram 24K)
    const ceyrekPrice = Number((gramPrice * 1.635).toFixed(2));
    const prevCeyrek = Number((prevGram * 1.635).toFixed(2));
    results['CEYREK'] = {
      name: 'Çeyrek Altın (Yeni)',
      price: ceyrekPrice,
      prevClose: prevCeyrek,
      change: Number((ceyrekPrice - prevCeyrek).toFixed(2)),
      changePercent: changePercent,
      unit: '₺/Adet'
    };
  }

  if (siData && usdData) {
    const silverPrice = siData.price;
    const usdPrice = usdData.price;
    const gramSilver = Number(((silverPrice * usdPrice) / OUNCE_TO_GRAM).toFixed(2));
    const prevSilver = siData.prevClose || silverPrice;
    const prevUsd = usdData.prevClose || usdPrice;
    const prevGramSilver = Number(((prevSilver * prevUsd) / OUNCE_TO_GRAM).toFixed(2));
    const change = Number((gramSilver - prevGramSilver).toFixed(2));
    const changePercent = prevGramSilver > 0 ? Number(((change / prevGramSilver) * 100).toFixed(2)) : 0;

    results['GUMUS'] = {
      name: 'Gram Gümüş',
      price: gramSilver,
      prevClose: prevGramSilver,
      change: change,
      changePercent: changePercent,
      unit: '₺/gr'
    };
  }

  return results;
}

export async function fetchAllData() {
  const sessionStatus = getMarketSessionStatus();
  console.log(`\n📊 BIST Borsa Takip - Veri Motoru`);
  console.log(`Durum: ${sessionStatus.sessionName} (${sessionStatus.status}) | Zaman: ${sessionStatus.timeStr}`);
  console.log(`Hedef Evren: ${STOCKS_CONFIG.length} Hisse + ${INDICES_CONFIG.length} Endeks + Döviz/Emtialar\n`);

  const now = new Date();
  const formattedTime = formatTimeTR(now);

  // Existing cache fallback
  let previousData = {};
  if (fs.existsSync('./data.json')) {
    try {
      previousData = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
    } catch {
      previousData = {};
    }
  }

  const output = {
    updatedAt: now.toISOString(),
    updatedAtFormatted: formattedTime,
    marketSession: sessionStatus,
    indices: {},
    currencies: {},
    commodities: {},
    stocks: {},
    sectorStats: {},
    topGainers: [],
    topLosers: [],
    mostActive: []
  };

  // 1. Fetch Indices
  console.log('⏳ 1/4 Endeks verileri çekiliyor...');
  for (const idx of INDICES_CONFIG) {
    const data = await fetchTickerData(idx.symbol);
    if (data) {
      output.indices[idx.key] = {
        name: idx.name,
        desc: idx.desc,
        symbol: idx.symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        prevClose: data.prevClose,
        dayHigh: data.dayHigh,
        dayLow: data.dayLow,
        rsi14: data.rsi14,
        sma20: data.sma20,
        returns: data.returns,
        sparkline: data.sparkline,
        history: data.history
      };
      console.log(`  ✓ ${idx.name} (${idx.key}): ${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%)`);
    } else if (previousData.indices?.[idx.key]) {
      output.indices[idx.key] = previousData.indices[idx.key];
      console.log(`  ⚡ [Önbellek] ${idx.key}`);
    }
  }

  // 2. Fetch Currencies, Commodities & Raw Metals
  console.log('\n⏳ 2/4 Döviz, Emtia ve Kripto verileri çekiliyor...');
  const auxiliaryTickers = [
    'GC=F', 'SI=F', 'USDTRY=X', 'EURTRY=X', 'GBPTRY=X', 'BZ=F', 'BTC-USD'
  ];
  const auxResults = {};

  await mapConcurrent(auxiliaryTickers, 4, async (ticker) => {
    const data = await fetchTickerData(ticker);
    if (data) auxResults[ticker] = data;
  });

  // Calculate Precious Metals
  const metals = await calculateMetalsAndCurrencies(auxResults);
  Object.assign(output.indices, metals);

  for (const curr of CURRENCIES_CONFIG) {
    const data = auxResults[curr.symbol];
    if (data) {
      output.currencies[curr.key] = {
        name: curr.name,
        symbol: curr.symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        prevClose: data.prevClose,
        history: data.history
      };
      console.log(`  ✓ ${curr.name}: ₺${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%)`);
    }
  }

  for (const comm of COMMODITIES_CONFIG) {
    const data = auxResults[comm.symbol];
    if (data) {
      output.commodities[comm.key] = {
        name: comm.name,
        unit: comm.unit,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        prevClose: data.prevClose,
        history: data.history
      };
      console.log(`  ✓ ${comm.name}: $${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%)`);
    }
  }

  // 3. Fetch Stocks (Batch Concurrent)
  console.log(`\n⏳ 3/4 ${STOCKS_CONFIG.length} Hisse senedi verisi çekiliyor...`);
  const stockList = STOCKS_CONFIG.map(s => ({ ...s, ticker: `${s.symbol}.IS` }));

  const stockResults = await mapConcurrent(stockList, 5, async (item) => {
    const data = await fetchTickerData(item.ticker);
    if (data) {
      return {
        ...item,
        data: {
          ...data,
          symbol: item.symbol,
          name: item.name,
          sector: item.sector,
          bist30: item.bist30,
          dividend: item.dividend
        }
      };
    } else if (previousData.stocks?.[item.symbol]) {
      return {
        ...item,
        data: {
          ...previousData.stocks[item.symbol],
          symbol: item.symbol
        }
      };
    }
    return null;
  });

  const validStockObjects = [];

  for (const res of stockResults) {
    if (res && res.data) {
      output.stocks[res.symbol] = res.data;
      validStockObjects.push(res.data);
      process.stdout.write(`.`);
    }
  }
  console.log(`\n✅ Toplam ${validStockObjects.length} hisse başarıyla işlendi.`);

  // 4. Calculate Market Stats, Sector Breakdown & Top Movers
  console.log('\n⏳ 4/4 Sektör ve piyasa istatistikleri hesaplanıyor...');
  
  // Top Gainers & Losers
  const sortedByGain = [...validStockObjects].sort((a, b) => b.changePercent - a.changePercent);
  output.topGainers = sortedByGain.slice(0, 5).map(s => ({
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    changePercent: s.changePercent,
    sector: s.sector
  }));

  output.topLosers = [...sortedByGain].reverse().slice(0, 5).map(s => ({
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    changePercent: s.changePercent,
    sector: s.sector
  }));

  // Most Active by Volume
  output.mostActive = [...validStockObjects]
    .sort((a, b) => (b.volume * b.price) - (a.volume * a.price))
    .slice(0, 5)
    .map(s => ({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      volume: s.volume,
      turnover: Math.round(s.volume * s.price),
      changePercent: s.changePercent
    }));

  // Sector Breakdown Stats
  const sectorGroups = {};
  for (const s of validStockObjects) {
    const sec = s.sector || 'Diğer';
    if (!sectorGroups[sec]) {
      sectorGroups[sec] = { count: 0, totalChange: 0, positiveCount: 0, negativeCount: 0, symbols: [] };
    }
    sectorGroups[sec].count++;
    sectorGroups[sec].totalChange += s.changePercent;
    if (s.changePercent >= 0) sectorGroups[sec].positiveCount++;
    else sectorGroups[sec].negativeCount++;
    sectorGroups[sec].symbols.push(s.symbol);
  }

  for (const [sec, stats] of Object.entries(sectorGroups)) {
    output.sectorStats[sec] = {
      count: stats.count,
      avgChange: Number((stats.totalChange / stats.count).toFixed(2)),
      positiveCount: stats.positiveCount,
      negativeCount: stats.negativeCount,
      symbols: stats.symbols
    };
  }

  fs.writeFileSync('./data.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n🎉 data.json (${Object.keys(output.stocks).length} hisse + ${Object.keys(output.indices).length} endeks/emtia) başarıyla kaydedildi!\n`);
  return output;
}

import { fileURLToPath } from 'url';
if (process.argv[1] && (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith('fetch-data.js'))) {
  fetchAllData().catch(err => {
    console.error('Kritik veri motoru hatası:', err);
    process.exit(1);
  });
}