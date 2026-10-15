import { db } from '@/db';
import { addDays, today } from '@/lib/dates';
import type { Currency } from '@/lib/money';

/**
 * Polşa Milli Bankının (NBP) rəsmi məzənnələri.
 * USD — A cədvəli (hər iş günü), AZN — B cədvəli (həftədə bir dəfə, çərşənbə).
 * https://api.nbp.pl/
 */
const TABLE: Record<Exclude<Currency, 'PLN'>, 'a' | 'b'> = { USD: 'a', AZN: 'b' };

export type RateResult = {
  rate: number;
  /** Məzənnənin NBP-də qüvvəyə mindiyi tarix. */
  effectiveDate: string;
  /** İnternet olmadığı üçün köhnə (yadda saxlanmış) məzənnə istifadə olunubsa true. */
  stale: boolean;
};

export class RateUnavailableError extends Error {}

function cachedRate(currency: Currency, date: string) {
  return db.getFirstSync<{ date: string; rate_to_pln: number }>(
    `SELECT date, rate_to_pln FROM exchange_rates WHERE currency = ? AND date <= ? ORDER BY date DESC LIMIT 1`,
    [currency, date],
  );
}

/** Verilən tarix üçün 1 vahid valyutanın PLN qiyməti. */
export async function getRateToPln(currency: Currency, date: string = today()): Promise<RateResult> {
  if (currency === 'PLN') return { rate: 1, effectiveDate: date, stale: false };

  const target = date > today() ? today() : date;
  const cached = cachedRate(currency, target);
  // B cədvəli həftəlikdir: son 7 gündə yadda saxlanmış məzənnə varsa, yenidən soruşmuruq.
  const freshEnough = cached && cached.date >= addDays(target, TABLE[currency] === 'b' ? -7 : 0);
  if (cached && freshEnough) return { rate: cached.rate_to_pln, effectiveDate: cached.date, stale: false };

  try {
    const from = addDays(target, -21);
    const url = `https://api.nbp.pl/api/exchangerates/rates/${TABLE[currency]}/${currency.toLowerCase()}/${from}/${target}/?format=json`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`NBP ${res.status}`);
    const json = (await res.json()) as { rates: { effectiveDate: string; mid: number }[] };
    const last = json.rates[json.rates.length - 1];
    if (!last) throw new Error('NBP: boş cavab');
    for (const r of json.rates) {
      db.runSync(`INSERT OR REPLACE INTO exchange_rates (date, currency, rate_to_pln) VALUES (?, ?, ?)`, [
        r.effectiveDate,
        currency,
        r.mid,
      ]);
    }
    return { rate: last.mid, effectiveDate: last.effectiveDate, stale: false };
  } catch {
    if (cached) return { rate: cached.rate_to_pln, effectiveDate: cached.date, stale: true };
    const any = db.getFirstSync<{ date: string; rate_to_pln: number }>(
      `SELECT date, rate_to_pln FROM exchange_rates WHERE currency = ? ORDER BY date DESC LIMIT 1`,
      [currency],
    );
    if (any) return { rate: any.rate_to_pln, effectiveDate: any.date, stale: true };
    throw new RateUnavailableError(currency);
  }
}
