import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, sanitizeAmountInput, toPlnMinor, formatAmount, durationMinutes, hourlyRate } from '../src/lib/money';
import { startOfWeek, addDays, monthRange } from '../src/lib/dates';
test('parse', () => {
  assert.equal(parseAmount('248'), 24800); assert.equal(parseAmount('248,5'), 24850); assert.equal(parseAmount('0,07'), 7);
  assert.equal(parseAmount('1 000,99'), 100099); assert.equal(parseAmount(''), null); assert.equal(parseAmount('1,234'), null); assert.equal(parseAmount(','), null);
});
test('sanitize', () => { assert.equal(sanitizeAmountInput('12.345'), '12,34'); assert.equal(sanitizeAmountInput('007'), '7'); assert.equal(sanitizeAmountInput('1,2,3'), '1,23'); assert.equal(sanitizeAmountInput('abc5'), '5'); });
test('convert', () => { assert.equal(toPlnMinor(5000, 2.2957), 11479); });
test('format', () => { assert.equal(formatAmount(324050), '3 240,50'); assert.equal(formatAmount(324000), '3 240'); assert.equal(formatAmount(-94000), '−940'); assert.equal(formatAmount(5, {decimals:2}), '0,05'); assert.equal(formatAmount(123456789), '1 234 567,89'); });
test('duration', () => { assert.equal(durationMinutes('14:10','20:30'), 380); assert.equal(durationMinutes('22:00','02:00'), 240); assert.equal(hourlyRate(24800,380), 3916); assert.equal(hourlyRate(100,0), null); });
test('dates', () => { assert.equal(startOfWeek('2026-10-15'), '2026-10-12'); assert.equal(startOfWeek('2026-10-18'), '2026-10-12'); assert.equal(startOfWeek('2026-10-12'), '2026-10-12'); assert.equal(addDays('2026-10-31',1),'2026-11-01'); assert.deepEqual(monthRange(2026,1), {from:'2026-02-01',to:'2026-02-28'}); });
