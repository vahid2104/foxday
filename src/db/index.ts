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
];

/** Bazanı ən son versiyaya gətirir. App açılanda bir dəfə çağırılır. */
export function migrate() {
  db.execSync('PRAGMA journal_mode = WAL');
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
