/**
 * Comprehensive BIST Market Universe Configuration
 * Contains stock metadata, sector categorization, and market indices
 */

export const STOCKS_CONFIG = [
  // HAVACILIK & ULAŞTIRMA
  { symbol: 'THYAO', name: 'Türk Hava Yolları', sector: 'Ulaştırma & Havacılık', bist30: true, dividend: true },
  { symbol: 'PGSUS', name: 'Pegasus Hava Taşımacılığı', sector: 'Ulaştırma & Havacılık', bist30: true, dividend: false },
  { symbol: 'TAVHL', name: 'TAV Havalimanları', sector: 'Ulaştırma & Havacılık', bist30: true, dividend: true },

  // BANKACILIK & FİNANS
  { symbol: 'GARAN', name: 'Garanti BBVA', sector: 'Bankacılık & Finans', bist30: true, dividend: true },
  { symbol: 'AKBNK', name: 'Akbank', sector: 'Bankacılık & Finans', bist30: true, dividend: true },
  { symbol: 'ISCTR', name: 'Türkiye İş Bankası (C)', sector: 'Bankacılık & Finans', bist30: true, dividend: true },
  { symbol: 'YKBNK', name: 'Yapı ve Kredi Bankası', sector: 'Bankacılık & Finans', bist30: true, dividend: true },
  { symbol: 'VAKBN', name: 'Vakıflar Bankası', sector: 'Bankacılık & Finans', bist30: false, dividend: true },
  { symbol: 'HALKB', name: 'Türkiye Halk Bankası', sector: 'Bankacılık & Finans', bist30: false, dividend: false },
  { symbol: 'TSKB', name: 'T.S.K.B.', sector: 'Bankacılık & Finans', bist30: false, dividend: true },

  // SAVUNMA, TEKNOLOJİ & TELEKOMÜNİKASYON
  { symbol: 'ASELS', name: 'Aselsan Elektronik Sanayi', sector: 'Teknoloji & Savunma', bist30: true, dividend: true },
  { symbol: 'TCELL', name: 'Turkcell İletişim', sector: 'Teknoloji & Telekomünikasyon', bist30: true, dividend: true },
  { symbol: 'TTKOM', name: 'Türk Telekomünikasyon', sector: 'Teknoloji & Telekomünikasyon', bist30: true, dividend: true },
  { symbol: 'VBTYZ', name: 'VBT Yazılım', sector: 'Teknoloji & Savunma', bist30: false, dividend: true },
  { symbol: 'SDTTR', name: 'SDT Uzay ve Savunma', sector: 'Teknoloji & Savunma', bist30: false, dividend: false },

  // HOLDİNGLER & YATIRIM
  { symbol: 'KCHOL', name: 'Koç Holding', sector: 'Holdingler', bist30: true, dividend: true },
  { symbol: 'SAHOL', name: 'Sabancı Holding', sector: 'Holdingler', bist30: true, dividend: true },
  { symbol: 'DOHOL', name: 'Doğan Holding', sector: 'Holdingler', bist30: false, dividend: true },
  { symbol: 'ENKAI', name: 'Enka İnşaat ve Sanayi', sector: 'Holdingler', bist30: true, dividend: true },
  { symbol: 'ALARK', name: 'Alarko Holding', sector: 'Holdingler', bist30: true, dividend: true },
  { symbol: 'TKFEN', name: 'Tekfen Holding', sector: 'Holdingler', bist30: false, dividend: true },

  // SANAYİ, DEMİR ÇELİK & CAM
  { symbol: 'EREGL', name: 'Ereğli Demir ve Çelik', sector: 'Sanayi & Metal', bist30: true, dividend: true },
  { symbol: 'KRDMD', name: 'Kardemir (D)', sector: 'Sanayi & Metal', bist30: true, dividend: true },
  { symbol: 'SISE', name: 'Türkiye Şişe ve Cam', sector: 'Sanayi & Cam', bist30: true, dividend: true },
  { symbol: 'OYAKC', name: 'OYAK Çimento', sector: 'Sanayi & Yapı', bist30: true, dividend: true },
  { symbol: 'CIMSA', name: 'Çimsa Çimento Sanayi', sector: 'Sanayi & Yapı', bist30: false, dividend: true },

  // OTOMOTİV & BEYAZ EŞYA
  { symbol: 'FROTO', name: 'Ford Otomotiv Sanayi', sector: 'Otomotiv & Sanayi', bist30: true, dividend: true },
  { symbol: 'TOASO', name: 'Tofaş Türk Otomobil', sector: 'Otomotiv & Sanayi', bist30: true, dividend: true },
  { symbol: 'ARCLK', name: 'Arçelik', sector: 'Dayanıklı Tüketim', bist30: true, dividend: true },
  { symbol: 'VESTL', name: 'Vestel Elektronik', sector: 'Dayanıklı Tüketim', bist30: false, dividend: false },

  // ENERJİ, PETROKİMYA & MADENCİLİK
  { symbol: 'TUPRS', name: 'Tüpraş Türkiye Petrol Rafinerileri', sector: 'Enerji & Petrokimya', bist30: true, dividend: true },
  { symbol: 'PETKM', name: 'Petkim Petrokimya', sector: 'Enerji & Petrokimya', bist30: true, dividend: false },
  { symbol: 'ASTOR', name: 'Astor Enerji', sector: 'Enerji & Altyapı', bist30: true, dividend: true },
  { symbol: 'GESAN', name: 'Girişim Elektrik', sector: 'Enerji & Altyapı', bist30: false, dividend: false },
  { symbol: 'KONTR', name: 'Kontrolmatik Teknoloji Enerji', sector: 'Enerji & Teknoloji', bist30: true, dividend: false },
  { symbol: 'EUPWR', name: 'Europower Enerji', sector: 'Enerji & Altyapı', bist30: false, dividend: false },
  { symbol: 'KOZAL', name: 'Koza Altın İşletmeleri', sector: 'Madencilik & Emtia', bist30: true, dividend: false },
  { symbol: 'KOZAA', name: 'Koza Anadolu Metal', sector: 'Madencilik & Emtia', bist30: false, dividend: false },
  { symbol: 'ODAS', name: 'Odaş Elektrik Üretim', sector: 'Enerji & Altyapı', bist30: false, dividend: false },

  // PERAKENDE, GIDA & İÇECEK
  { symbol: 'BIMAS', name: 'BİM Birleşik Mağazalar', sector: 'Perakende & Tüketim', bist30: true, dividend: true },
  { symbol: 'MGROS', name: 'Migros Ticaret', sector: 'Perakende & Tüketim', bist30: false, dividend: true },
  { symbol: 'SOKM', name: 'Şok Marketler', sector: 'Perakende & Tüketim', bist30: false, dividend: true },
  { symbol: 'ULKER', name: 'Ülker Bisküvi', sector: 'Gıda & İçecek', bist30: false, dividend: true },
  { symbol: 'CCOLA', name: 'Coca-Cola İçecek', sector: 'Gıda & İçecek', bist30: false, dividend: true },
  { symbol: 'AEFES', name: 'Anadolu Efes Biracılık', sector: 'Gıda & İçecek', bist30: false, dividend: true },

  // KİMYA & GAYRİMENKUL
  { symbol: 'SASA', name: 'Sasa Polyester Sanayi', sector: 'Kimya & Sanayi', bist30: true, dividend: false },
  { symbol: 'HEKTS', name: 'Hektaş Ticaret', sector: 'Kimya & Tarım', bist30: true, dividend: false },
  { symbol: 'GUBRF', name: 'Gübre Fabrikaları', sector: 'Kimya & Tarım', bist30: true, dividend: false },
  { symbol: 'EKGYO', name: 'Emlak Konut GYO', sector: 'Gayrimenkul (GYO)', bist30: true, dividend: true }
];

