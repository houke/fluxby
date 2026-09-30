import type { Migration } from './index.js';
import { migration016 } from './016_financial_planning.js';

/** Keep migration 016 intact for existing databases, then retire these tables. */
export const migration017: Migration = {
  version: 17,
  name: 'Remove transaction splits, statement reconciliation and change history',
  up: async (db) => {
    await db.execAsync('DROP TABLE IF EXISTS transaction_splits');
    await db.execAsync('DROP TABLE IF EXISTS statement_reconciliations');
    await db.execAsync('DROP TABLE IF EXISTS change_history');
  },
  down: migration016.up,
};
