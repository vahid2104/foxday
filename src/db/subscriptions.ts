import { today } from '@/lib/dates';
import type { Currency } from '@/lib/money';
import { periodOf, subscriptionStatus, urgency, type SubscriptionStatus } from '@/lib/subscriptions';
import { getRateToPln } from '@/services/rates';

import { db, notifyDbChanged } from './index';
import { addExpense, type ExpenseCategory } from './money';

export type Subscription = {
  id: number;
  name: string;
  amountMinor: number;
  currency: Currency;
  dayOfMonth: number;
  category: ExpenseCategory;
};

export type SubscriptionWithStatus = Subscription & { status: SubscriptionStatus; paidPeriods: Set<string> };

export type SubscriptionInput = Omit<Subscription, 'id'>;

type Row = { id: number; name: string; amount_minor: number; currency: Currency; day_of_month: number; category: ExpenseCategory };
const toSub = (r: Row): Subscription => ({
  id: r.id,
  name: r.name,
  amountMinor: r.amount_minor,
  currency: r.currency,
  dayOfMonth: r.day_of_month,
  category: r.category,
});

export function getSubscription(id: number): Subscription | null {
  const r = db.getFirstSync<Row>('SELECT * FROM subscriptions WHERE id = ?', [id]);
  return r ? toSub(r) : null;
}

/** Bütün abunəliklər vəziyyəti ilə, ən təcili olanı əvvəl. */
export function getSubscriptions(date = today()): SubscriptionWithStatus[] {
  const subs = db.getAllSync<Row>('SELECT * FROM subscriptions ORDER BY day_of_month, id').map(toSub);
  const pays = db.getAllSync<{ subscription_id: number; period: string }>('SELECT subscription_id, period FROM subscription_payments');
  const paid: Record<number, Set<string>> = {};
  for (const p of pays) (paid[p.subscription_id] ??= new Set()).add(p.period);
  return subs
    .map((s) => {
      const paidPeriods = paid[s.id] ?? new Set<string>();
      return { ...s, paidPeriods, status: subscriptionStatus(s.dayOfMonth, paidPeriods, date) };
    })
    .sort((a, b) => urgency(a.status) - urgency(b.status));
}

export function addSubscription(s: SubscriptionInput): number {
  const res = db.runSync('INSERT INTO subscriptions (name, amount_minor, currency, day_of_month, category) VALUES (?, ?, ?, ?, ?)', [
    s.name,
    s.amountMinor,
    s.currency,
    s.dayOfMonth,
    s.category,
  ]);
  notifyDbChanged();
  return res.lastInsertRowId;
}

export function updateSubscription(id: number, s: SubscriptionInput) {
  db.runSync('UPDATE subscriptions SET name = ?, amount_minor = ?, currency = ?, day_of_month = ?, category = ? WHERE id = ?', [
    s.name,
    s.amountMinor,
    s.currency,
    s.dayOfMonth,
    s.category,
    id,
  ]);
  notifyDbChanged();
}

/** Abunəliyi silir. Keçmiş ödənişlər xərc kimi qalır (hesabatlar dəyişmir). */
export function deleteSubscription(id: number) {
  db.runSync('DELETE FROM subscription_payments WHERE subscription_id = ?', [id]);
  db.runSync('DELETE FROM subscriptions WHERE id = ?', [id]);
  notifyDbChanged();
}

/**
 * "Ödədim": bu ay üçün xərc yaradır (qazancdan avtomatik çıxılır) və ödənişi qeyd edir.
 * Məzənnə lazımdırsa NBP-dən alınır (internet yoxdursa son məlum məzənnə).
 */
export async function paySubscription(sub: Subscription, date = today()) {
  const { rate } = await getRateToPln(sub.currency, date);
  const expenseId = addExpense({
    date,
    amountMinor: sub.amountMinor,
    currency: sub.currency,
    rateToPln: rate,
    category: sub.category,
    note: sub.name,
  });
  db.runSync('INSERT OR REPLACE INTO subscription_payments (subscription_id, period, expense_id) VALUES (?, ?, ?)', [
    sub.id,
    periodOf(date),
    expenseId,
  ]);
  notifyDbChanged();
}

/** Bu ayın ödənişini geri alır (yaradılmış xərci də silir). */
export function unpaySubscription(subId: number, date = today()) {
  const p = db.getFirstSync<{ expense_id: number | null }>(
    'SELECT expense_id FROM subscription_payments WHERE subscription_id = ? AND period = ?',
    [subId, periodOf(date)],
  );
  if (p?.expense_id) db.runSync('DELETE FROM expenses WHERE id = ?', [p.expense_id]);
  db.runSync('DELETE FROM subscription_payments WHERE subscription_id = ? AND period = ?', [subId, periodOf(date)]);
  notifyDbChanged();
}

/** Aylıq cəm (PLN qəpik), son məlum məzənnələrlə. */
export function getMonthlySubscriptionTotal(): number {
  const subs = db.getAllSync<Row>('SELECT * FROM subscriptions');
  let total = 0;
  for (const s of subs) {
    if (s.currency === 'PLN') {
      total += s.amount_minor;
      continue;
    }
    const r = db.getFirstSync<{ rate_to_pln: number }>(
      'SELECT rate_to_pln FROM exchange_rates WHERE currency = ? ORDER BY date DESC LIMIT 1',
      [s.currency],
    );
    total += Math.round(s.amount_minor * (r?.rate_to_pln ?? 0));
  }
  return total;
}
