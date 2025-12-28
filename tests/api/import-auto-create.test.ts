import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../apps/api/src/app';
import { run, queryOne } from '../../apps/api/src/db';

describe('Import Auto-Create Account', () => {
  beforeEach(() => {
    // Reset DB
    run('DELETE FROM accounts');
    run('DELETE FROM transactions');
    run('DELETE FROM profiles');

    // Create profile
    run('INSERT INTO profiles (id, name, type) VALUES (1, ?, ?)', [
      'Test Profile',
      'personal',
    ]);
  });

  it('should auto-create account for generic import when no account exists', async () => {
    const csvContent =
      'date,amount,description,iban\n2023-01-01,100,Test Transaction,NL01TEST1234567890';
    const mapping = JSON.stringify({
      date: 'date',
      amount: 'amount',
      description: 'description',
      iban: 'iban',
    });

    const response = await request(app)
      .post('/api/import/generic/import')
      .set('X-Profile-ID', '1')
      .field('mapping', mapping)
      .attach('file', Buffer.from(csvContent), 'test.csv');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Check if account was created
    const account = queryOne<{ id: number; name: string; iban: string }>(
      'SELECT * FROM accounts WHERE iban = ?',
      ['NL01TEST1234567890']
    );
    expect(account).toBeDefined();
    // Account is named with last 4 digits of IBAN
    expect(account?.name).toBe('Rekening 7890');
  });
});
