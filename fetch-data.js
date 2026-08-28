import fs from 'fs';
import yahooFinance from 'yahoo-finance2';

// Yahoo Finance istemci ayarları
yahooFinance.setGlobalConfig({
  queue: { concurrency: 4 }
});

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

async function fetchSummary(ticker) {
  try {
    const res = await yahooFinance.chart(ticker, {
      period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      interval: '1d'
    });
    
    if (!res || !res.meta) return null;
    const meta = res.meta;
    
    const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    return {
      symbol: meta.symbol,
      shortName: meta.shortName || meta.symbol,
      price: Number(price.toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      dayHigh: meta.regularMarketDayHigh || null,
      dayLow: meta.regularMarketDayLow || null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
      volume: meta.regularMarketVolume || 0
    };
  } catch (err) {
    console.warn(`Veri çekilemedi: ${ticker} -> ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('Veriler Yahoo Finance chart API üzerinden çekiliyor...');
  
  const now = new Date();
  const formattedTime = now.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const output = {
    updatedAt: now.toISOString(),
    updatedAtFormatted: formattedTime,
    indices: {},
    stocks: {}
  };

  // 1. Endeksleri Çek
  for (const idx of INDICES) {
    const data = await fetchSummary(idx.symbol);
    if (data) {
      output.indices[idx.key] = {
        name: idx.key,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        prevClose: data.prevClose
      };
      console.log(`✓ Endeks çekildi: ${idx.key} -> ₺${data.price}`);
    }
  }

  // 2. Hisseleri Çek
  for (const sym of STOCKS) {
    const data = await fetchSummary(sym);
    if (data) {
      const cleanKey = sym.replace('.IS', '');
      output.stocks[cleanKey] = {
        symbol: cleanKey,
        shortName: data.shortName,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        dayHigh: data.dayHigh,
        dayLow: data.dayLow,
        fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: data.fiftyTwoWeekLow,
        volume: data.volume
      };
      console.log(`✓ Hisse çekildi: ${cleanKey} -> ₺${data.price}`);
    }
  }

  fs.writeFileSync('./data.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('data.json tüm verilerle başarıyla oluşturuldu.');
}

main();