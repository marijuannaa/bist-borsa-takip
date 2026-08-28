# 📈 Borsa İstanbul (BIST) Canlı Finans Terminali & Portföy Analiz Portalı

[![CI Test Suite](https://github.com/marijuannaa/bist-borsa-takip/actions/workflows/test.yml/badge.svg)](https://github.com/marijuannaa/bist-borsa-takip/actions)
[![BIST Web Portalı](https://github.com/marijuannaa/bist-borsa-takip/actions/workflows/deploy.yml/badge.svg)](https://github.com/marijuannaa/bist-borsa-takip/actions)
[![Node.js Version](https://img.shields.io/badge/node.js-v22%2B-339933?logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Borsa İstanbul (**BIST 100, BIST 30, BIST Banka, BIST Sınai, BIST Bilişim**) endekslerini, 45+ lider hisse senedini, döviz kurlarını ve kıymetli madenleri (Gram Altın, Çeyrek Altın, Gümüş) anlık, gecikmesiz ve derinlemesine teknik göstergelerle takip etmenizi sağlayan yüksek performanslı finansal web terminali ve CLI aracıdır.

🌐 **Canlı Web Portalı:** [https://marijuannaa.github.io/bist-borsa-takip/](https://marijuannaa.github.io/bist-borsa-takip/)

---

## ✨ Öne Çıkan Özellikler

### 📊 1. Canlı Piyasa Terminali (`index.html`)
- ⚡ **Yüksek Hızlı Statik CDN Mimarisi:** Tarayıcı tarafında CORS veya proxy engellerine takılmadan, sunucu tarafında derlenen optimize `data.json` ile 0.02 saniyede ultra hızlı yükleme.
- ⏱️ **Canlı Seans & Geri Sayım Saati:** TSİ (UTC+3) çalışma saatlerini (Emir toplama, sürekli müzayede, kapanış seansı, hafta sonu) anlık izleyen ve seans açılış/kapanışına kalan süreyi hesaplayan akıllı motor.
- 🚥 **Kayan Piyasa Bandı (Ticker Marquee):** Endeksler, dövizler, altın ve günün en çok yükselen hisselerini kesintisiz kayan bantta canlı gösterim.
- 🎛️ **3 Farklı Görüntüleme Modu:**
  - **Kart Görünümü (Grid):** Mini sparkline SVG grafikleri, hacim rozetleri ve RSI sinyalleri.
  - **Finansal Tablo (Table):** Sembol, fiyat, 1 günlük / 1 haftalık / 1 aylık getiri, günün aralığı, RSI(14) ve hacim sıralaması.
  - **Piyasa Isı Haritası (Heatmap):** Sektör ağırlıklarına göre renk tonlamalı görsel getiri haritası.
- 🔍 **Canlı Arama & Sektör Filtreleri:** BIST 30, Bankacılık, Havacılık, Holding, Sanayi, Enerji, Teknoloji, Temettü ve Kişisel Takip Listesi sekmeleri.
- ⚡ **Hızlı Önizleme Modalı:** Tıklanan hissenin 1H - 1Y geçmiş trend grafiği, 52 haftalık aralık çubuğu, RSI ve destek/direnç pivotları.

### 📈 2. Derinlemesine Hisse Analiz Sayfası (`hisse.html`)
- 📉 **Çok Zamanlı İnteraktif Grafik:** 1H, 1A, 3A, 6A, 1Y periyotlarında Chart.js ile dinamik kapanış çizgisi.
- 📐 **Teknik Gösterge Katmanları:** SMA (20 Günlük) ve SMA (50 Günlük) hareketli ortalama bindirmeleri.
- 📊 **Hacim ve RSI(14) İndikatör Alt Grafiği:** Aşırı alım (>70) ve aşırı satım (<30) bölgelerinin tespiti.
- 🎯 **Otomatik Pivot Seviyeleri:** Standart Floor Pivot, Direnç 1 (R1) ve Destek 1 (S1) hesaplaması.
- 🏢 **Sektör Akran Karşılaştırması:** Aynı sektörde işlem gören diğer hisselerin anlık performans özeti.

### 💼 3. Canlı Portföy & Takip Yöneticisi (`portfoy.html`)
- 🔒 **Gizlilik Odaklı Yerel Depolama (LocalStorage):** Portföy verileriniz tamamen tarayıcınızda saklanır.
- 💰 **Anlık Kâr / Zarar & Getiri Hesaplama:** Ortalama maliyet, güncel piyasa değeri ve günlük portföy değişimi.
- 🍩 **Varlık Dağılımı Donut Grafiği:** Hisselerinizin portföydeki yüzdesel ağırlıklarını görselleştirme.
- 💾 **Yedekleme & Dışa Aktarma:** Portföyü tek tıkla JSON olarak kaydetme.

### 🧮 4. Finansal Hesaplayıcı & Simülatör (`hesaplayici.html`)
- 📈 **Hisse Kâr / Zarar & Komisyon Hesaplayıcı:** Alış-satış fiyatı, lot adedi ve aracı kurum komisyonu kesintisi sonrası net kâr/zarar.
- 💱 **Canlı Döviz & Kıymetli Maden Çevirici:** TL, USD, EUR, GBP, Gram Altın (24K), Çeyrek Altın ve Gram Gümüş arasında anlık kur dönüşümü.
- 🌱 **Bileşik Getiri & Temettü Büyüme Simülatörü:** Düzenli aylık tasarruf ve bileşik faiz getiri projeksiyon grafiği.

### ✉️ 5. Sabah Piyasa Bülteni (`send-newsletter.js` & `abone.html`)
- ☕ **Hafta İçi Her Sabah 09:00'da (TSİ):** Seans açılışından 1 saat önce dünün resmi seans kapanışları, döviz kurları, altın fiyatları ve günün en çok hareket eden hisseleri e-posta kutunuza otomatik iletilir.

### 💻 6. Zengin Terminal CLI Arayüzü (`index.js`)
- Konsol üzerinden renkli ANSI tabloları, ASCII mini sparkline grafikleri ve anlık piyasa durumu.

```bash
# Terminal Dashboard'u başlat
node index.js

# Özel bir hissenin detaylı analizini konsolda görüntüle
node index.js THYAO
node index.js GARAN
node index.js ASELS
```

---

## 🛠️ Teknoloji Yığını

- **Frontend:** Vanilla HTML5, Modern ECMAScript (ESM), Tailwind CSS (JIT CDN), Chart.js v4
- **Backend / Veri Motoru:** Node.js v22+, Yerel Fetch API, Yahoo Finance API v8
- **Finansal Algoritmalar:** RSI(14) Wilder Smoothing, SMA(20/50), Floor Pivot Points, Compound Interest Math
- **E-Posta Servisi:** Resend API
- **Otomasyon & Dağıtım:** GitHub Actions, GitHub Pages CI/CD

---

## 🚀 Yerel Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/marijuannaa/bist-borsa-takip.git
cd bist-borsa-takip
```

### 2. Bağımlılıkları Kurun
```bash
npm install
```

### 3. Testleri Çalıştırın
```bash
npm test
```

### 4. Güncel Verileri İndirin
```bash
npm run fetch
```

### 5. CLI Dashboard'u Başlatın
```bash
npm start
# veya belirli bir hisse için:
node index.js ASELS
```

### 6. Web Arayüzünü Tarayıcıda Açın
Herhangi bir statik sunucuyla (örn: VS Code Live Server veya `npx serve .`) `index.html` sayfasını açabilirsiniz.

---

## ⏰ GitHub Actions Otomasyonu

| İş Akışı | Zamanlama | Görev |
| :--- | :--- | :--- |
| **Piyasa Verisi & Dağıtım** | Hafta içi 10:00 - 19:00 (Her saat başı) | `fetch-data.js` çalıştırılır, `data.json` derlenir ve GitHub Pages'e yüklenir. |
| **Sabah Bülteni** | Hafta içi 09:00 TSİ | Güncel verileri derleyip kayıtlı abonelere bülten e-postası iletir. |
| **CI Test Suite** | Push / Pull Request | Tüm birim testleri (`npm test`) otomatik çalıştırır. |

---

## 📄 Yasal Uyarı

Bu sayfada ve terminal aracında sunulan borsa verileri, hisse fiyatları, teknik analiz göstergeleri ve hesaplamalar yalnızca bilgilendirme amaçlıdır. Sermaye Piyasası Kurulu (SPK) mevzuatı kapsamında yatırım danışmanlığı veya alım-satım tavsiyesi niteliği taşımaz.

---

## 👨‍💻 Geliştirici & Lisans

Geliştirici: **Mertcan Baybek**  
Lisans: [MIT](LICENSE)