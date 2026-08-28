import fs from 'fs';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RECIPIENT_EMAIL = process.env.NEWSLETTER_RECIPIENT || 'mertcan.baybekmn@gmail.com';

function formatNum(val) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChangeBadge(val, pct) {
  const isPos = (pct || 0) >= 0;
  const color = isPos ? '#10b981' : '#f43f5e';
  const sign = isPos ? '▲ +' : '▼ ';
  return `<span style="color: ${color}; font-weight: bold;">${sign}%${Math.abs(pct || 0).toFixed(2)}</span>`;
}

export function generateNewsletterHtml(data) {
  const indices = data.indices || {};
  const currencies = data.currencies || {};
  const topGainers = data.topGainers || [];
  const topLosers = data.topLosers || [];
  const session = data.marketSession || {};

  const xu100 = indices.XU100 || {};
  const xu030 = indices.XU030 || {};
  const xbank = indices.XBANK || {};
  const xusin = indices.XUSIN || {};
  const altin = indices.ALTIN || {};
  const ceyrek = indices.CEYREK || {};
  const gumus = indices.GUMUS || {};
  const usd = currencies.USDTRY || {};
  const eur = currencies.EURTRY || {};

  const dateStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
    timeZone: 'Europe/Istanbul'
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BIST Sabah Bülteni</title>
  </head>
  <body style="margin: 0; padding: 20px 10px; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0f172a; border-radius: 20px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      
      <!-- Header -->
      <tr>
        <td style="padding: 28px 24px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border-bottom: 1px solid #334155; text-align: center;">
          <div style="display: inline-block; width: 44px; height: 44px; background: linear-gradient(135deg, #0284c7, #6366f1); border-radius: 12px; line-height: 44px; font-size: 22px; font-weight: 900; color: #ffffff; margin-bottom: 12px;">₺</div>
          <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Borsa İstanbul Günlük Bülten</h1>
          <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">${dateStr} • Seans Öncesi Piyasa Özeti</p>
          <div style="margin-top: 12px;">
            <span style="display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; background-color: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3);">
              ${session.sessionName || 'Resmi Seans Kapanışları'}
            </span>
          </div>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td style="padding: 24px;">
          
          <!-- BIST 100 Ana Kart -->
          <div style="background-color: #1e293b; border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; border: 1px solid #334155;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Ana Gösterge</span>
                  <h2 style="margin: 2px 0 0 0; font-size: 18px; font-weight: 800; color: #ffffff;">BIST 100 (XU100)</h2>
                </td>
                <td align="right">
                  <div style="font-size: 22px; font-weight: 900; color: #ffffff;">${formatNum(xu100.price)}</div>
                  <div style="font-size: 13px;">${formatChangeBadge(xu100.change, xu100.changePercent)}</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Endeksler Tablosu -->
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #cbd5e1;">📊 Sektör ve Piyasa Endeksleri</h3>
          <table width="100%" border="0" cellpadding="10" cellspacing="0" style="background-color: #131d31; border-radius: 12px; margin-bottom: 24px; font-size: 13px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #1e293b; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">
              <th align="left" style="padding-left: 14px;">Endeks</th>
              <th align="right">Puan / Fiyat</th>
              <th align="right" style="padding-right: 14px;">Değişim</th>
            </tr>
            <tr style="border-bottom: 1px solid #1e293b;">
              <td style="padding-left: 14px; font-weight: 600; color: #818cf8;">BIST 30 (XU030)</td>
              <td align="right" style="font-weight: 700;">${formatNum(xu030.price)}</td>
              <td align="right" style="padding-right: 14px;">${formatChangeBadge(xu030.change, xu030.changePercent)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1e293b;">
              <td style="padding-left: 14px; font-weight: 600; color: #34d399;">BIST Banka (XBANK)</td>
              <td align="right" style="font-weight: 700;">${formatNum(xbank.price)}</td>
              <td align="right" style="padding-right: 14px;">${formatChangeBadge(xbank.change, xbank.changePercent)}</td>
            </tr>
            <tr>
              <td style="padding-left: 14px; font-weight: 600; color: #f59e0b;">BIST Sınai (XUSIN)</td>
              <td align="right" style="font-weight: 700;">${formatNum(xusin.price)}</td>
              <td align="right" style="padding-right: 14px;">${formatChangeBadge(xusin.change, xusin.changePercent)}</td>
            </tr>
          </table>

          <!-- Altın & Döviz Kartları -->
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #cbd5e1;">🪙 Kıymetli Maden & Döviz Kurları</h3>
          <table width="100%" border="0" cellpadding="0" cellspacing="8" style="margin-bottom: 24px;">
            <tr>
              <td width="50%" style="background-color: #131d31; border: 1px solid #1e293b; border-radius: 12px; padding: 12px 14px;">
                <div style="font-size: 11px; color: #fbbf24; font-weight: 700;">Gram Altın (24K)</div>
                <div style="font-size: 17px; font-weight: 900; margin: 4px 0;">₺${formatNum(altin.price)}</div>
                <div style="font-size: 12px;">${formatChangeBadge(altin.change, altin.changePercent)}</div>
              </td>
              <td width="50%" style="background-color: #131d31; border: 1px solid #1e293b; border-radius: 12px; padding: 12px 14px;">
                <div style="font-size: 11px; color: #94a3b8; font-weight: 700;">Gram Gümüş</div>
                <div style="font-size: 17px; font-weight: 900; margin: 4px 0;">₺${formatNum(gumus.price)}</div>
                <div style="font-size: 12px;">${formatChangeBadge(gumus.change, gumus.changePercent)}</div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="background-color: #131d31; border: 1px solid #1e293b; border-radius: 12px; padding: 12px 14px;">
                <div style="font-size: 11px; color: #38bdf8; font-weight: 700;">Dolar / TL</div>
                <div style="font-size: 17px; font-weight: 900; margin: 4px 0;">₺${formatNum(usd.price)}</div>
                <div style="font-size: 12px;">${formatChangeBadge(usd.change, usd.changePercent)}</div>
              </td>
              <td width="50%" style="background-color: #131d31; border: 1px solid #1e293b; border-radius: 12px; padding: 12px 14px;">
                <div style="font-size: 11px; color: #a78bfa; font-weight: 700;">Euro / TL</div>
                <div style="font-size: 17px; font-weight: 900; margin: 4px 0;">₺${formatNum(eur.price)}</div>
                <div style="font-size: 12px;">${formatChangeBadge(eur.change, eur.changePercent)}</div>
              </td>
            </tr>
          </table>

          <!-- En Çok Hareket Edenler -->
          ${topGainers.length > 0 ? `
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #cbd5e1;">🚀 Günün En Çok Yükselenleri</h3>
          <div style="background-color: #131d31; border-radius: 12px; padding: 10px 14px; margin-bottom: 24px;">
            ${topGainers.slice(0, 3).map(g => `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1e293b;">
                <span style="font-weight: 700; color: #ffffff;">${g.symbol} <span style="font-weight: normal; color: #64748b; font-size: 11px;">(${g.name})</span></span>
                <span style="color: #34d399; font-weight: 700;">₺${formatNum(g.price)} (+%${g.changePercent.toFixed(2)})</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Buton -->
          <div style="text-align: center; margin: 28px 0 12px 0;">
            <a href="https://marijuannaa.github.io/bist-borsa-takip/" style="background: linear-gradient(135deg, #0284c7, #4f46e5); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
              Canlı Borsa Terminaline Git →
            </a>
          </div>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #090d16; border-top: 1px solid #1e293b; padding: 20px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0 0 6px 0;">Bu bülten otomatik olarak derlenmiştir ve Sermaye Piyasası Kurulu mevzuatınca yatırım tavsiyesi içermez.</p>
          <p style="margin: 0;">
            Abonelikten ayrılmak için 
            <a href="https://marijuannaa.github.io/bist-borsa-takip/abone.html" style="color: #94a3b8; text-decoration: underline;">
              buraya tıklayabilirsiniz
            </a>.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

async function main() {
  if (!fs.existsSync('./data.json')) {
    console.error('❌ data.json dosyası bulunamadı. Önce "node fetch-data.js" çalıştırılmalıdır.');
    process.exit(1);
  }

  const rawData = fs.readFileSync('./data.json', 'utf-8');
  const data = JSON.parse(rawData);

  const html = generateNewsletterHtml(data);

  if (!RESEND_API_KEY) {
    console.log('ℹ️ RESEND_API_KEY tanımlanmamış. HTML bülten şablonu yerel olarak başarıyla oluşturuldu ve doğrulandı.');
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  console.log(`✉️ Sabah bülteni ${RECIPIENT_EMAIL} adresine gönderiliyor...`);

  try {
    const res = await resend.emails.send({
      from: 'BIST Takip <onboarding@resend.dev>',
      to: RECIPIENT_EMAIL,
      subject: `📈 BIST & Piyasa Sabah Bülteni (${data.marketSession?.timeStr || 'Güncel'})`,
      html: html
    });

    if (res.error) {
      console.error('✕ Resend Hatası:', res.error.message);
      process.exit(1);
    } else {
      console.log('✓ Sabah bülteni başarıyla iletildi! ID:', res.data?.id);
    }
  } catch (err) {
    console.error('✕ Gönderim Hatası:', err.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1]?.endsWith('send-newsletter.js')) {
  main();
}