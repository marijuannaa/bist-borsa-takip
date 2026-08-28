import fs from 'fs';
import yahooFinance from 'yahoo-finance2';

const STOCKS = [
  'THYAO.IS', 'GARAN.IS', 'ASELS.IS', 'EREGL.IS', 
  'TUPRS.IS', 'KCHOL.IS', 'BIMAS.IS', 'SISE.IS', 
  'SASA.IS', 'FROTO.IS', 'AKBNK.IS', 'PETKM.IS'
];

const INDICES = [
  { key: 'XU100', symbol: 'XU100.IS' },
  { key: 'XU030', symbol: 'XU030.IS' },
  { key: 'XBANK', symbol: 'XBANK.IS' }
];

async function getSafeQuote(symbol) {
  try {
    return await yahooFinance.quote(symbol);
  } catch (err) {
    // Alternatif sembol formatını dene (^XU100 gibi)
    if (!symbol.startsWith('^')) {
      try {
        return await yahooFinance.quote(`^${symbol.replace('.IS', '')}`);
      } catch (e) {
        console.warn(`Veri çekilemedi: ${symbol}`);
        return null;
      }
    }
    return null;
  }
}

async function main() {
  console.log('Veriler Yahoo Finance üzerinden çekiliyor...');
  const output = {
    updatedAt: new Date().toISOString(),
    indices: {},
    stocks: {}
  };

  // 1. Endeksleri Çek
  for (const idx of INDICES) {
    const q = await getSafeQuote(idx.symbol);
    if (q) {
      let price = q.regularMarketPrice ?? q.chartPreviousClose ?? q.previousClose ?? 0;
      let prevClose = q.regularMarketPreviousClose ?? q.chartPreviousClose ?? q.previousClose ?? price;
      
      // Endeks puanı 100.000 üzerinde anormal gelirse 10'a bölme düzeltmesi
      if (price > 50000 && (idx.key === 'XU100' || idx.key === 'XU030')) {
        price = price / 10;
        prevClose = prevClose / 10;
      }

      const change = price - prevClose;
      const changePercent = prevClose ? (change / prevClose) * 100 : (q.regularMarketChangePercent ?? 0);

      output.indices[idx.key] = {
        name: q.shortName || idx.key,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        prevClose: Number(prevClose.toFixed(2))
      };
    }
  }

  // 2. Hisseleri Çek
  for (const sym of STOCKS) {
    const q = await getSafeQuote(sym);
    if (q) {
      const cleanKey = sym.replace('.IS', '');
      const price = q.regularMarketPrice ?? q.previousClose ?? 0;
      const prevClose = q.regularMarketPreviousClose ?? price;
      const change = q.regularMarketChange ?? (price - prevClose);
      const changePercent = q.regularMarketChangePercent ?? (prevClose ? (change / prevClose) * 100 : 0);

      output.stocks[cleanKey] = {
        symbol: cleanKey,
        shortName: q.shortName || cleanKey,
        longName: q.longName || q.shortName || cleanKey,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        dayHigh: q.regularMarketDayHigh || null,
        dayLow: q.regularMarketDayLow || null,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow || null,
        volume: q.regularMarketVolume || 0
      };
    }
  }

  fs.writeFileSync('./data.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('data.json başarıyla oluşturuldu.');
}

main();