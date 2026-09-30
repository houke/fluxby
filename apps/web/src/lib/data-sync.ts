import type { SyncChange, SyncableRow } from '@fluxby/core';
import type { MigrationContext } from '@fluxby/database';

type Row = Record<string, unknown> & SyncableRow & { profile_id: string };
type Column = {
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
};
export type LocalDataChange = { profileId: string | null; method?: string };
const listeners = new Set<(change: LocalDataChange) => void>();

export function notifyLocalDataChanged(
  profileId: string | null,
  method?: string
): void {
  for (const listener of listeners) {
    try {
      listener({ profileId, method });
    } catch (error) {
      console.error('Sync notification failed:', error);
    }
  }
}
export function subscribeLocalDataChanges(
  listener: (change: LocalDataChange) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify only after a successful outermost service mutation. Reads never broadcast. */
export function withDataChangeNotifications<T extends object>(
  service: T,
  getProfileId: () => string | null
): T {
  const prefixes =
    /^(create|update|delete|reset|import|apply|bulk|merge|seed|dismiss|confirm|decide|undo|restore|accept|reject|set|save|add|remove|discover|detect|recalculate|resolve|reorder|rename)/;
  let depth = 0;
  for (const key of Object.keys(service) as (keyof T)[]) {
    const original = service[key];
    if (typeof original !== 'function' || !prefixes.test(String(key))) continue;
    service[key] = async function (this: T, ...args: unknown[]) {
      depth++;
      let success = false;
      const profileId = getProfileId();
      try {
        const result = await original.apply(this, args);
        success = true;
        return result;
      } finally {
        depth--;
        if (success && depth === 0)
          notifyLocalDataChanged(profileId, String(key));
      }
    } as T[keyof T];
  }
  return service;
}

// Dependency order also prevents cross-profile references in child tables.
export const PROFILE_SYNC_TABLES = [
  'accounts',
  'categories',
  'address_book',
  'recurring_patterns',
  'name_cleanup_rules',
  'payment_provider_rules',
  'category_rules',
  'budgets',
  'imports',
  'contact_ibans',
  'transactions',
  'recurring_pattern_source_decisions',
  'subscription_dismissed_alerts',
  'savings_goals',
  'savings_contributions',
  'planning_preferences',
  'net_worth_items',
  'monthly_reviews',
  'saved_transaction_views',
] as const;
const references: Record<string, Record<string, string>> = {
  categories: { parent_id: 'categories' },
  savings_contributions: { goal_id: 'savings_goals' },
  transactions: {
    account_id: 'accounts',
    category_id: 'categories',
    address_book_id: 'address_book',
  },
  budgets: { category_id: 'categories' },
  category_rules: { category_id: 'categories' },
  contact_ibans: { contact_id: 'address_book' },
  recurring_pattern_source_decisions: { pattern_id: 'recurring_patterns' },
  subscription_dismissed_alerts: { pattern_id: 'recurring_patterns' },
};
const naturalKeys: Record<string, string[]> = {
  planning_preferences: [],
  monthly_reviews: ['month'],
  budgets: ['category_id', 'period', 'start_date', 'end_date'],
  accounts: ['iban'],
  categories: ['name', 'parent_id', 'icon'],
  address_book: ['iban', 'original_name'],
  contact_ibans: ['contact_id', 'iban'],
  name_cleanup_rules: ['pattern'],
  payment_provider_rules: ['name'],
  recurring_patterns: ['opposing_iban', 'merchant_name', 'pattern_type'],
  recurring_pattern_source_decisions: ['pattern_id', 'source_key'],
  subscription_dismissed_alerts: ['pattern_id', 'alert_type'],
};
function key(table: string, id: string): string {
  return `${table}:${id}`;
}
function scoped(table: string, alias = ''): string {
  const prefix = alias ? `${alias}.` : '';
  return table === 'contact_ibans'
    ? `${prefix}contact_id IN (SELECT id FROM address_book WHERE profile_id = ?)`
    : `${prefix}profile_id = ?`;
}
function versionWins(remote: Row, local: Row | undefined): boolean {
  return (
    !local ||
    remote.updated_at > local.updated_at ||
    (remote.updated_at === local.updated_at &&
      remote.device_id > (local.device_id || ''))
  );
}

/** Database adapter for one explicitly approved local/remote profile pair. */
export class ProfileDataSync {
  private previous = new Map<string, Row>();
  private columns = new Map<string, Column[]>();
  private ready = false;
  private serial: Promise<unknown> = Promise.resolve();
  constructor(
    private db: MigrationContext,
    readonly profileId: string,
    private deviceId: string,
    private isActive: () => boolean = () => true
  ) {}
  private assertActive(): void {
    if (!this.isActive())
      throw new Error('The paired profile is no longer active');
  }

  private exclusive<T>(work: () => Promise<T>): Promise<T> {
    const next = this.serial.then(work);
    this.serial = next.catch(() => undefined);
    return next;
  }
  private async load(): Promise<Map<string, Row>> {
    const rows = new Map<string, Row>();
    for (const table of PROFILE_SYNC_TABLES) {
      if (!this.columns.has(table)) {
        this.columns.set(
          table,
          await this.db.queryAsync<Column>(`PRAGMA table_info(${table})`)
        );
      }
      if (!this.columns.get(table)?.length) continue;
      for (const record of await this.db.queryAsync<Record<string, unknown>>(
        `SELECT * FROM ${table} WHERE ${scoped(table)}`,
        [this.profileId]
      )) {
        const row = {
          ...record,
          profile_id: this.profileId,
          updated_at: Number(
            record.updated_at || record.dismissed_at || record.created_at || 0
          ),
          is_deleted: !!record.is_deleted,
          device_id: String(record.device_id || this.deviceId),
        } as Row;
        rows.set(key(table, row.id), row);
      }
    }
    return rows;
  }
  async initialize(): Promise<void> {
    return this.exclusive(async () => {
      this.previous = await this.load();
      this.ready = true;
    });
  }
  /** Persist hard deletions and stamp local edits with their actual author. */
  async captureLocalChanges(reset = false): Promise<SyncChange[]> {
    return this.exclusive(async () => {
      const current = await this.load();
      const changes: SyncChange[] = [];
      await this.db.transactionAsync(async () => {
        if (reset) {
          await this.db.runAsync(
            'DELETE FROM sync_tombstones WHERE profile_id = ?',
            [this.profileId]
          );
          await this.db.runAsync(
            'DELETE FROM sync_row_aliases WHERE profile_id = ?',
            [this.profileId]
          );
        }
        for (const [rowKey, row] of current) {
          const old = this.previous.get(rowKey);
          if (reset || !old || JSON.stringify(old) !== JSON.stringify(row)) {
            const table = rowKey.slice(0, rowKey.indexOf(':'));
            row.device_id = this.deviceId;
            row.updated_at = Math.max(
              row.updated_at,
              (old?.updated_at || 0) + 1
            );
            await this.db.runAsync(
              `UPDATE ${table} SET updated_at = ?, device_id = ? WHERE id = ? AND ${scoped(table)}`,
              [row.updated_at, this.deviceId, row.id, this.profileId]
            );
            changes.push({ table, row });
          }
        }
        if (this.ready && !reset) {
          for (const [rowKey, old] of this.previous) {
            if (current.has(rowKey)) continue;
            const table = rowKey.slice(0, rowKey.indexOf(':'));
            const row = {
              ...old,
              is_deleted: true,
              updated_at: Math.max(Date.now(), old.updated_at + 1),
              device_id: this.deviceId,
            };
            await this.saveTombstone(table, row);
            changes.push({ table, row });
          }
        }
      });
      this.previous = current;
      this.ready = true;
      return changes;
    });
  }
  private async saveTombstone(table: string, row: Row): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO sync_tombstones (profile_id, table_name, row_id, row_data, updated_at, device_id)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id, table_name, row_id) DO UPDATE SET
      row_data = excluded.row_data, updated_at = excluded.updated_at, device_id = excluded.device_id`,
      [
        this.profileId,
        table,
        row.id,
        JSON.stringify(row),
        row.updated_at,
        row.device_id,
      ]
    );
  }
  async getChanges(): Promise<SyncChange[]> {
    return this.exclusive(async () => {
      const rows = await this.load();
      const changes: SyncChange[] = Array.from(rows, ([rowKey, row]) => ({
        table: rowKey.slice(0, rowKey.indexOf(':')),
        row,
      }));
      const deleted = await this.db.queryAsync<{
        table_name: string;
        row_data: string;
      }>(
        'SELECT table_name, row_data FROM sync_tombstones WHERE profile_id = ?',
        [this.profileId]
      );
      for (const item of deleted) {
        if (
          !(PROFILE_SYNC_TABLES as readonly string[]).includes(item.table_name)
        )
          continue;
        const row = JSON.parse(item.row_data) as Row;
        const existing = rows.get(key(item.table_name, row.id));
        if (versionWins(row, existing))
          changes.push({ table: item.table_name, row });
      }
      return changes;
    });
  }
  private validate(change: SyncChange, remoteProfileId: string): Row {
    if (
      !change ||
      !(PROFILE_SYNC_TABLES as readonly string[]).includes(change.table)
    )
      throw new Error('Unsupported sync table');
    const row = change.row as Row;
    if (
      !row ||
      typeof row !== 'object' ||
      Array.isArray(row) ||
      typeof row.id !== 'string' ||
      !row.id ||
      row.id.length > 200 ||
      typeof row.device_id !== 'string' ||
      !row.device_id ||
      row.device_id.length > 200 ||
      !Number.isSafeInteger(row.updated_at) ||
      row.updated_at < 0 ||
      row.updated_at > Date.now() + 3600000 ||
      typeof row.is_deleted !== 'boolean' ||
      row.profile_id !== remoteProfileId
    )
      throw new Error('Invalid sync row or profile');
    const columns = this.columns.get(change.table) || [];
    if (!columns.length) throw new Error('Sync schema version mismatch');
    const columnMap = new Map(columns.map((column) => [column.name, column]));
    for (const [name, value] of Object.entries(row)) {
      if (name === 'profile_id') continue;
      const column = columnMap.get(name);
      if (!column || !/^[a-z_]+$/.test(name))
        throw new Error('Unsupported sync column');
      if (value === null) {
        if (column.notnull && !row.is_deleted)
          throw new Error('Missing required sync value');
        continue;
      }
      if (name === 'is_deleted') continue;
      if (column.type.toUpperCase().includes('TEXT')) {
        if (typeof value !== 'string' || value.length > 2000000)
          throw new Error('Invalid sync text');
      } else if (typeof value !== 'number' || !Number.isFinite(value))
        throw new Error('Invalid sync number');
    }
    if (!row.is_deleted) {
      for (const column of columns) {
        if (
          column.notnull &&
          column.dflt_value === null &&
          !(column.name in row)
        )
          throw new Error('Missing required sync column');
      }
    }
    return { ...row, profile_id: this.profileId };
  }
  async applyChanges(
    changes: SyncChange[],
    remoteProfileId: string,
    remoteDeviceId: string
  ): Promise<number> {
    return this.exclusive(async () => {
      this.assertActive();
      if (
        !Array.isArray(changes) ||
        changes.length > 50000 ||
        JSON.stringify(changes).length > 32000000
      )
        throw new Error('Sync payload is too large');
      const current = await this.load();
      const incoming = changes.map((change) => ({
        table: change.table,
        row: this.validate(change, remoteProfileId),
      }));
      const bindingIdentity = `${remoteDeviceId}:${remoteProfileId}`;
      const aliases = new Map<string, string>();
      for (const alias of await this.db.queryAsync<{
        table_name: string;
        remote_id: string;
        local_id: string;
      }>(
        'SELECT table_name, remote_id, local_id FROM sync_row_aliases WHERE profile_id = ? AND remote_device_id = ?',
        [this.profileId, bindingIdentity]
      ))
        aliases.set(key(alias.table_name, alias.remote_id), alias.local_id);
      const tombstones = new Map<string, Row>();
      for (const deleted of await this.db.queryAsync<{
        table_name: string;
        row_data: string;
      }>(
        'SELECT table_name, row_data FROM sync_tombstones WHERE profile_id = ?',
        [this.profileId]
      ))
        tombstones.set(
          key(deleted.table_name, (JSON.parse(deleted.row_data) as Row).id),
          JSON.parse(deleted.row_data) as Row
        );
      let applied = 0;
      await this.db.transactionAsync(async () => {
        this.assertActive();
        for (const table of PROFILE_SYNC_TABLES) {
          const remaining = incoming.filter((change) => change.table === table);
          while (remaining.length) {
            this.assertActive();
            // Self-referencing categories must resolve parents before children.
            const index = remaining.findIndex(
              (change) =>
                !change.row.parent_id ||
                aliases.has(key(table, String(change.row.parent_id))) ||
                current.has(key(table, String(change.row.parent_id))) ||
                !remaining.some(
                  (other) => other.row.id === change.row.parent_id
                )
            );
            if (index < 0) throw new Error('Cyclic sync references');
            const { row } = remaining.splice(index, 1)[0];
            const remoteId = row.id;
            for (const [column, parent] of Object.entries(
              references[table] || {}
            )) {
              const value = row[column];
              if (value === null || value === undefined || value === '')
                continue;
              if (typeof value !== 'string')
                throw new Error('Invalid sync reference');
              row[column] = aliases.get(key(parent, value)) || value;
              if (
                !row.is_deleted &&
                !current.has(key(parent, String(row[column])))
              )
                throw new Error(
                  'Sync reference does not belong to the paired profile'
                );
            }
            let localId = aliases.get(key(table, remoteId));
            if (!localId) {
              const existing = current.get(key(table, remoteId));
              if (existing) localId = existing.id;
              const fields = naturalKeys[table];
              if (!localId && fields) {
                localId = Array.from(current.entries()).find(
                  ([rowKey, local]) =>
                    rowKey.startsWith(`${table}:`) &&
                    fields.every(
                      (field) => (local[field] ?? null) === (row[field] ?? null)
                    )
                )?.[1].id;
              }
              localId ||= remoteId;
              // IDs may never overwrite rows in an unrelated local profile.
              const elsewhere = await this.db.queryAsync<{ id: string }>(
                `SELECT id FROM ${table} WHERE id = ? AND NOT (${scoped(table)})`,
                [localId, this.profileId]
              );
              if (elsewhere.length)
                throw new Error('Sync row belongs to another local profile');
              aliases.set(key(table, remoteId), localId);
              await this.db.runAsync(
                `INSERT INTO sync_row_aliases (profile_id, remote_device_id, table_name, remote_id, local_id)
                VALUES (?, ?, ?, ?, ?) ON CONFLICT(profile_id, remote_device_id, table_name, remote_id) DO UPDATE SET local_id = excluded.local_id`,
                [this.profileId, bindingIdentity, table, remoteId, localId]
              );
            }
            row.id = localId;
            const rowKey = key(table, row.id);
            const local = current.get(rowKey);
            const tombstone = tombstones.get(rowKey);
            if (!versionWins(row, local) || !versionWins(row, tombstone))
              continue;
            if (row.is_deleted) {
              await this.saveTombstone(table, row);
              tombstones.set(rowKey, row);
              if (local) {
                await this.db.runAsync(
                  `UPDATE ${table} SET is_deleted = 1, updated_at = ?, device_id = ? WHERE id = ? AND ${scoped(table)}`,
                  [row.updated_at, row.device_id, row.id, this.profileId]
                );
                current.set(rowKey, row);
              }
            } else {
              const names = (this.columns.get(table) || [])
                .map((column) => column.name)
                .filter((name) => name in row);
              const values = names.map((name) =>
                typeof row[name] === 'boolean' ? Number(row[name]) : row[name]
              );
              await this.db.runAsync(
                `INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})
                ON CONFLICT(id) DO UPDATE SET ${names
                  .filter((name) => name !== 'id')
                  .map((name) => `${name} = excluded.${name}`)
                  .join(', ')}`,
                values
              );
              await this.db.runAsync(
                'DELETE FROM sync_tombstones WHERE profile_id = ? AND table_name = ? AND row_id = ?',
                [this.profileId, table, row.id]
              );
              current.set(rowKey, row);
            }
            applied++;
          }
        }
        this.assertActive();
      });
      this.previous = await this.load();
      this.ready = true;
      return applied;
    });
  }
}
