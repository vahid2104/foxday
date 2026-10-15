import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CSV_BOM, minorToCsv, toCsv } from '../src/lib/csv';

test('toCsv', () => {
  const out = toCsv(['Tarix', 'Qeyd', 'Məbləğ'], [
    ['2026-10-15', 'Ailəyə; köçürmə', minorToCsv(50000)],
    ['2026-10-16', 'Dedi "salam"', minorToCsv(5)],
    ['2026-10-17', null, minorToCsv(-940)],
  ]);
  assert.ok(out.startsWith(CSV_BOM));
  const lines = out.slice(1).trimEnd().split('\r\n');
  assert.equal(lines[0], 'Tarix;Qeyd;Məbləğ');
  assert.equal(lines[1], '2026-10-15;"Ailəyə; köçürmə";500,00');
  assert.equal(lines[2], '2026-10-16;"Dedi ""salam""";0,05');
  assert.equal(lines[3], '2026-10-17;;-9,40');
});
