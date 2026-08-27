import fs from 'fs';
import BorsaAPI from 'borsa-api';

const api = new BorsaAPI();

const WATCHLIST = [
  'THYAO', 'GARAN', 'ASELS', 'EREGL', 'TUPRS', 
  'KCHOL', 'SISE', 'BIMAS', 'AKBNK', 'YKBNK'
];

async function generateHTML() {
  console.log('🚀 Borsa verileri çekiliyor ve web sayfası hazırlanıyor...');

  try {
    // 1. Endeks verilerini çek
    const xu100 = await api.getIndex('XU100').catch(() => ({ value: 'N/A', changePercent: 0 }));
    const xu030 = await api.getIndex('XU030').catch(() => ({ value: 'N/A', changePercent: 0 }));
    const xbank = await api.getIndex('XBANK').catch(() => ({ value: 'N/A', changePercent: 0 }));

    // 2. Takip listesi hisselerini çek
    const stockDataList = [];
    for (const symbol of WATCHLIST) {
      try {
        const data = await api.getStock(symbol);
        stockDataList.push(data);
      } catch (e) {
        console.warn(`${symbol} verisi alınamadı:`, e.message);
      }
    }

    // 3. En çok yükselenler
    let topGainers = [];
    try {
      topGainers = await api.getTopGainers(5);
    } catch (e) {
      console.warn('En çok yükselenler alınamadı.');
    }

    const now = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

    const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIST Borsa Takip Paneli</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
    .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); }
  </style>
</head>
<body class="min-h-screen p-4 md:p-8">
  <div class="max-w-6xl mx-auto space-y-8">
    
    <!-- Üst Başlık -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-750 gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          📈 BIST Piyasa Takip Paneli
        </h1>
        <p class="text-slate-400 text-sm mt-1">Gecikmeli BIST borsa verileri ve popüler hisseler</p>
      </div>
      <div class="text-xs text-slate-400 glass px-4 py-2 rounded-xl flex items-center gap-2">
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Son Güncelleme: <span class="font-mono text-slate-200">${now}</span>
      </div>
    </header>

    <!-- Endeks Kartları -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="glass p-5 rounded-2xl">
        <div class="text-slate-400 text-sm font-medium">BIST 100 (XU100)</div>
        <div class="text-2xl font-bold mt-2 font-mono">${xu100.value || '---'}</div>
        <div class="mt-2 text-sm font-semibold ${(xu100.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
          ${(xu100.changePercent || 0) >= 0 ? '▲' : '▼'} %${Number(xu100.changePercent || 0).toFixed(2)}
        </div>
      </div>

      <div class="glass p-5 rounded-2xl">
        <div class="text-slate-400 text-sm font-medium">BIST 30 (XU030)</div>
        <div class="text-2xl font-bold mt-2 font-mono">${xu030.value || '---'}</div>
        <div class="mt-2 text-sm font-semibold ${(xu030.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
          ${(xu030.changePercent || 0) >= 0 ? '▲' : '▼'} %${Number(xu030.changePercent || 0).toFixed(2)}
        </div>
      </div>

      <div class="glass p-5 rounded-2xl">
        <div class="text-slate-400 text-sm font-medium">BIST Banka (XBANK)</div>
        <div class="text-2xl font-bold mt-2 font-mono">${xbank.value || '---'}</div>
        <div class="mt-2 text-sm font-semibold ${(xbank.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
          ${(xbank.changePercent || 0) >= 0 ? '▲' : '▼'} %${Number(xbank.changePercent || 0).toFixed(2)}
        </div>
      </div>
    </section>

    <!-- Tablolar Alanı -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Ana Takip Listesi Tablosu -->
      <div class="lg:col-span-2 glass p-6 rounded-2xl">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <i class="fa-solid fa-layer-group text-blue-400"></i> Popüler Hisseler
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-slate-400 uppercase text-xs border-b border-slate-700/60 pb-2">
              <tr>
                <th class="py-3 px-2">Sembol</th>
                <th class="py-3 px-2">Şirket</th>
                <th class="py-3 px-2 text-right">Fiyat</th>
                <th class="py-3 px-2 text-right">Değişim</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${stockDataList.map(stock => {
                const isPos = (stock.changePercent || 0) >= 0;
                return `
                <tr class="hover:bg-slate-800/40 transition">
                  <td class="py-3 px-2 font-bold font-mono text-blue-300">${stock.symbol}</td>
                  <td class="py-3 px-2 text-slate-300 truncate max-w-[150px] md:max-w-[200px]">${stock.name || '-'}</td>
                  <td class="py-3 px-2 text-right font-mono font-medium">₺${Number(stock.price).toFixed(2)}</td>
                  <td class="py-3 px-2 text-right font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}">
                    ${isPos ? '+' : ''}%${Number(stock.changePercent || 0).toFixed(2)}
                  </td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Günün Yıldızları -->
      <div class="glass p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <i class="fa-solid fa-fire text-amber-400"></i> Günün Yükselenleri
          </h2>
          <div class="space-y-3">
            ${topGainers.map((g, idx) => `
              <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <div class="flex items-center gap-3">
                  <span class="text-xs w-5 h-5 flex items-center justify-center rounded-full bg-slate-700 font-bold text-slate-300">${idx + 1}</span>
                  <div>
                    <div class="font-bold text-sm">${g.symbol}</div>
                    <div class="text-xs text-slate-400">₺${Number(g.price).toFixed(2)}</div>
                  </div>
                </div>
                <div class="text-emerald-400 font-bold text-sm">
                  +%${Number(g.changePercent || 0).toFixed(2)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500">
          * Veriler Yahoo Finance kaynaklı olup gecikmeli sağlanmaktadır. Yatırım tavsiyesi içermez.
        </div>
      </div>

    </div>

  </div>
</body>
</html>`;

    // Oluşan sayfayı index.html olarak kaydet
    fs.writeFileSync('index.html', htmlContent, 'utf-8');
    console.log('✅ index.html başarıyla oluşturuldu!');
  } catch (err) {
    console.error('Hata oluştu:', err);
  }
}

generateHTML();