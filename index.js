#!/usr/bin/env node

import fs from 'fs';
import { getMarketSessionStatus } from './src/indicators.js';

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgDark: '\x1b[40m'
};

function formatNum(val) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(val, pct) {
  const isPos = (pct || 0) >= 0;
  const color = isPos ? c.green : c.red;
  const arrow = isPos ? '▲ +' : '▼ ';
  return `${color}${arrow}%${Math.abs(pct || 0).toFixed(2)}${c.reset}`;
}

function renderSparkline(prices) {
  if (!prices || prices.length === 0) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (max === min) return '━━━━━';
  
  const chars = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  return prices.map(p => {
    const idx = Math.min(chars.length - 1, Math.max(0, Math.floor(((p - min) / (max - min)) * (chars.length - 1))));
    return chars[idx];
  }).join('');
}

function printStockDetail(sym, stock) {
  const isPos = stock.change >= 0;
  const changeColor = isPos ? c.green : c.red;

  console.log(`\n${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`  ${c.bold}${c.white}${sym}${c.reset} - ${c.bold}${stock.name || stock.shortName}${c.reset}  [${c.yellow}${stock.sector || 'BIST'}${c.reset}]`);
  console.log(`${c.cyan}========================================================================${c.reset}`);

  console.log(`\n  ${c.dim}FİYAT BİLGİLERİ${c.reset}`);
  console.log(`  Son Fiyat       : ${c.bold}${c.white}₺${formatNum(stock.price)}${c.reset}`);
  console.log(`  Günlük Değişim  : ${changeColor}${isPos ? '▲ +' : '▼ '}₺${formatNum(stock.change)} (%${stock.changePercent.toFixed(2)})${c.reset}`);
  console.log(`  Önceki Kapanış  : ₺${formatNum(stock.prevClose)}`);
  console.log(`  Günün Aralığı   : ₺${formatNum(stock.dayLow)} - ₺${formatNum(stock.dayHigh)}`);
  console.log(`  52H En Düş/Yük  : ₺${formatNum(stock.fiftyTwoWeekLow)} - ₺${formatNum(stock.fiftyTwoWeekHigh)}`);
  console.log(`  İşlem Hacmi     : ${Number(stock.volume || 0).toLocaleString('tr-TR')} Adet (₺${Number(Math.round((stock.volume || 0) * stock.price)).toLocaleString('tr-TR')})`);

  // Technicals
  console.log(`\n  ${c.dim}TEKNİK GÖSTERGELER & SİNYALLER${c.reset}`);
  const rsi = stock.rsi14;
  let rsiStatus = `${c.yellow}Nötr${c.reset}`;
  if (rsi !== null) {
    if (rsi < 30) rsiStatus = `${c.green}Aşırı Satım (Alım Fırsatı / Ucuz)${c.reset}`;
    else if (rsi > 70) rsiStatus = `${c.red}Aşırı Alım (Düzeltme Riski / Pahalı)${c.reset}`;
  }
  console.log(`  RSI (14)        : ${rsi ? `${c.bold}${rsi}${c.reset} [${rsiStatus}]` : '-'}`);
  console.log(`  SMA (20 Günlük) : ${stock.sma20 ? `₺${formatNum(stock.sma20)} ${stock.price > stock.sma20 ? c.green + '▲ Üstünde (Boğa)' + c.reset : c.red + '▼ Altında (Ayı)' + c.reset}` : '-'}`);
  console.log(`  SMA (50 Günlük) : ${stock.sma50 ? `₺${formatNum(stock.sma50)} ${stock.price > stock.sma50 ? c.green + '▲ Üstünde' + c.reset : c.red + '▼ Altında' + c.reset}` : '-'}`);

  if (stock.pivots) {
    console.log(`  Pivot Seviyesi  : ₺${stock.pivots.pivot}  (Direnç R1: ₺${stock.pivots.r1} | Destek S1: ₺${stock.pivots.s1})`);
  }

  // Returns
  if (stock.returns) {
    console.log(`\n  ${c.dim}GEÇMİŞ PERFORMANS GETİRİLERİ${c.reset}`);
    console.log(`  1 Hafta: ${formatChange(0, stock.returns.w1)}   1 Ay: ${formatChange(0, stock.returns.m1)}   3 Ay: ${formatChange(0, stock.returns.m3)}   1 Yıl: ${formatChange(0, stock.returns.y1)}   YTD: ${formatChange(0, stock.returns.ytd)}`);
  }

  // Sparkline
  if (stock.sparkline && stock.sparkline.length > 0) {
    console.log(`\n  ${c.dim}12 GÜNLÜK MİNİ TREND:${c.reset}  ${c.cyan}${renderSparkline(stock.sparkline)}${c.reset}`);
  }

  console.log(`\n${c.dim}Web detay sayfası için: https://marijuannaa.github.io/bist-borsa-takip/hisse.html?sembol=${sym}${c.reset}\n`);
}

function printDashboard(data) {
  const session = getMarketSessionStatus();
  const dateStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul'
  });

  console.log(`
${c.cyan}${c.bold}========================================================================
   📈  BORSA İSTANBUL (BIST) CANLI FİNANS TERMİNALİ
========================================================================${c.reset}`);
  console.log(`  ${c.bold}Zaman:${c.reset} ${dateStr} ${session.timeStr} | ${c.bold}Durum:${c.reset} ${session.isOpen ? c.green + '● ' + session.status : c.red + '● ' + session.status}${c.reset} | ${c.dim}${session.nextEvent}${c.reset}\n`);

  // Endeksler
  console.log(`${c.bold}--- 📊 PİYASA ENDEKSLERİ & EMTİA ---${c.reset}`);
  const xu100 = data.indices?.XU100;
  const xu030 = data.indices?.XU030;
  const xbank = data.indices?.XBANK;
  const xusin = data.indices?.XUSIN;
  const altin = data.indices?.ALTIN;
  const ceyrek = data.indices?.CEYREK;
  const usd = data.currencies?.USDTRY;
  const eur = data.currencies?.EURTRY;
  const brent = data.commodities?.BRENT;
  const btc = data.commodities?.BITCOIN;

  if (xu100) console.log(`  BIST 100 (XU100) : ${c.bold}${formatNum(xu100.price)}${c.reset}  [${formatChange(xu100.change, xu100.changePercent)}]  ${c.cyan}${renderSparkline(xu100.sparkline)}${c.reset}`);
  if (xu030) console.log(`  BIST 30 (XU030)  : ${c.bold}${formatNum(xu030.price)}${c.reset}  [${formatChange(xu030.change, xu030.changePercent)}]`);
  if (xbank) console.log(`  BIST Banka (XBANK): ${c.bold}${formatNum(xbank.price)}${c.reset}  [${formatChange(xbank.change, xbank.changePercent)}]`);
  if (xusin) console.log(`  BIST Sınai (XUSIN): ${c.bold}${formatNum(xusin.price)}${c.reset}  [${formatChange(xusin.change, xusin.changePercent)}]`);
  if (altin) console.log(`  Gram Altın (24K) : ₺${c.bold}${formatNum(altin.price)}${c.reset}  [${formatChange(altin.change, altin.changePercent)}]`);
  if (ceyrek) console.log(`  Çeyrek Altın     : ₺${c.bold}${formatNum(ceyrek.price)}${c.reset}  [${formatChange(ceyrek.change, ceyrek.changePercent)}]`);
  if (usd) console.log(`  Dolar / TL       : ₺${c.bold}${formatNum(usd.price)}${c.reset}  [${formatChange(usd.change, usd.changePercent)}]`);
  if (eur) console.log(`  Euro / TL        : ₺${c.bold}${formatNum(eur.price)}${c.reset}  [${formatChange(eur.change, eur.changePercent)}]`);
  if (brent) console.log(`  Brent Petrol     : $${c.bold}${formatNum(brent.price)}${c.reset}  [${formatChange(brent.change, brent.changePercent)}]`);
  if (btc) console.log(`  Bitcoin (USD)    : $${c.bold}${formatNum(btc.price)}${c.reset}  [${formatChange(btc.change, btc.changePercent)}]`);

  // Top Gainers & Losers
  console.log(`\n${c.bold}--- 🚀 GÜNÜN EN ÇOK YÜKSELENLERİ ---${c.reset}`);
  (data.topGainers || []).slice(0, 4).forEach((h, i) => {
    console.log(`  ${i + 1}. ${c.bold}${c.white}${h.symbol.padEnd(6)}${c.reset} : ₺${formatNum(h.price).padStart(8)} (${c.green}+%${h.changePercent.toFixed(2)}${c.reset}) - ${c.dim}${h.name}${c.reset}`);
  });

  console.log(`\n${c.bold}--- 🔻 GÜNÜN EN ÇOK DÜŞENLERİ ---${c.reset}`);
  (data.topLosers || []).slice(0, 4).forEach((h, i) => {
    console.log(`  ${i + 1}. ${c.bold}${c.white}${h.symbol.padEnd(6)}${c.reset} : ₺${formatNum(h.price).padStart(8)} (${c.red}%${h.changePercent.toFixed(2)}${c.reset}) - ${c.dim}${h.name}${c.reset}`);
  });

  // Most Active
  if (data.mostActive && data.mostActive.length > 0) {
    console.log(`\n${c.bold}--- 💎 EN YÜKSEK İŞLEM HACMİ (TL) ---${c.reset}`);
    data.mostActive.slice(0, 4).forEach((h, i) => {
      const turnoverStr = (h.turnover >= 1e9) 
        ? `₺${(h.turnover / 1e9).toFixed(2)} Milyar` 
        : `₺${(h.turnover / 1e6).toFixed(2)} Milyon`;
      console.log(`  ${i + 1}. ${c.bold}${c.white}${h.symbol.padEnd(6)}${c.reset} : ₺${formatNum(h.price).padStart(8)} [${turnoverStr}]`);
    });
  }

  console.log(`
${c.cyan}------------------------------------------------------------------------${c.reset}
  💡 ${c.bold}İpucu:${c.reset} Özel bir hisse incelemek için:  ${c.yellow}node index.js THYAO${c.reset}
  🌐 ${c.bold}Web Portalı:${c.reset}                  ${c.cyan}https://marijuannaa.github.io/bist-borsa-takip/${c.reset}
${c.cyan}========================================================================${c.reset}
`);
}

async function main() {
  const targetSymbol = process.argv[2]?.toUpperCase();

  if (!fs.existsSync('./data.json')) {
    console.log('⏳ Veriler henüz indirilmemiş. Veri motoru başlatılıyor...');
    const { execSync } = await import('child_process');
    execSync('node fetch-data.js', { stdio: 'inherit' });
  }

  const raw = fs.readFileSync('./data.json', 'utf-8');
  const data = JSON.parse(raw);

  if (targetSymbol) {
    const stock = data.stocks?.[targetSymbol];
    if (stock) {
      printStockDetail(targetSymbol, stock);
    } else {
      console.error(`\n❌ "${targetSymbol}" sembolü listede bulunamadı.`);
      console.log(`Mevcut hisseler: ${Object.keys(data.stocks || {}).slice(0, 20).join(', ')}...`);
    }
  } else {
    printDashboard(data);
  }
}

main().catch(err => {
  console.error('Hata:', err.message);
});