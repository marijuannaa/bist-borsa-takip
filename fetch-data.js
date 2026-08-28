import fs from 'fs';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const TRACKED_STOCKS = [
  'THYAO', 'GARAN', 'ASELS', 'EREGL', 'TUPRS', 
  'KCHOL', 'BIMAS', 'SISE', 'SASA', 'FROTO', 
  'AKBNK', 'PETKM', 'YKBNK', 'ISCTR', 'TCELL', 'KRDMD'
];

const INDICES = ['XU100', 'XU030', 'XBANK'];

async function main() {
  console.log('🚀 BIST Veri toplayıcı çalışıyor...');

  const output = {
    updatedAt: new Date().toISOString(),
    updatedAtFormatted: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
    indices: {},
    stocks: {}
  };

  try {
    // 1. Endeksleri ve Hisseleri tek seferde çek
    const allSymbols = [
      ...INDICES.map(i => `^${i}`),
      ...TRACKED_STOCKS.map(s => `${s}.IS`)
    ];

    console.log('📊 Toplu fiyatlar Yahoo Finance üzerinden alınıyor...');
    const quoteResults = await yf.quote(allSymbols);

    quoteResults.forEach(item => {
      let cleanSymbol = item.symbol.replace('.IS', '').replace('^', '');
      const dataObj = {
        symbol: cleanSymbol,
        shortName: item.shortName || item.longName || cleanSymbol,
        price: item.regularMarketPrice || item.regularMarketPreviousClose || 0,
        change: item.regularMarketChange || 0,
        changePercent: item.regularMarketChangePercent || 0,
        dayHigh: item.regularMarketDayHigh || null,
        dayLow: item.regularMarketDayLow || null,
        fiftyTwoWeekHigh: item.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: item.fiftyTwoWeekLow || null,
        volume: item.regularMarketVolume || 0,
        marketCap: item.marketCap || null
      };

      if (INDICES.includes(cleanSymbol)) {
        output.indices[cleanSymbol] = dataObj;
      } else {
        output.stocks[cleanSymbol] = dataObj;
      }
    });

    // 2. Takip edilen hisselerin geçmiş 30 günlük grafik verilerini topla
    console.log('📈 Hisse grafik geçmişleri indiriliyor...');
    for (const sym of TRACKED_STOCKS) {
      try {
        const queryOptions = { period1: '30d', interval: '1d' };
        const hist = await yf.historical(`${sym}.IS`, queryOptions);
        if (hist && Array.isArray(hist) && output.stocks[sym]) {
          output.stocks[sym].history = hist.map(h => ({
            date: new Date(h.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
            close: Number(h.close.toFixed(2))
          }));
        }
      } catch (err) {
        console.warn(`⚠️ ${sym} grafiği alınamadı:`, err.message);
      }
    }

    // 3. data.json olarak kaydet
    fs.writeFileSync('data.json', JSON.stringify(output, null, 2), 'utf8');
    console.log('✅ data.json dosyası başarıyla üretildi!');

  } catch (error) {
    console.error('❌ Veri toplama hatası:', error);
    process.exit(1);
  }
}

main();