/** XP, səviyyələr və nişanlar (təmiz funksiyalar, test olunur). */

export type XpStats = {
  habitsDone: number;
  longestStreak: number;
  waterGoalDays: number;
  sleepLogs: number;
  workSessions: number;
  totalIncomePln: number; // PLN (qəpik yox)
  goalsCompleted: number;
  moodLogs: number;
  subsPaid: number;
};

/** Hər fəaliyyətin XP dəyəri. */
export const XP_RULES = {
  habitsDone: 10,
  waterGoalDays: 15,
  sleepLogs: 5,
  workSessions: 5,
  goalsCompleted: 100,
  moodLogs: 3,
  subsPaid: 5,
} as const;

export type XpSource = keyof typeof XP_RULES;

export function xpBreakdown(s: XpStats): { source: XpSource; count: number; xp: number }[] {
  return (Object.keys(XP_RULES) as XpSource[]).map((source) => ({
    source,
    count: s[source],
    xp: s[source] * XP_RULES[source],
  }));
}

export function totalXp(s: XpStats): number {
  return xpBreakdown(s).reduce((a, b) => a + b.xp, 0);
}

/**
 * Səviyyə: 1-dən başlayır. N-ci səviyyədən N+1-ə keçmək üçün 100 × N XP lazımdır
 * (2-yə 100, 3-ə daha 200, 4-ə daha 300 ...).
 */
export function levelFromXp(xp: number): { level: number; current: number; needed: number } {
  let level = 1;
  let remaining = xp;
  while (remaining >= 100 * level) {
    remaining -= 100 * level;
    level++;
  }
  return { level, current: remaining, needed: 100 * level };
}

/** Səviyyə adı açarı (i18n: xp.titles.*). */
export function levelTitle(level: number): 'cub' | 'quick' | 'clever' | 'master' | 'legend' {
  if (level >= 12) return 'legend';
  if (level >= 8) return 'master';
  if (level >= 5) return 'clever';
  if (level >= 3) return 'quick';
  return 'cub';
}

/** Foxy-nin açılan görünüşləri. */
export function foxyAccessory(level: number): 'none' | 'scarf' | 'crown' {
  if (level >= 8) return 'crown';
  if (level >= 4) return 'scarf';
  return 'none';
}

export type BadgeId =
  | 'firstHabit'
  | 'streak7'
  | 'streak30'
  | 'habits100'
  | 'water7'
  | 'sleep7'
  | 'firstGoal'
  | 'income1k'
  | 'income5k'
  | 'work30'
  | 'mood7'
  | 'subs3';

export type Badge = { id: BadgeId; icon: string; value: number; target: number; unlocked: boolean };

const BADGES: { id: BadgeId; icon: string; stat: keyof XpStats; target: number }[] = [
  { id: 'firstHabit', icon: '🌱', stat: 'habitsDone', target: 1 },
  { id: 'streak7', icon: '🔥', stat: 'longestStreak', target: 7 },
  { id: 'streak30', icon: '🏆', stat: 'longestStreak', target: 30 },
  { id: 'habits100', icon: '💯', stat: 'habitsDone', target: 100 },
  { id: 'water7', icon: '💧', stat: 'waterGoalDays', target: 7 },
  { id: 'sleep7', icon: '😴', stat: 'sleepLogs', target: 7 },
  { id: 'firstGoal', icon: '🎯', stat: 'goalsCompleted', target: 1 },
  { id: 'income1k', icon: '💰', stat: 'totalIncomePln', target: 1000 },
  { id: 'income5k', icon: '🚀', stat: 'totalIncomePln', target: 5000 },
  { id: 'work30', icon: '🚴', stat: 'workSessions', target: 30 },
  { id: 'mood7', icon: '😊', stat: 'moodLogs', target: 7 },
  { id: 'subs3', icon: '📅', stat: 'subsPaid', target: 3 },
];

export function badges(s: XpStats): Badge[] {
  return BADGES.map((b) => ({
    id: b.id,
    icon: b.icon,
    value: Math.min(s[b.stat], b.target),
    target: b.target,
    unlocked: s[b.stat] >= b.target,
  }));
}
