import {
  encryptBackup,
  type EncryptedBackup,
  type PlainBackup,
} from './backup-crypto';
import type { FinancialBackup } from './data/backup';

const STATUS_KEY = 'fluxby.backupHealth';
const RECOVERY_DATABASE = 'fluxby-recovery-backup';
const RECOVERY_STORE = 'snapshots';

export interface BackupHealth {
  lastDownloadStartedAt?: string;
  lastDownloadEncrypted?: boolean;
  lastVerifiedRestoreAt?: string;
}
export interface RecoverySnapshot {
  createdAt: string;
  encrypted: EncryptedBackup;
}

export function readBackupHealth(): BackupHealth {
  try {
    const value = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
    const health: BackupHealth = {};
    if (
      typeof value.lastDownloadStartedAt === 'string' &&
      Number.isFinite(Date.parse(value.lastDownloadStartedAt))
    ) {
      health.lastDownloadStartedAt = value.lastDownloadStartedAt;
      health.lastDownloadEncrypted = value.lastDownloadEncrypted === true;
    }
    if (
      typeof value.lastVerifiedRestoreAt === 'string' &&
      Number.isFinite(Date.parse(value.lastVerifiedRestoreAt))
    )
      health.lastVerifiedRestoreAt = value.lastVerifiedRestoreAt;
    return health;
  } catch {
    return {};
  }
}
export function recordBackupDownload(encrypted: boolean): BackupHealth {
  const health = {
    ...readBackupHealth(),
    lastDownloadStartedAt: new Date().toISOString(),
    lastDownloadEncrypted: encrypted,
  };
  saveHealth(health);
  return health;
}
export function recordVerifiedRestore(verifiedAt: string): BackupHealth {
  const health = { ...readBackupHealth(), lastVerifiedRestoreAt: verifiedAt };
  saveHealth(health);
  return health;
}
function saveHealth(health: BackupHealth) {
  // Metadata is advisory; restricted browser storage must not change the result
  // of an otherwise successful download/restore.
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify(health));
  } catch {
    /* no metadata persistence */
  }
}

function recoveryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RECOVERY_DATABASE, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(RECOVERY_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Recovery storage unavailable'));
    request.onblocked = () => reject(new Error('Recovery storage is blocked'));
  });
}

/** Persist only ciphertext; resolve after the transaction commits to storage. */
export async function saveRecoverySnapshot(
  backup: FinancialBackup,
  password: string
): Promise<void> {
  const encrypted = await encryptBackup(backup as PlainBackup, password);
  const db = await recoveryDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(RECOVERY_STORE, 'readwrite');
      transaction.objectStore(RECOVERY_STORE).put(
        {
          createdAt: new Date().toISOString(),
          encrypted,
        } satisfies RecoverySnapshot,
        'latest'
      );
      transaction.oncomplete = () => resolve();
      transaction.onabort = () =>
        reject(
          transaction.error || new Error('Recovery snapshot could not be saved')
        );
      transaction.onerror = () =>
        reject(
          transaction.error || new Error('Recovery snapshot could not be saved')
        );
    });
  } finally {
    db.close();
  }
}
export async function readRecoverySnapshot(): Promise<RecoverySnapshot | null> {
  const db = await recoveryDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction(RECOVERY_STORE, 'readonly')
        .objectStore(RECOVERY_STORE)
        .get('latest');
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
