import type { Database } from '@fluxby/database';
import { verifyBackupChecksum, type PlainBackup } from '../backup-crypto';

export type BackupRow = Record<string, string | number | null>;
type BackupDatabase = Pick<
  Database,
  'queryAsync' | 'runAsync' | 'transactionAsync'
>;
interface Column {
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
}
interface ForeignKey {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
}

// Installation-specific transport state never travels in a financial backup.
// Domain tables are discovered from the schema, including deleted rows, so a
// newly introduced feature cannot silently disappear from backup round trips.
const LOCAL_TABLES = new Set([
  'schema_version',
  'devices',
  'sync_log',
  'sync_error_log',
  'sync_tombstones',
  'sync_row_aliases',
]);
const RESET_ON_RESTORE = new Set(['sync_tombstones', 'sync_row_aliases']);
const LEGACY_KEYS: Record<string, string> = {
  category_rules: 'categoryRules',
  address_book: 'addressBook',
  contact_ibans: 'contactIbans',
  shared_ibans: 'sharedIbans',
  shared_iban_merchants: 'sharedIbanMerchants',
  name_cleanup_rules: 'nameCleanupRules',
  payment_provider_rules: 'paymentProviderRules',
  recurring_patterns: 'recurringPatterns',
  recurring_pattern_source_decisions: 'recurringPatternSourceDecisions',
  subscription_dismissed_alerts: 'subscriptionDismissedAlerts',
};
const CORE_TABLES = [
  'users',
  'profiles',
  'accounts',
  'categories',
  'transactions',
  'budgets',
];

export interface FinancialBackup {
  version: 3;
  schemaVersion: number;
  exportedAt: string;
  tables: Record<string, BackupRow[]>;
  tableManifest: string[];
}
interface ParsedBackup extends FinancialBackup {
  legacy: boolean;
}
export interface BackupPreview {
  profiles: number;
  accounts: number;
  transactions: number;
  rows: number;
  exportedAt: string;
  legacy: boolean;
  missingTables: string[];
}
export interface RestoreBackupOptions {
  saveRecovery?: (backup: FinancialBackup) => Promise<void>;
}

export class InvalidBackupError extends Error {
  constructor() {
    super('Invalid or unsupported Fluxby backup');
    this.name = 'InvalidBackupError';
  }
}
function invalid(): never {
  throw new InvalidBackupError();
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function identifier(name: string): string {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) invalid();
  return `"${name}"`;
}
function unwrapBackup(input: unknown): unknown {
  return isRecord(input) && 'data' in input ? input.data : input;
}

/** Structural validation is shared by preview and restore, before any writes. */
export function parseFinancialBackup(input: unknown): ParsedBackup {
  const payload = unwrapBackup(input);
  if (!isRecord(payload) || ![1, 2, 3].includes(payload.version as number))
    invalid();
  if (
    typeof payload.exportedAt !== 'string' ||
    !Number.isFinite(Date.parse(payload.exportedAt))
  )
    invalid();
  const legacy = payload.version !== 3;
  if (
    !legacy &&
    (!Number.isInteger(payload.schemaVersion) ||
      Number(payload.schemaVersion) < 0)
  )
    invalid();
  const source = legacy ? payload : payload.tables;
  if (!isRecord(source)) invalid();
  const tables: Record<string, BackupRow[]> = Object.create(null);
  const entries = legacy
    ? Object.entries(source).filter(
        ([key]) =>
          !['version', 'exportedAt', 'checksum', 'schemaVersion'].includes(key)
      )
    : Object.entries(source);
  for (const [key, rows] of entries) {
    const table =
      Object.entries(LEGACY_KEYS).find(([, alias]) => alias === key)?.[0] ??
      key;
    identifier(table);
    if (LOCAL_TABLES.has(table) || !Array.isArray(rows) || table in tables)
      invalid();
    const ids = new Set<string>();
    tables[table] = rows.map((value) => {
      if (!isRecord(value)) invalid();
      const row: BackupRow = {};
      for (const [column, cell] of Object.entries(value)) {
        // Boolean flags appeared in some legacy API exports.
        if (legacy && typeof cell === 'boolean') row[column] = Number(cell);
        else if (
          cell === null ||
          typeof cell === 'string' ||
          (typeof cell === 'number' && Number.isFinite(cell))
        )
          row[column] = cell;
        else invalid();
      }
      if (
        !['string', 'number'].includes(typeof row.id) ||
        String(row.id).trim().length === 0 ||
        ids.has(String(row.id))
      )
        invalid();
      ids.add(String(row.id));
      return row;
    });
  }
  for (const table of CORE_TABLES) if (!(table in tables)) invalid();
  if (!legacy) {
    if (
      !Array.isArray(payload.tableManifest) ||
      payload.tableManifest.length !== Object.keys(tables).length
    )
      invalid();
    const manifest = new Set(payload.tableManifest);
    if (
      manifest.size !== payload.tableManifest.length ||
      Object.keys(tables).some((table) => !manifest.has(table))
    )
      invalid();
  }
  return {
    version: 3,
    schemaVersion: legacy ? 0 : Number(payload.schemaVersion),
    exportedAt: payload.exportedAt,
    tables,
    tableManifest: Object.keys(tables),
    legacy,
  };
}

