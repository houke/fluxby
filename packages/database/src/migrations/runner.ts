import {
  MigrationContext,
  migrations,
  Migration,
  LATEST_MIGRATION_VERSION,
} from './index.js';
import { dbLog, dbError } from '../logger.js';

const STORAGE_KEY_DB_VERSION = 'fluxby-db-schema-version';
const STORAGE_KEY_CODE_VERSION = 'fluxby-code-migration-version';
const STORAGE_KEY_MIGRATIONS_APPLIED = 'fluxby-migrations-applied';

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

  // Set flags in localStorage to signal that migrations were applied
  // and track version information for stale code detection
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MIGRATIONS_APPLIED, 'true');
      // Store the new database schema version
      const newVersion = Math.max(...migrations.map((m) => m.version));
      localStorage.setItem(STORAGE_KEY_DB_VERSION, String(newVersion));
      // Store the code's migration version
      localStorage.setItem(
        STORAGE_KEY_CODE_VERSION,
        String(LATEST_MIGRATION_VERSION)
      );
    }
  } catch (error) {
    // Ignore localStorage errors (e.g., in private browsing mode)
  }
}

/**
 * Check if we're running stale code.
 * Returns true if the database has been migrated to a version
 * higher than what this code knows about.
 */
export function isStaleCode(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;

    const storedDbVersion = localStorage.getItem(STORAGE_KEY_DB_VERSION);
    if (!storedDbVersion) return false;

    const dbVersion = parseInt(storedDbVersion, 10);
    if (isNaN(dbVersion)) return false;

    // If the stored DB version is higher than what this code knows about,
    // we're running stale/cached code
    if (dbVersion > LATEST_MIGRATION_VERSION) {
      dbLog(
        `[MigrationRunner] Stale code detected! DB version: ${dbVersion}, Code knows: ${LATEST_MIGRATION_VERSION}`
      );
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get the latest migration version this code knows about.
 */
export function getLatestMigrationVersion(): number {
  return LATEST_MIGRATION_VERSION;
}
