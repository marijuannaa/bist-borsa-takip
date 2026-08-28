# 📈 Borsa İstanbul (BIST) Canlı Takip Portalı

Borsa İstanbul (BIST 100, BIST 30, BIST Banka) endekslerini ve popüler hisse senetlerini modern bir web arayüzü üzerinden anlık, gecikmesiz ve kesintisiz takip etmenizi sağlayan yüksek performanslı bir finans takip portalıdır.

---

## ✨ Özellikler

- ⚡ **Yüksek Hızlı CDN & Statik Veri Mimarisi:** Tarayıcı tarafındaki CORS ve proxy engellerine takılmadan, sunucu tarafında derlenen `data.json` sayesinde 0.02 saniyede anında yükleme.
- ⏱️ **Otomatik GitHub Actions Senkronizasyonu:** Hafta içi borsa seans saatleri boyunca (10:00 - 19:00 TSİ) her saat başı otomatik veri çekme ve yayınlama.
- 📊 **İnteraktif Grafikler (Chart.js):** Hisse detay sayfalarında 1H, 1A, 3A, 6A ve 1Y periyotlarında dinamik trend grafikleri.
- 🔍 **Canlı Filtreleme & Arama:** Hisse senetleri arasında anlık arama ve hızlı önizleme modalları.
- 🕒 **Seans Duyarlı Veri Motoru:** Borsa kapalıyken son resmi seans kapanışını, seans açıkken canlı piyasa fiyatını grafiğe işleyen akıllı motor.
- 📱 **Mobil ve Karanlık Mod Uyumlu:** Tailwind CSS ile geliştirilmiş modern, şık ve responsive arayüz.

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** HTML5, Tailwind CSS, JavaScript (ES6+), Chart.js
- **Backend / Veri Motoru:** Node.js, Yerel Fetch API, Yahoo Finance v8 API
- **Otomasyon & Dağıtım:** GitHub Actions, GitHub Pages

---

## 🚀 Yerel Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için:

### 1. Depoyu Klonlayın
```bash
git clone [https://github.com/marijuannaa/bist-borsa-takip.git](https://github.com/marijuannaa/bist-borsa-takip.git)
cd bist-borsa-takip