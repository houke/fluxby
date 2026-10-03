import type { FinancialDatabase } from './financial-planning';
import { exportFinancialBackup } from './backup';
import type {
  ImportColumnMapping,
  ImportOptions,
} from '../importers/import-options';

export interface ImportProfile {
  id: string;
  name: string;
  headerSignature: string;
  settings: {
    mapping: ImportColumnMapping;
    options: ImportOptions;
    bank: string;
  };
}
interface CandidateTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
}
interface ImportAccountBaseline {
  balance?: number;
  sum?: number;
  committedBalance?: number;
  statementBalance?: boolean;
}
interface StoredImportBatch {
  id: string;
  created_at: number;
  account_baselines_json: string;
}
export function merchantSimilarity(a: string, b: string) {
  const tokens = (value: string) =>
    new Set(
      value
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 1)
    );
  const x = tokens(a),
    y = tokens(b);
  if (!x.size || !y.size) return 0;
  return (
    [...x].filter((token) => y.has(token)).length / Math.max(x.size, y.size)
  );
}
export function createImportToolsService(
  db: FinancialDatabase,
  currentProfileId: () => string | null
) {
  const profile = () => {
    const pid = currentProfileId();
    if (!pid) throw new Error('No active profile');
    return pid;
  };
  return {
    async getImportProfiles(): Promise<ImportProfile[]> {
      const rows = await db.queryAsync<{
        id: string;
        name: string;
        header_signature: string;
        settings_json: string;
      }>(
        'SELECT id,name,header_signature,settings_json FROM import_profiles WHERE profile_id=? AND is_deleted=0 ORDER BY name',
        [profile()]
      );
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        headerSignature: row.header_signature,
        settings: JSON.parse(row.settings_json),
      }));
    },
    async saveImportProfile(
      input: Omit<ImportProfile, 'id'> & { id?: string }
    ) {
      if (!input.name.trim() || input.name.length > 120)
        throw new Error('Invalid profile name');
      const pid = profile(),
        now = Date.now(),
        id = input.id ?? crypto.randomUUID();
      await db.runAsync(
        `INSERT INTO import_profiles(id,name,header_signature,settings_json,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,header_signature=excluded.header_signature,settings_json=excluded.settings_json,updated_at=excluded.updated_at WHERE import_profiles.profile_id=excluded.profile_id`,
        [
          id,
          input.name.trim(),
          input.headerSignature,
          JSON.stringify(input.settings),
          pid,
          now,
          now,
        ]
      );
      return id;
    },
    async createImportRecoverySnapshot(
      filename: string,
      expectedProfileId?: string
    ) {
      const pid = profile(),
        id = crypto.randomUUID(),
        now = Date.now();
      if (expectedProfileId && pid !== expectedProfileId)
        throw new Error('importProfileChanged');
      const backup = await exportFinancialBackup(db);
      await db.transactionAsync(async () => {
        await db.runAsync(
          'INSERT INTO import_recovery_snapshots(id,filename,backup_json,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?)',
          [id, filename, JSON.stringify(backup), pid, now, now]
        );
        await db.runAsync(
          'DELETE FROM import_recovery_snapshots WHERE profile_id=? AND id NOT IN (SELECT id FROM import_recovery_snapshots WHERE profile_id=? ORDER BY created_at DESC,id DESC LIMIT 3)',
          [pid, pid]
        );
      });
      return id;
    },
    async getImportRecoverySnapshots() {
      return db.queryAsync<{ id: string; filename: string; createdAt: number }>(
        'SELECT id,filename,created_at AS createdAt FROM import_recovery_snapshots WHERE profile_id=? ORDER BY created_at DESC',
        [profile()]
      );
    },
    async getImportRecoverySnapshot(id: string) {
      const row = await db.queryOneAsync<{ backup_json: string }>(
        'SELECT backup_json FROM import_recovery_snapshots WHERE id=? AND profile_id=?',
        [id, profile()]
      );
      if (!row) throw new Error('Snapshot unavailable');
      return JSON.parse(row.backup_json);
    },
    async recordImportBatch(
      filename: string,
      importId: string,
      transactionIds: string[],
      recoveryId?: string,
      expectedProfileId?: string
    ) {
      const pid = expectedProfileId ?? profile(),
        id = crypto.randomUUID();
      // Completion belongs to the profile captured by the import, even if
      // the UI switched after the final transaction commit.
      const previous = await db.queryOneAsync<{ latest: number | null }>(
        'SELECT MAX(created_at) AS latest FROM import_batches WHERE profile_id=?',
        [pid]
      );
      // Imports can finish in the same millisecond; preserve their actual order.
      const now = Math.max(Date.now(), (previous?.latest ?? 0) + 1);
      const baselines: Record<string, ImportAccountBaseline> = {};
      if (recoveryId) {
        const snapshot = await db.queryOneAsync<{ backup_json: string }>(
          'SELECT backup_json FROM import_recovery_snapshots WHERE id=? AND profile_id=?',
          [recoveryId, pid]
        );
        if (!snapshot) throw new Error('Snapshot unavailable');
        const backup = JSON.parse(snapshot.backup_json) as {
          tables: {
            accounts: Array<{
              id: string;
              profile_id: string;
              current_balance: number;
              is_deleted: number;
            }>;
            transactions: Array<{
              account_id: string;
              amount: number;
              is_deleted: number;
            }>;
          };
        };
        for (const account of backup.tables.accounts)
          if (account.profile_id === pid && !account.is_deleted)
            baselines[account.id] = {
              balance: account.current_balance ?? 0,
              sum: 0,
            };
        for (const tx of backup.tables.transactions)
          if (!tx.is_deleted && baselines[tx.account_id])
            baselines[tx.account_id].sum =
              (baselines[tx.account_id].sum ?? 0) + tx.amount;
      }
      const accounts = await db.queryAsync<{
        id: string;
        current_balance: number;
      }>(
        'SELECT id,current_balance FROM accounts WHERE profile_id=? AND is_deleted=0',
        [pid]
      );
      for (const account of accounts)
        baselines[account.id] = {
          ...baselines[account.id],
          committedBalance: account.current_balance ?? 0,
        };
      const importedAccounts = await db.queryAsync<{
        account_id: string;
        statement_balance: number;
      }>(
        'SELECT account_id,MAX(balance_after IS NOT NULL) AS statement_balance FROM transactions WHERE profile_id=? AND id IN (SELECT value FROM json_each(?)) GROUP BY account_id',
        [pid, JSON.stringify(transactionIds)]
      );
      for (const account of importedAccounts)
        baselines[account.account_id].statementBalance = Boolean(
          account.statement_balance
        );
      // Membership comes from IDs actually committed by this import, never from time windows.
      await db.runAsync(
        "INSERT INTO import_batches(id,import_id,filename,transaction_ids_json,account_baselines_json,status,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,'completed',?,?,?)",
        [
          id,
          importId,
          filename,
          JSON.stringify(transactionIds),
          JSON.stringify(baselines),
          pid,
          now,
          now,
        ]
      );
      return id;
    },
    async getImportBatches() {
      const rows = await db.queryAsync<{
        id: string;
        filename: string;
        createdAt: number;
        transaction_ids_json: string;
      }>(
        "SELECT id,filename,created_at AS createdAt,transaction_ids_json FROM import_batches WHERE profile_id=? AND is_deleted=0 AND status='completed' ORDER BY created_at DESC",
        [profile()]
      );
      return rows.map(({ transaction_ids_json, ...row }) => ({
        ...row,
        count: (JSON.parse(transaction_ids_json) as string[]).length,
      }));
    },
    async undoImportBatch(id: string) {
      const pid = profile(),
        now = Date.now();
      return db.transactionAsync(async () => {
        const batch = await db.queryOneAsync<{
          transaction_ids_json: string;
          created_at: number;
          import_id: string;
          account_baselines_json: string;
        }>(
          "SELECT transaction_ids_json,account_baselines_json,created_at,import_id FROM import_batches WHERE id=? AND profile_id=? AND is_deleted=0 AND status='completed'",
          [id, pid]
        );
        if (!batch) throw new Error('Batch unavailable');
        const ids = JSON.parse(batch.transaction_ids_json) as string[];
        const baselines = JSON.parse(batch.account_baselines_json) as Record<
          string,
          ImportAccountBaseline
        >;
        const laterBatches = await db.queryAsync<StoredImportBatch>(
          "SELECT id,created_at,account_baselines_json FROM import_batches WHERE profile_id=? AND is_deleted=0 AND status='completed' AND created_at>? ORDER BY created_at,id",
          [pid, batch.created_at]
        );
        const laterAnchors = laterBatches.map((later) => ({
          ...later,
          baselines: JSON.parse(later.account_baselines_json) as Record<
            string,
            ImportAccountBaseline
          >,
        }));
        let removed = 0;
        const accounts = new Map<string, number>();
        const statementAccounts = new Set<string>();
        for (const txId of ids) {
          const row = await db.queryOneAsync<{
            account_id: string;
            amount: number;
            updated_at: number;
            balance_after: number | null;
          }>(
            'SELECT account_id,amount,updated_at,balance_after FROM transactions WHERE id=? AND profile_id=? AND is_deleted=0',
            [txId, pid]
          );
          if (!row) continue;
          // Later edits or sync changes must not silently disappear during batch undo.
          if (row.updated_at > batch.created_at)
            throw new Error('importBatchChanged');
          if (row.balance_after !== null) statementAccounts.add(row.account_id);
          accounts.set(
            row.account_id,
            (accounts.get(row.account_id) ?? 0) + row.amount
          );
          await db.runAsync(
            'UPDATE transactions SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
            [now, txId, pid]
          );
          removed++;
        }
        for (const [accountId, total] of accounts) {
          // Bank-provided statement anchors are authoritative at their dates.
          // Require the later anchor to be undone first rather than rebasing
          // a historical statement across another surviving bank balance.
          if (
            statementAccounts.has(accountId) &&
            laterAnchors.some(
              (later) => later.baselines[accountId]?.statementBalance
            )
          )
            throw new Error('importBatchBalanceAnchor');
          const account = await db.queryOneAsync<{
            current_balance: number;
            updated_at: number;
          }>(
            'SELECT current_balance,updated_at FROM accounts WHERE id=? AND profile_id=? AND is_deleted=0',
            [accountId, pid]
          );
          if (!account) throw new Error('importBatchChanged');
          const sameBalance = (a: number, b: number) =>
            Math.round(a * 100) === Math.round(b * 100);
          let expectedBalance = baselines[accountId]?.committedBalance;
          for (const later of laterAnchors) {
            const anchor = later.baselines[accountId];
            if (!anchor || anchor.committedBalance === undefined) continue;
            // A manual balance correction between imports must not be erased
            // simply because another statement was imported afterwards.
            if (
              expectedBalance !== undefined &&
              anchor.balance !== undefined &&
              !sameBalance(expectedBalance, anchor.balance)
            )
              throw new Error('importBatchChanged');
            expectedBalance = anchor.committedBalance;
          }
          if (
            expectedBalance === undefined
              ? account.updated_at > batch.created_at
              : !sameBalance(account.current_balance, expectedBalance)
          )
            throw new Error('importBatchChanged');
          const latest = await db.queryOneAsync<{
            balance_after: number;
            date: string;
            id: string;
            created_at: number;
          }>(
            'SELECT balance_after,date,id,created_at FROM transactions WHERE account_id=? AND profile_id=? AND is_deleted=0 AND balance_after IS NOT NULL ORDER BY date DESC,created_at DESC,id DESC LIMIT 1',
            [accountId, pid]
          );
          const baseline = baselines[accountId];
          if (
            baseline?.balance !== undefined &&
            baseline.sum !== undefined &&
            (!latest || latest.created_at <= batch.created_at)
          ) {
            const remaining = await db.queryOneAsync<{ total: number }>(
              'SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE account_id=? AND profile_id=? AND is_deleted=0',
              [accountId, pid]
            );
            await db.runAsync(
              'UPDATE accounts SET current_balance=?,updated_at=? WHERE id=? AND profile_id=?',
              [
                Math.round(
                  (baseline.balance + (remaining?.total ?? 0) - baseline.sum) *
                    100
                ) / 100,
                now,
                accountId,
                pid,
              ]
            );
          } else if (latest) {
            const subsequent = await db.queryOneAsync<{ amount: number }>(
              'SELECT COALESCE(SUM(amount),0) AS amount FROM transactions WHERE account_id=? AND profile_id=? AND is_deleted=0 AND date>?',
              [accountId, pid, latest.date]
            );
            await db.runAsync(
              'UPDATE accounts SET current_balance=?,updated_at=? WHERE id=? AND profile_id=?',
              [
                Math.round(
                  (latest.balance_after + (subsequent?.amount ?? 0)) * 100
                ) / 100,
                now,
                accountId,
                pid,
              ]
            );
          } else
            await db.runAsync(
              'UPDATE accounts SET current_balance=ROUND(current_balance-?,2),updated_at=? WHERE id=? AND profile_id=?',
              [total, now, accountId, pid]
            );
          const updated = await db.queryOneAsync<{ current_balance: number }>(
            'SELECT current_balance FROM accounts WHERE id=? AND profile_id=?',
            [accountId, pid]
          );
          const balanceChange =
            (updated?.current_balance ?? account.current_balance) -
            account.current_balance;
          // Later imports survive this undo. Rebase their before/after anchors
          // so they can themselves be undone safely in either order.
          for (const later of laterAnchors) {
            const anchor = later.baselines[accountId];
            if (!anchor) continue;
            if (anchor.balance !== undefined)
              anchor.balance =
                Math.round((anchor.balance + balanceChange) * 100) / 100;
            if (anchor.sum !== undefined)
              anchor.sum = Math.round((anchor.sum - total) * 100) / 100;
            if (anchor.committedBalance !== undefined)
              anchor.committedBalance =
                Math.round((anchor.committedBalance + balanceChange) * 100) /
                100;
          }
        }
        for (const later of laterAnchors)
          await db.runAsync(
            'UPDATE import_batches SET account_baselines_json=?,updated_at=? WHERE id=? AND profile_id=?',
            [JSON.stringify(later.baselines), now, later.id, pid]
          );
        await db.runAsync(
          "UPDATE import_batches SET status='undone',updated_at=? WHERE id=? AND profile_id=?",
          [now, id, pid]
        );
        await db.runAsync(
          'UPDATE imports SET transaction_count=0,updated_at=? WHERE id=? AND profile_id=?',
          [now, batch.import_id, pid]
        );
        return removed;
      });
    },
    async getAccountImportFreshness() {
      return db.queryAsync<{
        id: string;
        name: string;
        lastImportedAt: number | null;
        newestTransactionDate: string | null;
      }>(
        `SELECT a.id,a.name,MAX(CASE WHEN t.import_hash IS NOT NULL THEN t.created_at END) AS lastImportedAt,MAX(CASE WHEN t.import_hash IS NOT NULL THEN t.date END) AS newestTransactionDate FROM accounts a LEFT JOIN transactions t ON t.account_id=a.id AND t.profile_id=a.profile_id AND t.is_deleted=0 WHERE a.profile_id=? AND a.is_deleted=0 GROUP BY a.id ORDER BY a.name`,
        [profile()]
      );
    },
    async findLocalDuplicateCandidates() {
      const pid = profile();
      const rows = await db.queryAsync<{
        id1: string;
        date1: string;
        amount1: number;
        desc1: string;
        id2: string;
        date2: string;
        amount2: number;
        desc2: string;
      }>(
        `SELECT a.id AS id1,a.date AS date1,a.amount AS amount1,COALESCE(a.merchant_name,a.description,'') AS desc1,b.id AS id2,b.date AS date2,b.amount AS amount2,COALESCE(b.merchant_name,b.description,'') AS desc2 FROM transactions a JOIN transactions b ON a.id<b.id AND a.account_id=b.account_id AND a.profile_id=b.profile_id AND ROUND(a.amount*100)=ROUND(b.amount*100) AND ABS(julianday(a.date)-julianday(b.date))<=3 WHERE a.profile_id=? AND a.is_deleted=0 AND b.is_deleted=0 ORDER BY a.date DESC LIMIT 1000`,
        [pid]
      );
      return rows
        .map((row) => ({
          tx1: {
            id: row.id1,
            date: row.date1,
            amount: row.amount1,
            description: row.desc1,
          } as CandidateTransaction,
          tx2: {
            id: row.id2,
            date: row.date2,
            amount: row.amount2,
            description: row.desc2,
          } as CandidateTransaction,
          probability: merchantSimilarity(row.desc1, row.desc2),
        }))
        .filter((pair) => pair.probability >= 0.6)
        .slice(0, 100);
    },
  };
}
