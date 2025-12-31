import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// DB_PATH is set to :memory: in tests/setup.ts

/**
 * Integration tests for AddressBook functionality
 *
 * Tests the following scenarios:
 * 1. Shared IBAN detection and visibility
 * 2. Resolving merchants on shared IBANs
 * 3. Transaction count accuracy
 * 4. Badge display logic (via address_book_id)
 */

describe('AddressBook Integration Tests', () => {
  let app: any;
  const PROFILE_ID = 1;
  const SHARED_IBAN = 'NL04ADYB2017400157'; // Simulated payment processor
  const REGULAR_IBAN = 'NL91ABNA0417164300';
  let accountId: number;

  beforeAll(async () => {
    const mod = await import('../../apps/api/src/app.js');
    app = mod.default;

    // Create an account for transactions
    const accRes = await request(app)
      .post('/api/accounts')
      .set('X-Profile-Id', String(PROFILE_ID))
      .send({
        name: 'Test Account',
        iban: 'NL99TEST0001234567',
        type: 'checking',
      });
    accountId = accRes.body.data?.id || 1;
  });

  describe('Shared IBAN Detection', () => {
    it('should NOT show regular IBAN with single merchant as shared', async () => {
      // First, create a transaction with regular IBAN
      const { run } = await import('../../apps/api/src/db/index.js');
      run(
        `INSERT INTO transactions (account_id, date, amount, description, type, opposing_account_iban, opposing_account_name, profile_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          '2024-01-01',
          -50.0,
          'Test payment',
          'expense',
          REGULAR_IBAN,
          'Regular Company',
          PROFILE_ID,
        ]
      );

      const res = await request(app)
        .get('/api/addressbook/shared-ibans')
        .set('X-Profile-Id', String(PROFILE_ID));

      expect(res.status).toBe(200);
      const sharedIbans = res.body.data;
      const regularIbanFound = sharedIbans.find(
        (s: any) => s.iban === REGULAR_IBAN
      );
      expect(regularIbanFound).toBeUndefined();
    });

    it('should show IBAN with multiple merchants as shared', async () => {
      const { run } = await import('../../apps/api/src/db/index.js');

      // Create transactions from multiple merchants using same IBAN
      run(
        `INSERT INTO transactions (account_id, date, amount, description, type, opposing_account_iban, opposing_account_name, profile_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          '2024-01-02',
          -25.0,
          'Payment to Merchant A',
          'expense',
          SHARED_IBAN,
          'Merchant A via Adyen',
          PROFILE_ID,
        ]
      );

      run(
        `INSERT INTO transactions (account_id, date, amount, description, type, opposing_account_iban, opposing_account_name, profile_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          '2024-01-03',
          -30.0,
          'Payment to Merchant B',
          'expense',
          SHARED_IBAN,
          'Merchant B via Adyen',
          PROFILE_ID,
        ]
      );

      run(
        `INSERT INTO transactions (account_id, date, amount, description, type, opposing_account_iban, opposing_account_name, profile_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          '2024-01-04',
          -15.0,
          'Payment to Merchant C',
          'expense',
          SHARED_IBAN,
          'Merchant C via Adyen',
          PROFILE_ID,
        ]
      );

      const res = await request(app)
        .get('/api/addressbook/shared-ibans')
        .set('X-Profile-Id', String(PROFILE_ID));

      expect(res.status).toBe(200);
      const sharedIbans = res.body.data;
      const sharedIban = sharedIbans.find((s: any) => s.iban === SHARED_IBAN);

      expect(sharedIban).toBeDefined();
      expect(sharedIban.merchantCount).toBe(3);
      expect(sharedIban.merchants.map((m: any) => m.name).sort()).toEqual([
        'Merchant A via Adyen',
        'Merchant B via Adyen',
        'Merchant C via Adyen',
      ]);
    });
  });

  describe('Address Book Creation Rules', () => {
    it('should merge contacts when adding a second IBAN with the exact same name', async () => {
      const { run, queryOne } = await import('../../apps/api/src/db/index.js');
      const profileInsert = run(
        "INSERT INTO profiles (user_id, name, type) VALUES (1, 'AB Merge Test', 'personal')"
      );
      const testProfileId = Number(profileInsert.lastInsertRowid);

      const name = 'Merge Me';
      const iban1 = 'NL11TEST0000000001';
      const iban2 = 'NL11TEST0000000002';

      const res1 = await request(app)
        .post('/api/addressbook')
        .set('X-Profile-Id', String(testProfileId))
        .send({ iban: iban1, name });

      expect(res1.status).toBe(201);
      expect(res1.body.success).toBe(true);

      const res2 = await request(app)
        .post('/api/addressbook')
        .set('X-Profile-Id', String(testProfileId))
        .send({ iban: iban2, name });

      expect(res2.status).toBe(201);
      expect(res2.body.success).toBe(true);
      expect(res2.body.merged).toBe(true);
      expect(res2.body.data?.ibans).toEqual(
        expect.arrayContaining([iban1, iban2])
      );

      const row = queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM address_book WHERE profile_id = ? AND LOWER(name) = LOWER(?)',
        [testProfileId, name]
      );
      expect(row?.count).toBe(1);
    });

    it('should allow creating multiple shared-IBAN contacts as long as the name is unique', async () => {
      const { run, queryOne } = await import('../../apps/api/src/db/index.js');
      const profileInsert = run(
        "INSERT INTO profiles (user_id, name, type) VALUES (1, 'AB Shared Test', 'personal')"
      );
      const testProfileId = Number(profileInsert.lastInsertRowid);

      run(
        'INSERT OR IGNORE INTO shared_ibans (iban, provider_name) VALUES (?, ?)',
        [SHARED_IBAN, 'Adyen']
      );

      const res1 = await request(app)
        .post('/api/addressbook')
        .set('X-Profile-Id', String(testProfileId))
        .send({
          iban: SHARED_IBAN,
          name: 'Merchant One',
          originalName: 'Merchant One via Adyen',
        });

      expect([200, 201]).toContain(res1.status);
      expect(res1.body.success).toBe(true);

      const res2 = await request(app)
        .post('/api/addressbook')
        .set('X-Profile-Id', String(testProfileId))
        .send({
          iban: SHARED_IBAN,
          name: 'Merchant Two',
          originalName: 'Merchant Two via Adyen',
        });

      expect([200, 201]).toContain(res2.status);
      expect(res2.body.success).toBe(true);

      const count = queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM address_book WHERE profile_id = ? AND iban = ? AND original_name IS NOT NULL',
        [testProfileId, SHARED_IBAN]
      );

      expect(count?.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resolve Shared IBAN Merchants', () => {
    let merchantAContactId: number;

    it('should resolve ONE merchant and still show remaining merchants', async () => {
      // Resolve Merchant A
      const resolveRes = await request(app)
        .post('/api/addressbook/resolve-shared')
        .set('X-Profile-Id', String(PROFILE_ID))
        .send({
          iban: SHARED_IBAN,
          name: 'Merchant A',
          originalNames: ['Merchant A via Adyen'],
        });

      expect(resolveRes.status).toBe(201);
      expect(resolveRes.body.success).toBe(true);
      expect(resolveRes.body.data.transactionsUpdated).toBe(1);
      merchantAContactId = resolveRes.body.data.addressBookId;

      // Check shared IBANs - should still show with 2 remaining
      const sharedRes = await request(app)
        .get('/api/addressbook/shared-ibans')
        .set('X-Profile-Id', String(PROFILE_ID));

      expect(sharedRes.status).toBe(200);
      const sharedIban = sharedRes.body.data.find(
        (s: any) => s.iban === SHARED_IBAN
      );

      expect(sharedIban).toBeDefined();
      expect(sharedIban.merchantCount).toBe(2);
      expect(sharedIban.merchants.map((m: any) => m.name).sort()).toEqual([
        'Merchant B via Adyen',
        'Merchant C via Adyen',
      ]);
      expect(sharedIban.isPartiallyResolved).toBe(true);
    });

    it('should have correct transaction count on resolved contact', async () => {
      const res = await request(app)
        .get('/api/addressbook')
        .set('X-Profile-Id', String(PROFILE_ID));

      expect(res.status).toBe(200);
      const contact = res.body.data.find(
        (c: any) => c.id === merchantAContactId
      );

      expect(contact).toBeDefined();
      expect(contact.name).toBe('Merchant A');
      expect(contact.transactionCount).toBe(1); // Only 1 transaction for Merchant A
    });

    it('should set address_book_id on resolved transactions', async () => {
      const { query } = await import('../../apps/api/src/db/index.js');
      const transactions = query<{
        id: number;
        address_book_id: number | null;
      }>(
        `SELECT id, address_book_id FROM transactions 
         WHERE opposing_account_iban = ? AND opposing_account_name = ?`,
        [SHARED_IBAN, 'Merchant A via Adyen']
      );

      expect(transactions.length).toBe(1);
      expect(transactions[0].address_book_id).toBe(merchantAContactId);
    });

    it('should NOT set address_book_id on unresolved transactions', async () => {
      const { query } = await import('../../apps/api/src/db/index.js');
      const transactions = query<{
        id: number;
        address_book_id: number | null;
      }>(
        `SELECT id, address_book_id FROM transactions 
         WHERE opposing_account_iban = ? AND opposing_account_name IN (?, ?)`,
        [SHARED_IBAN, 'Merchant B via Adyen', 'Merchant C via Adyen']
      );

      expect(transactions.length).toBe(2);
      expect(transactions.every((t) => t.address_book_id === null)).toBe(true);
    });

    it('should resolve second merchant and NOT show with only one remaining', async () => {
      const resolveRes = await request(app)
        .post('/api/addressbook/resolve-shared')
        .set('X-Profile-Id', String(PROFILE_ID))
        .send({
          iban: SHARED_IBAN,
          name: 'Merchant B',
          originalNames: ['Merchant B via Adyen'],
        });

      expect(resolveRes.status).toBe(201);

      // Check shared IBANs - should NOT show with only 1 remaining
      // A shared IBAN is only shown when it has > 1 unique contact names
      const sharedRes = await request(app)
        .get('/api/addressbook/shared-ibans')
        .set('X-Profile-Id', String(PROFILE_ID));

      expect(sharedRes.status).toBe(200);
      const sharedIban = sharedRes.body.data.find(
        (s: any) => s.iban === SHARED_IBAN
      );

      // Should NOT show because only 1 merchant remaining (not > 1)
      expect(sharedIban).toBeUndefined();
    });

    it('should NOT show shared IBAN after all merchants resolved', async () => {
      const resolveRes = await request(app)
        .post('/api/addressbook/resolve-shared')
        .set('X-Profile-Id', String(PROFILE_ID))
        .send({
          iban: SHARED_IBAN,
          name: 'Merchant C',
          originalNames: ['Merchant C via Adyen'],
        });

      expect(resolveRes.status).toBe(201);

      // Check shared IBANs - should NOT show anymore
      const sharedRes = await request(app)
        .get('/api/addressbook/shared-ibans')
        .set('X-Profile-Id', String(PROFILE_ID));

      expect(sharedRes.status).toBe(200);
      const sharedIban = sharedRes.body.data.find(
        (s: any) => s.iban === SHARED_IBAN
      );

      expect(sharedIban).toBeUndefined();
    });

    it('should have 3 contacts in addressbook after all resolved', async () => {
      const res = await request(app)
        .get('/api/addressbook')
        .set('X-Profile-Id', String(PROFILE_ID));

      expect(res.status).toBe(200);

      // Find contacts with the shared IBAN
      const contacts = res.body.data.filter(
        (c: any) => c.iban === SHARED_IBAN || c.ibans?.includes(SHARED_IBAN)
      );

      expect(contacts.length).toBe(3);
      expect(contacts.map((c: any) => c.name).sort()).toEqual([
        'Merchant A',
        'Merchant B',
        'Merchant C',
      ]);

      // Each should have exactly 1 transaction
      for (const contact of contacts) {
        expect(contact.transactionCount).toBe(1);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle duplicate merchant names on same IBAN', async () => {
      const { run } = await import('../../apps/api/src/db/index.js');
      const DUPLICATE_IBAN = 'NL99DUPLICATE001';

      // Create multiple transactions with SAME merchant name
      run(
        `INSERT INTO transactions (account_id, date, amount, description, type, opposing_account_iban, opposing_account_name, profile_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          '2024-02-01',
          -10.0,
          'Payment 1',
          'expense',
          DUPLICATE_IBAN,
          'Same Merchant',
          PROFILE_ID,
        ]
      );

      run(
        `INSERT INTO transactions (account_id, date, amount, description, type, opposing_account_iban, opposing_account_name, profile_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          '2024-02-02',
          -20.0,
          'Payment 2',
          'expense',
          DUPLICATE_IBAN,
          'Same Merchant',
          PROFILE_ID,
        ]
      );

      // Should NOT show as shared (only 1 distinct merchant name)
      const res = await request(app)
        .get('/api/addressbook/shared-ibans')
        .set('X-Profile-Id', String(PROFILE_ID));

      const duplicateIban = res.body.data.find(
        (s: any) => s.iban === DUPLICATE_IBAN
      );
      expect(duplicateIban).toBeUndefined();

      // Resolve and check transaction count
      const resolveRes = await request(app)
        .post('/api/addressbook/resolve-shared')
        .set('X-Profile-Id', String(PROFILE_ID))
        .send({
          iban: DUPLICATE_IBAN,
          name: 'Same Merchant Contact',
          originalNames: ['Same Merchant'],
        });

      expect(resolveRes.body.data.transactionsUpdated).toBe(2);

      // Check contact has both transactions
      const abRes = await request(app)
        .get('/api/addressbook')
        .set('X-Profile-Id', String(PROFILE_ID));

      const contact = abRes.body.data.find(
        (c: any) => c.name === 'Same Merchant Contact'
      );
      expect(contact).toBeDefined();
      expect(contact.transactionCount).toBe(2);
    });
  });
});
