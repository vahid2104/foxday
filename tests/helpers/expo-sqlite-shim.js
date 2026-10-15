const { DatabaseSync } = require('node:sqlite');
function wrap(db) {
  const norm = (p) => (p ?? []).map((v) => (v === undefined ? null : v));
  return {
    execSync: (sql) => db.exec(sql),
    getFirstSync: (sql, p) => db.prepare(sql).get(...norm(p)) ?? null,
    getAllSync: (sql, p) => db.prepare(sql).all(...norm(p)),
    runSync: (sql, p) => { const r = db.prepare(sql).run(...norm(p)); return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes }; },
    withTransactionSync: (fn) => { db.exec('BEGIN'); try { fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } },
  };
}
module.exports = { openDatabaseSync: () => wrap(new DatabaseSync(':memory:')) };
