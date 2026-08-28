import fs from 'fs';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const audienceId = process.env.RESEND_AUDIENCE_ID;

if (!resendApiKey) {
  console.error('❌ HATA: RESEND_API_KEY ortam değişkeni bulunamadı.');
  process.exit(1);
}

const resend = new Resend(resendApiKey);

function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMarketData() {
  if (!fs.existsSync('./data.json')) {
    throw new Error('data.json dosyası bulunamadı. Önce node fetch-data.js çalıştırılmalı.');
  }
  const raw = fs.readFileSync('./data.json', 'utf-8');
  return JSON.parse(raw);
}

function generateEmailTemplate(data) {
  const indices = data.indices || {};
  const xu100 = indices.XU100 || { price: 0, change: 0, changePercent: 0 };
  const xu030 = indices.XU030 || { price: 0, change: 0, changePercent: 0 };
  const altin = indices.ALTIN || { price: 0, change: 0, changePercent: 0 };
  const xbank = indices.XBANK || { price: 0, change: 0, changePercent: 0 };

  const todayStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul'
  });

  const makeRow = (title, item, isCurrency = false) => {
    const isPos = item.change >= 0;
    const color = isPos ? '#10b981' : '#f43f5e';
    const sign = isPos ? '+' : '';
    const arrow = isPos ? '▲' : '▼';
    const priceText = isCurrency ? `₺${formatNumber(item.price)}` : formatNumber(item.price);
    
    return `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 12px 8px; font-weight: 600; color: #f8fafc;">${title}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #ffffff;">${priceText}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: ${color};">
          ${arrow} ${sign}${formatNumber(item.change)} (%${item.changePercent}%)
        </td>
      </tr>
    `;
  };

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>BIST Sabah Bülteni</title>
  </head>
  <body style="margin: 0; padding: 24px; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #cbd5e1;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      
      <!-- Başlık -->
      <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">☀️ Borsa İstanbul Sabah Bülteni</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">${todayStr} • Seans Öncesi Kapanış Verileri</p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0;">
        Günaydın! Borsa İstanbul'da seans açılmadan önce dünün piyasa kapanış puanları ve gram altın fiyat özeti aşağıdadır:
      </p>

      <!-- Fiyat Tablosu -->
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
        <thead>
          <tr style="border-bottom: 2px solid #334155; color: #94a3b8; text-align: left; font-size: 12px; text-transform: uppercase;">
            <th style="padding: 8px;">Enstrüman</th>
            <th style="padding: 8px; text-align: right;">Kapanış Fiyatı</th>
            <th style="padding: 8px; text-align: right;">Günlük Değişim</th>
          </tr>
        </thead>
        <tbody>
          ${makeRow('BIST 100 (XU100)', xu100)}
          ${makeRow('BIST 30 (XU030)', xu030)}
          ${makeRow('BIST Banka (XBANK)', xbank)}
          ${makeRow('Gram Altın (TL)', altin, true)}
        </tbody>
      </table>

      <!-- Buton -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://marijuannaa.github.io/bist-borsa-takip/" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 10px; display: inline-block;">
          Canlı Grafikleri İncele →
        </a>
      </div>

      <!-- Alt Bilgi & Yasal Uyarı & Unsubscribe -->
      <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
        <p style="margin-bottom: 8px;">
          <strong>YASAL UYARI:</strong> Bu e-postadaki veriler yatırım tavsiyesi niteliği taşımaz. Bilgilendirme amaçlıdır.
        </p>
        <p style="margin: 0;">
          Bu e-postayı BIST Borsa Takip bültenine abone olduğunuz için aldınız.<br>
          Artık e-posta almak istemiyorsanız <a href="https://marijuannaa.github.io/bist-borsa-takip/abone.html#cikis" style="color: #38bdf8; text-decoration: underline;">Abonelikten Ayrıl</a>.
        </p>
      </div>

    </div>
  </body>
  </html>
  `;
}

async function main() {
  try {
    console.log('📬 Sabah bülteni hazırlanıyor...');
    const marketData = getMarketData();
    const htmlContent = generateEmailTemplate(marketData);

    const todayFormatted = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    const subject = `☀️ BIST & Altın Sabah Özeti (${todayFormatted})`;

    // Audience ID tanımlıysa oradaki kayıtlı abonelere, değilse test adresine gönderilir
    if (audienceId) {
      console.log(`Audience (${audienceId}) listesine bülten iletiliyor...`);
      await resend.broadcasts.create({
        audienceId: audienceId,
        from: 'BIST Portali <onboarding@resend.dev>',
        subject: subject,
        html: htmlContent
      });
    } else {
      console.log('Audience ID belirtilmedi. Doğrudan tekil gönderim yapılıyor...');
      await resend.emails.send({
        from: 'BIST Portali <onboarding@resend.dev>',
        to: ['delivered@resend.dev'], // Test alıcısı
        subject: subject,
        html: htmlContent
      });
    }

    console.log('✅ Sabah bülteni başarıyla gönderildi!');
  } catch (err) {
    console.error('❌ E-posta gönderim hatası:', err.message);
    process.exit(1);
  }
}

main();