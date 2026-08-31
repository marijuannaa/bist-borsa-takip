/**
 * Technical Indicators and Financial Calculations Module
 * Borsa Istanbul (BIST) Analytics Engine
 */

/**
 * Calculates Simple Moving Average (SMA)
 * @param {number[]} prices - Array of closing prices
 * @param {number} period - Number of periods (e.g. 20, 50)
 * @returns {number|null} SMA value or null if not enough data
 */
export function calculateSMA(prices, period) {
  if (!prices || prices.length < period || period <= 0) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Number((sum / period).toFixed(2));
}

/**
 * Calculates Relative Strength Index (RSI - 14)
 * @param {number[]} prices - Array of closing prices in chronological order
 * @param {number} period - RSI period (default 14)
 * @returns {number|null} RSI value (0 - 100) or null
 */
export function calculateRSI(prices, period = 14) {
  if (!prices || prices.length <= period) return null;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // First average gain and loss (SMA)
  let gains = 0;
  let losses = 0;
  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smoothed averages (Wilder's Smoothing)
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

/**
 * Calculates Pivot Points (Floor Standard)
 * @param {number} high - High price
 * @param {number} low - Low price
 * @param {number} close - Close price
 * @returns {object|null} { pivot, r1, r2, s1, s2 }
 */
export function calculatePivotPoints(high, low, close) {
  if (!high || !low || !close) return null;
  const pivot = Number(((high + low + close) / 3).toFixed(2));
  const r1 = Number((2 * pivot - low).toFixed(2));
  const s1 = Number((2 * pivot - high).toFixed(2));
  const r2 = Number((pivot + (high - low)).toFixed(2));
  const s2 = Number((pivot - (high - low)).toFixed(2));

  return { pivot, r1, r2, s1, s2 };
}

/**
 * Calculates multi-period return rates (% change)
 * @param {Array<{date: string, close: number, timestamp?: number}>} history - Historical bars
 * @returns {object} { d1, w1, m1, m3, m6, y1, ytd }
 */
export function calculateReturns(history) {
  if (!history || history.length < 2) {
    return { d1: 0, w1: 0, m1: 0, m3: 0, m6: 0, y1: 0, ytd: 0 };
  }

  const currentPrice = history[history.length - 1].close;

  function calcChange(barIndex) {
    if (barIndex < 0 || barIndex >= history.length) return 0;
    const oldPrice = history[barIndex].close;
    if (!oldPrice || oldPrice === 0) return 0;
    return Number((((currentPrice - oldPrice) / oldPrice) * 100).toFixed(2));
  }

  const len = history.length;
  const d1 = calcChange(len - 2);
  const w1 = calcChange(Math.max(0, len - 6));   // ~5 trading days
  const m1 = calcChange(Math.max(0, len - 22));  // ~21 trading days
  const m3 = calcChange(Math.max(0, len - 64));  // ~63 trading days
  const m6 = calcChange(Math.max(0, len - 128)); // ~126 trading days
  const y1 = calcChange(0);                      // full year

  // YTD (Find first bar of current year)
  const currentYear = new Date().getFullYear();
  const ytdIndex = history.findIndex(bar => {
    if (bar.timestamp) {
      const year = new Date(bar.timestamp * 1000).getFullYear();
      return year === currentYear;
    }
    return false;
  });
  const ytd = ytdIndex >= 0 ? calcChange(ytdIndex) : m1;

  return { d1, w1, m1, m3, m6, y1, ytd };
}

/**
 * Checks market trading session status in Istanbul Time (UTC+3)
 * @param {Date|string|number} [customDate] Optional custom date/timestamp to evaluate
 * @returns {object} { isOpen, isPrePost, status, statusColor, nextEvent, countdownStr, sessionName, timeStr, dateStr }
 */
export function getMarketSessionStatus(customDate = null) {
  const now = customDate ? new Date(customDate) : new Date();
  
  // Format to Istanbul timezone parts
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  let hour = parseInt(partMap.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(partMap.minute, 10);
  const second = parseInt(partMap.second, 10);

  const weekdayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const dayOfWeek = weekdayMap[partMap.weekday] ?? 0;

  const totalMinutes = hour * 60 + minute;
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  const dateStr = `${pad(day)}.${pad(month)}.${year}`;

  // Check Official Turkish Public Holidays (Fixed date holidays)
  const holidayKey = `${pad(day)}-${pad(month)}`;
  const holidays = {
    '01-01': 'Yılbaşı Tatili',
    '23-04': 'Ulusal Egemenlik ve Çocuk Bayramı',
    '01-05': 'Emek ve Dayanışma Günü',
    '19-05': 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı',
    '15-07': 'Demokrasi ve Milli Birlik Günü',
    '30-08': 'Zafer Bayramı',
    '29-10': 'Cumhuriyet Bayramı'
  };

  if (holidays[holidayKey]) {
    return {
      isOpen: false,
      isPrePost: false,
      status: `Resmi Tatil (${holidays[holidayKey]}) - Kapalı`,
      statusColor: 'rose',
      sessionName: 'Borsa Kapalı',
      nextEvent: 'Bir Sonraki İş Günü 09:40 Açılış Seansı',
      countdownStr: 'Resmi Tatil',
      timeStr,
      dateStr
    };
  }

  // Weekend (Saturday or Sunday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isOpen: false,
      isPrePost: false,
      status: 'Hafta Sonu - Kapalı',
      statusColor: 'rose',
      sessionName: 'Borsa Kapalı',
      nextEvent: 'Pazartesi 09:40 Açılış Seansı',
      countdownStr: 'Hafta Sonu',
      timeStr,
      dateStr
    };
  }

  // Helper function for countdown text
  const calcRemaining = (targetMin) => {
    const diff = targetMin - totalMinutes;
    if (diff <= 0) return '0dk';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
  };

  // 00:00 - 09:40: Seans Öncesi
  if (totalMinutes < 580) {
    const rem = calcRemaining(580);
    return {
      isOpen: false,
      isPrePost: false,
      status: 'Gün Başı - Seans Öncesi',
      statusColor: 'slate',
      sessionName: 'Borsa Kapalı',
      nextEvent: '09:40 Açılış Seansı',
      countdownStr: `Açılışa: ${rem}`,
      timeStr,
      dateStr
    };
  }

  // 09:40 - 09:55: Açılış Seansı (Emir Toplama)
  if (totalMinutes >= 580 && totalMinutes < 595) {
    const rem = calcRemaining(600);
    return {
      isOpen: false,
      isPrePost: true,
      status: 'Açılış Seansı (Emir Toplama)',
      statusColor: 'amber',
      sessionName: 'Açılış Emir Toplama',
      nextEvent: '10:00 Sürekli İşlem Başlangıcı',
      countdownStr: `Sürekli İşleme: ${rem}`,
      timeStr,
      dateStr
    };
  }

  // 09:55 - 10:00: Açılış Eşleştirme
  if (totalMinutes >= 595 && totalMinutes < 600) {
    const rem = calcRemaining(600);
    return {
      isOpen: false,
      isPrePost: true,
      status: 'Açılış Eşleştirme Fiyatı',
      statusColor: 'amber',
      sessionName: 'Açılış Eşleştirme',
      nextEvent: '10:00 Sürekli İşlem Başlangıcı',
      countdownStr: `Sürekli İşleme: ${rem}`,
      timeStr,
      dateStr
    };
  }

  // 10:00 - 18:00: Canlı Sürekli Müzayede (AÇIK)
  if (totalMinutes >= 600 && totalMinutes < 1080) {
    const rem = calcRemaining(1080);
    return {
      isOpen: true,
      isPrePost: false,
      status: 'Canlı Sürekli Müzayede',
      statusColor: 'emerald',
      sessionName: 'Canlı Seans Açık',
      nextEvent: '18:00 Kapanış Seansı',
      countdownStr: `Kapanışa: ${rem}`,
      timeStr,
      dateStr
    };
  }

  // 18:00 - 18:05: Kapanış Emir Toplama
  if (totalMinutes >= 1080 && totalMinutes < 1085) {
    const rem = calcRemaining(1090);
    return {
      isOpen: false,
      isPrePost: true,
      status: 'Kapanış Seansı (Emir Toplama)',
      statusColor: 'amber',
      sessionName: 'Kapanış Emir Toplama',
      nextEvent: '18:05 Kapanış Eşleştirme',
      countdownStr: `Kapanış Eşleştirmeye: ${calcRemaining(1085)}`,
      timeStr,
      dateStr
    };
  }

  // 18:05 - 18:08: Eşleştirme & 18:08 - 18:10: Kapanış Fiyatlı İşlemler
  if (totalMinutes >= 1085 && totalMinutes <= 1090) {
    return {
      isOpen: false,
      isPrePost: true,
      status: 'Kapanış Fiyatlı İşlemler',
      statusColor: 'amber',
      sessionName: 'Kapanış Seansı',
      nextEvent: '18:10 Gün Sonu',
      countdownStr: `Gün Sonuna: ${calcRemaining(1090)}`,
      timeStr,
      dateStr
    };
  }

  // 18:10 sonrası: Gün Sonu - Seans Kapalı
  return {
    isOpen: false,
    isPrePost: false,
    status: 'Gün Sonu - Seans Kapalı',
    statusColor: 'slate',
    sessionName: 'Borsa Kapalı',
    nextEvent: dayOfWeek === 5 ? 'Pazartesi 09:40 Açılış Seansı' : 'Yarın 09:40 Açılış Seansı',
    countdownStr: 'Seans Kapandı',
    timeStr,
    dateStr
  };
}
