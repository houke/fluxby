import SQLite from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migration002 } from '../../packages/database/src/migrations/002_v5_transaction_columns';
import { migration003 } from '../../packages/database/src/migrations/003_v6_profiles_hidden';
import { migration004 } from '../../packages/database/src/migrations/004_v7_rules_profile_id';
import { migration009 } from '../../packages/database/src/migrations/009_addressbook_indexes';
import { migration010 } from '../../packages/database/src/migrations/010_transaction_indexes';
import { migration023 } from '../../packages/database/src/migrations/023_repair_performance_indexes';
import type { MigrationContext } from '../../packages/database/src/migrations';

let sqlite: SQLite.Database;
let db: MigrationContext;
beforeEach(() => {
  sqlite = new SQLite(':memory:');
  db = {
    execAsync: vi.fn(async (sql) => {
      sqlite.exec(sql);
    }),
    queryAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params) as T[],
    runAsync: async (sql, params = []) => {
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async (operation) => operation(db),
  };
});
afterEach(() => sqlite.close());

function indexColumns(name: string) {
  return (
    sqlite.prepare(`PRAGMA index_info(${name})`).all() as { name: string }[]
  ).map((column) => column.name);
}
function plan(sql: string, params: unknown[]) {
  return (
    sqlite.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params) as {
      detail: string;
    }[]
  )
    .map((row) => row.detail)
    .join('\n');
}

describe('migration resource use and index definitions', () => {
  it('skips ALTER statements for columns already present in a fresh schema', async () => {
    sqlite.exec(SCHEMA_SQL);
    await migration002.up(db);
    await migration003.up(db);
    await migration004.up(db);
    expect(db.execAsync).not.toHaveBeenCalled();
  });

  it('adds missing legacy columns once and preserves existing rows', async () => {
    sqlite.exec(`
      CREATE TABLE transactions(id TEXT PRIMARY KEY);
      CREATE TABLE profiles(id TEXT PRIMARY KEY);
      CREATE TABLE name_cleanup_rules(id TEXT PRIMARY KEY);
      CREATE TABLE payment_provider_rules(id TEXT PRIMARY KEY);
      INSERT INTO transactions VALUES('transaction');
      INSERT INTO profiles VALUES('profile');
    `);
    for (const migration of [migration002, migration003, migration004])
      await migration.up(db);
    expect(db.execAsync).toHaveBeenCalledTimes(5);
    expect(sqlite.prepare('SELECT * FROM transactions').get()).toEqual({
      id: 'transaction',
      payment_provider: null,
      address_book_id: null,
    });
    expect(sqlite.prepare('SELECT * FROM profiles').get()).toEqual({
      id: 'profile',
      is_hidden: 0,
    });
    for (const migration of [migration002, migration003, migration004])
      await migration.up(db);
    expect(db.execAsync).toHaveBeenCalledTimes(5);
  });

  it('propagates genuine failures when adding a missing column', async () => {
    sqlite.exec('CREATE TABLE transactions(id TEXT PRIMARY KEY)');
    vi.mocked(db.execAsync).mockRejectedValueOnce(new Error('Disk full'));
    await expect(migration002.up(db)).rejects.toThrow('Disk full');
  });

  it('repairs colliding index names and uses covering/profile-filtered query plans', async () => {
    sqlite.exec(SCHEMA_SQL);
    sqlite.exec(
      'ALTER TABLE recurring_patterns ADD COLUMN is_dismissed INTEGER DEFAULT 0'
    );
    await migration009.up(db);
    await migration010.up(db);
    // IF NOT EXISTS in the old migrations left these original definitions.
    expect(indexColumns('idx_transactions_opposing_iban')).toEqual([
      'opposing_account_iban',
    ]);
    expect(indexColumns('idx_address_book_profile')).toEqual(['profile_id']);
    await migration023.up(db);
    expect(indexColumns('idx_transactions_opposing_iban')).toEqual([
      'opposing_account_iban',
      'is_deleted',
      'profile_id',
      'opposing_account_name',
    ]);
    expect(indexColumns('idx_transactions_profile_date')).toEqual([
      'profile_id',
      'date',
      'is_deleted',
    ]);
    expect(indexColumns('idx_address_book_profile')).toEqual([
      'profile_id',
      'is_deleted',
      'name',
    ]);
    expect(indexColumns('idx_recurring_patterns_profile')).toEqual([
      'profile_id',
      'is_deleted',
      'is_dismissed',
      'is_confirmed',
    ]);
    const names = plan(
      'SELECT COUNT(DISTINCT opposing_account_name) FROM transactions WHERE opposing_account_iban=? AND profile_id=? AND is_deleted=0',
      ['NL00COUNTERPARTY', 'profile']
    );
    expect(names).toContain('COVERING INDEX idx_transactions_opposing_iban');
    expect(names).not.toContain('TEMP B-TREE');
    expect(
      plan(
        'SELECT date FROM transactions WHERE profile_id=? AND is_deleted=0 AND date>=? AND date<=?',
        ['profile', '2026-01-01', '2026-12-31']
      )
    ).toContain('COVERING INDEX idx_transactions_profile_date');
    const contacts = plan(
      'SELECT name FROM address_book WHERE profile_id=? AND is_deleted=0 ORDER BY name',
      ['profile']
    );
    expect(contacts).toContain('idx_address_book_profile');
    expect(contacts).not.toContain('TEMP B-TREE');
    expect(
      plan(
        'SELECT id,name FROM address_book WHERE iban=? AND profile_id=? AND is_deleted=0',
        ['NL00COUNTERPARTY', 'profile']
      )
    ).toContain('COVERING INDEX idx_address_book_import_iban');
    expect(
      plan(
        'SELECT id,iban FROM address_book WHERE profile_id=? AND is_deleted=0 AND LOWER(TRIM(name))=LOWER(TRIM(?))',
        ['profile', 'Merchant']
      )
    ).toContain('idx_address_book_import_name (profile_id=? AND <expr>=?)');
    expect(
      plan(
        'SELECT id FROM recurring_patterns WHERE profile_id=? AND is_deleted=0 AND is_dismissed=0 AND is_confirmed=1',
        ['profile']
      )
    ).toContain(
      'profile_id=? AND is_deleted=? AND is_dismissed=? AND is_confirmed=?'
    );
    await migration023.down(db);
    expect(indexColumns('idx_transactions_opposing_iban')).toEqual([
      'opposing_account_iban',
    ]);
    await migration023.up(db);
    expect(indexColumns('idx_transactions_opposing_iban')).toHaveLength(4);
    expect(sqlite.pragma('integrity_check', { simple: true })).toBe('ok');
  });
});
