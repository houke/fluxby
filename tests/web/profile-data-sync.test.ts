import type { AsyncDatabaseConnection } from '@fluxby/database';
import { migrations } from '../../packages/database/src/migrations';
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
    transactionAsync: async function <T>(
      this: unknown,
      work: (connection: AsyncDatabaseConnection) => Promise<T>
    ) {
      sqlite.exec('BEGIN');
      try {
        const result = await work(this as AsyncDatabaseConnection);
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
  const dismissedMigration = migrations.find(
    (migration) => migration.version === 6
  );
  if (!dismissedMigration) throw new Error('Expected dismissed migration');
  await dismissedMigration.up(db);
  await migration013.up(db);
  await migration015.up(db);
  await migration016.up(db);
  await migration017.up(db);
  for (const m of migrations.filter((m) => m.version > 17)) await m.up(db);
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

function addImportedTransactions(count: number, author: string | null = null) {
  const insert = sqlite.prepare(`INSERT INTO transactions
    (id,date,amount,type,account_id,category_id,profile_id,updated_at,device_id)
    VALUES(?, '2026-09-29', -1, 'expense', 'a', 'c', 'local-profile', 500, ?)`);
  sqlite.transaction(() => {
    for (let index = 0; index < count; index++)
      insert.run(`import-${index}`, author);
  })();
}

describe('bounded local sync stamps', () => {
  it('does not replace a newer local clock while waiting to stamp captured edits', async () => {
    const db = database();
    const captured = new ProfileDataSync(db, 'local-profile', 'local-device');
    await captured.initialize();
    sqlite.exec(
      "UPDATE transactions SET amount=-20,updated_at=200 WHERE id='t'"
    );
    const transaction = db.transactionAsync;
    vi.spyOn(db, 'transactionAsync').mockImplementationOnce(async (work) => {
      sqlite.exec(
        "UPDATE transactions SET amount=-50,updated_at=500 WHERE id='t'"
      );
      return transaction.call(db, work);
    });
    const changes = await captured.captureLocalChanges();
    expect(changes).toContainEqual(
      expect.objectContaining({
        table: 'transactions',
        row: expect.objectContaining({ id: 't', amount: -50, updated_at: 500 }),
      })
    );
    expect(
      sqlite
        .prepare('SELECT amount,updated_at FROM transactions WHERE id=?')
        .get('t')
    ).toEqual({ amount: -50, updated_at: 500 });
  });

  it('stamps a large import in bounded batches, preserves unchanged/foreign rows and persists hard deletions', async () => {
    const db = database();
    const run = vi.spyOn(db, 'runAsync');
    const captured = new ProfileDataSync(db, 'local-profile', 'local-device');
    await captured.initialize();
    addImportedTransactions(405);
    sqlite.exec(
      "UPDATE accounts SET name = 'Changed' WHERE id = 'a'; DELETE FROM transactions WHERE id = 't';"
    );

    const changes = await captured.captureLocalChanges();
    expect(changes).toHaveLength(407);
    const stamps = run.mock.calls.filter(([sql]) =>
      /UPDATE(?: OR FAIL)? transactions/.test(sql)
    );
    expect(stamps).toHaveLength(3);
    expect(stamps.every(([sql]) => !sql.includes('CASE id'))).toBe(true);
    expect(stamps.every(([, params]) => (params?.length ?? 0) <= 205)).toBe(
      true
    );
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM transactions WHERE id LIKE 'import-%' AND device_id='local-device' AND updated_at=500"
        )
        .get()
    ).toEqual({ count: 405 });
    expect(
      sqlite
        .prepare("SELECT updated_at,device_id FROM accounts WHERE id='a'")
        .get()
    ).toEqual({ updated_at: 101, device_id: 'local-device' });
    expect(
      sqlite
        .prepare(
          "SELECT updated_at,device_id FROM accounts WHERE id='private-a'"
        )
        .get()
    ).toEqual({ updated_at: 100, device_id: 'local-device' });
    expect(
      sqlite
        .prepare("SELECT updated_at,device_id FROM categories WHERE id='c'")
        .get()
    ).toEqual({ updated_at: 100, device_id: 'local-device' });
    expect(changes).toContainEqual(
      expect.objectContaining({
        table: 'transactions',
        row: expect.objectContaining({ id: 't', is_deleted: true }),
      })
    );

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
    run.mockClear();
    expect(await captured.captureLocalChanges()).toEqual([]);
    expect(run).not.toHaveBeenCalled();
  });

  it('retains individual monotonic clocks when changed rows do not share an import clock', async () => {
    addImportedTransactions(405, 'old-author');
    const clock = sqlite.prepare(
      'UPDATE transactions SET updated_at = ? WHERE id = ?'
    );
    sqlite.transaction(() => {
      for (let index = 0; index < 405; index++)
        clock.run(500 + index, `import-${index}`);
    })();
    const db = database();
    const run = vi.spyOn(db, 'runAsync');
    const captured = new ProfileDataSync(db, 'local-profile', 'local-device');
    await captured.initialize();
    sqlite.exec(`UPDATE transactions SET amount = -2,
      updated_at = CASE WHEN id = 'import-0' THEN 1 ELSE updated_at + 20 END
      WHERE id LIKE 'import-%'`);

    const changes = await captured.captureLocalChanges();
    expect(changes).toHaveLength(405);
    const stamps = run.mock.calls.filter(([sql]) =>
      /UPDATE(?: OR FAIL)? transactions/.test(sql)
    );
    expect(stamps).toHaveLength(3);
    expect(stamps.every(([, params]) => (params?.length ?? 0) <= 1003)).toBe(
      true
    );
    const rows = sqlite
      .prepare(
        "SELECT id,updated_at,device_id FROM transactions WHERE id LIKE 'import-%'"
      )
      .all() as { id: string; updated_at: number; device_id: string }[];
    for (const row of rows) {
      const index = Number(row.id.slice('import-'.length));
      expect(row.updated_at).toBe(index === 0 ? 501 : 520 + index);
      expect(row.device_id).toBe('local-device');
      expect(changes).toContainEqual({
        table: 'transactions',
        row: expect.objectContaining(row),
      });
    }
    expect(await captured.captureLocalChanges()).toEqual([]);
  });

  it('captures changed rows without rewriting already correct stored author/clock metadata', async () => {
    addImportedTransactions(3, 'local-device');
    sqlite.exec(`CREATE TABLE stamp_audit(id TEXT);
      CREATE TRIGGER audit_stamp AFTER UPDATE OF updated_at,device_id ON transactions
      BEGIN INSERT INTO stamp_audit VALUES(new.id); END;`);
    const changes = await sync.captureLocalChanges();
    expect(
      changes.filter((change) => change.table === 'transactions')
    ).toHaveLength(3);
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM stamp_audit').get()
    ).toEqual({ count: 0 });
    expect(await sync.captureLocalChanges()).toEqual([]);
  });

  it('rolls back all stamp batches on failure and retains the prior snapshot for retry', async () => {
    const db = database();
    const originalRun = db.runAsync;
    let batches = 0;
    let fail = true;
    db.runAsync = async (sql, params) => {
      if (
        /UPDATE(?: OR FAIL)? transactions/.test(sql) &&
        ++batches === 2 &&
        fail
      )
        throw new Error('Stamp write failed');
      return originalRun(sql, params);
    };
    const captured = new ProfileDataSync(db, 'local-profile', 'local-device');
    await captured.initialize();
    addImportedTransactions(405);
    await expect(captured.captureLocalChanges()).rejects.toThrow(
      'Stamp write failed'
    );
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM transactions WHERE id LIKE 'import-%' AND device_id IS NULL"
        )
        .get()
    ).toEqual({ count: 405 });
    fail = false;
    expect(await captured.captureLocalChanges()).toHaveLength(405);
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM transactions WHERE id LIKE 'import-%' AND device_id='local-device'"
        )
        .get()
    ).toEqual({ count: 405 });
  });

  it('preserves contact scoping and reset snapshots while clearing obsolete transport state', async () => {
    sqlite.exec(`
      INSERT INTO address_book(id,iban,name,profile_id,updated_at,device_id)
      VALUES('local-contact','NLCONTACT','Local','local-profile',100,'local-device'),
        ('foreign-contact','NLFOREIGN','Foreign','other-profile',100,'local-device');
      INSERT INTO contact_ibans(id,contact_id,iban,updated_at,device_id)
      VALUES('local-iban','local-contact','NLLOCAL',100,'old-author'),
        ('foreign-iban','foreign-contact','NLFOREIGN',100,'foreign-author');
    `);
    await sync.initialize();
    sqlite.exec(
      "UPDATE contact_ibans SET iban='NLCHANGED' WHERE id='local-iban'"
    );
    const edits = await sync.captureLocalChanges();
    expect(edits).toContainEqual(
      expect.objectContaining({
        table: 'contact_ibans',
        row: expect.objectContaining({
          id: 'local-iban',
          updated_at: 101,
          device_id: 'local-device',
        }),
      })
    );
    expect(
      sqlite
        .prepare(
          "SELECT updated_at,device_id FROM contact_ibans WHERE id='foreign-iban'"
        )
        .get()
    ).toEqual({ updated_at: 100, device_id: 'foreign-author' });

    sqlite.exec(`
      DELETE FROM transactions WHERE id='t';
      INSERT INTO sync_row_aliases(profile_id,remote_device_id,table_name,remote_id,local_id)
      VALUES('local-profile','remote:profile','transactions','remote-t','t');
    `);
    await sync.captureLocalChanges();
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM sync_tombstones').get()
    ).toEqual({ count: 1 });
    const reset = await sync.captureLocalChanges(true);
    expect(reset).toHaveLength(4);
    expect(
      reset.every(
        (change) =>
          change.row.profile_id === 'local-profile' &&
          change.row.device_id === 'local-device'
      )
    ).toBe(true);
    expect(
      reset.some(
        (change) => change.row.id === 't' || change.row.id === 'foreign-iban'
      )
    ).toBe(false);
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM sync_tombstones').get()
    ).toEqual({ count: 0 });
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM sync_row_aliases').get()
    ).toEqual({ count: 0 });
    expect(await sync.captureLocalChanges()).toEqual([]);
  });

  it('rolls back earlier rows and stamp batches after a mid-statement uniqueness failure', async () => {
    const db = database();
    const run = db.runAsync;
    let partiallyStamped = 0;
    db.runAsync = async (sql, params) => {
      try {
        return await run(sql, params);
      } catch (error) {
        partiallyStamped = Number(
          (
            sqlite
              .prepare(
                "SELECT COUNT(*) AS count FROM transactions WHERE id LIKE 'import-%' AND device_id='local-device'"
              )
              .get() as { count: number }
          ).count
        );
        throw error;
      }
    };
    const captured = new ProfileDataSync(db, 'local-profile', 'local-device');
    await captured.initialize();
    addImportedTransactions(405);
    sqlite.exec(`
      UPDATE transactions SET amount=-2 WHERE id='import-250';
      CREATE UNIQUE INDEX stamp_unique ON transactions(amount) WHERE device_id='local-device' AND amount=-2;
      INSERT INTO transactions(id,date,amount,type,account_id,profile_id,updated_at,device_id)
      VALUES('stamp-conflict','2026-09-29',-2,'expense','a','local-profile',500,'local-device');
    `);
    await expect(captured.captureLocalChanges()).rejects.toThrow('UNIQUE');
    expect(partiallyStamped).toBeGreaterThan(200);
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count FROM transactions WHERE id LIKE 'import-%' AND device_id IS NULL"
        )
        .get()
    ).toEqual({ count: 405 });
    sqlite.exec("DELETE FROM transactions WHERE id='stamp-conflict'");
    expect(await captured.captureLocalChanges()).toHaveLength(405);
  });
});

