/**
 * Vərdiş hesablamaları (təmiz funksiyalar, test olunur).
 * Həftə günləri: 0 = bazar ertəsi ... 6 = bazar.
 */
import { addDays, fromISODate, startOfWeek } from './dates';

export type HabitFrequency = 'daily' | 'days' | 'weekly';
export type HabitLogStatus = 'done' | 'skipped';

export type HabitSchedule = {
  frequency: HabitFrequency;
  /** Seçilmiş günlər (0 = B.e). frequency = 'daily' olanda nəzərə alınmır. */
  days: number[];
  /** Vərdişin başladığı tarix — ondan əvvəlki günlər "buraxılmış" sayılmır. */
  startDate: string;
  /** frequency = 'weekly': həftədə neçə dəfə (istənilən günlərdə). */
  timesPerWeek?: number;
};

export type DayState = 'done' | 'skipped' | 'missed' | 'pending' | 'off' | 'future';

/** 0 = B.e ... 6 = Bazar */
export function weekdayIndex(iso: string): number {
  return (fromISODate(iso).getDay() + 6) % 7;
}

/** Bu gün vərdiş edilə bilərmi (plan üzrə)? Həftəlik vərdiş istənilən gün edilə bilər. */
export function isDue(h: HabitSchedule, iso: string): boolean {
  if (iso < h.startDate) return false;
  if (h.frequency === 'daily' || h.frequency === 'weekly') return true;
  return h.days.includes(weekdayIndex(iso));
}

const target = (h: HabitSchedule) => Math.max(1, h.timesPerWeek ?? 1);

/** Həftədə neçə dəfə edilib (iso günü daxil olan həftə; except — həmin günü sayma). */
export function doneInWeek(logs: Record<string, HabitLogStatus>, iso: string, except?: string): number {
  const monday = startOfWeek(iso);
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    if (d !== except && logs[d] === 'done') n++;
  }
  return n;
}

/**
 * Bu gün siyahıda göstərilməli və bala daxil edilməlidirmi?
 * Həftəlik vərdiş: bu həftənin hədəfi (bu gündən əvvəl) hələ dolmayıbsa.
 */
export function isDueToday(h: HabitSchedule, iso: string, logs: Record<string, HabitLogStatus>): boolean {
  if (!isDue(h, iso)) return false;
  if (h.frequency !== 'weekly') return true;
  return doneInWeek(logs, iso, iso) < target(h);
}

/** Bir günün vəziyyəti (təqvim və həftə zolağı üçün). */
export function dayState(h: HabitSchedule, iso: string, logs: Record<string, HabitLogStatus>, today: string): DayState {
  if (iso > today) return 'future';
  const log = logs[iso];
  if (log === 'done') return 'done';
  if (log === 'skipped') return 'skipped';
  if (!isDue(h, iso)) return 'off';
  if (h.frequency === 'weekly') {
    // Həftəlik vərdişdə ayrıca gün "buraxılmış" sayılmır — hədəf həftə üzrədir
    return iso === today && isDueToday(h, iso, logs) ? 'pending' : 'off';
  }
  return iso === today ? 'pending' : 'missed';
}

/** Seriyanın vahidi: həftəlik vərdişdə həftələr, digərlərində günlər. */
export function streakUnit(h: HabitSchedule): 'days' | 'weeks' {
  return h.frequency === 'weekly' ? 'weeks' : 'days';
}

/** Həftə hədəfi: başlanğıc həftəsində yalnız qalan günlər qədər tələb olunur. */
function weekTarget(h: HabitSchedule, monday: string): number {
  const t = target(h);
  if (monday >= h.startDate) return t;
  const daysLeft = 7 - weekdayIndex(h.startDate);
  return Math.min(t, daysLeft);
}

function weekMet(h: HabitSchedule, logs: Record<string, HabitLogStatus>, monday: string): boolean {
  return doneInWeek(logs, monday) >= weekTarget(h, monday);
}

function weeklyCurrentStreak(h: HabitSchedule, logs: Record<string, HabitLogStatus>, today: string): number {
  const first = startOfWeek(h.startDate);
  let monday = startOfWeek(today);
  let streak = 0;
  if (weekMet(h, logs, monday)) streak++; // cari həftə bitməyib: dolmayıbsa seriya qırılmır
  monday = addDays(monday, -7);
  for (let i = 0; i < 160 && monday >= first; i++, monday = addDays(monday, -7)) {
    if (!weekMet(h, logs, monday)) break;
    streak++;
  }
  return streak;
}

function weeklyLongestStreak(h: HabitSchedule, logs: Record<string, HabitLogStatus>, today: string): number {
  const current = startOfWeek(today);
  let best = 0;
  let run = 0;
  for (let monday = startOfWeek(h.startDate), i = 0; monday <= current && i < 160; monday = addDays(monday, 7), i++) {
    if (weekMet(h, logs, monday)) {
      run++;
      best = Math.max(best, run);
    } else if (monday < current) {
      run = 0;
    }
  }
  return best;
}

/**
 * Cari seriya: bu gündən geriyə ardıcıl edilmiş günlər.
 * - Bu gün hələ edilməyibsə, seriya qırılmır (gün bitməyib).
 * - "Keçildi" (istirahət) və plan olmayan günlər seriyanı qırmır, amma sayılmır.
 */
export function currentStreak(h: HabitSchedule, logs: Record<string, HabitLogStatus>, today: string): number {
  if (h.frequency === 'weekly') return weeklyCurrentStreak(h, logs, today);
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
  if (h.frequency === 'weekly') return weeklyLongestStreak(h, logs, today);
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
  if (h.frequency === 'weekly') {
    // Hər həftə üçün hədəf; cari (bitməmiş) həftə yalnız edilənlər qədər sayılır
    const start = from < h.startDate ? h.startDate : from;
    if (start > end) return null;
    const current = startOfWeek(today);
    for (let monday = startOfWeek(start); monday <= end; monday = addDays(monday, 7)) {
      let n = 0;
      for (let i = 0; i < 7; i++) {
        const d = addDays(monday, i);
        if (d >= start && d <= end && logs[d] === 'done') n++;
      }
      const t = weekTarget(h, monday);
      const counted = Math.min(n, t);
      done += counted;
      due += monday === current ? counted : t;
    }
    return due === 0 ? null : done / due;
  }
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
