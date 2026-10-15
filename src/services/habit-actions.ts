import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { getDayHabitSummary, getTodayHabits, setHabitLog } from '@/db/habits';
import { today } from '@/lib/dates';
import type { HabitLogStatus } from '@/lib/habits';
import { useSettings } from '@/store/settings';

/**
 * Vərdişin bugünkü qeydini dəyişir. Bununla bütün vərdişlər tamamlanırsa
 * (gündə bir dəfə) Foxy-nin təbrik ekranını açır.
 */
export function setTodayHabit(habitId: number, status: HabitLogStatus | null, date = today()) {
  setHabitLog(habitId, date, status);

  if (status !== 'done') {
    Haptics.selectionAsync();
    return;
  }
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  if (date !== today()) return;
  const { due, done } = getDayHabitSummary(date);
  const { lastCelebrated, set } = useSettings.getState();
  if (due > 0 && done >= due && lastCelebrated !== date) {
    set({ lastCelebrated: date });
    const best = Math.max(0, ...getTodayHabits(date).map((h) => h.streak));
    router.push({ pathname: '/celebrate', params: { kind: 'habits', streak: String(best) } });
  }
}

/** Məqsəd tamamlananda təbrik. */
export function celebrateGoal(goalName: string) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  router.push({ pathname: '/celebrate', params: { kind: 'goal', goal: goalName } });
}