export function previewFinancialBackup(input: unknown): BackupPreview {
  const backup = parseFinancialBackup(input);
  return preview(backup, []);
}
function preview(backup: ParsedBackup, missingTables: string[]): BackupPreview {
  return {
    profiles: backup.tables.profiles.length,
    accounts: backup.tables.accounts.length,
    transactions: backup.tables.transactions.length,
    rows: Object.values(backup.tables).reduce(
      (sum, rows) => sum + rows.length,
      0
    ),
    exportedAt: backup.exportedAt,
    legacy: backup.legacy,
    missingTables,
  };
}

async function tableRegistry(db: BackupDatabase) {
  const tables = await db.queryAsync<{ name: string; sql: string }>(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  return tables.filter(({ name }) => !LOCAL_TABLES.has(name));
}
async function schemaVersion(db: BackupDatabase): Promise<number> {
  const rows = await db.queryAsync<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_version'
  );
  return rows[0]?.version ?? 0;
}
async function snapshot(db: BackupDatabase): Promise<FinancialBackup> {
  const registry = await tableRegistry(db);
  const tables: Record<string, BackupRow[]> = {};
  for (const { name } of registry) {
    tables[name] = await db.queryAsync<BackupRow>(
      `SELECT * FROM ${identifier(name)} ORDER BY id`
    );
  }
  return {
    version: 3,
    schemaVersion: await schemaVersion(db),
    exportedAt: new Date().toISOString(),
    tables,
    tableManifest: registry.map(({ name }) => name),
  };
}

/** A transaction makes the multi-table export a consistent snapshot. */
export async function exportFinancialBackup(
  db: BackupDatabase
): Promise<FinancialBackup> {
  return db.transactionAsync(() => snapshot(db));
}

function validDate(value: string | number | null) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}

