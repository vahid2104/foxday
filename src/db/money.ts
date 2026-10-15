import type { Currency } from '@/lib/money';

import { db, notifyDbChanged } from './index';

export type Platform = 'uber' | 'glovo' | 'wolt' | 'other';
export const PLATFORMS: Platform[] = ['uber', 'glovo', 'wolt', 'other'];

export type ExpenseCategory = 'bike' | 'food' | 'phone' | 'home' | 'transport' | 'transfer' | 'subscription' | 'other';
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['bike', 'food', 'phone', 'home', 'transport', 'transfer', 'subscription', 'other'];

export type WorkSessionInput = {
  date: string;
  platform: Platform;
  amountMinor: number;
  tipMinor: number;
  currency: Currency;
  rateToPln: number;
  startTime: string | null;
  endTime: string | null;
  durationMin: number;
  orders: number | null;
  km: number | null;
  note: string | null;
};

export type ExpenseInput = {
  date: string;
  amountMinor: number;
  currency: Currency;
  rateToPln: number;
  category: ExpenseCategory;
  note: string | null;
};

export function addWorkSession(s: WorkSessionInput) {
  const plnMinor = Math.round((s.amountMinor + s.tipMinor) * s.rateToPln);
  db.runSync(
    `INSERT INTO work_sessions
      (date, platform, amount_minor, tip_minor, currency, rate_to_pln, amount_pln_minor,
       start_time, end_time, duration_min, orders, km, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.date, s.platform, s.amountMinor, s.tipMinor, s.currency, s.rateToPln, plnMinor,
     s.startTime, s.endTime, s.durationMin, s.orders, s.km, s.note],
  );
  notifyDbChanged();
}

export function addExpense(e: ExpenseInput): number {
  const plnMinor = Math.round(e.amountMinor * e.rateToPln);
  const res = db.runSync(
    `INSERT INTO expenses (date, amount_minor, currency, rate_to_pln, amount_pln_minor, category, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [e.date, e.amountMinor, e.currency, e.rateToPln, plnMinor, e.category, e.note],
  );
  notifyDbChanged();
  return res.lastInsertRowId;
}

export function deleteTransaction(kind: 'income' | 'expense', id: number) {
  // Abunəlik ödənişi silinirsə, həmin ay yenidən "ödənilməyib" olsun
  if (kind === 'expense') db.runSync('DELETE FROM subscription_payments WHERE expense_id = ?', [id]);
  db.runSync(`DELETE FROM ${kind === 'income' ? 'work_sessions' : 'expenses'} WHERE id = ?`, [id]);
  notifyDbChanged();
}

/** Bir günün qazancı (PLN qəpik), iş dəqiqəsi və sifarişlər. */
export function getDayEarnings(date: string) {
  return (
    db.getFirstSync<{ pln: number; minutes: number; orders: number; sessions: number }>(
      `SELECT COALESCE(SUM(amount_pln_minor),0) AS pln, COALESCE(SUM(duration_min),0) AS minutes,
              COALESCE(SUM(orders),0) AS orders, COUNT(*) AS sessions
       FROM work_sessions WHERE date = ?`,
      [date],
    ) ?? { pln: 0, minutes: 0, orders: 0, sessions: 0 }
  );
}

/** Tarix aralığı üçün cəmlər (PLN qəpik). */
export function getRangeTotals(from: string, to: string) {
  const inc = db.getFirstSync<{ pln: number; minutes: number }>(
    `SELECT COALESCE(SUM(amount_pln_minor),0) AS pln, COALESCE(SUM(duration_min),0) AS minutes
     FROM work_sessions WHERE date BETWEEN ? AND ?`,
    [from, to],
  );
  const exp = db.getFirstSync<{ pln: number }>(
    `SELECT COALESCE(SUM(amount_pln_minor),0) AS pln FROM expenses WHERE date BETWEEN ? AND ?`,
    [from, to],
  );
  const income = inc?.pln ?? 0;
  const expense = exp?.pln ?? 0;
  return { income, expense, net: income - expense, minutes: inc?.minutes ?? 0 };
}

/** Gün-gün gəlir: { "2026-10-15": 24800, ... } */
export function getDailyIncome(from: string, to: string): Record<string, number> {
  const rows = db.getAllSync<{ date: string; pln: number }>(
    `SELECT date, SUM(amount_pln_minor) AS pln FROM work_sessions
     WHERE date BETWEEN ? AND ? GROUP BY date`,
    [from, to],
  );
  return Object.fromEntries(rows.map((r) => [r.date, r.pln]));
}

export function getPlatformSplit(from: string, to: string) {
  return db.getAllSync<{ platform: Platform; pln: number }>(
    `SELECT platform, SUM(amount_pln_minor) AS pln FROM work_sessions
     WHERE date BETWEEN ? AND ? GROUP BY platform ORDER BY pln DESC`,
    [from, to],
  );
}

export type Transaction = {
  kind: 'income' | 'expense';
  id: number;
  date: string;
  /** income: platforma, expense: kateqoriya */
  label: string;
  amountMinor: number;
  currency: Currency;
  plnMinor: number;
  durationMin: number | null;
  orders: number | null;
  note: string | null;
};

/** Gəlir və xərclər birlikdə, ən yenisi əvvəl. */
export function getTransactions(from: string, to: string, limit = 50): Transaction[] {
  const rows = db.getAllSync<{
    kind: 'income' | 'expense';
    id: number;
    date: string;
    label: string;
    amount_minor: number;
    currency: Currency;
    pln: number;
    duration_min: number | null;
    orders: number | null;
    note: string | null;
    created_at: string;
  }>(
    `SELECT 'income' AS kind, id, date, platform AS label, amount_minor + tip_minor AS amount_minor,
            currency, amount_pln_minor AS pln, duration_min, orders, note, created_at
     FROM work_sessions WHERE date BETWEEN ? AND ?
     UNION ALL
     SELECT 'expense' AS kind, id, date, category AS label, amount_minor,
            currency, amount_pln_minor AS pln, NULL, NULL, note, created_at
     FROM expenses WHERE date BETWEEN ? AND ?
     ORDER BY date DESC, created_at DESC
     LIMIT ?`,
    [from, to, from, to, limit],
  );
  return rows.map((r) => ({
    kind: r.kind,
    id: r.id,
    date: r.date,
    label: r.label,
    amountMinor: r.amount_minor,
    currency: r.currency,
    plnMinor: r.pln,
    durationMin: r.duration_min,
    orders: r.orders,
    note: r.note,
  }));
}

// ---------- Redaktə ----------

export function getWorkSession(id: number): (WorkSessionInput & { id: number }) | null {
  const r = db.getFirstSync<{
    id: number; date: string; platform: Platform; amount_minor: number; tip_minor: number; currency: Currency;
    rate_to_pln: number; start_time: string | null; end_time: string | null; duration_min: number;
    orders: number | null; km: number | null; note: string | null;
  }>('SELECT * FROM work_sessions WHERE id = ?', [id]);
  if (!r) return null;
  return {
    id: r.id, date: r.date, platform: r.platform, amountMinor: r.amount_minor, tipMinor: r.tip_minor,
    currency: r.currency, rateToPln: r.rate_to_pln, startTime: r.start_time, endTime: r.end_time,
    durationMin: r.duration_min, orders: r.orders, km: r.km, note: r.note,
  };
}

export function updateWorkSession(id: number, s: WorkSessionInput) {
  const plnMinor = Math.round((s.amountMinor + s.tipMinor) * s.rateToPln);
  db.runSync(
    `UPDATE work_sessions SET date = ?, platform = ?, amount_minor = ?, tip_minor = ?, currency = ?, rate_to_pln = ?,
       amount_pln_minor = ?, start_time = ?, end_time = ?, duration_min = ?, orders = ?, km = ?, note = ? WHERE id = ?`,
    [s.date, s.platform, s.amountMinor, s.tipMinor, s.currency, s.rateToPln, plnMinor,
     s.startTime, s.endTime, s.durationMin, s.orders, s.km, s.note, id],
  );
  notifyDbChanged();
}

export function getExpense(id: number): (ExpenseInput & { id: number }) | null {
  const r = db.getFirstSync<{
    id: number; date: string; amount_minor: number; currency: Currency; rate_to_pln: number;
    category: ExpenseCategory; note: string | null;
  }>('SELECT * FROM expenses WHERE id = ?', [id]);
  if (!r) return null;
  return { id: r.id, date: r.date, amountMinor: r.amount_minor, currency: r.currency, rateToPln: r.rate_to_pln, category: r.category, note: r.note };
}

export function updateExpense(id: number, e: ExpenseInput) {
  const plnMinor = Math.round(e.amountMinor * e.rateToPln);
  db.runSync(
    `UPDATE expenses SET date = ?, amount_minor = ?, currency = ?, rate_to_pln = ?, amount_pln_minor = ?, category = ?, note = ? WHERE id = ?`,
    [e.date, e.amountMinor, e.currency, e.rateToPln, plnMinor, e.category, e.note, id],
  );
  notifyDbChanged();
}

/** Kateqoriyalar üzrə xərclər (hesabat üçün). */
export function getExpenseByCategory(from: string, to: string) {
  return db.getAllSync<{ category: ExpenseCategory; pln: number }>(
    `SELECT category, SUM(amount_pln_minor) AS pln FROM expenses WHERE date BETWEEN ? AND ? GROUP BY category ORDER BY pln DESC`,
    [from, to],
  );
}
