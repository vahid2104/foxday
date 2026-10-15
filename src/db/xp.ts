import { today } from '@/lib/dates';
import { longestStreak, type HabitLogStatus } from '@/lib/habits';
import type { XpStats } from '@/lib/xp';
import { useSettings } from '@/store/settings';

import { getHabits } from './habits';
import { db } from './index';

/** XP və nişanlar üçün statistika — hamısı bazadakı real qeydlərdən hesablanır. */
export function getXpStats(): XpStats {
  const n = (sql: string, params: (string | number)[] = []) => db.getFirstSync<{ n: number }>(sql, params)?.n ?? 0;
  const waterGoal = useSettings.getState().waterGoalMl;

  // Ən uzun seriya (bütün vərdişlər, arxivlənənlər də daxil)
  const habits = getHabits(true);
  const rows = db.getAllSync<{ habit_id: number; date: string; status: HabitLogStatus }>('SELECT habit_id, date, status FROM habit_logs');
  const logs: Record<number, Record<string, HabitLogStatus>> = {};
  for (const r of rows) (logs[r.habit_id] ??= {})[r.date] = r.status;
  const t = today();
  const best = habits.reduce((m, h) => Math.max(m, longestStreak(h, logs[h.id] ?? {}, t)), 0);

  return {
    habitsDone: n(`SELECT COUNT(*) AS n FROM habit_logs WHERE status = 'done'`),
    longestStreak: best,
    waterGoalDays: n(`SELECT COUNT(*) AS n FROM (SELECT date FROM water_logs GROUP BY date HAVING SUM(ml) >= ?)`, [waterGoal]),
    sleepLogs: n('SELECT COUNT(*) AS n FROM sleep_logs'),
    workSessions: n('SELECT COUNT(*) AS n FROM work_sessions'),
    totalIncomePln: Math.floor(n('SELECT COALESCE(SUM(amount_pln_minor), 0) AS n FROM work_sessions') / 100),
    goalsCompleted: n('SELECT COUNT(*) AS n FROM goals WHERE completed_at IS NOT NULL'),
    moodLogs: n('SELECT COUNT(*) AS n FROM mood_logs'),
    subsPaid: n('SELECT COUNT(*) AS n FROM subscription_payments'),
  };
}
