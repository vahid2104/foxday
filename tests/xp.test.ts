import assert from 'node:assert/strict';
import { test } from 'node:test';

import { badges, foxyAccessory, levelFromXp, levelTitle, totalXp, type XpStats } from '../src/lib/xp';

const empty: XpStats = {
  habitsDone: 0,
  longestStreak: 0,
  waterGoalDays: 0,
  sleepLogs: 0,
  workSessions: 0,
  totalIncomePln: 0,
  goalsCompleted: 0,
  moodLogs: 0,
  subsPaid: 0,
};

test('levelFromXp', () => {
  assert.deepEqual(levelFromXp(0), { level: 1, current: 0, needed: 100 });
  assert.deepEqual(levelFromXp(99), { level: 1, current: 99, needed: 100 });
  assert.deepEqual(levelFromXp(100), { level: 2, current: 0, needed: 200 });
  assert.deepEqual(levelFromXp(350), { level: 3, current: 50, needed: 300 });
});

test('totalXp', () => {
  assert.equal(totalXp(empty), 0);
  assert.equal(totalXp({ ...empty, habitsDone: 12, goalsCompleted: 1, waterGoalDays: 2 }), 120 + 100 + 30);
});

test('titles and accessories', () => {
  assert.equal(levelTitle(1), 'cub');
  assert.equal(levelTitle(5), 'clever');
  assert.equal(levelTitle(12), 'legend');
  assert.equal(foxyAccessory(3), 'none');
  assert.equal(foxyAccessory(4), 'scarf');
  assert.equal(foxyAccessory(9), 'crown');
});

test('badges', () => {
  const b = badges({ ...empty, habitsDone: 5, longestStreak: 8, totalIncomePln: 1200 });
  const byId = Object.fromEntries(b.map((x) => [x.id, x]));
  assert.equal(byId.firstHabit.unlocked, true);
  assert.equal(byId.streak7.unlocked, true);
  assert.equal(byId.streak30.unlocked, false);
  assert.equal(byId.streak30.value, 8);
  assert.equal(byId.income1k.unlocked, true);
  assert.equal(byId.income5k.value, 1200);
  assert.equal(b.length, 12);
});
