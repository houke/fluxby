
export interface MigrationContext {
  execAsync(sql: string): Promise<void>;
  queryAsync<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
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

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
];
