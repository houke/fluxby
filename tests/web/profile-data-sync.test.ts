import Sqlite from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { migration013 } from '../../packages/database/src/migrations/013_subscription_dismissed_alerts';
import { migration015 } from '../../packages/database/src/migrations/015_profile_sync_state';
import { migration016 } from '../../packages/database/src/migrations/016_financial_planning';
import { migration017 } from '../../packages/database/src/migrations/017_remove_transaction_tools';
import {
  ProfileDataSync,
  subscribeLocalDataChanges,
  withDataChangeNotifications,
} from '@/lib/data-sync';
import type { SyncChange } from '@fluxby/core';

let sqlite: Sqlite.Database;
function database() {
  return {
    execAsync: async (sql: string) => {
      sqlite.exec(sql);
    },
    queryAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params) as T[],
    runAsync: async (sql: string, params: unknown[] = []) => {
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async <T>(work: () => Promise<T>) => {
      sqlite.exec('BEGIN');
      try {
        const result = await work();
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
let sync: ProfileDataSync;
function change(table: string, row: Record<string, unknown>): SyncChange {
  return {
    table,
    row: {
      id: 'remote',
      profile_id: 'remote-profile',
      updated_at: 200,
      device_id: 'remote-device',
      is_deleted: false,
      ...row,
    },
  } as SyncChange;
}
beforeEach(async () => {
  sqlite = new Sqlite(':memory:');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(SCHEMA_SQL);
  const db = database();
  await migration013.up(db);
  await migration015.up(db);
  await migration016.up(db);
  await migration017.up(db);
  sqlite.exec(`
    INSERT INTO users(id,name) VALUES('u','Local');
    INSERT INTO profiles(id,user_id,name) VALUES('local-profile','u','Personal'),('other-profile','u','Work');
    INSERT INTO accounts(id,iban,name,profile_id,updated_at,device_id) VALUES('a','NL00TEST','Local account','local-profile',100,'local-device'),('private-a','NLPRIVATE','Private account','other-profile',100,'local-device');
    INSERT INTO categories(id,name,icon,profile_id,updated_at,device_id) VALUES('c','Groceries','basket','local-profile',100,'local-device'),('private-c','Private',NULL,'other-profile',100,'local-device');
    INSERT INTO transactions(id,date,amount,type,account_id,category_id,profile_id,updated_at,device_id) VALUES('t','2026-09-29',-10,'expense','a','c','local-profile',100,'local-device');
  `);
  sync = new ProfileDataSync(db, 'local-profile', 'local-device');
  await sync.initialize();
});
afterEach(() => sqlite.close());

describe('profile-bound financial data sync', () => {
  it('exports profile financial rows and excludes other profiles, users, credentials and device settings', async () => {
    const changes = await sync.getChanges();
    expect(changes.map((item) => item.table)).not.toContain('users');
    expect(changes.map((item) => item.row.id)).not.toContain('private-a');
    expect(changes).toHaveLength(3);
    expect(
      changes.every(
        (item) =>
          (item.row as unknown as { profile_id: string }).profile_id ===
          'local-profile'
      )
    ).toBe(true);
  });
  it('merges independently seeded accounts/categories and resolves child references inside the approved profile', async () => {
    const incoming = [
      change('transactions', {
        id: 'new-tx',
        date: '2026-09-30',
        amount: -25,
        type: 'expense',
        account_id: 'remote-a',
        category_id: 'remote-c',
      }),
      change('categories', {
        id: 'remote-c',
        name: 'Groceries',
        icon: 'basket',
        parent_id: null,
      }),
      change('accounts', {
        id: 'remote-a',
        iban: 'NL00TEST',
        name: 'Remote account',
      }),
    ];
    expect(
      await sync.applyChanges(incoming, 'remote-profile', 'remote-device')
    ).toBe(3);
    expect(
      sqlite
        .prepare('SELECT COUNT(*) AS count FROM accounts WHERE profile_id = ?')
        .get('local-profile')
    ).toEqual({ count: 1 });
    expect(
      sqlite
        .prepare(
          'SELECT account_id, category_id, profile_id FROM transactions WHERE id = ?'
        )
        .get('new-tx')
    ).toEqual({
      account_id: 'a',
      category_id: 'c',
      profile_id: 'local-profile',
    });
    const restarted = new ProfileDataSync(
      database(),
      'local-profile',
      'local-device'
    );
    await restarted.initialize();
    expect(
      await restarted.applyChanges(
        [
          change('transactions', {
            id: 'later-tx',
            date: '2026-10-01',
            amount: -5,
            type: 'expense',
            account_id: 'remote-a',
            category_id: 'remote-c',
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).toBe(1);
  });
  it('rejects malformed tables/columns, credentials and foreign-profile data before any write', async () => {
    for (const invalid of [
      change('users', { name: 'Injected' }),
      change('accounts; DELETE FROM transactions', { name: 'Injected' }),
      change('accounts', { iban: 'NLE', name: 'Injected', secret: 'key' }),
      change('accounts', {
        iban: 'NLE',
        name: 'Injected',
        profile_id: 'other-profile',
      }),
      change('accounts', {
        iban: 'NLE',
        name: 'Injected',
        updated_at: Infinity,
      }),
    ])
      await expect(
        sync.applyChanges([invalid], 'remote-profile', 'remote-device')
      ).rejects.toThrow();
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM sync_row_aliases').get()
    ).toEqual({ count: 0 });
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM transactions').get()
    ).toEqual({ count: 1 });
  });
  it('atomically rejects rows referencing an unrelated profile and id collisions with it', async () => {
    await expect(
      sync.applyChanges(
        [
          change('accounts', { iban: 'NLNEW', name: 'New' }),
          change('transactions', {
            id: 'bad',
            date: '2026-09-29',
            amount: -1,
            type: 'expense',
            account_id: 'private-a',
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).rejects.toThrow('paired profile');
    expect(
      sqlite.prepare('SELECT id FROM accounts WHERE id = ?').get('remote')
    ).toBeUndefined();
    await expect(
      sync.applyChanges(
        [change('accounts', { id: 'private-a', iban: 'NLNEW', name: 'Bad' })],
        'remote-profile',
        'remote-device'
      )
    ).rejects.toThrow('another local profile');
    expect(
      sqlite.prepare('SELECT name FROM accounts WHERE id = ?').get('private-a')
    ).toEqual({ name: 'Private account' });
  });
  it('uses stored authors for deterministic timestamp ties and never lets an older row resurrect a tombstone', async () => {
    expect(
      await sync.applyChanges(
        [
          change('transactions', {
            id: 't',
            date: '2026-09-29',
            amount: -30,
            type: 'expense',
            account_id: 'a',
            category_id: 'c',
            updated_at: 100,
            device_id: 'z-device',
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).toBe(1);
    expect(
      await sync.applyChanges(
        [
          change('transactions', {
            id: 't',
            date: '2026-09-29',
            amount: -40,
            type: 'expense',
            account_id: 'a',
            category_id: 'c',
            updated_at: 100,
            device_id: 'm-device',
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).toBe(0);
    expect(
      await sync.applyChanges(
        [
          change('transactions', {
            id: 't',
            is_deleted: true,
            updated_at: 300,
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).toBe(1);
    expect(
      await sync.applyChanges(
        [
          change('transactions', {
            id: 't',
            date: '2026-09-29',
            amount: -40,
            type: 'expense',
            account_id: 'a',
            updated_at: 200,
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).toBe(0);
    expect(
      sqlite
        .prepare('SELECT is_deleted FROM transactions WHERE id = ?')
        .get('t')
    ).toEqual({ is_deleted: 1 });
  });
  it('persists physical deletions across restart and stamps local edits with this device', async () => {
    sqlite.exec(
      "UPDATE transactions SET amount = -50, updated_at = 500 WHERE id = 't'"
    );
    await sync.captureLocalChanges();
    expect(
      sqlite.prepare('SELECT device_id FROM transactions WHERE id = ?').get('t')
    ).toEqual({ device_id: 'local-device' });
    sqlite.exec("DELETE FROM transactions WHERE id = 't'");
    const changes = await sync.captureLocalChanges();
    expect(changes).toEqual([
      expect.objectContaining({
        table: 'transactions',
        row: expect.objectContaining({ id: 't', is_deleted: true }),
      }),
    ]);
    const restarted = new ProfileDataSync(
      database(),
      'local-profile',
      'local-device'
    );
    await restarted.initialize();
    expect(await restarted.getChanges()).toContainEqual(
      expect.objectContaining({
        table: 'transactions',
        row: expect.objectContaining({ id: 't', is_deleted: true }),
      })
    );
    expect(
      await restarted.applyChanges(
        [
          change('transactions', {
            id: 't',
            date: '2026-09-29',
            amount: -40,
            type: 'expense',
            account_id: 'a',
            updated_at: 200,
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).toBe(0);
  });
  it('rolls back incoming data when the active profile changes while its transaction is running', async () => {
    let active = true;
    const db = database();
    const run = db.runAsync;
    db.runAsync = async (sql, params) => {
      const result = await run(sql, params);
      if (sql.startsWith('INSERT INTO accounts')) active = false;
      return result;
    };
    const guarded = new ProfileDataSync(
      db,
      'local-profile',
      'local-device',
      () => active
    );
    await guarded.initialize();
    await expect(
      guarded.applyChanges(
        [
          change('accounts', {
            id: 'new-account',
            iban: 'NLGUARDED',
            name: 'Guarded',
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).rejects.toThrow('no longer active');
    expect(
      sqlite.prepare('SELECT id FROM accounts WHERE id = ?').get('new-account')
    ).toBeUndefined();
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM sync_row_aliases').get()
    ).toEqual({ count: 0 });
  });
  it('syncs planning dependencies and maps singleton/monthly records across independently created profiles', async () => {
    sqlite.exec(
      "INSERT INTO planning_preferences(id,profile_id,minimum_balance,updated_at,device_id) VALUES('local-preferences','local-profile',10,100,'local-device')"
    );
    await sync.initialize();
    await sync.applyChanges(
      [
        change('savings_contributions', {
          id: 'contribution',
          goal_id: 'goal',
          amount: 50,
        }),
        change('savings_goals', {
          id: 'goal',
          name: 'Trip',
          target_amount: 500,
        }),
        change('planning_preferences', {
          id: 'remote-preferences',
          minimum_balance: 30,
        }),
        change('monthly_reviews', {
          id: 'review',
          month: '2026-09',
          checks_json: '{"budgets":true}',
        }),
      ],
      'remote-profile',
      'remote-device'
    );
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM planning_preferences').get()
    ).toEqual({ count: 1 });
    expect(
      sqlite
        .prepare('SELECT goal_id,profile_id FROM savings_contributions')
        .get()
    ).toEqual({ goal_id: 'goal', profile_id: 'local-profile' });
    expect(
      sqlite.prepare('SELECT minimum_balance FROM planning_preferences').get()
    ).toEqual({ minimum_balance: 30 });
  });
  it('orders nested categories and rolls back cyclic references', async () => {
    await sync.applyChanges(
      [
        change('categories', { id: 'kid', name: 'Kid', parent_id: 'parent' }),
        change('categories', { id: 'parent', name: 'Parent', parent_id: null }),
      ],
      'remote-profile',
      'remote-device'
    );
    expect(
      sqlite.prepare('SELECT parent_id FROM categories WHERE id = ?').get('kid')
    ).toEqual({ parent_id: 'parent' });
    await expect(
      sync.applyChanges(
        [
          change('categories', { id: 'x', name: 'X', parent_id: 'y' }),
          change('categories', { id: 'y', name: 'Y', parent_id: 'x' }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).rejects.toThrow('Cyclic');
  });
});

describe('committed data change notifications', () => {
  it('notifies once for nested successful mutations, preserves return values, and excludes failed operations/reads', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLocalDataChanges(listener);
    const service = withDataChangeNotifications(
      {
        async createItem() {
          return 'created';
        },
        async applyBatch() {
          return this.createItem();
        },
        async getItems() {
          return [];
        },
        async deleteItem() {
          throw new Error('failed');
        },
      },
      () => 'local-profile'
    );
    expect(await service.applyBatch()).toBe('created');
    expect(listener).toHaveBeenCalledExactlyOnceWith({
      profileId: 'local-profile',
      method: 'applyBatch',
    });
    await service.getItems();
    await expect(service.deleteItem()).rejects.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
