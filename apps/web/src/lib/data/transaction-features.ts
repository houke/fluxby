import type {
  TransactionSplit,
  SavedTransactionView,
  StatementReconciliationInput,
  StatementReconciliation,
} from '@fluxby/shared';
import { moneyCents, validateDateOnly } from './financial-planning';
import { decodeTransactionView } from '../transaction-view';
import {
  captureRow,
  recordFinancialChange,
  type FinancialDatabase,
  type FinancialRow,
} from './financial-history';

export const SAVED_VIEW_FILTER_KEYS = new Set([
  'startDate',
  'endDate',
  'type',
  'categoryId',
  'categoryIds',
  'accountId',
  'search',
  'opposingAccountIbans',
  'opposingAccountName',
  'addressBookId',
  'paymentMethods',
  'paymentProviders',
]);
export function validateSavedFilters(
  input: Record<string, string>
): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid saved filters');
  if (
    Object.keys(input).length === 2 &&
    'version' in input &&
    'view' in input
  ) {
    if (!decodeTransactionView(input)) throw new Error('Invalid saved view');
    return { version: input.version, view: input.view };
  }
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (
      !SAVED_VIEW_FILTER_KEYS.has(key) ||
      typeof value !== 'string' ||
      value.length > 1000
    )
      throw new Error('Invalid saved filter');
    if (['startDate', 'endDate'].includes(key) && value)
      validateDateOnly(value);
    if (
      key === 'type' &&
      value &&
      !['all', 'income', 'expense', 'transfer'].includes(value)
    )
      throw new Error('Invalid transaction type filter');
    filters[key] = value;
  }
  if (
    filters.startDate &&
    filters.endDate &&
    filters.startDate > filters.endDate
  )
    throw new Error('Invalid filter date range');
  return filters;
}
function savedName(value: string) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 200)
    throw new Error('A view name is required');
  return value.trim();
}
export function createTransactionFeaturesService(
  db: FinancialDatabase,
  currentProfileId: () => string | null
) {
  const profile = () => {
    const pid = currentProfileId();
    if (!pid) throw new Error('No active profile');
    return pid;
  };
  return {
    async getTransactionSplits(
      transactionId: string
    ): Promise<TransactionSplit[]> {
      const pid = currentProfileId();
      if (!pid) return [];
      return db.queryAsync<TransactionSplit>(
        `SELECT s.id,s.transaction_id AS transactionId,s.category_id AS categoryId,s.amount
        FROM transaction_splits s JOIN transactions t ON t.id=s.transaction_id AND t.profile_id=s.profile_id
        WHERE s.transaction_id=? AND s.profile_id=? AND s.is_deleted=0 AND t.is_deleted=0 ORDER BY s.created_at,s.id`,
        [transactionId, pid]
      );
    },
    async setTransactionSplits(
      transactionId: string,
      splits: { categoryId: string; amount: number }[]
    ): Promise<void> {
      if (!Array.isArray(splits) || splits.length > 50)
        throw new Error('Invalid transaction splits');
      for (const split of splits)
        if (!split.categoryId || moneyCents(split.amount) <= 0)
          throw new Error('A category and positive amount are required');
      if (
        new Set(splits.map((split) => split.categoryId)).size !== splits.length
      )
        throw new Error('Use each split category once');
      const pid = profile();
      await db.transactionAsync(async () => {
        const transaction = await db.queryOneAsync<FinancialRow>(
          'SELECT * FROM transactions WHERE id=? AND profile_id=? AND is_deleted=0',
          [transactionId, pid]
        );
        if (!transaction) throw new Error('Transaction not found');
        if (transaction.type === 'transfer')
          throw new Error(
            'Transfers cannot be split across spending categories'
          );
        if (
          splits.length &&
          splits.reduce((sum, split) => sum + moneyCents(split.amount), 0) !==
            moneyCents(Math.abs(Number(transaction.amount)))
        )
          throw new Error('Split amounts must equal the transaction amount');
        const categories = await db.queryAsync<{ id: string }>(
          'SELECT id FROM categories WHERE profile_id=? AND is_deleted=0',
          [pid]
        );
        const ids = new Set(categories.map((category) => category.id));
        if (splits.some((split) => !ids.has(split.categoryId)))
          throw new Error('Split category does not belong to this profile');
        const existing = await db.queryAsync<{ id: string }>(
          'SELECT id FROM transaction_splits WHERE transaction_id=? AND profile_id=?',
          [transactionId, pid]
        );
        const newIds = splits.map(() => crypto.randomUUID());
        const allIds = [...existing.map((row) => row.id), ...newIds];
        const before = await Promise.all(
          allIds.map((id) => captureRow(db, pid, 'transaction_splits', id))
        );
        const now = Date.now();
        await db.runAsync(
          'UPDATE transaction_splits SET is_deleted=1,updated_at=? WHERE transaction_id=? AND profile_id=?',
          [now, transactionId, pid]
        );
        for (const [index, split] of splits.entries())
          await db.runAsync(
            'INSERT INTO transaction_splits(id,transaction_id,category_id,amount,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
            [
              newIds[index],
              transactionId,
              split.categoryId,
              moneyCents(split.amount) / 100,
              pid,
              now,
              now,
            ]
          );
        const after = await Promise.all(
          allIds.map((id) => captureRow(db, pid, 'transaction_splits', id))
        );
        await recordFinancialChange(
          db,
          pid,
          'transaction_splits',
          transactionId,
          'update',
          before,
          after,
          String(transaction.merchant_name ?? transaction.description ?? '')
        );
      });
    },
    async getSavedViews(): Promise<SavedTransactionView[]> {
      const pid = currentProfileId();
      if (!pid) return [];
      const rows = await db.queryAsync<{
        id: string;
        name: string;
        filters_json: string;
        version: number;
      }>(
        'SELECT id,name,filters_json,version FROM saved_transaction_views WHERE profile_id=? AND is_deleted=0 ORDER BY name',
        [pid]
      );
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        filters: validateSavedFilters(JSON.parse(row.filters_json)),
        version: row.version,
      }));
    },
    async createSavedView(input: {
      name: string;
      filters: Record<string, string>;
    }): Promise<SavedTransactionView> {
      const pid = profile(),
        id = crypto.randomUUID(),
        now = Date.now(),
        view = {
          id,
          name: savedName(input.name),
          filters: validateSavedFilters(input.filters),
          version: 1,
        };
      await db.runAsync(
        'INSERT INTO saved_transaction_views(id,name,filters_json,version,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
        [
          id,
          view.name,
          JSON.stringify(view.filters),
          view.version,
          pid,
          now,
          now,
        ]
      );
      return view;
    },
    async deleteSavedView(id: string): Promise<void> {
      await db.runAsync(
        'UPDATE saved_transaction_views SET is_deleted=1,updated_at=? WHERE id=? AND profile_id=?',
        [Date.now(), id, profile()]
      );
    },
    async reconcileStatement(
      input: StatementReconciliationInput
    ): Promise<StatementReconciliation> {
      validateDateOnly(input.startDate);
      validateDateOnly(input.endDate);
      if (input.startDate > input.endDate)
        throw new Error('Invalid statement date range');
      const opening = moneyCents(input.openingBalance, true),
        closing = moneyCents(input.closingBalance, true),
        pid = profile(),
        id = crypto.randomUUID(),
        now = Date.now();
      return db.transactionAsync(async () => {
        const account = await db.queryOneAsync(
          'SELECT id FROM accounts WHERE id=? AND profile_id=? AND is_deleted=0',
          [input.accountId, pid]
        );
        if (!account)
          throw new Error('Statement account does not belong to this profile');
        // Sum each original transaction exactly once, including own transfers.
        const transactions = await db.queryAsync<{ amount: number }>(
          'SELECT amount FROM transactions WHERE account_id=? AND profile_id=? AND is_deleted=0 AND date>=? AND date<=?',
          [input.accountId, pid, input.startDate, input.endDate]
        );
        const expected =
            opening +
            transactions.reduce(
              (sum, transaction) => sum + moneyCents(transaction.amount, true),
              0
            ),
          difference = closing - expected;
        const result: StatementReconciliation = {
          id,
          accountId: input.accountId,
          startDate: input.startDate,
          endDate: input.endDate,
          expectedClosingBalance: expected / 100,
          actualClosingBalance: closing / 100,
          difference: difference / 100,
          transactionCount: transactions.length,
          status: difference === 0 ? 'matched' : 'difference',
        };
        await db.runAsync(
          'INSERT INTO statement_reconciliations(id,account_id,start_date,end_date,opening_balance,actual_closing_balance,expected_closing_balance,difference,transaction_count,status,profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [
            id,
            input.accountId,
            input.startDate,
            input.endDate,
            opening / 100,
            closing / 100,
            expected / 100,
            difference / 100,
            transactions.length,
            result.status,
            pid,
            now,
            now,
          ]
        );
        return result;
      });
    },
    async getReconciliations(
      accountId?: string
    ): Promise<StatementReconciliation[]> {
      const pid = currentProfileId();
      if (!pid) return [];
      return db.queryAsync<StatementReconciliation>(
        `SELECT id,account_id AS accountId,start_date AS startDate,end_date AS endDate,actual_closing_balance AS actualClosingBalance,expected_closing_balance AS expectedClosingBalance,difference,transaction_count AS transactionCount,status
        FROM statement_reconciliations WHERE profile_id=? AND is_deleted=0 ${accountId ? 'AND account_id=?' : ''} ORDER BY created_at DESC,id DESC`,
        accountId ? [pid, accountId] : [pid]
      );
    },
  };
}
