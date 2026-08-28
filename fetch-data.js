import fs from 'fs';

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

async function fetchTickerData(ticker) {
  // 1 yıllık günlük veriyi tek seferde çeker
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y&includePrePost=true`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result || !result.meta) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    // Grafik geçmişini temiz bir diziye dönüştür
    const history = [];
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    timestamps.forEach((ts, i) => {
      const c = closes[i];
      if (c !== null && c !== undefined && !isNaN(c)) {
        const date = new Date(ts * 1000);
        const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Istanbul' });
        history.push({
          timestamp: ts,
          date: dateStr,
          close: Number(c.toFixed(2))
        });
      }
    });

    // Güncel fiyatı grafiğin son barı olarak bağla
    const now = new Date();
    const todayStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Istanbul' });
    if (history.length > 0 && history[history.length - 1].date !== todayStr && price > 0) {
      history.push({
        timestamp: Math.floor(now.getTime() / 1000),
        date: todayStr,
        close: Number(price.toFixed(2))
      });
    }

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
      volume: meta.regularMarketVolume || 0,
      history: history
    };
  } catch (err) {
    console.warn(`Veri çekilemedi: ${ticker} -> ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('Veriler ve grafikler doğrudan Yahoo API üzerinden çekiliyor...');

  const now = new Date();
  const formattedTime = now.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });

  const output = {
    updatedAt: now.toISOString(),
    updatedAtFormatted: formattedTime,
    indices: {},
    stocks: {}
  };

  for (const idx of INDICES) {
    const data = await fetchTickerData(idx.symbol);
    if (data) {
      output.indices[idx.key] = {
        name: idx.key,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        prevClose: data.prevClose,
        history: data.history
      };
      console.log(`✓ Endeks çekildi: ${idx.key} -> ₺${data.price}`);
    }
  }

  for (const sym of STOCKS) {
    const data = await fetchTickerData(sym);
    if (data) {
      const cleanKey = sym.replace('.IS', '');
      output.stocks[cleanKey] = data;
      console.log(`✓ Hisse çekildi: ${cleanKey} -> ₺${data.price} (${data.history.length} bar grafik)`);
    }
  }

  fs.writeFileSync('./data.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('data.json tüm veriler ve grafiklerle başarıyla oluşturuldu.');
}

main();