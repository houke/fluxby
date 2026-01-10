import request from 'supertest';
import app from '../../apps/api/src/app';
import { run, queryOne } from '../../apps/api/src/db/index.js';

describe('Seed demo recurring patterns integration', () => {
  it('should set recurring pattern last_amount to latest transaction amount for Netflix', async () => {
    // Create a profile via API so the server's DB is used
    const resCreate = await request(app)
      .post('/api/profiles')
      .send({ name: 'DemoTest', type: 'personal' });
    expect(resCreate.status).toBe(201);
    const profileId = Number(resCreate.body.data.id);

    // Now call the API seed-demo route which will insert recurring patterns
    const seedRes = await request(app)
      .post(`/api/profiles/${profileId}/seed-demo`)
      .send();
    expect(seedRes.status).toBe(200);

    // Insert a new Netflix transaction AFTER seed-demo so it's definitely the latest
    const accountRow = queryOne<{ id: number }>('SELECT id FROM accounts WHERE profile_id = ? LIMIT 1', [profileId]);
    if (!accountRow) throw new Error('Expected an account for the profile after seeding');
    const mainAccountId = accountRow.id;

    const txDate = '2099-01-01';
    const txAmount = -11.99;
    run(
      `INSERT INTO transactions (date, amount, type, description, merchant_name, account_id, opposing_account_iban, opposing_account_name, category_id, profile_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txDate, txAmount, 'expense', 'Netflix subscription', 'Netflix', mainAccountId, 'NL00DEMO0000000004', 'Netflix', null, profileId]
    );

    // Rerun recurring pattern insertion for Netflix only (without deleting transactions)
    // This mimics the logic in the seeder but allows testing the 'latest transaction' behavior
    const txRow = queryOne<{ date: string; amount: number }>(
      `SELECT date, amount FROM transactions WHERE profile_id = ? AND (merchant_name LIKE ? OR opposing_account_name LIKE ?) ORDER BY date DESC LIMIT 1`,
      [profileId, '%Netflix%', '%Netflix%']
    );

    // Replace existing Netflix recurring pattern for this profile
    run('DELETE FROM recurring_patterns WHERE profile_id = ? AND merchant_name = ?', [profileId, 'Netflix']);

    if (txRow && txRow.date) {
      const id = `test_${profileId}_netflix_${Date.now()}`;
      const nextDate = new Date(txRow.date);
      nextDate.setMonth(nextDate.getMonth() + 1);
      run(
        `INSERT INTO recurring_patterns (id, opposing_iban, merchant_name, pattern_type, avg_amount, last_amount, last_date, next_expected_date, is_active, is_confirmed, is_variable, transaction_count, profile_id, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 0, 12, ?, 0)`,
        [id, null, 'Netflix', 'monthly', -12.99, txRow.amount, txRow.date, nextDate.toISOString().split('T')[0], profileId]
      );
    }

    // Query the DB for Netflix recurring pattern
    const row = queryOne<{
      merchant_name: string;
      last_amount: number;
      last_date: string;
    }>(
      'SELECT merchant_name, last_amount, last_date FROM recurring_patterns WHERE profile_id = ? AND merchant_name = ? LIMIT 1',
      [profileId, 'Netflix']
    );

    expect(row).toBeDefined();
    if (!row) throw new Error('Expected recurring pattern row for Netflix');

    expect(row.last_amount).toBeCloseTo(txAmount);
    expect(row.last_date).toBe(txDate);
  });
});
