import type { Migration } from './index.js';

/** manual_source=1 is written only by the expense-only mark-as-bill action. */
export const migration022: Migration = {
  version: 22,
  name: 'Repair expense signs on manual recurring bills',
  up: async (db) => {
    await db.runAsync(
      `UPDATE recurring_patterns
       SET avg_amount=-ABS(avg_amount),last_amount=-ABS(last_amount),
           updated_at=MAX(COALESCE(updated_at,0),?)
       WHERE manual_source=1 AND (avg_amount>0 OR last_amount>0)`,
      [Date.now()]
    );
  },
  // Restoring the known-invalid signs would change the meaning of user bills.
  down: async () => undefined,
};
