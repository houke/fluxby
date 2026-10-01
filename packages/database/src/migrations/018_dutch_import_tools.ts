import type { Migration } from './index.js';

const sync = `profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
is_deleted INTEGER NOT NULL DEFAULT 0, device_id TEXT`;
export const DUTCH_IMPORT_TOOLS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS import_profiles (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, header_signature TEXT NOT NULL,
 settings_json TEXT NOT NULL, ${sync}
);
CREATE INDEX IF NOT EXISTS idx_import_profiles_signature ON import_profiles(profile_id,header_signature);
CREATE TABLE IF NOT EXISTS import_batches (
 id TEXT PRIMARY KEY, import_id TEXT, filename TEXT NOT NULL,
 transaction_ids_json TEXT NOT NULL DEFAULT '[]', account_baselines_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending', ${sync}
);
CREATE TABLE IF NOT EXISTS import_recovery_snapshots (
 id TEXT PRIMARY KEY, filename TEXT NOT NULL, backup_json TEXT NOT NULL, ${sync}
);
`;
export const migration018: Migration = {
  version: 18,
  name: 'Dutch import profiles, batch recovery and local snapshots',
  up: async (db) => {
    await db.execAsync(DUTCH_IMPORT_TOOLS_SCHEMA_SQL);
  },
  down: async (db) => {
    for (const table of [
      'import_recovery_snapshots',
      'import_batches',
      'import_profiles',
    ])
      await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
  },
};
