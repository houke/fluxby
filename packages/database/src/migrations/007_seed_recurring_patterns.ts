import type { Migration, MigrationContext } from './index.js';
import { DEMO_PROFILE_ID } from '@fluxby/shared';

export const migration007: Migration = {
  version: 7,
  name: 'Seed demo recurring patterns for demo profile',
  up: async (db: MigrationContext) => {
    // Only seed demo recurring patterns if demo profile exists
    const rows = await db.queryAsync<{ id: string }>(
      'SELECT id FROM profiles WHERE id = ? LIMIT 1',
      [DEMO_PROFILE_ID]
    );

    if (!rows || rows.length === 0) return; // No demo profile present

    const patternDate = new Date();

    const patterns = [
      { merchant: 'Netflix', avg: -12.99, last: -12.99 },
      { merchant: 'Spotify', avg: -9.99, last: -9.99 },
      { merchant: 'Disney+', avg: -8.99, last: -8.99 },
      { merchant: 'KPN', avg: -52.0, last: -52.0 },
      { merchant: 'Vattenfall', avg: -120.0, last: -125.0 },
      { merchant: 'Ziggo', avg: -55.0, last: -55.0 },
      { merchant: 'Woonstad Rotterdam', avg: -850.0, last: -850.0 },
      { merchant: 'Basic-Fit', avg: -29.99, last: -29.99 },
      { merchant: 'Werkgever BV', avg: 2800.0, last: 2850.0 },
    ];

    for (const p of patterns) {
      const id = `demo_${DEMO_PROFILE_ID}_${p.merchant
        .replace(/\s+/g, '_')
        .toLowerCase()}_${Date.now()}`;
      const lastDate = new Date(patternDate);
      lastDate.setDate(3);
      lastDate.setMonth(lastDate.getMonth() - 1);
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 1);

      await db.execAsync(
        `INSERT OR IGNORE INTO recurring_patterns (
          id,
          opposing_iban,
          merchant_name,
          pattern_type,
          avg_amount,
          last_amount,
          last_date,
          next_expected_date,
          is_active,
          is_confirmed,
          is_variable,
          transaction_count,
          profile_id,
          updated_at
        ) VALUES (
          '${id}',
          NULL,
          '${p.merchant.replace("'", "''")}',
          'monthly',
          ${p.avg},
          ${p.last},
          '${lastDate.toISOString().split('T')[0]}',
          '${nextDate.toISOString().split('T')[0]}',
          1,
          1,
          0,
          12,
          '${DEMO_PROFILE_ID}',
          ${Date.now()}
        )`
      );
    }
  },

  down: async (db: MigrationContext) => {
    const merchants = [
      'Netflix',
      'Spotify',
      'Disney+',
      'KPN',
      'Vattenfall',
      'Ziggo',
      'Woonstad Rotterdam',
      'Basic-Fit',
      'Werkgever BV',
    ];

    const inList = merchants.map((m) => `'${m.replace("'", "''")}'`).join(',');

    await db.execAsync(
      `DELETE FROM recurring_patterns WHERE profile_id = '${DEMO_PROFILE_ID}' AND merchant_name IN (${inList})`
    );
  },
};
