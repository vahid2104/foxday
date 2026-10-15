import { toHHMM } from '@/lib/dates';

import { db, notifyDbChanged } from './index';

// ---------- Kalori ----------

export type FoodLog = { id: number; date: string; time: string; name: string; kcal: number };

export function addFood(date: string, name: string, kcal: number) {
  db.runSync('INSERT INTO food_logs (date, time, name, kcal) VALUES (?, ?, ?, ?)', [date, toHHMM(new Date()), name, kcal]);
  notifyDbChanged();
}

export function deleteFood(id: number) {
  db.runSync('DELETE FROM food_logs WHERE id = ?', [id]);
  notifyDbChanged();
}

export function getFoods(date: string): FoodLog[] {
  return db.getAllSync<FoodLog>('SELECT id, date, time, name, kcal FROM food_logs WHERE date = ? ORDER BY time, id', [date]);
}

export function getKcal(date: string): number {
  return db.getFirstSync<{ n: number }>('SELECT COALESCE(SUM(kcal), 0) AS n FROM food_logs WHERE date = ?', [date])?.n ?? 0;
}

/** Tez-tez yediyin yeməklər (sonuncu kalorisi ilə) — bir toxunuşla əlavə etmək üçün. */
export function getFrequentFoods(limit = 8): { name: string; kcal: number }[] {
  return db.getAllSync<{ name: string; kcal: number }>(
    `SELECT name,
       (SELECT f2.kcal FROM food_logs f2 WHERE f2.name = f.name ORDER BY f2.id DESC LIMIT 1) AS kcal
     FROM food_logs f GROUP BY name ORDER BY COUNT(*) DESC, MAX(id) DESC LIMIT ?`,
    [limit],
  );
}

export function getKcalByDay(from: string, to: string): Record<string, number> {
  const rows = db.getAllSync<{ date: string; n: number }>(
    'SELECT date, SUM(kcal) AS n FROM food_logs WHERE date BETWEEN ? AND ? GROUP BY date',
    [from, to],
  );
  return Object.fromEntries(rows.map((r) => [r.date, r.n]));
}

// ---------- Əhval ----------

export type Mood = 1 | 2 | 3 | 4 | 5;
export const MOOD_EMOJI: Record<Mood, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

export function setMood(date: string, mood: Mood | null) {
  if (mood == null) db.runSync('DELETE FROM mood_logs WHERE date = ?', [date]);
  else db.runSync('INSERT OR REPLACE INTO mood_logs (date, mood) VALUES (?, ?)', [date, mood]);
  notifyDbChanged();
}

export function getMood(date: string): Mood | null {
  return (db.getFirstSync<{ mood: Mood }>('SELECT mood FROM mood_logs WHERE date = ?', [date])?.mood ?? null) as Mood | null;
}

export function getMoodAverage(from: string, to: string): number | null {
  return db.getFirstSync<{ avg: number | null }>('SELECT AVG(mood) AS avg FROM mood_logs WHERE date BETWEEN ? AND ?', [from, to])?.avg ?? null;
}
