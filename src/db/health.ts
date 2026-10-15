import { toHHMM } from '@/lib/dates';

import { db, notifyDbChanged } from './index';

// ---------- Su ----------

export function addWater(date: string, ml: number) {
  db.runSync('INSERT INTO water_logs (date, time, ml) VALUES (?, ?, ?)', [date, toHHMM(new Date()), ml]);
  notifyDbChanged();
}

/** Günün son su qeydini silir (səhvən basılıbsa). */
export function undoLastWater(date: string) {
  db.runSync('DELETE FROM water_logs WHERE id = (SELECT MAX(id) FROM water_logs WHERE date = ?)', [date]);
  notifyDbChanged();
}

export function getWaterMl(date: string): number {
  return db.getFirstSync<{ ml: number }>('SELECT COALESCE(SUM(ml),0) AS ml FROM water_logs WHERE date = ?', [date])?.ml ?? 0;
}

export function getWaterByDay(from: string, to: string): Record<string, number> {
  const rows = db.getAllSync<{ date: string; ml: number }>(
    'SELECT date, SUM(ml) AS ml FROM water_logs WHERE date BETWEEN ? AND ? GROUP BY date',
    [from, to],
  );
  return Object.fromEntries(rows.map((r) => [r.date, r.ml]));
}

// ---------- Yuxu ----------

export type SleepLog = {
  /** Oyanma tarixi (yəni "dünən gecə"nin yuxusu bu günə yazılır). */
  date: string;
  bedTime: string;
  wakeTime: string;
  durationMin: number;
  quality: number | null;
  note: string | null;
};

type SleepRow = { date: string; bed_time: string; wake_time: string; duration_min: number; quality: number | null; note: string | null };
const toSleep = (r: SleepRow): SleepLog => ({
  date: r.date,
  bedTime: r.bed_time,
  wakeTime: r.wake_time,
  durationMin: r.duration_min,
  quality: r.quality,
  note: r.note,
});

export function saveSleep(s: SleepLog) {
  db.runSync(
    'INSERT OR REPLACE INTO sleep_logs (date, bed_time, wake_time, duration_min, quality, note) VALUES (?, ?, ?, ?, ?, ?)',
    [s.date, s.bedTime, s.wakeTime, s.durationMin, s.quality, s.note],
  );
  notifyDbChanged();
}

export function deleteSleep(date: string) {
  db.runSync('DELETE FROM sleep_logs WHERE date = ?', [date]);
  notifyDbChanged();
}

export function getSleep(date: string): SleepLog | null {
  const r = db.getFirstSync<SleepRow>('SELECT * FROM sleep_logs WHERE date = ?', [date]);
  return r ? toSleep(r) : null;
}

export function getSleepRange(from: string, to: string): SleepLog[] {
  return db.getAllSync<SleepRow>('SELECT * FROM sleep_logs WHERE date BETWEEN ? AND ? ORDER BY date', [from, to]).map(toSleep);
}

/** Bu gün nəsə qeyd olunubmu (günün balının son 10 xalı üçün). */
export function anythingLogged(date: string): boolean {
  const r = db.getFirstSync<{ n: number }>(
    `SELECT
      (SELECT COUNT(*) FROM habit_logs WHERE date = ?) +
      (SELECT COUNT(*) FROM water_logs WHERE date = ?) +
      (SELECT COUNT(*) FROM sleep_logs WHERE date = ?) +
      (SELECT COUNT(*) FROM work_sessions WHERE date = ?) +
      (SELECT COUNT(*) FROM expenses WHERE date = ?) +
      (SELECT COUNT(*) FROM food_logs WHERE date = ?) +
      (SELECT COUNT(*) FROM mood_logs WHERE date = ?) AS n`,
    [date, date, date, date, date, date, date],
  );
  return (r?.n ?? 0) > 0;
}
