/**
 * Pul hesablamaları. Məbləğlər qəpiklə (minor units) tam ədəd kimi saxlanılır,
 * belə ki 248,50 PLN = 24850. Bu, float yuvarlaqlaşdırma səhvlərinin qarşısını alır.
 */

export type Currency = 'PLN' | 'AZN' | 'USD';
export const CURRENCIES: Currency[] = ['PLN', 'AZN', 'USD'];

/** İstifadəçinin yazdığı mətni qəpiyə çevirir: "248,5" → 24850. Səhvdirsə null. */
export function parseAmount(input: string): number | null {
  const clean = input.replace(/\s/g, '').replace(',', '.');
  if (clean === '' || !/^\d*\.?\d{0,2}$/.test(clean) || clean === '.') return null;
  const value = Math.round(parseFloat(clean) * 100);
  return Number.isFinite(value) ? value : null;
}

/** Yazı zamanı daxil edilən mətni təmizləyir: yalnız rəqəm və bir onluq ayırıcı, 2 rəqəmə qədər. */
export function sanitizeAmountInput(input: string): string {
  let s = input.replace('.', ',').replace(/[^\d,]/g, '');
  const first = s.indexOf(',');
  if (first !== -1) {
    s = s.slice(0, first + 1) + s.slice(first + 1).replace(/,/g, '').slice(0, 2);
  }
  return s.replace(/^0+(\d)/, '$1');
}

/** Valyutanı PLN-ə çevirir (qəpiklə). */
export function toPlnMinor(amountMinor: number, rateToPln: number): number {
  return Math.round(amountMinor * rateToPln);
}

/** 324050 → "3 240,50"; 324000 → "3 240". */
export function formatAmount(minor: number, opts: { decimals?: 'auto' | 0 | 2 } = {}): string {
  const { decimals = 'auto' } = opts;
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  const wholeStr = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const showCents = decimals === 2 || (decimals === 'auto' && cents !== 0);
  const out = showCents ? `${wholeStr},${String(cents).padStart(2, '0')}` : wholeStr;
  return negative ? `−${out}` : out;
}

export function formatMoney(minor: number, currency: Currency = 'PLN', opts?: { decimals?: 'auto' | 0 | 2 }) {
  return `${formatAmount(minor, opts)} ${currency}`;
}

/** "14:10" və "20:30" → 380 dəqiqə. Gecə yarısından keçirsə (22:00 → 02:00) düzgün hesablayır. */
export function durationMinutes(start: string, end: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const diff = toMin(end) - toMin(start);
  return diff >= 0 ? diff : diff + 24 * 60;
}

/** Saatlıq qazanc (qəpiklə). İş vaxtı yoxdursa null. */
export function hourlyRate(plnMinor: number, minutes: number): number | null {
  if (minutes <= 0) return null;
  return Math.round(plnMinor / (minutes / 60));
}
