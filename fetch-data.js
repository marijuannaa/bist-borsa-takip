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
  // Türkiye saati kontrolü
  const now = new Date();
  const trTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const day = trTime.getDay(); // 0: Pazar, 6: Cumartesi
  if (day === 0 || day === 6) return false;

  const hours = trTime.getHours();
  const minutes = trTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 10:00 (600 dk) ile 18:15 (1095 dk) arası seans açıktır
  return totalMinutes >= 600 && totalMinutes <= 1095;
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
    const lastHistoryBar = history[history.length - 1];
    const prevHistoryBar = history.length > 1 ? history[history.length - 2] : lastHistoryBar;

    let price = 0;
    let prevClose = 0;
    let change = 0;
    let changePercent = 0;

    const todayStr = formatDateTR(new Date());

    if (marketOpen) {
      // 1. SEANS AÇIK: Canlı piyasa fiyatını kullan
      price = meta.regularMarketPrice ?? lastHistoryBar.close;
      prevClose = lastHistoryBar.date === todayStr ? prevHistoryBar.close : lastHistoryBar.close;
      change = price - prevClose;
      changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

      // Bugünün barı yoksa ekle, varsa canlı fiyatla güncelle
      if (lastHistoryBar.date !== todayStr) {
        history.push({
          timestamp: Math.floor(Date.now() / 1000),
          date: todayStr,
          close: Number(price.toFixed(2))
        });
      } else {
        lastHistoryBar.close = Number(price.toFixed(2));
      }
    } else {
      // 2. SEANS KAPALI: Son gerçekleşen resmi seans kapanışını baz al
      price = lastHistoryBar.close;
      prevClose = prevHistoryBar.close;
      change = price - prevClose;
      changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
    }

    return {
      symbol: meta.symbol,
      shortName: meta.shortName || meta.symbol,
      price: Number(price.toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      dayHigh: meta.regularMarketDayHigh || price,
      dayLow: meta.regularMarketDayLow || price,
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
  const marketStatus = isBistOpen() ? 'CANLI SEANS AÇIK' : 'BORSA KAPALI (Son Kapanış Baz Alındı)';
  console.log(`Durum: ${marketStatus}`);

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
      console.log(`✓ Endeks: ${idx.key} -> ₺${data.price}`);
    }
  }

  for (const sym of STOCKS) {
    const data = await fetchTickerData(sym);
    if (data) {
      const cleanKey = sym.replace('.IS', '');
      output.stocks[cleanKey] = data;
      console.log(`✓ Hisse: ${cleanKey} -> ₺${data.price}`);
    }
  }

  fs.writeFileSync('./data.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('data.json hatasız ve organik verilerle oluşturuldu.');
}

main();