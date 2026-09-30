import type { Database } from '@fluxby/database';
import type { FinancialChange } from '@fluxby/shared';

export type FinancialDatabase = Pick<
  Database,
  'queryAsync' | 'queryOneAsync' | 'runAsync' | 'transactionAsync'
>;
export type FinancialRow = Record<string, string | number | null>;
export interface RowSnapshot {
  table: string;
  id: string;
  row: FinancialRow | null;
}
const HISTORY_TABLES = new Set([
  'transactions',
  'budgets',
  'savings_goals',
  'savings_contributions',
  'net_worth_items',
  'planning_preferences',
  'monthly_reviews',
  'transaction_splits',
]);
function tableName(table: string): string {
  if (!HISTORY_TABLES.has(table)) throw new Error('Unsupported history entity');
  return `"${table}"`;
}
function sameRow(left: FinancialRow | null, right: FinancialRow | null) {
  if (!left || !right) return left === right;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  // Sync can stamp author/version metadata after recording this local edit.
  // Undo is guarded by financial content; transport stamps aren't user edits.
  return [...keys]
    .filter((key) => !['updated_at', 'device_id'].includes(key))
    .every((key) => left[key] === right[key]);
}
export async function captureRow(
  db: FinancialDatabase,
  profileId: string,
  table: string,
  id: string
): Promise<RowSnapshot> {
  const row = await db.queryOneAsync<FinancialRow>(
    `SELECT * FROM ${tableName(table)} WHERE id = ? AND profile_id = ?`,
    [id, profileId]
  );
  return {
    table,
    id,
    row: row && row.id === id ? row : null,
  };
}
export async function recordFinancialChange(
  db: FinancialDatabase,
  profileId: string,
  entityType: string,
  entityId: string,
  action: string,
  before: RowSnapshot[],
  after: RowSnapshot[],
  description = ''
) {
  if (
    !before.some(
      (snapshot, index) => !sameRow(snapshot.row, after[index]?.row ?? null)
    ) &&
    before.length === after.length
  )
    return;
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO change_history(id,entity_type,entity_id,action,description,before_json,after_json,profile_id,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)`,
    [
      crypto.randomUUID(),
      entityType,
      entityId,
      action,
      description,
      JSON.stringify(before),
      JSON.stringify(after),
      profileId,
      now,
      now,
    ]
  );
}
export async function trackedMutation<T>(
  db: FinancialDatabase,
  profileId: string,
  table: string,
  id: string,
  action: string,
  operation: () => Promise<T>,
  description = ''
): Promise<T> {
  return db.transactionAsync(async () => {
    const before = await captureRow(db, profileId, table, id);
    const result = await operation();
    const after = await captureRow(db, profileId, table, id);
    await recordFinancialChange(
      db,
      profileId,
      table,
      id,
      action,
      [before],
      [after],
      description
    );
    return result;
  });
}
interface HistoryRow {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  before_json: string;
  after_json: string;
  undone_at: number | null;
  created_at: number;
}
function readSnapshots(serialized: string): RowSnapshot[] {
  const value: unknown = JSON.parse(serialized);
  if (
    !Array.isArray(value) ||
    !value.every(
      (snapshot) =>
        snapshot &&
        typeof snapshot.table === 'string' &&
        HISTORY_TABLES.has(snapshot.table) &&
        typeof snapshot.id === 'string' &&
        (snapshot.row === null ||
          (typeof snapshot.row === 'object' && snapshot.row !== null))
    )
  )
    throw new Error('Invalid change history');
  return value;
}
async function canUndo(
  db: FinancialDatabase,
  profileId: string,
  history: HistoryRow
) {
  if (history.undone_at) return false;
  try {
    for (const snapshot of readSnapshots(history.after_json)) {
      if (
        !sameRow(
          (await captureRow(db, profileId, snapshot.table, snapshot.id)).row,
          snapshot.row
        )
      )
        return false;
    }
    return true;
  } catch {
    return false;
  }
}
export function createFinancialHistoryService(
  db: FinancialDatabase,
  currentProfileId: () => string | null
) {
  const profile = () => {
    const id = currentProfileId();
    if (!id) throw new Error('No active profile');
    return id;
  };
  return {
    async getChangeHistory(): Promise<FinancialChange[]> {
      const pid = currentProfileId();
      if (!pid) return [];
      const rows = await db.queryAsync<HistoryRow>(
        'SELECT * FROM change_history WHERE profile_id = ? AND is_deleted = 0 ORDER BY created_at DESC, id DESC LIMIT 100',
        [pid]
      );
      const result: FinancialChange[] = [];
      for (const row of rows)
        result.push({
          id: row.id,
          entityType: row.entity_type,
          entityId: row.entity_id,
          action: row.action,
          description: row.description,
          createdAt: new Date(row.created_at).toISOString(),
          canUndo: await canUndo(db, pid, row),
        });
      return result;
    },
    async undoChange(id: string): Promise<void> {
      const pid = profile();
      await db.transactionAsync(async () => {
        const history = await db.queryOneAsync<HistoryRow>(
          'SELECT * FROM change_history WHERE id = ? AND profile_id = ? AND is_deleted = 0',
          [id, pid]
        );
        if (!history || !(await canUndo(db, pid, history)))
          throw new Error(
            'This change cannot be undone because the data has changed'
          );
        const before = readSnapshots(history.before_json);
        const after = readSnapshots(history.after_json);
        const previous = new Map(
          before.map((snapshot) => [
            `${snapshot.table}:${snapshot.id}`,
            snapshot,
          ])
        );
        const now = Date.now();
        const accountIds = new Set<string>();
        for (const snapshot of after) {
          const original = previous.get(
            `${snapshot.table}:${snapshot.id}`
          )?.row;
          if (snapshot.table === 'transactions') {
            const accountId = original?.account_id ?? snapshot.row?.account_id;
            if (typeof accountId === 'string') accountIds.add(accountId);
          }
          if (!original) {
            await db.runAsync(
              `UPDATE ${tableName(snapshot.table)} SET is_deleted = 1, updated_at = ? WHERE id = ? AND profile_id = ?`,
              [now, snapshot.id, pid]
            );
          } else {
            const columns = Object.keys(original).filter(
              (column) => !['id', 'profile_id', 'updated_at'].includes(column)
            );
            // Only raw database columns from our own recorded snapshots enter
            // this query; still constrain identifiers before interpolation.
            if (columns.some((column) => !/^[a-z][a-z0-9_]*$/.test(column)))
              throw new Error('Invalid change history');
            await db.runAsync(
              `UPDATE ${tableName(snapshot.table)} SET ${columns.map((column) => `"${column}" = ?`).join(', ')}, updated_at = ? WHERE id = ? AND profile_id = ?`,
              [
                ...columns.map((column) => original[column]),
                now,
                snapshot.id,
                pid,
              ]
            );
          }
        }
        for (const accountId of accountIds) {
          const balance = await db.queryOneAsync<{ balance: number }>(
            `SELECT COALESCE((SELECT balance_after FROM transactions WHERE account_id=? AND profile_id=? AND is_deleted=0 AND balance_after IS NOT NULL ORDER BY date DESC,created_at DESC LIMIT 1), SUM(amount),0) AS balance FROM transactions WHERE account_id=? AND profile_id=? AND is_deleted=0`,
            [accountId, pid, accountId, pid]
          );
          await db.runAsync(
            'UPDATE accounts SET current_balance=?,updated_at=? WHERE id=? AND profile_id=?',
            [balance?.balance ?? 0, now, accountId, pid]
          );
        }
        await db.runAsync(
          'UPDATE change_history SET undone_at=?,updated_at=? WHERE id=? AND profile_id=?',
          [now, now, id, pid]
        );
      });
    },
  };
}
