import BorsaAPI from 'borsa-api';
import fs from 'fs';

const api = new BorsaAPI();

// Takip edilecek ve detay sayfasi uretilecek hisseler
const TRACKED_STOCKS = ['THYAO', 'GARAN', 'ASELS', 'EREGL', 'TUPRS', 'KCHOL', 'BIMAS', 'SISE'];

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return Number(num).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMarketCap(cap) {
  if (!cap || isNaN(cap)) return '-';
  if (cap >= 1e12) return `₺${(cap / 1e12).toFixed(2)} Trl`;
  if (cap >= 1e9) return `₺${(cap / 1e9).toFixed(2)} Mlr`;
  if (cap >= 1e6) return `₺${(cap / 1e6).toFixed(2)} Mn`;
  return `₺${Number(cap).toLocaleString('tr-TR')}`;
}

function generateDetailHtml(symbol, stockInfo, details, historical) {
  const quotes = historical?.quotes || [];
  const meta = historical?.meta || {};

  // 52 Haftalik ve Finansal gostergeleri olasi tum kaynaklardan cikar
  const high52 = details?.fiftyTwoWeekHigh || meta.fiftyTwoWeekHigh || details?.summaryDetail?.fiftyTwoWeekHigh?.raw || details?.high || stockInfo.high;
  const low52 = details?.fiftyTwoWeekLow || meta.fiftyTwoWeekLow || details?.summaryDetail?.fiftyTwoWeekLow?.raw || details?.low || stockInfo.low;
  
  const rawPE = details?.peRatio || details?.trailingPE || details?.forwardPE || details?.summaryDetail?.trailingPE?.raw;
  const peText = rawPE && !isNaN(rawPE) ? Number(rawPE).toFixed(2) : 'N/A';

  const marketCap = details?.marketCap || details?.summaryDetail?.marketCap?.raw;
  const dayRange = (stockInfo.low && stockInfo.high) 
    ? `₺${formatNumber(stockInfo.low)} - ₺${formatNumber(stockInfo.high)}`
    : '-';

  const chartLabels = JSON.stringify(quotes.map(q => formatDate(q.date)));
  const chartPrices = JSON.stringify(quotes.map(q => Number(q.close.toFixed(2))));

  const isPositive = (stockInfo.changePercent || 0) >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const badgeBg = isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  return `<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${symbol} - Hisse Detayı ve Geçmiş Fiyat Grafiği</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 md:p-8">
  <div class="max-w-5xl mx-auto space-y-6">
    
    <!-- Ust Navigasyon -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <a href="index.html" class="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
        ← Ana Sayfaya Dön
      </a>
      <span class="text-xs text-slate-500">Otomatik BIST Analiz Portalı</span>
    </div>

    <!-- Hisse Baslik Karti -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-extrabold tracking-tight">${symbol}</h1>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeBg}">
            ${isPositive ? '+' : ''}${((stockInfo.changePercent || 0) * 100).toFixed(2)}%
          </span>
        </div>
        <p class="text-slate-400 text-sm mt-1">${stockInfo.name || details?.longName || meta.longName || symbol}</p>
        ${details?.sector ? `<span class="inline-block mt-2 text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">${details.sector}</span>` : ''}
      </div>

      <div class="text-left md:text-right">
        <div class="text-3xl font-bold tracking-tight">₺${Number(stockInfo.price || 0).toFixed(2)}</div>
        <div class="text-sm font-medium ${changeColor} mt-0.5">
          ${isPositive ? '▲' : '▼'} ₺${Number(stockInfo.change || 0).toFixed(2)}
        </div>
      </div>
    </div>

    <!-- Grafik Karti -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-slate-200">Son 1 Aylık Fiyat Hareketi</h2>
        <span class="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">Günlük Kapanış</span>
      </div>
      <div class="h-72 md:h-96 w-full">
        <canvas id="stockChart"></canvas>
      </div>
    </div>

    <!-- Finansal Detaylar Izgarasi -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span class="text-xs text-slate-500 font-medium block">52H En Yüksek</span>
        <span class="text-sm md:text-base font-bold text-slate-200 mt-1 block">${high52 ? `₺${formatNumber(high52)}` : '-'}</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span class="text-xs text-slate-500 font-medium block">52H En Düşük</span>
        <span class="text-sm md:text-base font-bold text-slate-200 mt-1 block">${low52 ? `₺${formatNumber(low52)}` : '-'}</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span class="text-xs text-slate-500 font-medium block">Günün Aralığı</span>
        <span class="text-xs md:text-sm font-bold text-slate-200 mt-1 block truncate">${dayRange}</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span class="text-xs text-slate-500 font-medium block">F/K Oranı (P/E)</span>
        <span class="text-sm md:text-base font-bold text-slate-200 mt-1 block">${peText}</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span class="text-xs text-slate-500 font-medium block">Piyasa Değeri</span>
        <span class="text-sm md:text-base font-bold text-slate-200 mt-1 block">${formatMarketCap(marketCap)}</span>
      </div>
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span class="text-xs text-slate-500 font-medium block">Günlük Hacim</span>
        <span class="text-sm md:text-base font-bold text-slate-200 mt-1 block">${stockInfo.volume ? Number(stockInfo.volume).toLocaleString('tr-TR') : '-'}</span>
      </div>
    </div>

    <!-- Alt Bilgi -->
    <footer class="text-center text-xs text-slate-600 pt-4">
      Veriler Yahoo Finance & Borsa API ile sağlanmaktadır. Yatırım tavsiyesi değildir.
    </footer>
  </div>

  <script>
    const ctx = document.getElementById('stockChart').getContext('2d');
    const labels = ${chartLabels};
    const data = ${chartPrices};

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '${symbol} Fiyat (₺)',
          data: data,
          borderColor: '#38bdf8',
          backgroundColor: gradient,
          fill: true,
          tension: 0.3,
          borderWidth: 2.5,
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: '#38bdf8',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#94a3b8',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: { color: '#64748b', maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

function generateIndexHtml(xu100, stockCardsData, topGainers) {
  const xu100Positive = (xu100.changePercent || 0) >= 0;
  const lastUpdate = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

  const stockCardsHtml = stockCardsData.map(item => {
    const isPos = (item.changePercent || 0) >= 0;
    const color = isPos ? 'text-emerald-400' : 'text-rose-400';
    const bg = isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400';

    return `
      <a href="${item.symbol.toLowerCase()}.html" class="block bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 p-5 rounded-2xl transition-all duration-200 transform hover:-translate-y-1 shadow-lg group">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-bold text-lg text-white group-hover:text-sky-400 transition-colors">${item.symbol}</h3>
            <p class="text-xs text-slate-400 line-clamp-1">${item.name || item.symbol}</p>
          </div>
          <span class="text-xs font-semibold px-2 py-1 rounded-full ${bg}">
            ${isPos ? '+' : ''}${((item.changePercent || 0) * 100).toFixed(2)}%
          </span>
        </div>
        <div class="flex items-baseline justify-between mt-4">
          <span class="text-2xl font-black text-slate-100">₺${Number(item.price || 0).toFixed(2)}</span>
          <span class="text-xs font-medium ${color} flex items-center">
            ${isPos ? '▲' : '▼'} ₺${Number(item.change || 0).toFixed(2)}
          </span>
        </div>
        <div class="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Detaylı Grafik</span>
          <span class="text-sky-400 group-hover:translate-x-1 transition-transform">İncele →</span>
        </div>
      </a>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIST Borsa Takip & Analiz Portalı</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 md:p-8">
  <div class="max-w-6xl mx-auto space-y-8">
    
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Borsa İstanbul Portalı
        </h1>
        <p class="text-slate-400 text-sm mt-1">Canlı Endeks, Hisse Kartları ve Geçmiş Fiyat Grafikleri</p>
      </div>
      <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-400 self-start md:self-auto">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Son Güncelleme: <strong class="text-slate-200">${lastUpdate}</strong></span>
      </div>
    </header>

    <!-- XU100 Ana Kart -->
    <div class="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-md">Ana Endeks</span>
          <h2 class="text-2xl md:text-3xl font-bold mt-2">BIST 100 (XU100)</h2>
          <p class="text-slate-400 text-xs mt-1">Borsa İstanbul Ulusal 100 Endeksi</p>
        </div>
        <div class="flex items-baseline md:flex-col md:items-end gap-3 md:gap-1">
          <span class="text-4xl md:text-5xl font-extrabold tracking-tight">₺${Number(xu100.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          <span class="text-sm font-semibold px-3 py-1 rounded-full ${xu100Positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
            ${xu100Positive ? '▲ +' : '▼ '}${((xu100.changePercent || 0) * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>

    <!-- Hisse Listesi Izgarasi -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-slate-200">Popüler Hisseler (Grafik için tıklayın)</h2>
        <span class="text-xs text-slate-500">Detaylı analiz sayfaları mevcuttur</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${stockCardsHtml}
      </div>
    </section>

    <!-- Footer -->
    <footer class="text-center text-xs text-slate-600 pt-8 border-t border-slate-900">
      GitHub Actions & Pages ile otomatik derlenmiştir. Yatırım tavsiyesi değildir.
    </footer>

  </div>
</body>
</html>`;
}

async function main() {
  console.log('🚀 Veriler ve grafik sayfaları oluşturuluyor...');

  try {
    // 1. Endeks verisi
    const xu100 = await api.getIndex('XU100');

    // 2. Hisseler için verileri ve detay sayfalarını oluştur
    const stockCardsData = [];

    for (const symbol of TRACKED_STOCKS) {
      console.log(`⏳ ${symbol} verisi ve geçmiş grafiği çekiliyor...`);
      try {
        const [stockData, details, historical] = await Promise.all([
          api.getStock(symbol),
          api.getStockDetails(symbol).catch(() => null),
          api.getHistoricalData(symbol, { period: '1mo', interval: '1d' }).catch(() => null)
        ]);

        stockCardsData.push(stockData);

        // Ayrı hisse detay sayfasını kaydet (örn: thyao.html)
        const detailHtml = generateDetailHtml(symbol, stockData, details, historical);
        fs.writeFileSync(`${symbol.toLowerCase()}.html`, detailHtml, 'utf8');

      } catch (err) {
        console.error(`${symbol} için veri alınamadı:`, err.message);
      }
    }

    // 3. Ana sayfayı (index.html) oluştur ve kaydet
    const indexHtml = generateIndexHtml(xu100, stockCardsData);
    fs.writeFileSync('index.html', indexHtml, 'utf8');

    console.log('✅ Tüm sayfalar (index.html ve detay sayfaları) başarıyla oluşturuldu!');

  } catch (error) {
    console.error('Kritik hata:', error.message);
    process.exit(1);
  }
}

main();