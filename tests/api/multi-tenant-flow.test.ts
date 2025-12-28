import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// DB_PATH is set to :memory: in tests/setup.ts

describe('Multi-Tenant Integration Flow', () => {
  let app: any;
  const personalProfileId = 1; // Default
  let businessProfileId: number;

  beforeAll(async () => {
    // Import app using dynamic import to ensure ENV is preserved
    const mod = await import('../../apps/api/src/app.js');
    app = mod.default;

    // Check if initial profile exists (it should from initializeDatabase call in app.ts)
    const { queryOne: _queryOne } =
      await import('../../apps/api/src/db/index.js');
    // ...
  });

  it('should create a second profile (Business)', async () => {
    const res = await request(app).post('/api/profiles').send({
      name: 'My Business',
      type: 'business',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    businessProfileId = res.body.data.id;
    expect(businessProfileId).toBeDefined();
    expect(businessProfileId).not.toBe(personalProfileId);
  });

  it('should create accounts in separate profiles', async () => {
    // Create Personal Account
    const resPersonal = await request(app)
      .post('/api/accounts')
      .set('X-Profile-Id', String(personalProfileId))
      .send({
        name: 'Personal Checking',
        iban: 'NL99INGB0001234567',
        type: 'checking',
      });
    expect(resPersonal.status).toBe(201);

    // Create Business Account
    const resBusiness = await request(app)
      .post('/api/accounts')
      .set('X-Profile-Id', String(businessProfileId))
      .send({
        name: 'Business Checking',
        iban: 'NL99INGB0007654321', // Different IBAN
        type: 'checking',
      });
    expect(resBusiness.status).toBe(201);
  });

  it('should not see Business accounts in Personal profile', async () => {
    const res = await request(app)
      .get('/api/accounts')
      .set('X-Profile-Id', String(personalProfileId));

    expect(res.status).toBe(200);
    const accounts = res.body.data;
    // Should see Personal Checking, maybe default seed accounts if any
    const names = accounts.map((a: any) => a.name);
    expect(names).toContain('Personal Checking');
    expect(names).not.toContain('Business Checking');
  });

  it('should not see Personal accounts in Business profile', async () => {
    const res = await request(app)
      .get('/api/accounts')
      .set('X-Profile-Id', String(businessProfileId));

    expect(res.status).toBe(200);
    const accounts = res.body.data;
    const names = accounts.map((a: any) => a.name);
    expect(names).toContain('Business Checking');
    expect(names).not.toContain('Personal Checking');
  });

  it('should create transactions in valid accounts only via profile', async () => {
    // Get Business Account ID
    const accRes = await request(app)
      .get('/api/accounts')
      .set('X-Profile-Id', String(businessProfileId));
    const businessAcc = accRes.body.data.find(
      (a: any) => a.name === 'Business Checking'
    );

    // Get Personal Account ID
    const persRes = await request(app)
      .get('/api/accounts')
      .set('X-Profile-Id', String(personalProfileId));
    const personalAcc = persRes.body.data.find(
      (a: any) => a.name === 'Personal Checking'
    );

    // Create Business Transaction
    const txRes = await request(app)
      .post('/api/transactions')
      .set('X-Profile-Id', String(businessProfileId))
      .send({
        date: '2024-01-01',
        amount: -50.0,
        type: 'expense',
        description: 'Business Lunch',
        accountId: businessAcc.id,
        merchantName: 'Lunch Place',
      });
    expect(txRes.status).toBe(201);

    // Create Personal Transaction
    const txPersRes = await request(app)
      .post('/api/transactions')
      .set('X-Profile-Id', String(personalProfileId))
      .send({
        date: '2024-01-01',
        amount: -25.0,
        type: 'expense',
        description: 'Personal Dinner',
        accountId: personalAcc.id,
        merchantName: 'Dinner Place',
      });
    expect(txPersRes.status).toBe(201);

    // Try to create transaction in Business Account while identified as Personal Profile
    // This should Fail or be Rejected if we enforce account ownership
    const securityTest = await request(app)
      .post('/api/transactions')
      .set('X-Profile-Id', String(personalProfileId)) // Access as Personal
      .send({
        date: '2024-01-02',
        amount: -100,
        type: 'expense',
        description: 'Hacking Attempt',
        accountId: businessAcc.id, // Target Business Account
      });

    // Depending on implementation, might return 403, 404 (account not found in profile), or 400
    // VerifyAccountProfile middleware usually throws error or returns 403/400
    expect(securityTest.status).not.toBe(201);
  });

  it('should isolate transactions by profile', async () => {
    // Fetch Business Transactions
    const resBiz = await request(app)
      .get('/api/transactions')
      .set('X-Profile-Id', String(businessProfileId));

    expect(resBiz.status).toBe(200);
    const bizTxs = resBiz.body.data;
    expect(bizTxs.length).toBeGreaterThan(0);
    expect(bizTxs.some((t: any) => t.description === 'Business Lunch')).toBe(
      true
    );
    expect(bizTxs.some((t: any) => t.description === 'Personal Dinner')).toBe(
      false
    );

    // Fetch Personal Transactions
    const resPers = await request(app)
      .get('/api/transactions')
      .set('X-Profile-Id', String(personalProfileId));

    expect(resPers.status).toBe(200);
    const persTxs = resPers.body.data;
    expect(persTxs.some((t: any) => t.description === 'Personal Dinner')).toBe(
      true
    );
    expect(persTxs.some((t: any) => t.description === 'Business Lunch')).toBe(
      false
    );
  });

  it('should isolate categories', async () => {
    // Create Business Category
    const catRes = await request(app)
      .post('/api/categories')
      .set('X-Profile-Id', String(businessProfileId))
      .send({
        name: 'Office Supplies',
        icon: '📎',
        color: '#ff0000',
      });
    expect(catRes.status).toBe(201);

    // Verify it doesn't appear in Personal
    const persCats = await request(app)
      .get('/api/categories')
      .set('X-Profile-Id', String(personalProfileId));

    const persNames = persCats.body.data.map((c: any) => c.name);
    expect(persNames).not.toContain('Office Supplies');

    // Verify it appears in Business
    const bizCats = await request(app)
      .get('/api/categories')
      .set('X-Profile-Id', String(businessProfileId));

    const bizNames = bizCats.body.data.map((c: any) => c.name);
    expect(bizNames).toContain('Office Supplies');
  });

  it('should apply category rules in scoped manner', async () => {
    // Create a rule in Business Profile: "Staples" -> "Office Supplies"
    // First get category ID
    const bizCats = await request(app)
      .get('/api/categories')
      .set('X-Profile-Id', String(businessProfileId));
    const officeCat = bizCats.body.data.find(
      (c: any) => c.name === 'Office Supplies'
    );

    await request(app)
      .post('/api/categories/rules')
      .set('X-Profile-Id', String(businessProfileId))
      .send({
        pattern: 'Staples',
        categoryId: officeCat.id,
      });
    expect(201);

    // Create a transaction "Staples" in Business
    // Need Account ID
    const accRes = await request(app)
      .get('/api/accounts')
      .set('X-Profile-Id', String(businessProfileId));
    const businessAcc = accRes.body.data[0];

    await request(app)
      .post('/api/transactions')
      .set('X-Profile-Id', String(businessProfileId))
      .send({
        date: '2024-01-05',
        amount: -15.0,
        type: 'expense',
        description: 'Staples Purchase',
        accountId: businessAcc.id,
        merchantName: 'Staples',
      });

    // Trigger apply (or rely on auto-apply if implemented, but safer to trigger)
    await request(app)
      .post('/api/categories/rules/apply')
      .set('X-Profile-Id', String(businessProfileId));

    // Check if categorized
    const checkTx = await request(app)
      .get('/api/transactions')
      .set('X-Profile-Id', String(businessProfileId));

    const staplesTx = checkTx.body.data.find(
      (t: any) => t.merchantName === 'Staples'
    );
    expect(staplesTx.categoryId).toBe(officeCat.id);

    // Create "Staples" transaction in Personal profile (should NOT be categorized by Business rule)
    // Personal has no rule for Staples
    const persAccRes = await request(app)
      .get('/api/accounts')
      .set('X-Profile-Id', String(personalProfileId));
    const personalAcc = persAccRes.body.data[0];

    await request(app)
      .post('/api/transactions')
      .set('X-Profile-Id', String(personalProfileId))
      .send({
        date: '2024-01-05',
        amount: -15.0,
        type: 'expense',
        description: 'Staples Personal',
        accountId: personalAcc.id,
        merchantName: 'Staples',
      });

    // Trigger apply in Personal
    await request(app)
      .post('/api/categories/rules/apply')
      .set('X-Profile-Id', String(personalProfileId));

    const checkPersTx = await request(app)
      .get('/api/transactions')
      .set('X-Profile-Id', String(personalProfileId));

    const staplesPersTx = checkPersTx.body.data.find(
      (t: any) => t.description === 'Staples Personal'
    );
    expect(staplesPersTx.categoryId).toBeNull(); // Should not use rule from other profile
  });

  it('should cleanup test data by deleting the business profile', async () => {
    // Delete the business profile created during tests
    // This also deletes all associated accounts, transactions, categories, etc. via CASCADE
    const res = await request(app).delete(`/api/profiles/${businessProfileId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify the profile no longer exists
    const profilesRes = await request(app).get('/api/profiles');
    const profileIds = profilesRes.body.data.map((p: any) => p.id);
    expect(profileIds).not.toContain(businessProfileId);
  });
});
