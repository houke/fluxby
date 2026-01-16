import {
  MigrationContext,
  migrations,
  Migration,
  LATEST_MIGRATION_VERSION,
} from './index.js';
import { dbLog, dbError } from '../logger.js';

const STORAGE_KEY_DB_VERSION = 'fluxby-db-schema-version';
const STORAGE_KEY_CODE_VERSION = 'fluxby-code-migration-version';
const SESSION_KEY_MIGRATIONS_COMPLETE = 'fluxby-migrations-complete-session';

// Track if migrations completed in this session (in-memory flag)
let migrationsCompletedThisSession = false;

/**
 * Get the stored database schema version from localStorage.
 * Returns null if not set.
 */
export function getStoredDbVersion(): number | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY_DB_VERSION);
    if (!stored) return null;
    const version = parseInt(stored, 10);
    return isNaN(version) ? null : version;
  } catch {
    return null;
  }
}

/**
 * Check if the database version matches the code's expected version.
 * Returns true if versions match, false if there's a mismatch.
 */
export function isVersionMismatch(): boolean {
  const storedVersion = getStoredDbVersion();
  if (storedVersion === null) return false; // First run, no mismatch
  return storedVersion !== LATEST_MIGRATION_VERSION;
}

/**
 * Check if migrations completed in this session.
 * Used to prevent showing migration prompt multiple times in the same session.
 */
export function hasMigrationsCompletedThisSession(): boolean {
  return migrationsCompletedThisSession;
}

/**
 * Mark migrations as completed in this session.
 * Also stores in sessionStorage for persistence across page navigation.
 */
export function markMigrationsComplete(): void {
  migrationsCompletedThisSession = true;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY_MIGRATIONS_COMPLETE, 'true');
  }
}

/**
 * Check sessionStorage to see if migrations completed in this browser session.
 */
export function checkMigrationsCompletedInSession(): boolean {
  if (migrationsCompletedThisSession) return true;

  if (typeof sessionStorage !== 'undefined') {
    const completed = sessionStorage.getItem(SESSION_KEY_MIGRATIONS_COMPLETE);
    if (completed === 'true') {
      migrationsCompletedThisSession = true;
      return true;
    }
  }

  return false;
}

/**
 * Update localStorage with the current code's migration version.
 * Call this early on app startup to track version changes.
 */
export function updateCodeVersionInStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const previousCodeVersion = localStorage.getItem(
        STORAGE_KEY_CODE_VERSION
      );
      const currentCodeVersion = String(LATEST_MIGRATION_VERSION);

      // Always update to current code version
      localStorage.setItem(STORAGE_KEY_CODE_VERSION, currentCodeVersion);

      // If code version increased, migrations will run, so mark that we need refresh after
      if (
        previousCodeVersion &&
        parseInt(previousCodeVersion, 10) < LATEST_MIGRATION_VERSION
      ) {
        dbLog(
          `[MigrationRunner] Code version upgraded: ${previousCodeVersion} → ${currentCodeVersion}`
        );
      }
    }
  } catch {
    // Ignore localStorage errors
  }
}

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
  } catch {
    // Table doesn't exist or other error, assume version 0
    return 0;
  }
}

/**
 * Ensure the schema_version table exists.
 * This MUST be called before any other migration logic to prevent
 * "no such table: schema_version" errors on fresh installs.
 */
