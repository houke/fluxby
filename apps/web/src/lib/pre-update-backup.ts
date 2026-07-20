/**
 * Pre-Update Backup Helper
 *
 * Creates a backup of the current SQLite database before applying
 * a Tauri desktop app update. Keeps only the latest N backups.
 */

const BACKUP_DIR_NAME = 'pre-update-backups';
const MAX_BACKUPS = 3;

export interface PreUpdateBackupResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * Generate a safe backup filename with ISO timestamp.
 * Replaces colons with dashes for filesystem compatibility.
 */
export function makeBackupFilename(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `pre-update-backup-${ts}.db`;
}

/**
 * Create a pre-update backup of the current database.
 *
 * Reads the SQLite database bytes from AppLocalData/fluxby/fluxby.db
 * and writes them to AppLocalData/fluxby/pre-update-backups/<timestamp>.db.
 * After writing, prunes old backups so only the latest MAX_BACKUPS remain.
 *
 * This function is intended to be called only in a Tauri environment.
 */
export async function createPreUpdateBackup(): Promise<PreUpdateBackupResult> {
  try {
    const fsModule = await import('@tauri-apps/plugin-fs');
    const pathModule = await import('@tauri-apps/api/path');

    const appDir = await pathModule.appLocalDataDir();
    const fluxbyDir = await pathModule.join(appDir, 'fluxby');
    const dbPath = await pathModule.join(fluxbyDir, 'fluxby.db');

    // Check that the database file exists
    const dbExists = await fsModule.exists(dbPath);
    if (!dbExists) {
      return { success: true, path: undefined }; // nothing to back up
    }

    // Read current DB bytes
    const dbBytes = await fsModule.readFile(dbPath);
    if (!dbBytes || dbBytes.length === 0) {
      console.warn(
        'Pre-update backup: database file is empty (0 bytes), skipping backup'
      );
      return { success: false, error: 'Database file is empty (0 bytes)' };
    }

    // Ensure backup directory exists
    const backupDir = await pathModule.join(fluxbyDir, BACKUP_DIR_NAME);
    const dirExists = await fsModule.exists(backupDir);
    if (!dirExists) {
      await fsModule.mkdir(backupDir, { recursive: true });
    }

    // Write backup
    const filename = makeBackupFilename();
    const backupPath = await pathModule.join(backupDir, filename);
    await fsModule.writeFile(backupPath, dbBytes);

    // Prune old backups
    await pruneOldBackups(fsModule, pathModule, backupDir);

    return { success: true, path: backupPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Pre-update backup failed:', message);
    return { success: false, error: message };
  }
}

export interface BackupEntry {
  filename: string;
  timestamp: Date;
}

/**
 * List available pre-update backups, newest first.
 */
export async function listPreUpdateBackups(): Promise<BackupEntry[]> {
  try {
    const fsModule = await import('@tauri-apps/plugin-fs');
    const pathModule = await import('@tauri-apps/api/path');

    const appDir = await pathModule.appLocalDataDir();
    const backupDir = await pathModule.join(appDir, 'fluxby', BACKUP_DIR_NAME);

    const dirExists = await fsModule.exists(backupDir);
    if (!dirExists) return [];

    const entries = await fsModule.readDir(backupDir);
    return entries
      .filter(
        (e): e is typeof e & { name: string } =>
          typeof e.name === 'string' &&
          e.name.startsWith('pre-update-backup-') &&
          e.name.endsWith('.db')
      )
      .map((e) => {
        // filename: pre-update-backup-2026-07-20T21-57-53-679Z.db
        const raw = e.name
          .replace('pre-update-backup-', '')
          .replace('.db', '')
          // restore colons that were replaced with dashes in ISO positions
          .replace(/(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z)/, '$1:$2:$3.$4');
        return { filename: e.name, timestamp: new Date(raw) };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // newest first
  } catch {
    return [];
  }
}

/**
 * Restore a pre-update backup by overwriting the active database file.
 * The caller must relaunch the app after this returns success.
 */
export async function restoreFromBackup(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fsModule = await import('@tauri-apps/plugin-fs');
    const pathModule = await import('@tauri-apps/api/path');

    const appDir = await pathModule.appLocalDataDir();
    const fluxbyDir = await pathModule.join(appDir, 'fluxby');
    const backupPath = await pathModule.join(
      fluxbyDir,
      BACKUP_DIR_NAME,
      filename
    );
    const dbPath = await pathModule.join(fluxbyDir, 'fluxby.db');

    const backupExists = await fsModule.exists(backupPath);
    if (!backupExists) {
      return { success: false, error: 'Backup file not found' };
    }

    const backupBytes = await fsModule.readFile(backupPath);
    await fsModule.writeFile(dbPath, backupBytes);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Remove oldest backups so that at most MAX_BACKUPS remain.
 * Files are sorted alphabetically (which matches chronological order
 * because the filename includes an ISO timestamp).
 */
async function pruneOldBackups(
  fs: typeof import('@tauri-apps/plugin-fs'),
  path: typeof import('@tauri-apps/api/path'),
  backupDir: string
): Promise<void> {
  try {
    const entries = await fs.readDir(backupDir);
    const backupFiles = entries
      .filter(
        (e): e is typeof e & { name: string } =>
          typeof e.name === 'string' &&
          e.name.startsWith('pre-update-backup-') &&
          e.name.endsWith('.db')
      )
      .map((e) => e.name)
      .sort(); // alphabetical = chronological for ISO timestamps

    if (backupFiles.length <= MAX_BACKUPS) return;

    const toDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUPS);
    for (const name of toDelete) {
      const filePath = await path.join(backupDir, name);
      await fs.remove(filePath);
    }
  } catch (err) {
    // Pruning is best-effort; don't fail the whole backup
    console.warn('Failed to prune old pre-update backups:', err);
  }
}
