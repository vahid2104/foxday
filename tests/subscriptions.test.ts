import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addMonths, dueDate, periodOf, subscriptionStatus, urgency } from '../src/lib/subscriptions';

const TODAY = '2026-10-15';

test('dueDate: ayın son günü', () => {
  assert.equal(dueDate('2026-10', 5), '2026-10-05');
  assert.equal(dueDate('2026-02', 31), '2026-02-28');
  assert.equal(dueDate('2026-11', 31), '2026-11-30');
});

test('addMonths / periodOf', () => {
  assert.equal(periodOf(TODAY), '2026-10');
  assert.equal(addMonths('2026-12', 1), '2027-01');
  assert.equal(addMonths('2026-01', -1), '2025-12');
});

test('subscriptionStatus', () => {
  const none = new Set<string>();
  assert.deepEqual(subscriptionStatus(17, none, TODAY), { kind: 'soon', due: '2026-10-17', daysLeft: 2 });
  assert.deepEqual(subscriptionStatus(15, none, TODAY), { kind: 'soon', due: '2026-10-15', daysLeft: 0 });
  assert.deepEqual(subscriptionStatus(25, none, TODAY), { kind: 'upcoming', due: '2026-10-25', daysLeft: 10 });
  assert.deepEqual(subscriptionStatus(10, none, TODAY), { kind: 'overdue', due: '2026-10-10', daysLate: 5 });
  assert.deepEqual(subscriptionStatus(10, new Set(['2026-10']), TODAY), { kind: 'paid', next: '2026-11-10', daysLeft: 26 });
});

test('urgency: gecikən > yaxın > ödənilən', () => {
  const late = subscriptionStatus(10, new Set(), TODAY);
  const soon = subscriptionStatus(17, new Set(), TODAY);
  const paid = subscriptionStatus(10, new Set(['2026-10']), TODAY);
  assert.ok(urgency(late) < urgency(soon));
  assert.ok(urgency(soon) < urgency(paid));
});
