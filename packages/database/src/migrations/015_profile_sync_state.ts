import type { Migration } from './index.js';

export const migration015: Migration = {
  version: 15,
  name: 'profile_sync_state',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_tombstones (
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        table_name TEXT NOT NULL,
        row_id TEXT NOT NULL,
        row_data TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        PRIMARY KEY (profile_id, table_name, row_id)
      );
      CREATE TABLE IF NOT EXISTS sync_row_aliases (
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        remote_device_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        remote_id TEXT NOT NULL,
        local_id TEXT NOT NULL,
        PRIMARY KEY (profile_id, remote_device_id, table_name, remote_id)
      );
    `);
    const columns = await db.queryAsync<{ name: string }>(
      'PRAGMA table_info(subscription_dismissed_alerts)'
    );
    for (const [name, definition] of [
      ['updated_at', 'INTEGER NOT NULL DEFAULT 0'],
      ['is_deleted', 'INTEGER NOT NULL DEFAULT 0'],
      ['device_id', 'TEXT'],
    ]) {
      if (!columns.some((column) => column.name === name)) {
        await db.execAsync(
          `ALTER TABLE subscription_dismissed_alerts ADD COLUMN ${name} ${definition}`
        );
      }
    }
    await db.execAsync(
      'UPDATE subscription_dismissed_alerts SET updated_at = dismissed_at WHERE updated_at = 0'
    );
  },
  async down(db) {
    await db.execAsync(
      'DROP TABLE IF EXISTS sync_row_aliases; DROP TABLE IF EXISTS sync_tombstones;'
    );
  },
};
