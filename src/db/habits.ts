import type { IconName } from '@/components/Icon';
import { addDays, today } from '@/lib/dates';
import {
  currentStreak,
  dayState,
  doneInWeek,
  isDueToday,
  type HabitFrequency,
  type HabitLogStatus,
  type HabitSchedule,
} from '@/lib/habits';

import { db, notifyDbChanged } from './index';

/** Vərdiş rəngləri — tema tokenlərinə uyğun açarlar. */
export type HabitColor = 'brand' | 'success' | 'water' | 'sleep' | 'danger';
export const HABIT_COLORS: HabitColor[] = ['brand', 'success', 'water', 'sleep', 'danger'];
export const HABIT_ICONS: IconName[] = ['dumbbell', 'book', 'droplet', 'moon', 'sparkle', 'bike', 'heart', 'phone', 'sun', 'target', 'flame', 'pencil'];

export type Habit = HabitSchedule & {
  id: number;
  name: string;
  icon: IconName;
  color: HabitColor;
  reminderTime: string | null;
  sort: number;
  archived: boolean;
};

export type HabitInput = {
  name: string;
  icon: IconName;
  color: HabitColor;
  frequency: HabitFrequency;
  days: number[];
  timesPerWeek: number;
  reminderTime: string | null;
};

type HabitRow = {
  id: number;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  days: string;
  reminder_time: string | null;
  sort: number;
  archived: number;
  start_date: string;
  times_per_week: number;
};

function toHabit(r: HabitRow): Habit {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon as IconName,
    color: r.color as HabitColor,
    frequency: r.frequency as HabitFrequency,
    days: r.days ? r.days.split(',').map(Number) : [],
    reminderTime: r.reminder_time,
    sort: r.sort,
    archived: r.archived === 1,
    startDate: r.start_date,
    timesPerWeek: r.times_per_week ?? 3,
  };
}

export function getHabits(includeArchived = false): Habit[] {
  return db
    .getAllSync<HabitRow>(
      `SELECT * FROM habits ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY sort, id`,
    )
    .map(toHabit);
}

export function getHabit(id: number): Habit | null {
  const r = db.getFirstSync<HabitRow>('SELECT * FROM habits WHERE id = ?', [id]);
  return r ? toHabit(r) : null;
}

export function addHabit(h: HabitInput): number {
  const max = db.getFirstSync<{ m: number | null }>('SELECT MAX(sort) AS m FROM habits')?.m ?? 0;
  const res = db.runSync(
    `INSERT INTO habits (name, icon, color, frequency, days, times_per_week, reminder_time, sort, start_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [h.name, h.icon, h.color, h.frequency, h.days.join(','), h.timesPerWeek, h.reminderTime, max + 1, today()],
  );
  notifyDbChanged();
  return res.lastInsertRowId;
}

export function updateHabit(id: number, h: HabitInput) {
  db.runSync(
    `UPDATE habits SET name = ?, icon = ?, color = ?, frequency = ?, days = ?, times_per_week = ?, reminder_time = ? WHERE id = ?`,
    [h.name, h.icon, h.color, h.frequency, h.days.join(','), h.timesPerWeek, h.reminderTime, id],
  );
  notifyDbChanged();
}

export function archiveHabit(id: number) {
  db.runSync('UPDATE habits SET archived = 1 WHERE id = ?', [id]);
  notifyDbChanged();
}

export function deleteHabit(id: number) {
  db.runSync('DELETE FROM habit_logs WHERE habit_id = ?', [id]);
  db.runSync('DELETE FROM habits WHERE id = ?', [id]);
  notifyDbChanged();
}

/** Günün qeydini dəyişir: null → silir. */
export function setHabitLog(habitId: number, date: string, status: HabitLogStatus | null) {
  if (status == null) {
    db.runSync('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', [habitId, date]);
  } else {
    db.runSync('INSERT OR REPLACE INTO habit_logs (habit_id, date, status) VALUES (?, ?, ?)', [habitId, date, status]);
  }
  notifyDbChanged();
}

/** Bir vərdişin bütün qeydləri: { "2026-10-15": "done" } */
export function getHabitLogs(habitId: number, from?: string): Record<string, HabitLogStatus> {
  const rows = db.getAllSync<{ date: string; status: HabitLogStatus }>(
    `SELECT date, status FROM habit_logs WHERE habit_id = ? ${from ? 'AND date >= ?' : ''}`,
    from ? [habitId, from] : [habitId],
  );
  return Object.fromEntries(rows.map((r) => [r.date, r.status]));
}

/** Bütün vərdişlərin qeydləri tarix aralığında: { habitId: { date: status } } */
export function getAllLogs(from: string, to: string): Record<number, Record<string, HabitLogStatus>> {
  const rows = db.getAllSync<{ habit_id: number; date: string; status: HabitLogStatus }>(
    'SELECT habit_id, date, status FROM habit_logs WHERE date BETWEEN ? AND ?',
    [from, to],
  );
  const out: Record<number, Record<string, HabitLogStatus>> = {};
  for (const r of rows) (out[r.habit_id] ??= {})[r.date] = r.status;
  return out;
}

export type HabitWithToday = Habit & {
  todayStatus: HabitLogStatus | null;
  due: boolean;
  streak: number;
  /** Həftəlik vərdiş: bu həftə neçə dəfə edilib (bu gün daxil). */
  weekDone: number;
};

/** Bu gün üçün vərdişlər + seriyalar. Seriya üçün son 400 günə baxılır. */
export function getTodayHabits(date = today()): HabitWithToday[] {
  const habits = getHabits();
  const logs = getAllLogs(addDays(date, -400), date);
  return habits.map((h) => {
    const l = logs[h.id] ?? {};
    return {
      ...h,
      todayStatus: l[date] ?? null,
      due: isDueToday(h, date, l),
      streak: currentStreak(h, l, date),
      weekDone: doneInWeek(l, date),
    };
  });
}

/** Günün xülasəsi: neçə vərdiş planlaşdırılıb, neçəsi edilib. */
export function getDayHabitSummary(date: string) {
  const habits = getHabits();
  const logs = getAllLogs(addDays(date, -7), date);
  let due = 0;
  let done = 0;
  for (const h of habits) {
    const status = logs[h.id]?.[date];
    if (status === 'skipped') continue;
    if (isDueToday(h, date, logs[h.id] ?? {}) || status === 'done') {
      due++;
      if (status === 'done') done++;
    }
  }
  return { due, done };
}

/** Dünən buraxılmış vərdişlər (Foxy-nin kədərli modalı üçün). */
export function getMissedOn(date: string): Habit[] {
  const habits = getHabits();
  const logs = getAllLogs(date, date);
  return habits.filter((h) => dayState(h, date, logs[h.id] ?? {}, today()) === 'missed');
}
