import request from 'supertest';
import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../apps/api/src/app';
import { queryOne, run } from '../../apps/api/src/db/index.js';

describe('Recurring calendar timezone stability', () => {
  const server = createServer(app);
  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  });
  afterAll(async () => {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('projects monthly entries from date-only strings without timezone drift', async () => {
    try {
      run(
        'ALTER TABLE recurring_patterns ADD COLUMN is_dismissed INTEGER DEFAULT 0'
      );
    } catch {
      // Column already exists in newer schemas.
    }

    const createResponse = await request(server)
      .post('/api/profiles')
      .send({ name: 'Recurring Calendar TZ', type: 'personal' });

    expect(createResponse.status).toBe(201);
    const profileId = Number(createResponse.body.data.id);

    run(
      `INSERT INTO recurring_patterns (
        id, opposing_iban, merchant_name, pattern_type, avg_amount,
        last_amount, last_date, next_expected_date,
        is_active, is_confirmed, is_dismissed, is_variable,
        transaction_count, profile_id, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 0, 0, ?, ?, 0)`,
      [
        `tz_calendar_${profileId}`,
        null,
        'Timezone Test Subscription',
        'monthly',
        -12.99,
        -12.99,
        '2025-03-01',
        '2025-03-31',
        6,
        profileId,
      ]
    );

    const response = await request(server)
      .get('/api/recurring/calendar')
      .set('X-Profile-Id', String(profileId))
      .query({ startDate: '2025-03-31', endDate: '2025-03-31' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([
      {
        id: `tz_calendar_${profileId}`,
        date: '2025-03-31',
        merchantName: 'Timezone Test Subscription',
        expectedAmount: -12.99,
        patternType: 'monthly',
        isConfirmed: true,
      },
    ]);

    const storedPattern = queryOne<{ next_expected_date: string }>(
      'SELECT next_expected_date FROM recurring_patterns WHERE id = ?',
      [`tz_calendar_${profileId}`]
    );

    expect(storedPattern?.next_expected_date).toBe('2025-03-31');
  });
});
