import { MigrationContext, migrations, Migration } from './index.js';
import { dbLog, dbError } from '../logger.js';

/**
 * Get the current schema version from the database
 * Returns 0 if the schema_version table does not exist
 */
export async function getCurrentVersion(db: MigrationContext): Promise<number> {
  try {
    const rows = await db.queryAsync<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );
    if (rows && rows.length > 0) {
      return rows[0].version;
    }
    return 0;
  } catch (error) {
    // Table doesn't exist or other error, assume version 0
    return 0;
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(db: MigrationContext): Promise<void> {
  const currentVersion = await getCurrentVersion(db);
  dbLog(`[MigrationRunner] Current version: ${currentVersion}`);

  // Filter for migrations newer than current version
  const pendingMigrations = migrations
    .filter((m: Migration) => m.version > currentVersion)
    .sort((a: Migration, b: Migration) => a.version - b.version);

  if (pendingMigrations.length === 0) {
    dbLog('[MigrationRunner] No pending migrations');
    return;
  }

  dbLog(
    `[MigrationRunner] Found ${pendingMigrations.length} pending migrations`
  );

  for (const migration of pendingMigrations) {
    dbLog(
      `[MigrationRunner] Running migration ${migration.version}: ${migration.name}`
    );

    try {
      await migration.up(db);

      // successful, update version
      await db.execAsync(
        `INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (${migration.version}, ${Date.now()})`
      );

      dbLog(`[MigrationRunner] Migration ${migration.version} completed`);
    } catch (err) {
      dbError(`[MigrationRunner] Migration ${migration.version} failed:`, err);
      throw err; // Stop migration process on error
    }
  }

  dbLog('[MigrationRunner] All migrations completed successfully');
}
