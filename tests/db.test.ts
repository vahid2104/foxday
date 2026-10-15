/**
 * Bazanın uçdan-uca testi: real db funksiyaları yaddaşdakı SQLite-də (node:sqlite) işləyir.
 */
const Module = require('module');
const orig = Module._resolveFilename;
Module._resolveFilename = function (req: string, ...rest: unknown[]) {
  if (req === 'expo-sqlite') return __dirname + '/helpers/expo-sqlite-shim.js';
  return orig.call(this, req, ...rest);
};
const assert = require('node:assert/strict');
const { test } = require('node:test');

test('baza: vərdişlər, məqsədlər, su, yuxu, pul', () => {
  const { migrate, db } = require('@/db');
  migrate(); migrate(); // idempotent
  const ver = db.getFirstSync('PRAGMA user_version').user_version;
  assert.equal(ver, 2);
  const H = require('@/db/habits');
  const G = require('@/db/goals');
  const W = require('@/db/health');
  const M = require('@/db/money');
  const { today, addDays } = require('@/lib/dates');
  const T = today();
  // habits
  const a = H.addHabit({ name: 'İdman', icon: 'dumbbell', color: 'success', frequency: 'daily', days: [0,1,2,3,4,5,6], reminderTime: '07:30' });
  const b = H.addHabit({ name: 'Kitab', icon: 'book', color: 'brand', frequency: 'daily', days: [0,1,2,3,4,5,6], reminderTime: null });
  // pretend started 5 days ago
  db.runSync('UPDATE habits SET start_date = ?', [addDays(T, -5)]);
  for (let i = 1; i <= 3; i++) H.setHabitLog(a, addDays(T, -i), 'done');
  H.setHabitLog(b, addDays(T, -1), 'done');
  let th = H.getTodayHabits(T);
  assert.equal(th.find((h: any) => h.id === a).streak, 3);
  assert.equal(JSON.stringify(H.getDayHabitSummary(T)), '{"due":2,"done":0}');
  H.setHabitLog(a, T, 'done'); H.setHabitLog(b, T, 'skipped');
  assert.equal(JSON.stringify(H.getDayHabitSummary(T)), '{"due":1,"done":1}');
  th = H.getTodayHabits(T);
  assert.equal(th.find((h: any) => h.id === a).streak, 4);
  assert.equal(H.getMissedOn(addDays(T, -2)).map((h: any) => h.name).join(), 'Kitab');
  H.updateHabit(b, { name: 'Kitab 20', icon: 'book', color: 'water', frequency: 'days', days: [0, 2], reminderTime: '21:00' });
  assert.equal(H.getHabit(b).days.join(), '0,2');
  H.deleteHabit(b);
  assert.equal(H.getHabits().length, 1);
  assert.equal(db.getFirstSync('SELECT COUNT(*) n FROM habit_logs WHERE habit_id = ?', [b]).n, 0);
  // goals numeric
  const g = G.addGoal({ name: 'Batareya', type: 'numeric', target: 1000, unit: 'PLN', deadline: addDays(T, 48), steps: [] });
  assert.equal(G.addGoalEntry(g, 640), false);
  assert.equal(Math.round(G.getGoal(g).progress * 100), 64);
  assert.equal(G.addGoalEntry(g, 400), true);
  assert.ok(G.getGoal(g).completedAt);
  const e = G.getGoalEntries(g)[0];
  G.deleteGoalEntry(g, e.id);
  assert.equal(G.getGoal(g).completedAt, null);
  // goals steps
  const s = G.addGoal({ name: 'Kitab bitir', type: 'steps', target: 0, unit: null, deadline: null, steps: ['1-ci fəsil', '2-ci fəsil'] });
  const st = G.getGoalSteps(s);
  assert.equal(G.toggleGoalStep(s, st[0].id, true), false);
  assert.equal(G.toggleGoalStep(s, st[1].id, true), true);
  assert.equal(G.getGoals().length, 2);
  G.deleteGoal(s);
  // water & sleep
  W.addWater(T, 250); W.addWater(T, 500);
  assert.equal(W.getWaterMl(T), 750);
  W.undoLastWater(T);
  assert.equal(W.getWaterMl(T), 250);
  W.saveSleep({ date: T, bedTime: '23:40', wakeTime: '06:55', durationMin: 435, quality: 4, note: null });
  W.saveSleep({ date: T, bedTime: '23:00', wakeTime: '07:00', durationMin: 480, quality: 5, note: null });
  assert.equal(W.getSleep(T).durationMin, 480);
  assert.equal(W.getSleepRange(addDays(T, -6), T).length, 1);
  assert.equal(W.anythingLogged(T), true);
  // money edit
  M.addWorkSession({ date: T, platform: 'uber', amountMinor: 22600, tipMinor: 2200, currency: 'PLN', rateToPln: 1, startTime: '14:10', endTime: '20:30', durationMin: 380, orders: 18, km: 64, note: null });
  const ws = M.getTransactions(T, T)[0];
  const full = M.getWorkSession(ws.id);
  M.updateWorkSession(ws.id, { ...full, amountMinor: 30000 });
  assert.equal(M.getDayEarnings(T).pln, 32200);
  M.addExpense({ date: T, amountMinor: 5000, currency: 'AZN', rateToPln: 2.2957, category: 'transfer', note: 'ailə' });
  const ex = M.getTransactions(T, T).find((x: any) => x.kind === 'expense');
  M.updateExpense(ex.id, { ...M.getExpense(ex.id), category: 'food' });
  assert.equal(JSON.stringify(M.getExpenseByCategory(T, T)), JSON.stringify([{ category: 'food', pln: 11479 }]));
});
