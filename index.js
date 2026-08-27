import BorsaAPI from 'borsa-api';

const api = new BorsaAPI();

async function main() {
  console.log('⏳ Borsa verileri getiriliyor...\n');

  try {
    // 1. BIST 100 Endeks Verisi
    const xu100 = await api.getIndex('XU100');
    console.log(`📊 BIST 100 Endeksi: ${xu100.value} TL (Günlük Değişim: %${xu100.changePercent})`);

    // 2. Takip Edilen Hisseler
    console.log('\n--- 📌 Takip Listesi ---');
    const hisseler = ['THYAO', 'GARAN', 'ASELS', 'EREGL'];
    
    for (const sembol of hisseler) {
      const data = await api.getStock(sembol);
      console.log(`${data.symbol} (${data.name}): ₺${data.price} [Değişim: %${data.changePercent}]`);
    }

    // 3. Günün En Çok Yükselenleri
    console.log('\n--- 🚀 Günün En Çok Yükselen 3 Hissesi ---');
    const yukselenler = await api.getTopGainers(3);
    yukselenler.forEach((h, i) => {
      console.log(`${i + 1}. ${h.symbol}: ₺${h.price} (+%${h.changePercent})`);
    });

  } catch (hata) {
    console.error('Bir hata oluştu:', hata.message);
  }
}

main();