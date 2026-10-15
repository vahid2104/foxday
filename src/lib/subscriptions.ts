/** Aylıq abunəlik tarixləri (təmiz funksiyalar, test olunur). */
import { daysBetween, toISODate } from './dates';

/** "2026-10" */
export function periodOf(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(period: string, n: number): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Ayın ödəniş günü. 31-i olmayan aylarda ayın son günü götürülür. */
export function dueDate(period: string, dayOfMonth: number): string {
  const [y, m] = period.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return toISODate(new Date(y, m - 1, Math.min(dayOfMonth, last)));
}

export type SubscriptionStatus =
  | { kind: 'paid'; next: string; daysLeft: number }
  | { kind: 'overdue'; due: string; daysLate: number }
  | { kind: 'soon'; due: string; daysLeft: number }
  | { kind: 'upcoming'; due: string; daysLeft: number };

/** Xatırlatma neçə gün qabaq başlayır. */
export const REMIND_DAYS = 3;

/**
 * Bu ay üçün vəziyyət.
 * paidPeriods — ödənilmiş aylar ("2026-10").
 */
export function subscriptionStatus(dayOfMonth: number, paidPeriods: Set<string>, today: string): SubscriptionStatus {
  const period = periodOf(today);
  const due = dueDate(period, dayOfMonth);
  if (paidPeriods.has(period)) {
    const next = dueDate(addMonths(period, 1), dayOfMonth);
    return { kind: 'paid', next, daysLeft: daysBetween(today, next) };
  }
  const left = daysBetween(today, due);
  if (left < 0) return { kind: 'overdue', due, daysLate: -left };
  if (left <= REMIND_DAYS) return { kind: 'soon', due, daysLeft: left };
  return { kind: 'upcoming', due, daysLeft: left };
}

/** Sıralama üçün: təcili olanlar əvvəl. */
export function urgency(s: SubscriptionStatus): number {
  switch (s.kind) {
    case 'overdue':
      return -1000 + -s.daysLate;
    case 'soon':
    case 'upcoming':
      return s.daysLeft;
    case 'paid':
      return 1000 + s.daysLeft;
  }
}
