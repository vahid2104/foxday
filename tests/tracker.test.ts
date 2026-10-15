import assert from 'node:assert/strict';
import { test } from 'node:test';

import { activeKcal, applyStepReading, limitLevel, stepsToKm } from '../src/lib/tracker';

test('applyStepReading', () => {
  const first = applyStepReading(null, 5000, '2026-10-16');
  assert.deepEqual(first, { add: 0, state: { lastCounter: 5000, lastDate: '2026-10-16' } });
  assert.equal(applyStepReading(first.state, 5600, '2026-10-16').add, 600);
  // reboot: sayğac sıfırdan başlayır
  assert.equal(applyStepReading(first.state, 120, '2026-10-16').add, 120);
  // sensor yoxdur / cavab vermədi
  assert.deepEqual(applyStepReading(first.state, -1, '2026-10-16'), { add: 0, state: first.state });
  // absurd artım
  assert.equal(applyStepReading(first.state, 500000, '2026-10-16').add, 0);
});

test('limitLevel və hesablamalar', () => {
  assert.equal(limitLevel(10, 60), 0);
  assert.equal(limitLevel(48, 60), 80);
  assert.equal(limitLevel(60, 60), 100);
  assert.equal(limitLevel(90, 0), 0);
  assert.equal(stepsToKm(10000), 7.5);
  assert.equal(activeKcal(10000, 60), 670);
});
