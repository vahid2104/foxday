/**
 * Vərdiş hesablamaları (təmiz funksiyalar, test olunur).
 * Həftə günləri: 0 = bazar ertəsi ... 6 = bazar.
 */
import { addDays, fromISODate } from './dates';

export type HabitFrequency = 'daily' | 'days';
export type HabitLogStatus = 'done' | 'skipped';

export type HabitSchedule = {
  frequency: HabitFrequency;
  /** Seçilmiş günlər (0 = B.e). frequency = 'daily' olanda nəzərə alınmır. */
  days: number[];
  /** Vərdişin başladığı tarix — ondan əvvəlki günlər "buraxılmış" sayılmır. */
  startDate: string;
};

export type DayState = 'done' | 'skipped' | 'missed' | 'pending' | 'off' | 'future';

/** 0 = B.e ... 6 = Bazar */
export function weekdayIndex(iso: string): number {
  return (fromISODate(iso).getDay() + 6) % 7;
}

/** Bu gün vərdiş edilməlidirmi? */
export function isDue(h: HabitSchedule, iso: string): boolean {
  if (iso < h.startDate) return false;
  if (h.frequency === 'daily') return true;
  return h.days.includes(weekdayIndex(iso));
}

/** Bir günün vəziyyəti (təqvim və həftə zolağı üçün). */
export function dayState(h: HabitSchedule, iso: string, logs: Record<string, HabitLogStatus>, today: string): DayState {
  if (iso > today) return 'future';
  const log = logs[iso];
  if (log === 'done') return 'done';
  if (log === 'skipped') return 'skipped';
  if (!isDue(h, iso)) return 'off';
  return iso === today ? 'pending' : 'missed';
}

/**
 * Cari seriya: bu gündən geriyə ardıcıl edilmiş günlər.
 * - Bu gün hələ edilməyibsə, seriya qırılmır (gün bitməyib).
 * - "Keçildi" (istirahət) və plan olmayan günlər seriyanı qırmır, amma sayılmır.
 */
export function currentStreak(h: HabitSchedule, logs: Record<string, HabitLogStatus>, today: string): number {
  let streak = 0;
  let day = today;
  // 3 il geriyə qədər yoxla — sonsuz dövrəyə qarşı qoruma
  for (let i = 0; i < 1100 && day >= h.startDate; i++, day = addDays(day, -1)) {
    const s = dayState(h, day, logs, today);
    if (s === 'done') streak++;
    else if (s === 'missed') break;
    // pending / skipped / off → davam et
  }
  return streak;
}

/** Ən uzun seriya (başlanğıcdan bu günə qədər). */
export function longestStreak(h: HabitSchedule, logs: Record<string, HabitLogStatus>, today: string): number {
  let best = 0;
  let run = 0;
  for (let day = h.startDate, i = 0; day <= today && i < 1100; day = addDays(day, 1), i++) {
    const s = dayState(h, day, logs, today);
    if (s === 'done') {
      run++;
      best = Math.max(best, run);
    } else if (s === 'missed') {
      run = 0;
    }
  }
  return best;
}

/**
 * Tamamlanma faizi (0–1) tarix aralığında.
 * Bu gün yalnız edilibsə sayılır (əks halda gün hələ bitməyib).
 */
export function completionRate(
  h: HabitSchedule,
  logs: Record<string, HabitLogStatus>,
  from: string,
  to: string,
  today: string,
): number | null {
  let due = 0;
  let done = 0;
  const end = to < today ? to : today;
  for (let day = from < h.startDate ? h.startDate : from; day <= end; day = addDays(day, 1)) {
    const s = dayState(h, day, logs, today);
    if (s === 'done') {
      due++;
      done++;
    } else if (s === 'missed') {
      due++;
    }
  }
  return due === 0 ? null : done / due;
}

/** SPEC §7 — günün balı (0–100). */
export function dayScore(input: {
  habitsDone: number;
  habitsDue: number;
  waterMl: number;
  waterGoalMl: number;
  sleepMin: number | null;
  sleepGoalMin: number;
  anythingLogged: boolean;
}): number {
  const habits = input.habitsDue === 0 ? 1 : input.habitsDone / input.habitsDue;
  const water = input.waterGoalMl > 0 ? Math.min(input.waterMl / input.waterGoalMl, 1) : 0;
  const sleep = input.sleepMin != null && input.sleepGoalMin > 0 ? Math.min(input.sleepMin / input.sleepGoalMin, 1) : 0;
  return Math.round(40 * habits + 25 * water + 25 * sleep + (input.anythingLogged ? 10 : 0));
}
