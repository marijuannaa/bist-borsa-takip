import fs from 'fs';

const STOCKS = [
  'THYAO.IS', 'GARAN.IS', 'ASELS.IS', 'EREGL.IS', 
  'TUPRS.IS', 'KCHOL.IS', 'BIMAS.IS', 'SISE.IS', 
  'SASA.IS', 'FROTO.IS', 'AKBNK.IS', 'PETKM.IS'
];

const INDICES = [
  { key: 'XU100', symbol: 'XU100.IS', name: 'BIST 100' },
  { key: 'XU030', symbol: 'XU030.IS', name: 'BIST 30' },
  { key: 'XBANK', symbol: 'XBANK.IS', name: 'BIST Banka' },
  { key: 'ALTIN', symbol: 'ALTIN.S1.IS', altSymbol: 'ALTIN.IS', name: 'Darphane Altın' }
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

async function fetchTickerData(ticker, altTicker = null) {
  let url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
  let data = null;

  try {
    let response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!response.ok && altTicker) {
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${altTicker}?interval=1d&range=1y`;
      response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (err) {
    console.warn(`Veri çekilemedi: ${ticker} -> ${err.message}`);
    return null;
  }

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

  const latestOfficialPrice = Number((meta.regularMarketPrice ?? history[history.length - 1].close).toFixed(2));
  const lastBar = history[history.length - 1];

  if (!marketOpen) {
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
}

async function main() {
  const statusStr = isBistOpen() ? 'CANLI SEANS' : 'BORSA KAPALI (Son Kapanış Baz Alındı)';
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
    const data = await fetchTickerData(idx.symbol, idx.altSymbol);
    if (data) {
      output.indices[idx.key] = {
        name: idx.name,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        prevClose: data.prevClose,
        history: data.history
      };
      console.log(`✓ Kart Verisi: ${idx.key} -> ₺${data.price} (${data.change >= 0 ? '+' : ''}${data.changePercent}%)`);
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
  console.log('data.json Altın verisi ile birlikte başarıyla güncellendi.');
}

main();