import fs from 'fs';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// Resend hesabı açtığınız onaylı e-posta:
const TEST_EMAIL = 'mertcan.baybekmn@gmail.com'; 

const resend = new Resend(RESEND_API_KEY);

function formatNum(val) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function runTest() {
  if (!fs.existsSync('./data.json')) {
    console.error('data.json dosyası bulunamadı. Önce "node fetch-data.js" çalıştırın.');
    process.exit(1);
  }

  const rawData = fs.readFileSync('./data.json', 'utf-8');
  const data = JSON.parse(rawData);

  const xu100 = data.indices?.XU100 || {};
  const xu030 = data.indices?.XU030 || {};
  const xbank = data.indices?.XBANK || {};
  const altin = data.indices?.ALTIN || {};

  const isMarketOpen = data.isMarketOpen;
  const statusLabel = isMarketOpen ? '🟢 Canlı Seans Verileri' : '🔴 Son Kapanış Verileri (Borsa Kapalı)';

  const dateStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; max-width: 600px; margin: 0 auto; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #38bdf8; margin: 0; font-size: 22px;">🎉 BIST Portalı'na Hoş Geldiniz!</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Sabah Bülteni • ${dateStr}</p>
        <span style="display: inline-block; margin-top: 8px; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 20px; background-color: ${isMarketOpen ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}; color: ${isMarketOpen ? '#34d399' : '#f87171'}; border: 1px solid ${isMarketOpen ? '#10b981' : '#f43f5e'};">
          ${statusLabel}
        </span>
      </div>

      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
        Merhaba, Borsa İstanbul Sabah Bülteni'ne kaydınız başarıyla tamamlandı. Her iş günü sabah saat 09:00'da resmi seans kapanışları ve piyasa verileri e-posta kutunuza iletilecektir.
      </p>

      <div style="margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <tr style="background-color: #1e293b; border-bottom: 2px solid #0f172a;">
            <th style="padding: 12px; color: #94a3b8;">Varlık</th>
            <th style="padding: 12px; color: #94a3b8;">Fiyat / Puan</th>
            <th style="padding: 12px; color: #94a3b8;">Günlük Değişim</th>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 12px; font-weight: bold; color: #38bdf8;">BIST 100 (XU100)</td>
            <td style="padding: 12px;">${formatNum(xu100.price)}</td>
            <td style="padding: 12px; color: ${(xu100.change || 0) >= 0 ? '#34d399' : '#f87171'}; font-weight: bold;">
              ${(xu100.change || 0) >= 0 ? '▲ +' : '▼ '}%${Math.abs(xu100.changePercent || 0).toFixed(2)}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 12px; font-weight: bold; color: #818cf8;">BIST 30 (XU030)</td>
            <td style="padding: 12px;">${formatNum(xu030.price)}</td>
            <td style="padding: 12px; color: ${(xu030.change || 0) >= 0 ? '#34d399' : '#f87171'}; font-weight: bold;">
              ${(xu030.change || 0) >= 0 ? '▲ +' : '▼ '}%${Math.abs(xu030.changePercent || 0).toFixed(2)}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 12px; font-weight: bold; color: #34d399;">BIST Banka (XBANK)</td>
            <td style="padding: 12px;">${formatNum(xbank.price)}</td>
            <td style="padding: 12px; color: ${(xbank.change || 0) >= 0 ? '#34d399' : '#f87171'}; font-weight: bold;">
              ${(xbank.change || 0) >= 0 ? '▲ +' : '▼ '}%${Math.abs(xbank.changePercent || 0).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #fbbf24;">Gram Altın (TL)</td>
            <td style="padding: 12px;">₺${formatNum(altin.price)}</td>
            <td style="padding: 12px; color: ${(altin.change || 0) >= 0 ? '#34d399' : '#f87171'}; font-weight: bold;">
              ${(altin.change || 0) >= 0 ? '▲ +' : '▼ '}%${Math.abs(altin.changePercent || 0).toFixed(2)}
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://marijuannaa.github.io/bist-borsa-takip/" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: bold; display: inline-block;">
          Canlı Portala Git →
        </a>
      </div>

      <!-- Alt Bilgi ve Abonelikten Çıkış Bağlantısı -->
      <div style="border-top: 1px solid #334155; margin-top: 28px; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;">Bu bülten bilgilendirme amaçlıdır, yatırım tavsiyesi içermez.</p>
        <p style="margin: 0;">
          Artık sabah bülteni almak istemiyorsanız 
          <a href="https://marijuannaa.github.io/bist-borsa-takip/abone.html?action=unsubscribe&email=${encodeURIComponent(TEST_EMAIL)}" style="color: #94a3b8; text-decoration: underline;">
            buraya tıklayarak abonelikten çıkabilirsiniz
          </a>.
        </p>
      </div>
    </div>
  `;

  console.log(`Hoş geldiniz ve piyasa bülteni ${TEST_EMAIL} adresine gönderiliyor...`);

  try {
    const response = await resend.emails.send({
      from: 'BIST Takip <onboarding@resend.dev>',
      to: TEST_EMAIL,
      subject: `🎉 Hoş Geldiniz! BIST & Piyasa Bülteni (${isMarketOpen ? 'Canlı Seans' : 'Son Kapanış'})`,
      html: htmlContent
    });

    if (response.error) {
      console.error('✕ Resend Hatası:', response.error.message);
    } else {
      console.log('✓ Hoş geldiniz maili başarıyla iletildi! Mail ID:', response.data?.id);
    }
  } catch (err) {
    console.error('✕ Beklenmeyen Hata:', err.message);
  }
}

runTest();