/** All schema, integrity, relationship and uniqueness checks are read-only. */
async function validate(db: BackupDatabase, input: unknown) {
  const backup = parseFinancialBackup(input);
  const integrity = await verifyBackupChecksum(
    unwrapBackup(input) as PlainBackup
  );
  if (!integrity.valid) invalid();
  const registry = await tableRegistry(db);
  const names = registry.map(({ name }) => name);
  const currentVersion = await schemaVersion(db);
  if (backup.schemaVersion > currentVersion) invalid();
  const missingTables = names.filter((name) => !(name in backup.tables));
  if (
    !backup.legacy &&
    backup.schemaVersion === currentVersion &&
    missingTables.length
  )
    invalid();
  for (const table of Object.keys(backup.tables))
    if (!names.includes(table)) invalid();
  const rowsByTable: Record<string, BackupRow[]> = {};
  const foreignKeys: Record<string, ForeignKey[]> = {};
  for (const { name: table, sql } of registry) {
    const columns = await db.queryAsync<Column>(
      `PRAGMA table_info(${identifier(table)})`
    );
    foreignKeys[table] = await db.queryAsync<ForeignKey>(
      `PRAGMA foreign_key_list(${identifier(table)})`
    );
    rowsByTable[table] = (backup.tables[table] ?? []).map((row) => {
      const normalized: BackupRow = {};
      for (const [key, value] of Object.entries(row)) {
        const columnName = backup.legacy
          ? key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
          : key;
        const column = columns.find(
          (candidate) => candidate.name === columnName
        );
        if (!column) {
          // Legacy API exports included derived display fields.
          if (backup.legacy) continue;
          invalid();
        }
        if (columnName in normalized) invalid();
        let cell = value;
        if (cell !== null && column.type.toUpperCase() === 'TEXT')
          cell = String(cell);
        if (cell !== null && /INT|REAL|NUM|FLOA|DOUB/i.test(column.type)) {
          if (
            backup.legacy &&
            /^(created_at|updated_at)$/.test(columnName) &&
            typeof cell === 'string' &&
            !Number.isFinite(Number(cell))
          )
            cell = Date.parse(cell);
          else if (typeof cell === 'string' && cell.trim().length === 0)
            invalid();
          else cell = typeof cell === 'number' ? cell : Number(cell);
          if (
            !Number.isFinite(cell) ||
            (/INT/i.test(column.type) && !Number.isInteger(cell))
          )
            invalid();
        }
        if ((column.notnull || column.pk) && cell === null) invalid();
        if (
          [
            'is_deleted',
            'is_active',
            'is_confirmed',
            'is_variable',
            'is_dismissed',
            'is_hidden',
            'is_primary',
          ].includes(columnName) &&
          cell !== null &&
          ![0, 1].includes(Number(cell))
        )
          invalid();
        if (
          [
            'date',
            'start_date',
            'end_date',
            'last_date',
            'next_expected_date',
          ].includes(columnName) &&
          cell !== null &&
          !validDate(cell)
        )
          invalid();
        normalized[columnName] = cell;
      }
      for (const column of columns) {
        if (
          (column.pk || (column.notnull && column.dflt_value === null)) &&
          normalized[column.name] === undefined
        )
          invalid();
      }
      for (const match of sql.matchAll(
        /([a-z][a-z0-9_]*)\s+IN\s*\((('[^']*'\s*,?\s*)+)\)/gi
      )) {
        const cell = normalized[match[1]];
        const allowed = Array.from(
          match[2].matchAll(/'([^']*)'/g),
          (entry) => entry[1]
        );
        if (
          cell !== undefined &&
          cell !== null &&
          !allowed.includes(String(cell))
        )
          invalid();
      }
      return normalized;
    });
    // Validate SQLite UNIQUE indexes before any destructive operation. SQLite
    // permits multiple NULLs, so keys containing NULL are intentionally skipped.
    const indexes = await db.queryAsync<{
      name: string;
      unique: number;
      partial: number;
    }>(`PRAGMA index_list(${identifier(table)})`);
    for (const index of indexes.filter(
      (candidate) => candidate.unique && !candidate.partial
    )) {
      const indexedColumns = await db.queryAsync<{ name: string | null }>(
        `PRAGMA index_info(${identifier(index.name)})`
      );
      if (indexedColumns.some(({ name }) => name === null)) continue;
      const seen = new Set<string>();
      for (const row of rowsByTable[table]) {
        const values = indexedColumns.map(({ name }) =>
          name === null ? undefined : row[name]
        );
        if (values.some((value) => value === null || value === undefined))
          continue;
        const key = JSON.stringify(values);
        if (seen.has(key)) invalid();
        seen.add(key);
      }
    }
  }
  for (const table of names) {
    const keys = foreignKeys[table].slice();
    if (
      table === 'transactions' &&
      !keys.some((key) => key.from === 'address_book_id')
    ) {
      keys.push({
        id: -1,
        seq: 0,
        table: 'address_book',
        from: 'address_book_id',
        to: 'id',
      });
    }
    for (const foreignKey of keys) {
      const parentRows = rowsByTable[foreignKey.table];
      if (!parentRows) continue;
      const parents = new Map(
        parentRows.map((row) => [row[foreignKey.to || 'id'], row])
      );
      for (const row of rowsByTable[table]) {
        const value = row[foreignKey.from];
        if (value === null || value === undefined) continue;
        const parent = parents.get(value);
        if (!parent) invalid();
        if (
          row.profile_id !== undefined &&
          row.profile_id !== null &&
          parent.profile_id !== undefined &&
          parent.profile_id !== null &&
          row.profile_id !== parent.profile_id
        )
          invalid();
      }
    }
  }
  return { backup, rowsByTable, names, missingTables };
}

/** Preview performs exactly the same validation used by restore. */
export async function validateFinancialBackup(
  db: BackupDatabase,
  input: unknown
): Promise<BackupPreview> {
  const { backup, missingTables } = await validate(db, input);
  return preview(backup, missingTables);
}

/** Replacement is atomic; a failed insert or integrity check rolls back. */
export async function restoreFinancialBackup(
  db: BackupDatabase,
  input: unknown,
  options: RestoreBackupOptions = {}
) {
  const { rowsByTable, names } = await validate(db, input);
  await db.transactionAsync(async () => {
    // Save outside the financial dataset so replacement cannot overwrite it.
    // A failed recovery write aborts before the first deletion.
    if (options.saveRecovery) await options.saveRecovery(await snapshot(db));
    await db.runAsync('PRAGMA defer_foreign_keys = ON');
    for (const table of names)
      await db.runAsync(`DELETE FROM ${identifier(table)}`);
    for (const table of names) {
      for (const row of rowsByTable[table]) {
        const columns = Object.keys(row);
        await db.runAsync(
          `INSERT INTO ${identifier(table)} (${columns.map(identifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
          Object.values(row)
        );
      }
    }
    const violations = await db.queryAsync('PRAGMA foreign_key_check');
    if (violations.length) invalid();
    const check = await db.queryAsync<Record<string, string>>(
      'PRAGMA integrity_check'
    );
    if (check.some((row) => Object.values(row).some((value) => value !== 'ok')))
      invalid();
    const existing = await db.queryAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    );
    for (const { name } of existing) {
      if (RESET_ON_RESTORE.has(name))
        await db.runAsync(`DELETE FROM ${identifier(name)}`);
    }
  });
  return {
    success: true,
    categoryRulesSkipped: [],
    verifiedAt: new Date().toISOString(),
  };
}
