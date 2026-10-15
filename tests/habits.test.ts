import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  completionRate,
  currentStreak,
  dayScore,
  dayState,
  isDue,
  longestStreak,
  weekdayIndex,
  type HabitLogStatus,
  type HabitSchedule,
} from '../src/lib/habits';

const daily: HabitSchedule = { frequency: 'daily', days: [], startDate: '2026-10-01' };
// B.e, Ç, C (0, 2, 4)
const mwf: HabitSchedule = { frequency: 'days', days: [0, 2, 4], startDate: '2026-10-01' };
const TODAY = '2026-10-15'; // cümə axşamı

function logs(entries: [string, HabitLogStatus][]) {
  return Object.fromEntries(entries) as Record<string, HabitLogStatus>;
}

test('weekdayIndex', () => {
  assert.equal(weekdayIndex('2026-10-12'), 0); // B.e
  assert.equal(weekdayIndex('2026-10-15'), 3); // C.a
  assert.equal(weekdayIndex('2026-10-18'), 6); // B
});

test('isDue', () => {
  assert.equal(isDue(daily, '2026-09-30'), false); // başlanğıcdan əvvəl
  assert.equal(isDue(daily, '2026-10-05'), true);
  assert.equal(isDue(mwf, '2026-10-12'), true);
  assert.equal(isDue(mwf, '2026-10-13'), false);
});

test('dayState', () => {
  const l = logs([['2026-10-14', 'done']]);
  assert.equal(dayState(daily, '2026-10-14', l, TODAY), 'done');
  assert.equal(dayState(daily, '2026-10-13', l, TODAY), 'missed');
  assert.equal(dayState(daily, TODAY, l, TODAY), 'pending');
  assert.equal(dayState(daily, '2026-10-16', l, TODAY), 'future');
  assert.equal(dayState(mwf, '2026-10-13', l, TODAY), 'off');
});

test('currentStreak: bu gün edilməyibsə seriya qırılmır', () => {
  const l = logs([['2026-10-12', 'done'], ['2026-10-13', 'done'], ['2026-10-14', 'done']]);
  assert.equal(currentStreak(daily, l, TODAY), 3);
  assert.equal(currentStreak(daily, { ...l, [TODAY]: 'done' }, TODAY), 4);
});

test('currentStreak: buraxılmış gün seriyanı sıfırlayır', () => {
  const l = logs([['2026-10-12', 'done'], ['2026-10-14', 'done']]);
  assert.equal(currentStreak(daily, l, TODAY), 1);
});

test('currentStreak: keçilmiş gün və plan olmayan günlər qırmır', () => {
  const l = logs([['2026-10-12', 'done'], ['2026-10-13', 'skipped'], ['2026-10-14', 'done']]);
  assert.equal(currentStreak(daily, l, TODAY), 2);
  // MWF: 5, 7, 9, 12, 14 → 5 ardıcıl (aradakı günlər plan deyil)
  const m = logs([['2026-10-05', 'done'], ['2026-10-07', 'done'], ['2026-10-09', 'done'], ['2026-10-12', 'done'], ['2026-10-14', 'done']]);
  assert.equal(currentStreak(mwf, m, TODAY), 5);
});

test('longestStreak', () => {
  const l = logs([
    ['2026-10-01', 'done'], ['2026-10-02', 'done'], ['2026-10-03', 'done'], ['2026-10-04', 'done'],
    ['2026-10-06', 'done'], ['2026-10-07', 'done'],
  ]);
  assert.equal(longestStreak(daily, l, TODAY), 4);
});

test('completionRate', () => {
  const l = logs([['2026-10-12', 'done'], ['2026-10-13', 'done'], ['2026-10-14', 'skipped']]);
  // 12, 13 done; 14 skipped (sayılmır); 15 pending (sayılmır) → 2/2
  assert.equal(completionRate(daily, l, '2026-10-12', '2026-10-18', TODAY), 1);
  // 1–11 buraxılıb → 2 / 13
  assert.equal(completionRate(daily, l, '2026-10-01', '2026-10-31', TODAY), 2 / 13);
  assert.equal(completionRate(daily, {}, '2026-10-20', '2026-10-25', TODAY), null);
});

test('dayScore', () => {
  assert.equal(
    dayScore({ habitsDone: 2, habitsDue: 4, waterMl: 1000, waterGoalMl: 2000, sleepMin: 480, sleepGoalMin: 480, anythingLogged: true }),
    68, // 20 + 12.5 + 25 + 10 = 67.5 → 68
  );
  assert.equal(
    dayScore({ habitsDone: 0, habitsDue: 0, waterMl: 0, waterGoalMl: 2000, sleepMin: null, sleepGoalMin: 480, anythingLogged: false }),
    40,
  );
});

// ---------- Həftədə N dəfə ----------
// Başlanğıc: 2026-09-28 (B.e). Hədəf: həftədə 3 dəfə. Bu gün: 2026-10-15 (C.a)
const weekly: HabitSchedule = { frequency: 'weekly', days: [], startDate: '2026-09-28', timesPerWeek: 3 };

test('weekly: bu gün göstərilir, hədəf dolanda gizlənir', async () => {
  const { isDueToday, doneInWeek } = await import('../src/lib/habits');
  const l = logs([['2026-10-12', 'done'], ['2026-10-14', 'done']]);
  assert.equal(doneInWeek(l, TODAY), 2);
  assert.equal(isDueToday(weekly, TODAY, l), true);
  const full = { ...l, '2026-10-13': 'done' as const };
  assert.equal(isDueToday(weekly, TODAY, full), false);
  // bu gün edilibsə: hədəf bu gündən əvvəl dolmamışdı → siyahıda qalır (işarəli)
  assert.equal(isDueToday(weekly, TODAY, { ...l, [TODAY]: 'done' }), true);
});

test('weekly: günlər "buraxılmış" sayılmır', () => {
  assert.equal(dayState(weekly, '2026-10-13', {}, TODAY), 'off');
  assert.equal(dayState(weekly, TODAY, {}, TODAY), 'pending');
});

test('weekly: seriya həftələrlə', () => {
  const l = logs([
    // 28 sen həftəsi: 3 ✓
    ['2026-09-28', 'done'], ['2026-09-30', 'done'], ['2026-10-02', 'done'],
    // 5 okt həftəsi: 3 ✓
    ['2026-10-05', 'done'], ['2026-10-06', 'done'], ['2026-10-09', 'done'],
    // 12 okt həftəsi (cari): 1 — hələ dolmayıb, seriya qırılmır
    ['2026-10-12', 'done'],
  ]);
  assert.equal(currentStreak(weekly, l, TODAY), 2);
  assert.equal(longestStreak(weekly, l, TODAY), 2);
  const l2 = { ...l, '2026-10-13': 'done' as const, '2026-10-14': 'done' as const };
  assert.equal(currentStreak(weekly, l2, TODAY), 3);
  // ortadakı həftə dolmayıbsa seriya qırılır
  const l3 = { ...l2 };
  delete l3['2026-10-09'];
  assert.equal(currentStreak(weekly, l3, TODAY), 1);
  assert.equal(longestStreak(weekly, l3, TODAY), 1);
});

test('weekly: tamamlanma faizi', () => {
  const l = logs([['2026-10-05', 'done'], ['2026-10-06', 'done'], ['2026-10-12', 'done']]);
  // 5 okt həftəsi: 2/3, cari həftə: 1/1 (yalnız edilən sayılır) → 3/4
  assert.equal(completionRate(weekly, l, '2026-10-05', '2026-10-18', TODAY), 3 / 4);
});