export async function ensureSchemaVersionTable(
  db: MigrationContext
): Promise<void> {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);
    dbLog('[MigrationRunner] schema_version table ensured');
  } catch (err) {
    dbError('[MigrationRunner] Failed to create schema_version table:', err);
    throw err;
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
  // CRITICAL: Ensure schema_version table exists BEFORE any migration logic
  // This prevents "no such table: schema_version" errors on fresh installs
  await ensureSchemaVersionTable(db);

  // Now verify that all expected tables exist
  // This handles edge cases where schema_version is ahead of actual schema
  await verifyAndRepairMigrations(db);

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

  // Force console log for pending migrations to provide user feedback
  // eslint-disable-next-line no-console
  console.log(
    `[MigrationRunner] Found ${pendingMigrations.length} pending migrations. This may take a moment...`
  );
  dbLog(
    `[MigrationRunner] Found ${pendingMigrations.length} pending migrations`
  );

  // Use a single transaction for all migrations to improve performance on OPFS
  await db.transactionAsync(async () => {
    for (const migration of pendingMigrations) {
      dbLog(
        `[MigrationRunner] Running migration ${migration.version}: ${migration.name}`
      );

      try {
        // Force console log for individual migrations
        // eslint-disable-next-line no-console
        console.log(
          `[MigrationRunner] Applying migration ${migration.version}...`
        );
        await migration.up(db);

        // successful, update version
        await db.execAsync(
          `INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (${migration.version}, ${Date.now()})`
        );

        dbLog(`[MigrationRunner] Migration ${migration.version} completed`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[MigrationRunner] Migration ${migration.version} FAILED:`,
          err
        );
        dbError(
          `[MigrationRunner] Migration ${migration.version} failed:`,
          err
        );
        throw err; // Stop migration process on error
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log('[MigrationRunner] All migrations completed successfully.');
  dbLog('[MigrationRunner] All migrations completed successfully');

  // Update localStorage with the new database schema version
  try {
    if (typeof localStorage !== 'undefined') {
      const newVersion = Math.max(...migrations.map((m) => m.version));
      localStorage.setItem(STORAGE_KEY_DB_VERSION, String(newVersion));
    }
  } catch {
    // Ignore localStorage errors (e.g., in private browsing mode)
  }

  // Mark migrations as completed in this session
  markMigrationsComplete();
}

/**
 * Check if we're running stale code.
 * Returns true if the database has been migrated to a version
 * higher than what this code knows about.
 *
 * NOTE: This function also repairs corrupted localStorage values
 * that may have been set by buggy migration version numbers.
 */
export function isStaleCode(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;

    const storedDbVersion = localStorage.getItem(STORAGE_KEY_DB_VERSION);
    if (!storedDbVersion) return false;

    const dbVersion = parseInt(storedDbVersion, 10);
    if (isNaN(dbVersion)) return false;

    // If the stored DB version is higher than what this code knows about,
    // check if it's a corrupted value from buggy migration versions (e.g., 5, 6, 7 instead of 2, 3, 4)
    if (dbVersion > LATEST_MIGRATION_VERSION) {
      // If the stored version is unreasonably high (more than double the latest),
      // it's likely a corrupted value from buggy migration numbering.
      // Reset to the latest version since migrations were likely already applied.
      const maxReasonableVersion = LATEST_MIGRATION_VERSION + 2; // Small buffer for legitimate future versions
      if (dbVersion > maxReasonableVersion) {
        dbLog(
          `[MigrationRunner] Corrupted localStorage version detected (${dbVersion}), resetting to ${LATEST_MIGRATION_VERSION}`
        );
        localStorage.setItem(
          STORAGE_KEY_DB_VERSION,
          String(LATEST_MIGRATION_VERSION)
        );
        // Also clear session flag to let the app load normally
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(SESSION_KEY_MIGRATIONS_COMPLETE);
        }
        return false;
      }

      dbLog(
        `[MigrationRunner] Stale code detected! DB version: ${dbVersion}, Code knows: ${LATEST_MIGRATION_VERSION}`
      );
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check if there are new migrations to run (code has newer migrations than DB).
 * This checks localStorage first (before DB is initialized) to detect early.
 */
export function hasNewMigrations(): boolean {
  try {
    // If migrations already ran in this session, don't show prompt again
    if (checkMigrationsCompletedInSession()) {
      dbLog('[MigrationRunner] Migrations already completed in this session');
      return false;
    }

    if (typeof localStorage === 'undefined') return false;

    const storedDbVersion = localStorage.getItem(STORAGE_KEY_DB_VERSION);

    // If no stored version, this is first run - let migrations run normally
    if (!storedDbVersion) return false;

    const dbVersion = parseInt(storedDbVersion, 10);
    if (isNaN(dbVersion)) return false;

    // If our code knows about higher migrations than DB has, we have pending migrations
    if (LATEST_MIGRATION_VERSION > dbVersion) {
      dbLog(
        `[MigrationRunner] New migrations available! DB version: ${dbVersion}, Code version: ${LATEST_MIGRATION_VERSION}`
      );
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get the latest migration version this code knows about.
 */
export function getLatestMigrationVersion(): number {
  return LATEST_MIGRATION_VERSION;
}

/**
 * Critical tables that must exist for each migration version.
 * If any of these are missing, the migration will be re-run.
 */
const CRITICAL_TABLES_BY_VERSION: Record<number, string[]> = {
  1: ['accounts', 'transactions', 'categories', 'profiles', 'schema_version'],
  5: ['recurring_patterns'],
};

/**
 * Critical columns that must exist for each migration version.
 * Format: { version: { table: [columns] } }
 * If any of these columns are missing, the migration will be re-run.
 */
const CRITICAL_COLUMNS_BY_VERSION: Record<number, Record<string, string[]>> = {
  6: { recurring_patterns: ['is_dismissed'] },
};

/**
 * Verify that critical tables exist for the given migration version.
 * Returns the list of missing tables.
 */
export async function verifyTablesExist(
  db: MigrationContext,
  version: number
): Promise<string[]> {
  const tablesToCheck = CRITICAL_TABLES_BY_VERSION[version] || [];
  const missingTables: string[] = [];

  for (const table of tablesToCheck) {
    try {
      // Check if table exists by querying sqlite_master
      const result = await db.queryAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      );
      if (!result || result.length === 0) {
        missingTables.push(table);
      }
    } catch {
      missingTables.push(table);
    }
  }

  return missingTables;
}

/**
 * Verify that critical columns exist for the given migration version.
 * Returns a list of missing columns in format "table.column".
 */
export async function verifyColumnsExist(
  db: MigrationContext,
  version: number
): Promise<string[]> {
  const columnsByTable = CRITICAL_COLUMNS_BY_VERSION[version] || {};
  const missingColumns: string[] = [];

  for (const [table, columns] of Object.entries(columnsByTable)) {
    try {
      // Get table info to check column existence
      const tableInfo = await db.queryAsync<{ name: string }>(
        `PRAGMA table_info(${table})`
      );
      const existingColumns = new Set(tableInfo?.map((row) => row.name) || []);

      for (const column of columns) {
        if (!existingColumns.has(column)) {
          missingColumns.push(`${table}.${column}`);
        }
      }
    } catch {
      // If we can't query table info, assume all columns are missing
      for (const column of columns) {
        missingColumns.push(`${table}.${column}`);
      }
    }
  }

  return missingColumns;
}

/**
 * Verify database integrity and re-run migrations if critical tables/columns are missing.
 * This handles edge cases where schema_version says migrations ran but tables/columns don't exist.
 * Also repairs corrupted schema_version entries from buggy migration version numbers.
 */
export async function verifyAndRepairMigrations(
  db: MigrationContext
): Promise<void> {
  const currentVersion = await getCurrentVersion(db);
  dbLog(
    `[MigrationRunner] Verifying migrations, current version: ${currentVersion}`
  );

  // First, clean up any invalid version entries in schema_version table
  // This handles corrupted entries from buggy migration numbering (e.g., 5, 6, 7 instead of 2, 3, 4)
  if (currentVersion > LATEST_MIGRATION_VERSION) {
    dbLog(
      `[MigrationRunner] DB version (${currentVersion}) exceeds code version (${LATEST_MIGRATION_VERSION}), repairing...`
    );

    // Delete all schema_version entries that are higher than our latest migration
    await db.execAsync(
      `DELETE FROM schema_version WHERE version > ${LATEST_MIGRATION_VERSION}`
    );

    dbLog(
      `[MigrationRunner] Cleaned up invalid schema_version entries, will re-check version`
    );
  }

  // Check all migrations up to current version - verify tables
  for (const [versionStr] of Object.entries(CRITICAL_TABLES_BY_VERSION)) {
    const version = parseInt(versionStr, 10);
    const actualVersion = await getCurrentVersion(db);
    if (version > actualVersion) continue;

    const missingTables = await verifyTablesExist(db, version);
    if (missingTables.length > 0) {
      dbLog(
        `[MigrationRunner] Missing tables for version ${version}: ${missingTables.join(', ')}`
      );
      dbLog(
        `[MigrationRunner] Rolling back schema_version to force re-migration`
      );

      // Delete the problematic version from schema_version to force re-run
      await db.execAsync(
        `DELETE FROM schema_version WHERE version >= ${version}`
      );

      // Clear localStorage to ensure migrations re-run
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_DB_VERSION);
        // Also clear session flag so migrations can run
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(SESSION_KEY_MIGRATIONS_COMPLETE);
        }
      }

      // Break to re-run migrations
      break;
    }
  }

  // Check all migrations up to current version - verify columns
  for (const [versionStr] of Object.entries(CRITICAL_COLUMNS_BY_VERSION)) {
    const version = parseInt(versionStr, 10);
    const actualVersion = await getCurrentVersion(db);
    if (version > actualVersion) continue;

    const missingColumns = await verifyColumnsExist(db, version);
    if (missingColumns.length > 0) {
      dbLog(
        `[MigrationRunner] Missing columns for version ${version}: ${missingColumns.join(', ')}`
      );
      dbLog(
        `[MigrationRunner] Rolling back schema_version to force re-migration`
      );

      // Delete the problematic version from schema_version to force re-run
      await db.execAsync(
        `DELETE FROM schema_version WHERE version >= ${version}`
      );

      // Clear localStorage to ensure migrations re-run
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_DB_VERSION);
        // Also clear session flag so migrations can run
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(SESSION_KEY_MIGRATIONS_COMPLETE);
        }
      }

      // Break to re-run migrations
      break;
    }
  }

  // After verification, sync localStorage with actual database state
  // This prevents loops where localStorage is out of sync with schema_version
  // BUT only if the DB actually has migrations (version > 0)
  // On fresh installs, we don't want to set version to 0 and trigger migration prompt loops
  const actualVersion = await getCurrentVersion(db);
  if (actualVersion > 0 && typeof localStorage !== 'undefined') {
    const storedVersion = localStorage.getItem(STORAGE_KEY_DB_VERSION);
    if (storedVersion !== String(actualVersion)) {
      dbLog(
        `[MigrationRunner] Syncing localStorage (${storedVersion}) with DB version (${actualVersion})`
      );
      localStorage.setItem(STORAGE_KEY_DB_VERSION, String(actualVersion));
    }
  }
}
