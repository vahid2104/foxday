import { applyStepReading, type StepState } from '@/lib/tracker';

import { db, notifyDbChanged } from './index';

// ---------- App limitləri ----------

export type AppLimit = { packageName: string; label: string; limitMin: number };

export function getAppLimits(): AppLimit[] {
  return db.getAllSync<AppLimit>(
    'SELECT package_name AS packageName, label, limit_min AS limitMin FROM app_limits ORDER BY label',
  );
}

export function getAppLimit(packageName: string): AppLimit | null {
  return (
    db.getFirstSync<AppLimit>(
      'SELECT package_name AS packageName, label, limit_min AS limitMin FROM app_limits WHERE package_name = ?',
      [packageName],
    ) ?? null
  );
}

export function setAppLimit(packageName: string, label: string, limitMin: number) {
  db.runSync(
    `INSERT INTO app_limits (package_name, label, limit_min) VALUES (?, ?, ?)
     ON CONFLICT(package_name) DO UPDATE SET label = excluded.label, limit_min = excluded.limit_min`,
    [packageName, label, limitMin],
  );
  notifyDbChanged();
}

export function removeAppLimit(packageName: string) {
  db.runSync('DELETE FROM app_limits WHERE package_name = ?', [packageName]);
  db.runSync('DELETE FROM app_limit_alerts WHERE package_name = ?', [packageName]);
  notifyDbChanged();
}

/**
 * Bu gün bu səviyyə üçün xəbərdarlıq artıq göndərilibmi? Göndərilməyibsə qeyd edir və true qaytarır.
 * (Hər app üçün gündə 80% və 100% xəbərdarlıqları yalnız bir dəfə.)
 */
export function claimLimitAlert(packageName: string, date: string, level: number): boolean {
  const r = db.runSync('INSERT OR IGNORE INTO app_limit_alerts (package_name, date, level) VALUES (?, ?, ?)', [
    packageName,
    date,
    level,
  ]);
  return r.changes > 0;
}

// ---------- Addımlar ----------

function getStepState(): StepState | null {
  return (
    db.getFirstSync<StepState>('SELECT last_counter AS lastCounter, last_date AS lastDate FROM step_state WHERE id = 1') ??
    null
  );
}

/** Sensor oxunuşunu bazaya yazır. Qaytarır: bu günə əlavə olunan addımlar. */
export function recordStepReading(counter: number, date: string): number {
  const { add, state } = applyStepReading(getStepState(), counter, date);
  db.withTransactionSync(() => {
    db.runSync('INSERT OR REPLACE INTO step_state (id, last_counter, last_date) VALUES (1, ?, ?)', [
      state.lastCounter,
      state.lastDate,
    ]);
    if (add > 0) {
      db.runSync(
        'INSERT INTO steps_daily (date, steps) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET steps = steps + excluded.steps',
        [date, add],
      );
    }
  });
  if (add > 0) notifyDbChanged();
  return add;
}

export function getSteps(date: string): number {
  return db.getFirstSync<{ steps: number }>('SELECT steps FROM steps_daily WHERE date = ?', [date])?.steps ?? 0;
}

export function getStepsByDay(from: string, to: string): Record<string, number> {
  const rows = db.getAllSync<{ date: string; steps: number }>(
    'SELECT date, steps FROM steps_daily WHERE date BETWEEN ? AND ?',
    [from, to],
  );
  return Object.fromEntries(rows.map((r) => [r.date, r.steps]));
}

/** Bu günün iş dəqiqələri (velosiped) — aktiv kalori hesabı üçün. */
export function getWorkMinutes(date: string): number {
  return (
    db.getFirstSync<{ n: number }>('SELECT COALESCE(SUM(duration_min), 0) AS n FROM work_sessions WHERE date = ?', [date])
      ?.n ?? 0
  );
}
