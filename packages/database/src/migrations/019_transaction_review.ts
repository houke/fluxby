import type { Migration } from './index.js';
const sync = `profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, is_deleted INTEGER NOT NULL DEFAULT 0, device_id TEXT`;
export const TRANSACTION_REVIEW_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS transaction_review_decisions (
 id TEXT PRIMARY KEY, item_key TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('done','later')),
 snoozed_until TEXT, ${sync}, UNIQUE(profile_id,item_key)
);
CREATE TABLE IF NOT EXISTS transaction_links (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
 target_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('refund','transfer')), relation_type TEXT NOT NULL DEFAULT 'refund' CHECK(relation_type IN ('refund','reimbursement','transfer')), amount REAL NOT NULL CHECK(amount>0),
 source_type TEXT, target_type TEXT, ${sync}
);
CREATE INDEX IF NOT EXISTS transaction_links_source ON transaction_links(profile_id,source_id,is_deleted);
CREATE INDEX IF NOT EXISTS transaction_links_target ON transaction_links(profile_id,target_id,is_deleted);
CREATE TABLE IF NOT EXISTS transaction_category_decisions (
 id TEXT PRIMARY KEY, transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
 category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, source TEXT NOT NULL DEFAULT 'manual',
 ${sync}, UNIQUE(profile_id,transaction_id)
);`;
export const migration019: Migration = {
  version: 19,
  name: 'Persistent transaction review and reimbursement links',
  up: async (db) => {
    await db.execAsync(TRANSACTION_REVIEW_SCHEMA_SQL);
    const columns = await db.queryAsync<{ name: string }>(
      'PRAGMA table_info(recurring_patterns)'
    );
    if (!columns.some((c) => c.name === 'manual_source'))
      await db.execAsync(
        'ALTER TABLE recurring_patterns ADD COLUMN manual_source INTEGER NOT NULL DEFAULT 0'
      );
  },
  down: async (db) => {
    for (const table of [
      'transaction_category_decisions',
      'transaction_links',
      'transaction_review_decisions',
    ])
      await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
  },
};