export const INDICES_CONFIG = [
  { key: 'XU100', symbol: 'XU100.IS', name: 'BIST 100', desc: 'Borsa İstanbul Ulusal 100 Endeksi' },
  { key: 'XU030', symbol: 'XU030.IS', name: 'BIST 30', desc: 'Borsa İstanbul 30 Endeksi' },
  { key: 'XBANK', symbol: 'XBANK.IS', name: 'BIST Banka', desc: 'Bankacılık Sektör Endeksi' },
  { key: 'XUSIN', symbol: 'XUSIN.IS', name: 'BIST Sınai', desc: 'Sınai Şirketler Endeksi' },
  { key: 'XBLSM', symbol: 'XBLSM.IS', name: 'BIST Bilişim', desc: 'Bilişim ve Teknoloji Endeksi' },
  { key: 'XUHZM', symbol: 'XUHZM.IS', name: 'BIST Hizmetler', desc: 'Hizmet Sektörü Endeksi' }
];

export const CURRENCIES_CONFIG = [
  { key: 'USDTRY', symbol: 'USDTRY=X', name: 'Dolar / TL', prefix: '$', unit: 'TL' },
  { key: 'EURTRY', symbol: 'EURTRY=X', name: 'Euro / TL', prefix: '€', unit: 'TL' },
  { key: 'GBPTRY', symbol: 'GBPTRY=X', name: 'Sterlin / TL', prefix: '£', unit: 'TL' }
];

export const COMMODITIES_CONFIG = [
  { key: 'BRENT', symbol: 'BZ=F', name: 'Brent Petrol', unit: 'USD/Varil' },
  { key: 'BITCOIN', symbol: 'BTC-USD', name: 'Bitcoin', unit: 'USD' }
];
