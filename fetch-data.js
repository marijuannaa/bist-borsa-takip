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

function isBistOpen() {
  const now = new Date();
  const trTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const day = trTime.getDay();
  if (day === 0 || day === 6) return false;

  const totalMinutes = trTime.getHours() * 60 + trTime.getMinutes();
  return totalMinutes >= 600 && totalMinutes <= 1095; // 10:00 - 18:15 TSİ
}

function formatDateTR(date) {
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
}

async function fetchTickerData(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
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
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    const history = [];
    timestamps.forEach((ts, i) => {
      const c = closes[i];
      if (c !== null && c !== undefined && !isNaN(c)) {
        history.push({
          timestamp: ts,
          date: formatDateTR(new Date(ts * 1000)),
          close: Number(c.toFixed(2))
        });
      }
    });

    if (history.length === 0) return null;

    const marketOpen = isBistOpen();
    const now = new Date();
    const todayStr = formatDateTR(now);

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = formatDateTR(yesterday);

    // meta.regularMarketPrice en son seans fiyatıdır (Örn: 307.25)
    const latestOfficialPrice = Number((meta.regularMarketPrice ?? history[history.length - 1].close).toFixed(2));
    
    // Son barın tarihi
    const lastBar = history[history.length - 1];

    if (!marketOpen) {
      // BORSA KAPALI:
      // Eğer son bar dünün seansı değilse, dünün kapanışını (307.25) ekle
      if (lastBar.date !== yesterdayStr && lastBar.date !== todayStr) {
        history.push({
          timestamp: Math.floor(yesterday.getTime() / 1000),
          date: yesterdayStr,
          close: latestOfficialPrice
        });
      } else {
        lastBar.close = latestOfficialPrice;
      }
    } else {
      // BORSA AÇIK:
      // Bugünün canlı fiyat barını ekle veya güncelle
      if (lastBar.date !== todayStr) {
        history.push({
          timestamp: Math.floor(now.getTime() / 1000),
          date: todayStr,
          close: latestOfficialPrice
        });
      } else {
        lastBar.close = latestOfficialPrice;
      }
    }

    // Fiyat ve Günlük Değişim Hesabı
    const currentPrice = history[history.length - 1].close;
    const previousClosePrice = history.length > 1 ? history[history.length - 2].close : currentPrice;
    
    const change = Number((currentPrice - previousClosePrice).toFixed(2));
    const changePercent = previousClosePrice > 0 ? Number(((change / previousClosePrice) * 100).toFixed(2)) : 0;

    return {
      symbol: meta.symbol,
      shortName: meta.shortName || meta.symbol,
      price: currentPrice,
      prevClose: previousClosePrice,
      change: change,
      changePercent: changePercent,
      dayHigh: meta.regularMarketDayHigh || currentPrice,
      dayLow: meta.regularMarketDayLow || currentPrice,
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
  const statusStr = isBistOpen() ? 'CANLI SEANS' : 'KAPALI (Dünün Kapanışı Eşitlendi)';
  console.log(`Durum: ${statusStr}`);

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
    isMarketOpen: isBistOpen(),
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
      console.log(`✓ Endeks: ${idx.key} -> ${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%)`);
    }
  }

  for (const sym of STOCKS) {
    const data = await fetchTickerData(sym);
    if (data) {
      const cleanKey = sym.replace('.IS', '');
      output.stocks[cleanKey] = data;
      console.log(`✓ Hisse: ${cleanKey} -> ₺${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%)`);
    }
  }

  fs.writeFileSync('./data.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('data.json Google Finance ile tam uyumlu güncellendi.');
}

main();