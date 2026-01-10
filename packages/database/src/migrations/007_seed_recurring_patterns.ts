import type { Migration, MigrationContext } from './index.js';
import { DEMO_PROFILE_ID, DEMO_RECURRING_PATTERNS } from '@fluxby/shared';

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
    const now = Date.now();

    for (const p of DEMO_RECURRING_PATTERNS) {
      const id = `demo_${DEMO_PROFILE_ID}_${p.merchantName
        .replace(/\s+/g, '_')
        .toLowerCase()}_${now}`;

      const lastDate = new Date(patternDate);
      lastDate.setDate(3);
      lastDate.setMonth(lastDate.getMonth() - 1);
      const lastDateStr = lastDate.toISOString().split('T')[0];

      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      await db.runAsync(
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          null,
          p.merchantName,
          p.patternType,
          p.avgAmount,
          p.lastAmount,
          lastDateStr,
          nextDateStr,
          1,
          p.isConfirmed ? 1 : 0,
          p.isVariable ? 1 : 0,
          p.transactionCount,
          DEMO_PROFILE_ID,
          now,
        ]
      );
    }
  },

  down: async (db: MigrationContext) => {
    const merchants = DEMO_RECURRING_PATTERNS.map((p) => p.merchantName);
    const placeholders = merchants.map(() => '?').join(',');

    await db.runAsync(
      `DELETE FROM recurring_patterns WHERE profile_id = ? AND merchant_name IN (${placeholders})`,
      [DEMO_PROFILE_ID, ...merchants]
    );
  },
};
