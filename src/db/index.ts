import * as SQLite from 'expo-sqlite';
import { create } from 'zustand';

/** Telefondakı yeganə baza faylı. */
export const db = SQLite.openDatabaseSync('foxday.db');

/**
 * Migrasiyalar. Hər element bazanın bir versiyasıdır — yalnız sona yenisini əlavə et,
 * köhnələri heç vaxt dəyişmə (telefonda artıq tətbiq olunublar).
 */
const MIGRATIONS: string[] = [
  // v1 — Pul modulu
  `
  CREATE TABLE work_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    platform TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    tip_minor INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'PLN',
    rate_to_pln REAL NOT NULL DEFAULT 1,
    amount_pln_minor INTEGER NOT NULL,
    start_time TEXT,
    end_time TEXT,
    duration_min INTEGER NOT NULL DEFAULT 0,
    orders INTEGER,
    km REAL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_work_sessions_date ON work_sessions(date);

  CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PLN',
    rate_to_pln REAL NOT NULL DEFAULT 1,
    amount_pln_minor INTEGER NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_expenses_date ON expenses(date);

  CREATE TABLE exchange_rates (
    date TEXT NOT NULL,
    currency TEXT NOT NULL,
    rate_to_pln REAL NOT NULL,
    PRIMARY KEY (date, currency)
  );
  `,
  // v2 — Vərdişlər, məqsədlər, su, yuxu
  `
  CREATE TABLE habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'daily',
    days TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6',
    reminder_time TEXT,
    sort INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE habit_logs (
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (habit_id, date)
  );
  CREATE INDEX idx_habit_logs_date ON habit_logs(date);

  CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    target REAL NOT NULL DEFAULT 0,
    unit TEXT,
    deadline TEXT,
    completed_at TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE goal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE goal_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE water_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    ml INTEGER NOT NULL
  );
  CREATE INDEX idx_water_logs_date ON water_logs(date);

  CREATE TABLE sleep_logs (
    date TEXT PRIMARY KEY,
    bed_time TEXT NOT NULL,
    wake_time TEXT NOT NULL,
    duration_min INTEGER NOT NULL,
    quality INTEGER,
    note TEXT
  );
  `,
  // v3 — "Həftədə N dəfə" vərdişləri
  `
  ALTER TABLE habits ADD COLUMN times_per_week INTEGER NOT NULL DEFAULT 3;
  `,
];

/** Bazanı ən son versiyaya gətirir. App açılanda bir dəfə çağırılır. */
export function migrate() {
  db.execSync('PRAGMA journal_mode = WAL');
  db.execSync('PRAGMA foreign_keys = ON');
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[v]);
      db.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

/** Hər yazmadan sonra artan sayğac — ekranlar bunu izləyib məlumatı yenidən oxuyur. */
export const useDbVersion = create<{ version: number; bump: () => void }>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

export const notifyDbChanged = () => useDbVersion.getState().bump();