describe('profile-bound financial data sync', () => {
  it('applies more than 50k valid rows once and rolls back a late invalid reference atomically', async () => {
    const db = database();
    const guarded = new ProfileDataSync(db, 'local-profile', 'local-device');
    await guarded.initialize();
    const transaction = vi.spyOn(db, 'transactionAsync');
    const snapshot = Array.from({ length: 50001 }, (_, index) =>
      change('transactions', {
        id: `snapshot-${index}`,
        date: '2026-10-07',
        amount: -1,
        type: 'expense',
        account_id: index === 50000 ? 'private-a' : 'a',
        category_id: 'c',
      })
    );
    expect(JSON.stringify(snapshot).length).toBeLessThan(32000000);
    await expect(
      guarded.applyChanges(snapshot, 'remote-profile', 'remote-device')
    ).rejects.toThrow('paired profile');
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM transactions').get()
    ).toEqual({ count: 1 });
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM sync_row_aliases').get()
    ).toEqual({ count: 0 });
    snapshot[snapshot.length - 1].row = {
      ...snapshot[snapshot.length - 1].row,
      account_id: 'a',
    } as SyncChange['row'];
    transaction.mockClear();
    expect(
      await guarded.applyChanges(snapshot, 'remote-profile', 'remote-device')
    ).toBe(50001);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS count, SUM(amount) AS total FROM transactions WHERE id LIKE 'snapshot-%' AND profile_id='local-profile'"
        )
        .get()
    ).toEqual({ count: 50001, total: -50001 });
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
  }, 30000);

  it('retains local edits queued after peer commit for the next capture', async () => {
    const db = database();
    const guarded = new ProfileDataSync(db, 'local-profile', 'local-device');
    await guarded.initialize();
    const transaction = db.transactionAsync;
    vi.spyOn(db, 'transactionAsync').mockImplementationOnce(async (work) => {
      const result = await transaction.call(db, work);
      sqlite.exec(
        "UPDATE transactions SET amount=-50,updated_at=500 WHERE id='t'"
      );
      return result;
    });
    await guarded.applyChanges(
      [
        change('transactions', {
          id: 't',
          date: '2026-09-29',
          amount: -20,
          type: 'expense',
          account_id: 'a',
          updated_at: 200,
        }),
      ],
      'remote-profile',
      'remote-device'
    );
    expect(await guarded.captureLocalChanges()).toContainEqual(
      expect.objectContaining({
        table: 'transactions',
        row: expect.objectContaining({
          id: 't',
          amount: -50,
          updated_at: 500,
          device_id: 'local-device',
        }),
      })
    );
  });

  it('compares incoming versions with edits committed while waiting for the transaction', async () => {
    const db = database();
    const guarded = new ProfileDataSync(db, 'local-profile', 'local-device');
    await guarded.initialize();
    const transaction = db.transactionAsync;
    vi.spyOn(db, 'transactionAsync').mockImplementationOnce(async (work) => {
      sqlite.exec(
        "UPDATE transactions SET amount=-50,updated_at=500 WHERE id='t'"
      );
      return transaction.call(db, work);
    });
    expect(
      await guarded.applyChanges(
        [
          change('transactions', {
            id: 't',
            date: '2026-09-29',
            amount: -20,
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
        .prepare('SELECT amount,updated_at FROM transactions WHERE id=?')
        .get('t')
    ).toEqual({ amount: -50, updated_at: 500 });
  });

  it('includes legacy transactions owned through their account and preserves foreign legacy rows', async () => {
    sqlite.exec(`
      UPDATE transactions SET profile_id=NULL WHERE id='t';
      INSERT INTO transactions(id,date,amount,type,account_id,profile_id,updated_at,device_id)
      VALUES('legacy-private','2026-09-29',-20,'expense','private-a',NULL,100,'local-device');
    `);
    await sync.initialize();
    const changes = await sync.getChanges();
    expect(changes).toContainEqual(
      expect.objectContaining({
        table: 'transactions',
        row: expect.objectContaining({ id: 't', profile_id: 'local-profile' }),
      })
    );
    expect(changes.some((item) => item.row.id === 'legacy-private')).toBe(
      false
    );
    sqlite.exec("UPDATE transactions SET amount=-15 WHERE id='t'");
    expect(await sync.captureLocalChanges()).toContainEqual(
      expect.objectContaining({
        table: 'transactions',
        row: expect.objectContaining({ id: 't', updated_at: 101 }),
      })
    );
    expect(
      sqlite.prepare('SELECT updated_at FROM transactions WHERE id=?').get('t')
    ).toEqual({ updated_at: 101 });
    await expect(
      sync.applyChanges(
        [
          change('transactions', {
            id: 'legacy-private',
            date: '2026-09-29',
            amount: -50,
            type: 'expense',
            account_id: 'a',
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).rejects.toThrow('another local profile');
  });

  it('rejects incoming IDs belonging to unassigned records instead of overwriting them', async () => {
    sqlite.exec(`INSERT INTO accounts(id,iban,name,profile_id,updated_at,device_id)
      VALUES('unassigned','NLUNASSIGNED','Preserved account',NULL,100,'local-device')`);
    await expect(
      sync.applyChanges(
        [
          change('accounts', {
            id: 'unassigned',
            iban: 'NLNEW',
            name: 'Overwritten',
          }),
        ],
        'remote-profile',
        'remote-device'
      )
    ).rejects.toThrow('another local profile');
    expect(
      sqlite
        .prepare('SELECT name,profile_id FROM accounts WHERE id=?')
        .get('unassigned')
    ).toEqual({ name: 'Preserved account', profile_id: null });
    expect(
      sqlite.prepare('SELECT COUNT(*) AS count FROM sync_row_aliases').get()
    ).toEqual({ count: 0 });
  });

  it('normalizes legacy manual bill signs from peers without changing recurring income, cadence or dates', async () => {
    const bill = {
      id: 'legacy-bill',
      merchant_name: 'Manual bill',
      manual_source: 1,
      avg_amount: 25,
      last_amount: 27,
      pattern_type: 'quarterly',
      last_date: '2026-09-30',
      next_expected_date: '2026-12-30',
      created_at: 100,
    };
    const salary = {
      ...bill,
      id: 'salary',
      merchant_name: 'Salary',
      manual_source: 0,
      avg_amount: 2500,
      last_amount: 2500,
    };
    expect(
      await sync.applyChanges(
        [
          change('recurring_patterns', bill),
          change('recurring_patterns', salary),
        ],
        'remote-profile',
        'remote-device'
      )
    ).toBe(2);
    expect(
      sqlite
        .prepare(
          'SELECT avg_amount,last_amount,pattern_type,last_date,next_expected_date FROM recurring_patterns WHERE id=?'
        )
        .get(bill.id)
    ).toEqual({
      avg_amount: -25,
      last_amount: -27,
      pattern_type: 'quarterly',
      last_date: '2026-09-30',
      next_expected_date: '2026-12-30',
    });
    expect(
      sqlite
        .prepare(
          'SELECT avg_amount,last_amount FROM recurring_patterns WHERE id=?'
        )
        .get(salary.id)
    ).toEqual({ avg_amount: 2500, last_amount: 2500 });
  });
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
  it('remaps persisted review keys to local transaction and category identities', async () => {
    sqlite
      .prepare(
        "INSERT INTO sync_row_aliases(profile_id,remote_device_id,table_name,remote_id,local_id) VALUES('local-profile','remote-device:remote-profile','transactions','remote-t','t')"
      )
      .run();
    await sync.applyChanges(
      [
        change('categories', {
          id: 'remote-c',
          name: 'Groceries',
          icon: 'basket',
          parent_id: null,
        }),
        change('transaction_review_decisions', {
          id: 'tx-decision',
          created_at: 200,
          item_key: 'uncategorized:remote-t',
          status: 'done',
          snoozed_until: null,
        }),
        change('transaction_review_decisions', {
          id: 'category-decision',
          created_at: 200,
          item_key: 'categorySpike:remote-c:2026-09',
          status: 'later',
          snoozed_until: '2026-10-09',
        }),
      ],
      'remote-profile',
      'remote-device'
    );
    expect(
      sqlite
        .prepare(
          'SELECT item_key,profile_id FROM transaction_review_decisions ORDER BY item_key'
        )
        .all()
    ).toEqual([
      { item_key: 'categorySpike:c:2026-09', profile_id: 'local-profile' },
      { item_key: 'uncategorized:t', profile_id: 'local-profile' },
    ]);
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
