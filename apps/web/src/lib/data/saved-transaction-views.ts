import type { SavedTransactionView } from '@fluxby/shared';
import { validateDateOnly, type FinancialDatabase } from './financial-planning';
import { decodeTransactionView } from '../transaction-view';

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
export function createSavedTransactionViewsService(
  db: FinancialDatabase,
  currentProfileId: () => string | null
) {
  const profile = () => {
    const pid = currentProfileId();
    if (!pid) throw new Error('No active profile');
    return pid;
  };
  return {
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
  };
}
