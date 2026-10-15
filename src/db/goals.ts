import { today } from '@/lib/dates';

import { db, notifyDbChanged } from './index';

export type GoalType = 'numeric' | 'steps';

export type Goal = {
  id: number;
  name: string;
  type: GoalType;
  target: number;
  unit: string | null;
  deadline: string | null;
  completedAt: string | null;
  /** numeric: cəm əlavələr; steps: edilmiş addımlar */
  current: number;
  /** steps: addımların sayı; numeric: target */
  total: number;
  progress: number;
};

export type GoalStep = { id: number; title: string; done: boolean };
export type GoalEntry = { id: number; date: string; amount: number; note: string | null };

type GoalRow = {
  id: number;
  name: string;
  type: GoalType;
  target: number;
  unit: string | null;
  deadline: string | null;
  completed_at: string | null;
  sum_entries: number;
  steps_total: number;
  steps_done: number;
};

const GOAL_SELECT = `
  SELECT g.*,
    COALESCE((SELECT SUM(amount) FROM goal_entries e WHERE e.goal_id = g.id), 0) AS sum_entries,
    (SELECT COUNT(*) FROM goal_steps s WHERE s.goal_id = g.id) AS steps_total,
    (SELECT COUNT(*) FROM goal_steps s WHERE s.goal_id = g.id AND s.done = 1) AS steps_done
  FROM goals g`;

function toGoal(r: GoalRow): Goal {
  const current = r.type === 'numeric' ? r.sum_entries : r.steps_done;
  const total = r.type === 'numeric' ? r.target : r.steps_total;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    target: r.target,
    unit: r.unit,
    deadline: r.deadline,
    completedAt: r.completed_at,
    current,
    total,
    progress: total > 0 ? Math.min(current / total, 1) : 0,
  };
}

export function getGoals(): Goal[] {
  return db
    .getAllSync<GoalRow>(`${GOAL_SELECT} WHERE g.archived = 0 ORDER BY g.completed_at IS NOT NULL, g.deadline IS NULL, g.deadline, g.id`)
    .map(toGoal);
}

export function getGoal(id: number): Goal | null {
  const r = db.getFirstSync<GoalRow>(`${GOAL_SELECT} WHERE g.id = ?`, [id]);
  return r ? toGoal(r) : null;
}

export type GoalInput = {
  name: string;
  type: GoalType;
  target: number;
  unit: string | null;
  deadline: string | null;
  steps: string[];
};

export function addGoal(g: GoalInput): number {
  const res = db.runSync(`INSERT INTO goals (name, type, target, unit, deadline) VALUES (?, ?, ?, ?, ?)`, [
    g.name,
    g.type,
    g.target,
    g.unit,
    g.deadline,
  ]);
  const id = res.lastInsertRowId;
  g.steps.forEach((title, i) => {
    db.runSync('INSERT INTO goal_steps (goal_id, title, sort) VALUES (?, ?, ?)', [id, title, i]);
  });
  notifyDbChanged();
  return id;
}

export function updateGoal(id: number, g: Omit<GoalInput, 'steps' | 'type'>) {
  db.runSync('UPDATE goals SET name = ?, target = ?, unit = ?, deadline = ? WHERE id = ?', [g.name, g.target, g.unit, g.deadline, id]);
  refreshCompletion(id);
  notifyDbChanged();
}

export function deleteGoal(id: number) {
  db.runSync('DELETE FROM goal_entries WHERE goal_id = ?', [id]);
  db.runSync('DELETE FROM goal_steps WHERE goal_id = ?', [id]);
  db.runSync('DELETE FROM goals WHERE id = ?', [id]);
  notifyDbChanged();
}

export function getGoalEntries(goalId: number): GoalEntry[] {
  return db.getAllSync<GoalEntry>('SELECT id, date, amount, note FROM goal_entries WHERE goal_id = ? ORDER BY date DESC, id DESC', [goalId]);
}

export function getGoalSteps(goalId: number): GoalStep[] {
  return db
    .getAllSync<{ id: number; title: string; done: number }>('SELECT id, title, done FROM goal_steps WHERE goal_id = ? ORDER BY sort, id', [goalId])
    .map((s) => ({ id: s.id, title: s.title, done: s.done === 1 }));
}

/**
 * Məqsəd tamamlandısa completed_at yazır. Əvvəl tamamlanmamışdısa true qaytarır
 * (təbrik animasiyası üçün).
 */
function refreshCompletion(goalId: number): boolean {
  const g = getGoal(goalId);
  if (!g) return false;
  const done = g.total > 0 && g.current >= g.total;
  if (done && !g.completedAt) {
    db.runSync('UPDATE goals SET completed_at = ? WHERE id = ?', [today(), goalId]);
    return true;
  }
  if (!done && g.completedAt) db.runSync('UPDATE goals SET completed_at = NULL WHERE id = ?', [goalId]);
  return false;
}

/** Məbləğ əlavə edir. Məqsəd indi tamamlandısa true qaytarır. */
export function addGoalEntry(goalId: number, amount: number, note: string | null = null): boolean {
  db.runSync('INSERT INTO goal_entries (goal_id, date, amount, note) VALUES (?, ?, ?, ?)', [goalId, today(), amount, note]);
  const completed = refreshCompletion(goalId);
  notifyDbChanged();
  return completed;
}

export function deleteGoalEntry(goalId: number, entryId: number) {
  db.runSync('DELETE FROM goal_entries WHERE id = ?', [entryId]);
  refreshCompletion(goalId);
  notifyDbChanged();
}

/** Addımı işarələyir. Məqsəd indi tamamlandısa true qaytarır. */
export function toggleGoalStep(goalId: number, stepId: number, done: boolean): boolean {
  db.runSync('UPDATE goal_steps SET done = ? WHERE id = ?', [done ? 1 : 0, stepId]);
  const completed = refreshCompletion(goalId);
  notifyDbChanged();
  return completed;
}

export function addGoalStep(goalId: number, title: string) {
  const max = db.getFirstSync<{ m: number | null }>('SELECT MAX(sort) AS m FROM goal_steps WHERE goal_id = ?', [goalId])?.m ?? 0;
  db.runSync('INSERT INTO goal_steps (goal_id, title, sort) VALUES (?, ?, ?)', [goalId, title, max + 1]);
  refreshCompletion(goalId);
  notifyDbChanged();
}

export function deleteGoalStep(goalId: number, stepId: number) {
  db.runSync('DELETE FROM goal_steps WHERE id = ?', [stepId]);
  refreshCompletion(goalId);
  notifyDbChanged();
}
