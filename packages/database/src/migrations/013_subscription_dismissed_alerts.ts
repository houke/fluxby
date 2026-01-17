import type { Migration, MigrationContext } from './index.js';

export const migration013: Migration = {
  version: 13,
  name: 'Add subscription_dismissed_alerts table',
  up: async (db: MigrationContext) => {
    // Create table to track permanently dismissed alerts for subscriptions
    // This allows users to dismiss price change, missed payment, or stale alerts
    // once and never see them again (unless the alert changes)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS subscription_dismissed_alerts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        pattern_id TEXT NOT NULL REFERENCES recurring_patterns(id) ON DELETE CASCADE,
        alert_type TEXT NOT NULL CHECK(alert_type IN ('price_change', 'missed_payment', 'stale')),
        dismissed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        -- For price_change alerts, store the amount that was dismissed
        -- This way if the price changes again, a new alert can be shown
        dismissed_amount REAL,
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        UNIQUE(pattern_id, alert_type, profile_id)
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_subscription_dismissed_alerts_pattern
      ON subscription_dismissed_alerts(pattern_id, profile_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_subscription_dismissed_alerts_profile
      ON subscription_dismissed_alerts(profile_id);
    `);
  },
  down: async (db: MigrationContext) => {
    await db.execAsync('DROP TABLE IF EXISTS subscription_dismissed_alerts;');
  },
};
