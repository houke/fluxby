export interface MigrationContext {
  execAsync(sql: string): Promise<void>;
  queryAsync<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  runAsync(
    sql: string,
    params?: unknown[]
  ): Promise<{ changes: number; lastInsertRowId: number }>;
  transactionAsync<T>(fn: () => Promise<T>): Promise<T>;
}

export interface Migration {
  version: number;
  name: string;
  up: (db: MigrationContext) => Promise<void>;
  down: (db: MigrationContext) => Promise<void>;
}

import { migration001 } from './001_initial.js';
import { migration002 } from './002_v5_transaction_columns.js';
import { migration003 } from './003_v6_profiles_hidden.js';
import { migration004 } from './004_v7_rules_profile_id.js';
import { migration005 } from './005_recurring_patterns.js';
import { migration006 } from './006_recurring_dismissed.js';
import { migration007 } from './007_seed_recurring_patterns.js';
import { migration008 } from './008_dashboard_indexes.js';
import { migration009 } from './009_addressbook_indexes.js';
import { migration010 } from './010_transaction_indexes.js';
import { migration011 } from './011_performance_indexes.js';
import { migration012 } from './012_addressbook_stats_indexes.js';

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
  migration010,
  migration011,
  migration012,
];

/**
 * The highest migration version this code knows about.
 * Used to detect stale code (when database has higher version than code knows).
 */
export const LATEST_MIGRATION_VERSION = 12;
