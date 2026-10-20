/** @vitest-environment jsdom */
import SQLite from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCHEMA_SQL } from '../../packages/database/src/schema';
import { createDataService } from '@/lib/data-service';
import type { Database, AsyncDatabaseConnection } from '@fluxby/database';

vi.mock('@fluxby/database', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: () => 'profile',
}));
let sqlite: SQLite.Database;
let writes: { sql: string; inTransaction: boolean; changes: number }[];
let adapter: {
  queryAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  queryOneAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  runAsync: (
    sql: string,
    params?: unknown[]
  ) => Promise<{ changes: number; lastInsertRowId: number }>;
  transactionAsync: <T>(
    operation: (connection: AsyncDatabaseConnection) => Promise<T>
  ) => Promise<T>;
};
let service: ReturnType<typeof createDataService>;
beforeEach(() => {
  sqlite = new SQLite(':memory:');
  sqlite.exec(SCHEMA_SQL);
  sqlite.exec(`
    INSERT INTO users(id,name) VALUES('user','User');
    INSERT INTO profiles(id,user_id,name) VALUES('profile','user','Current'),('other','user','Other');
    INSERT INTO accounts(id,iban,name,profile_id) VALUES('account','NL00OWN','Current','profile'),('other-account','NL00OTHER','Other','other');
  `);
  writes = [];
  adapter = {
    queryAsync: async <T>(sql: string, params: unknown[] = []) =>
      sqlite.prepare(sql).all(...params) as T[],
    queryOneAsync: async <T>(sql: string, params: unknown[] = []) =>
      (sqlite.prepare(sql).get(...params) as T) ?? null,
    runAsync: async (sql, params = []) => {
      const inTransaction = sqlite.inTransaction;
      const result = sqlite.prepare(sql).run(...params);
      writes.push({ sql, inTransaction, changes: result.changes });
      return {
        changes: result.changes,
        lastInsertRowId: Number(result.lastInsertRowid),
      };
    },
    transactionAsync: async (operation) => {
      sqlite.exec('BEGIN');
      try {
        const result = await operation(adapter as unknown as Database);
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  service = createDataService(adapter as unknown as Database);
});
afterEach(() => sqlite.close());

describe('data service bulk operation performance', () => {
  it('reaches all contact history through bounded stable pages without crossing profiles', async () => {
    sqlite.exec(`
      INSERT INTO address_book(id,iban,name,profile_id)
      VALUES('contact','NLPRIMARY','Current contact','profile'),
        ('foreign-contact','NLPRIMARY','Foreign contact','other');
      INSERT INTO contact_ibans(id,contact_id,iban)
      VALUES('current-iban','contact','NLEXTRA'),('foreign-iban','foreign-contact','NLEXTRA');
    `);
    const insert = sqlite.prepare(`INSERT INTO transactions
      (id,date,amount,type,account_id,profile_id,address_book_id,opposing_account_iban,description)
      VALUES(?, '2026-10-03', -1, 'expense', ?, ?, ?, ?, ?)`);
    sqlite.transaction(() => {
      for (let index = 0; index < 75; index++) {
        const id = `contact-tx-${String(index).padStart(3, '0')}`;
        insert.run(
          id,
          'account',
          'profile',
          index < 25 ? 'contact' : null,
          index >= 50 ? 'NLEXTRA' : index >= 25 ? 'NLPRIMARY' : null,
          id
        );
      }
      insert.run(
        'foreign-tx',
        'other-account',
        'other',
        'foreign-contact',
        'NLPRIMARY',
        'Private'
      );
      insert.run(
        'deleted-tx',
        'account',
        'profile',
        'contact',
        'NLPRIMARY',
        'Deleted'
      );
    })();
    sqlite.exec("UPDATE transactions SET is_deleted=1 WHERE id='deleted-tx'");
    const query = vi.spyOn(adapter, 'queryAsync');
    const pages = await Promise.all(
      [0, 20, 40, 60].map((offset) =>
        service.getTransactionsForContact('contact', 20, offset)
      )
    );
    expect(pages.map((page) => page.length)).toEqual([20, 20, 20, 15]);
    const ids = pages.flat().map((row) => row.id);
    expect(ids).toEqual(
      Array.from(
        { length: 75 },
        (_, index) => `contact-tx-${String(74 - index).padStart(3, '0')}`
      )
    );
    expect(new Set(ids).size).toBe(75);
    expect((await service.getTransactionsForContact('contact')).length).toBe(
      50
    );
    const sqlPages = query.mock.calls.filter(([sql]) =>
      sql.includes('FROM transactions')
    );
    expect(sqlPages.every(([sql]) => sql.includes('LIMIT ? OFFSET ?'))).toBe(
      true
    );
    expect(sqlPages.slice(0, 4).map(([, params]) => params?.slice(-2))).toEqual(
      [
        [20, 0],
        [20, 20],
        [20, 40],
        [20, 60],
      ]
    );
    expect(
      await service.getTransactionsForContact('foreign-contact', 20, 0)
    ).toEqual([]);
    sqlite.exec("UPDATE address_book SET is_deleted=1 WHERE id='contact'");
    expect(await service.getTransactionsForContact('contact', 20, 0)).toEqual(
      []
    );
  });

  it('creates and links many imported contacts inside bounded transactions', async () => {
    const csv = [
      'date;amount;description;counterparty',
      ...Array.from(
        { length: 251 },
        (_, index) =>
          `2026-10-02;-1,00;Merchant ${index};NL00COUNTERPARTY${index}`
      ),
    ].join('\n');
    const result = await service.importCsv(csv, {
      accountId: 'account',
      mapping: {
        date: 'date',
        amount: 'amount',
        description: 'description',
        counterparty: 'counterparty',
      },
    });
    expect(result).toMatchObject({ imported: 251, skipped: 0, errors: [] });
    expect(
      sqlite.prepare('SELECT COUNT(*) count FROM address_book').get()
    ).toEqual({ count: 251 });
    expect(
      sqlite
        .prepare(
          'SELECT COUNT(*) count FROM transactions WHERE address_book_id IS NOT NULL'
        )
        .get()
    ).toEqual({ count: 251 });
    const bulkWrites = writes.filter(
      ({ sql }) =>
        /INSERT(?: OR IGNORE)? INTO (address_book|contact_ibans)/.test(sql) ||
        sql.includes('SET address_book_id = (')
    );
    expect(bulkWrites.length).toBeGreaterThan(500);
    expect(bulkWrites.every((write) => write.inTransaction)).toBe(true);
    expect(
      sqlite
        .prepare("SELECT current_balance FROM accounts WHERE id='account'")
        .get()
    ).toEqual({ current_balance: -251 });
  });

  it('does not rewrite unmatched or foreign-profile transactions when linking contacts', async () => {
    sqlite.exec(`
      INSERT INTO address_book(id,iban,name,profile_id) VALUES('direct','NL00DIRECT','Direct','profile'),('secondary','NL00PRIMARY','Secondary','profile');
      INSERT INTO contact_ibans(id,contact_id,iban,is_deleted) VALUES
        ('secondary-iban','secondary','NL00SECONDARY',0),
        ('retired-iban','secondary','NL00RETIRED',1);
      INSERT INTO transactions(id,date,amount,type,account_id,opposing_account_iban,profile_id,updated_at) VALUES
        ('direct-tx','2026-10-01',-1,'expense','account','NL00DIRECT','profile',1),
        ('secondary-tx','2026-10-01',-1,'expense','account','NL00SECONDARY','profile',1),
        ('retired-tx','2026-10-01',-1,'expense','account','NL00RETIRED','profile',1),
        ('unmatched-tx','2026-10-01',-1,'expense','account','NL00SHARED','profile',1),
        ('foreign-tx','2026-10-01',-1,'expense','other-account','NL00DIRECT','other',1);
    `);
    await service._linkTransactionsToAddressBook(
      ['direct-tx', 'secondary-tx', 'unmatched-tx', 'foreign-tx'],
      'profile',
      2
    );
    expect(
      sqlite
        .prepare(
          'SELECT id,address_book_id,updated_at FROM transactions ORDER BY id'
        )
        .all()
    ).toEqual([
      { id: 'direct-tx', address_book_id: 'direct', updated_at: 2 },
      { id: 'foreign-tx', address_book_id: null, updated_at: 1 },
      { id: 'retired-tx', address_book_id: null, updated_at: 1 },
      { id: 'secondary-tx', address_book_id: 'secondary', updated_at: 2 },
      { id: 'unmatched-tx', address_book_id: null, updated_at: 1 },
    ]);
    expect(writes.reduce((total, write) => total + write.changes, 0)).toBe(2);
    expect(writes.every((write) => write.inTransaction)).toBe(true);
  });

  it('loads contact IBANs with a bounded query and keeps profile isolation', async () => {
    sqlite.exec(`
      INSERT INTO address_book(id,iban,name,profile_id,is_deleted) VALUES
        ('current','NL00PRIMARY','Current','profile',0),
        ('deleted','NL00DELETED','Deleted','profile',1),
        ('foreign','NL00FOREIGN','Foreign','other',0);
      INSERT INTO contact_ibans(id,contact_id,iban,is_deleted) VALUES
        ('current-iban','current','NL00SECONDARY',0),
        ('retired-iban','current','NL00RETIRED',1),
        ('deleted-iban','deleted','NL00DELETED-SECONDARY',0),
        ('foreign-iban','foreign','NL00FOREIGN-SECONDARY',0);
    `);
    const query = vi.spyOn(adapter, 'queryAsync');
    const contacts = await service.getAddressBookContacts();
    expect(contacts).toHaveLength(1);
    expect(contacts[0].ibans).toEqual(['NL00PRIMARY', 'NL00SECONDARY']);
    const ibanQuery = query.mock.calls.find(([sql]) =>
      sql.includes('FROM contact_ibans')
    );
    expect(ibanQuery?.[1]).toEqual(['profile']);
  });

  it('does not treat a tombstoned contact IBAN as an existing import contact', async () => {
    sqlite.exec(`
      INSERT INTO address_book(id,iban,name,profile_id) VALUES('existing','NL00PRIMARY','Existing','profile');
      INSERT INTO contact_ibans(id,contact_id,iban,is_deleted) VALUES('retired-link','existing','NL00RETIRED',1);
    `);
    const result = await service.importCsv(
      'date;amount;description;counterparty\n2026-10-02;-1,00;New merchant;NL00RETIRED',
      {
        accountId: 'account',
        mapping: {
          date: 'date',
          amount: 'amount',
          description: 'description',
          counterparty: 'counterparty',
        },
      }
    );
    expect(result.imported).toBe(1);
    const contact = sqlite
      .prepare("SELECT id FROM address_book WHERE name='New merchant'")
      .get() as { id: string };
    expect(contact).toBeDefined();
    expect(
      sqlite.prepare('SELECT address_book_id FROM transactions').get()
    ).toEqual({ address_book_id: contact.id });
  });

  it('creates a seed category batch in one transaction', async () => {
    const transaction = vi.spyOn(adapter, 'transactionAsync');
    const result = await service.applySeedCategories([
      { name: 'First' },
      { name: 'Second' },
      { name: 'Third' },
    ]);
    expect(result.created).toBe(3);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(writes.every((write) => write.inTransaction)).toBe(true);
  });

  it('deletes a profile atomically and leaves another profile intact', async () => {
    sqlite.exec(`
      INSERT INTO transactions(id,date,amount,type,account_id,profile_id) VALUES('transaction','2026-10-01',-1,'expense','account','profile');
      INSERT INTO address_book(id,iban,name,profile_id) VALUES('contact','NL00CONTACT','Contact','profile');
    `);
    const original = sqlite.prepare('SELECT * FROM transactions').all();
    const run = adapter.runAsync;
    const spy = vi
      .spyOn(adapter, 'runAsync')
      .mockImplementation(async (sql, params) => {
        if (/^UPDATE\s+"?categories"?\s+SET\s+is_deleted/i.test(sql))
          throw new Error('Delete failed');
        return run(sql, params);
      });
    await expect(service.deleteProfile('profile')).rejects.toThrow(
      'Delete failed'
    );
    expect(sqlite.prepare('SELECT * FROM transactions').all()).toEqual(
      original
    );
    expect(
      sqlite.prepare("SELECT is_deleted FROM accounts WHERE id='account'").get()
    ).toEqual({ is_deleted: 0 });
    spy.mockRestore();
    writes = [];
    await service.deleteProfile('profile');
    // Deletion now discovers all owned feature tables. The four seeded records
    // must change, even when additional empty domain tables are present.
    expect(writes.reduce((total, write) => total + write.changes, 0)).toBe(4);
    expect(writes).toContainEqual(
      expect.objectContaining({
        sql: expect.stringMatching(
          /^UPDATE\s+"?transactions"?\s+SET\s+is_deleted/i
        ),
        changes: 1,
      })
    );
    expect(writes.every((write) => write.inTransaction)).toBe(true);
    expect(
      sqlite.prepare('SELECT id,is_deleted FROM profiles ORDER BY id').all()
    ).toEqual([
      { id: 'other', is_deleted: 0 },
      { id: 'profile', is_deleted: 1 },
    ]);
  });

  it('deletes the address book and clears links in one transaction', async () => {
    sqlite.exec(`
      INSERT INTO address_book(id,iban,name,profile_id) VALUES('contact','NL00CONTACT','Contact','profile'),('foreign','NL00FOREIGN','Foreign','other');
      INSERT INTO contact_ibans(id,contact_id,iban) VALUES('iban','contact','NL00CONTACT');
      INSERT INTO transactions(id,date,amount,type,account_id,address_book_id,profile_id) VALUES('transaction','2026-10-01',-1,'expense','account','contact','profile');
    `);
    expect(await service.deleteAllAddressBook()).toEqual({ deleted: 1 });
    expect(writes).toHaveLength(3);
    expect(writes.every((write) => write.inTransaction)).toBe(true);
    expect(
      sqlite.prepare('SELECT address_book_id FROM transactions').get()
    ).toEqual({ address_book_id: null });
    expect(
      sqlite
        .prepare("SELECT is_deleted FROM address_book WHERE id='foreign'")
        .get()
    ).toEqual({ is_deleted: 0 });
  });

  it('rolls back a partial contact merge when a write fails', async () => {
    sqlite.exec(`
      INSERT INTO address_book(id,iban,name,profile_id) VALUES('first','NL00FIRST','First','profile'),('second','NL00SECOND','Second','profile');
      INSERT INTO transactions(id,date,amount,type,account_id,merchant_name,opposing_account_iban,profile_id) VALUES('transaction','2026-10-01',-1,'expense','account','Second','NL00SECOND','profile');
    `);
    const original = sqlite
      .prepare('SELECT id,name,is_deleted FROM address_book ORDER BY id')
      .all();
    const run = adapter.runAsync;
    const spy = vi
      .spyOn(adapter, 'runAsync')
      .mockImplementation(async (sql, params) => {
        if (sql.includes('UPDATE address_book SET is_deleted'))
          throw new Error('Merge failed');
        return run(sql, params);
      });
    await expect(
      service.mergeContacts(['first', 'second'], 'Merged')
    ).rejects.toThrow('Merge failed');
    expect(
      sqlite
        .prepare('SELECT id,name,is_deleted FROM address_book ORDER BY id')
        .all()
    ).toEqual(original);
    expect(
      sqlite.prepare('SELECT merchant_name FROM transactions').get()
    ).toEqual({ merchant_name: 'Second' });
    spy.mockRestore();
    writes = [];
    expect(await service.mergeContacts(['first', 'second'], 'Merged')).toEqual({
      merged: 1,
    });
    expect(writes.every((write) => write.inTransaction)).toBe(true);
  });
});
