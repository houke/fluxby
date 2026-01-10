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
 * Check if there are pending migrations
 * Returns the count of pending migrations
 */
export async function checkPendingMigrations(
  db: MigrationContext
): Promise<number> {
  const currentVersion = await getCurrentVersion(db);
  const pendingCount = migrations.filter(
    (m: Migration) => m.version > currentVersion
  ).length;
  return pendingCount;
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

  // Set flag in localStorage to signal that migrations were applied
  // This will trigger the migration prompt to show on next page load
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fluxby-migrations-applied', 'true');
    }
  } catch (error) {
    // Ignore localStorage errors (e.g., in private browsing mode)
  }
}
