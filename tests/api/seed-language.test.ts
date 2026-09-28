import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../apps/api/src/app';
import { initializeDatabase, query } from '../../apps/api/src/db/index.js';

describe('API seeded data language', () => {
  it('preserves English profile categories when the API initializes again', async () => {
    const created = await request(app)
      .post('/api/profiles')
      .set('X-Language', 'en')
      .send({ name: 'English profile', type: 'personal' });
    expect(created.status).toBe(201);
    const profileId = Number(created.body.data.id);

    initializeDatabase();
    const names = query<{ name: string }>(
      'SELECT name FROM categories WHERE profile_id = ?',
      [profileId]
    ).map((category) => category.name);
    expect(names).toContain('Salary');
    expect(names).not.toContain('Salaris');
  });

  it('uses the request language for new profile categories and demo records', async () => {
    const created = await request(app)
      .post('/api/profiles')
      .set('X-Language', 'en')
      .send({ name: 'Language test', type: 'personal' });
    expect(created.status).toBe(201);
    const profileId = Number(created.body.data.id);

    const categoryNames = () =>
      query<{ name: string }>(
        'SELECT name FROM categories WHERE profile_id = ?',
        [profileId]
      ).map((category) => category.name);
    expect(categoryNames()).toContain('Housing & Living');
    expect(categoryNames()).not.toContain('Wonen & Huisvesting');

    for (const language of ['en', 'nl'] as const) {
      const seeded = await request(app)
        .post(`/api/profiles/${profileId}/seed-demo`)
        .set('X-Language', language === 'en' ? 'nl' : 'en')
        .send({ language });
      expect(seeded.status).toBe(200);

      const accounts = query<{ name: string }>(
        'SELECT name FROM accounts WHERE profile_id = ? ORDER BY order_index',
        [profileId]
      );
      expect(accounts.map((account) => account.name)).toEqual(
        language === 'en'
          ? ['Demo checking account', 'Demo savings account']
          : ['Demo Betaalrekening', 'Demo Spaarrekening']
      );
      const salary = language === 'en' ? 'Salary' : 'Salaris';
      const salaryRows = query<{
        description: string;
        category: string | null;
        payment_method: string | null;
      }>(
        `SELECT t.description, t.payment_method, c.name AS category FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         WHERE t.profile_id = ? AND t.opposing_account_iban = 'NL00DEMO0050000001'`,
        [profileId]
      );
      expect(salaryRows.length).toBeGreaterThan(0);
      expect(
        salaryRows.every(
          (row) =>
            row.description === salary &&
            row.category === salary &&
            row.payment_method === 'transfer'
        )
      ).toBe(true);
      expect(
        query('SELECT id FROM budgets WHERE profile_id = ?', [profileId])
      ).toHaveLength(5);
      expect(
        query<{ payment_method: string | null }>(
          'SELECT payment_method FROM transactions WHERE profile_id = ?',
          [profileId]
        ).every((transaction) =>
          ['transfer', 'incasso', 'pin', 'iDEAL'].includes(
            String(transaction.payment_method)
          )
        )
      ).toBe(true);
      const uncategorizedNames = new Set([
        'Salon Nova',
        'Bistro Kora',
        'Albert Heijn',
        'Jan de Vries',
        language === 'en' ? 'Jansen family' : 'Familie Jansen',
        language === 'en' ? 'Marktplaats seller' : 'Marktplaats Verkoper',
      ]);
      const uncategorized = query<{
        type: string;
        opposing_account_name: string;
      }>(
        `SELECT type, opposing_account_name FROM transactions
         WHERE profile_id = ? AND category_id IS NULL`,
        [profileId]
      );
      expect(
        uncategorized.every(
          (transaction) =>
            transaction.type === 'transfer' ||
            uncategorizedNames.has(transaction.opposing_account_name)
        )
      ).toBe(true);
      expect(
        query<{ description: string }>(
          "SELECT description FROM transactions WHERE profile_id = ? AND merchant_name = 'Salon Nova'",
          [profileId]
        ).map((row) => row.description)
      ).toEqual(Array(3).fill(language === 'en' ? 'Haircut' : 'Knipbeurt'));
      expect(
        query<{ merchant_name: string }>(
          'SELECT merchant_name FROM recurring_patterns WHERE profile_id = ? AND avg_amount > 0',
          [profileId]
        )[0].merchant_name
      ).toBe(language === 'en' ? 'Employer Ltd.' : 'Werkgever B.V.');
    }

    const before = categoryNames();
    const invalid = await request(app)
      .post(`/api/profiles/${profileId}/seed-demo`)
      .send({ language: 'fr' });
    expect(invalid.status).toBe(400);
    expect(categoryNames()).toEqual(before);

    const fromHeader = await request(app)
      .post(`/api/profiles/${profileId}/seed-demo`)
      .set('X-Language', 'en')
      .send({});
    expect(fromHeader.status).toBe(200);
    expect(categoryNames()).toContain('Housing & Living');

    const defaultLanguage = await request(app)
      .post(`/api/profiles/${profileId}/seed-demo`)
      .send({});
    expect(defaultLanguage.status).toBe(200);
    expect(categoryNames()).toContain('Wonen & Huisvesting');
  });

  it.each([
    ['en', 'Demo checking account', 'Housing & Living'],
    ['nl', 'Demo Betaalrekening', 'Wonen & Huisvesting'],
  ] as const)(
    'restores %s demo records after an API reset',
    async (language, accountName, categoryName) => {
      const reset = await request(app)
        .delete('/api/data/reset')
        .set('X-Language', language);
      expect(reset.status).toBe(200);
      const profileId = Number(reset.body.data.demoProfileId);
      expect(
        query<{ name: string }>(
          'SELECT name FROM accounts WHERE profile_id = ? ORDER BY order_index',
          [profileId]
        )[0].name
      ).toBe(accountName);
      expect(
        query<{ name: string }>(
          'SELECT name FROM categories WHERE profile_id = ?',
          [profileId]
        ).map((category) => category.name)
      ).toContain(categoryName);
    }
  );
});
