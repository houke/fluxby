import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { ipKeyGenerator } from 'express-rate-limit';
import request from 'supertest';
import app from '../../apps/api/src/app';
import { db, initializeDatabase, query } from '../../apps/api/src/db/index';
import { sensitiveRateLimiter } from '../../apps/api/src/middleware/rate-limit';

describe('API household demo data', () => {
  beforeEach(() => {
    // Each lifecycle scenario has an independent allowance; production limits
    // still apply to every individual HTTP request in the scenario.
    for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', '::1'])
      sensitiveRateLimiter.resetKey(ipKeyGenerator(ip));
  });
  it('clears seeded household features through the existing full reset contract', async () => {
    const created = await request(app)
      .post('/api/profiles')
      .send({ name: 'Reset household', type: 'personal' });
    expect(created.status).toBe(201);
    const pid = Number(created.body.data.id);
    const seeded = await request(app)
      .post(`/api/profiles/${pid}/seed-demo`)
      .send({ language: 'en' });
    expect(seeded.status).toBe(200);
    expect(
      query('SELECT id FROM savings_goals WHERE profile_id=?', [pid])
    ).toHaveLength(2);
    const reset = await request(app)
      .delete('/api/data/reset')
      .set('X-Language', 'en');
    expect(reset.status).toBe(200);
    expect(query('SELECT id FROM profiles')).toEqual([
      { id: reset.body.data.demoProfileId },
    ]);
    for (const table of [
      'savings_goals',
      'savings_contributions',
      'planning_preferences',
      'net_worth_items',
      'planned_cashflows',
      'household_planning_preferences',
      'import_profiles',
    ])
      expect(query(`SELECT id FROM ${table}`), table).toEqual([]);
    expect(db.pragma('foreign_key_check')).toEqual([]);
    // Leave demo IBANs available for the next independent profile seed.
    db.prepare('DELETE FROM accounts WHERE profile_id=?').run(
      reset.body.data.demoProfileId
    );
  });

  it('preserves existing profile data after a failed household reseed and clears all features through profile deletion', async () => {
    const created = await request(app)
      .post('/api/profiles')
      .send({ name: 'Reseed rollback', type: 'personal' });
    expect(created.status).toBe(201);
    const pid = Number(created.body.data.id);
    const seeded = await request(app)
      .post(`/api/profiles/${pid}/seed-demo`)
      .send({ language: 'en' });
    expect(seeded.status).toBe(200);
    const tables = [
      'accounts',
      'transactions',
      'categories',
      'budgets',
      'address_book',
      'recurring_patterns',
      'savings_goals',
      'savings_contributions',
      'planning_preferences',
      'net_worth_items',
      'planned_cashflows',
      'household_planning_preferences',
      'import_profiles',
    ];
    const snapshot = () =>
      Object.fromEntries(
        tables.map((table) => [
          table,
          createHash('sha256')
            .update(
              JSON.stringify(
                query(`SELECT * FROM ${table} WHERE profile_id=? ORDER BY id`, [
                  pid,
                ])
              )
            )
            .digest('hex'),
        ])
      );
    const before = snapshot();
    db.exec(
      `CREATE TRIGGER block_household_reseed BEFORE INSERT ON planned_cashflows WHEN NEW.profile_id=${pid} BEGIN SELECT RAISE(ABORT,'reseed blocked'); END;`
    );
    const errorLog = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      const failed = await request(app)
        .post(`/api/profiles/${pid}/seed-demo`)
        .send({ language: 'nl' });
      expect(failed.status).toBe(500);
      expect(snapshot()).toEqual(before);
      expect(db.inTransaction).toBe(false);
      expect(db.pragma('foreign_key_check')).toEqual([]);
    } finally {
      db.exec('DROP TRIGGER block_household_reseed');
      errorLog.mockRestore();
    }
    const removed = await request(app).delete(`/api/profiles/${pid}`);
    expect(removed.status).toBe(200);
    for (const table of tables)
      expect(
        query(`SELECT id FROM ${table} WHERE profile_id=?`, [pid]),
        table
      ).toEqual([]);
    expect(query('SELECT id FROM profiles')).not.toEqual([]);
    expect(db.pragma('foreign_key_check')).toEqual([]);
  });

  it('seeds the selected language immediately, replaces previous demo plans and cascades profile deletion', async () => {
    const created = await request(app)
      .post('/api/profiles')
      .send({ name: 'Household demo', type: 'personal' });
    expect(created.status).toBe(201);
    const pid = Number(created.body.data.id);
    for (const language of ['en', 'nl'] as const) {
      const result = await request(app)
        .post(`/api/profiles/${pid}/seed-demo`)
        .set('X-Language', language === 'en' ? 'nl' : 'en')
        .send({ language });
      expect(result.status).toBe(200);
      expect(
        query<{ name: string }>(
          'SELECT name FROM planned_cashflows WHERE profile_id=? ORDER BY amount_cents DESC',
          [pid]
        ).map((row) => row.name)
      ).toEqual(
        language === 'nl'
          ? ['Salaris', 'Vakantiegeld', 'Gemeentelijke belastingen']
          : ['Salary', 'Holiday allowance', 'Municipal taxes']
      );
      expect(
        query<{ name: string }>(
          'SELECT name FROM savings_goals WHERE profile_id=? ORDER BY target_amount DESC',
          [pid]
        ).map((row) => row.name)
      ).toEqual(
        language === 'nl'
          ? ['Noodfonds', 'Vakantie']
          : ['Emergency fund', 'Holiday']
      );
      expect(
        query('SELECT id FROM savings_contributions WHERE profile_id=?', [pid])
      ).toHaveLength(2);
      expect(
        query<{ name: string }>(
          'SELECT name FROM import_profiles WHERE profile_id=?',
          [pid]
        )[0].name
      ).toBe(
        language === 'nl'
          ? 'Mijn Nederlandse bankexport'
          : 'My Dutch bank export'
      );
      expect(
        query<{ variable_daily_cents: number }>(
          'SELECT variable_daily_cents FROM household_planning_preferences WHERE profile_id=?',
          [pid]
        )[0].variable_daily_cents
      ).toBe(1500);
      initializeDatabase();
      expect(
        query<{ name: string }>(
          'SELECT name FROM import_profiles WHERE profile_id=?',
          [pid]
        )[0].name
      ).toBe(
        language === 'nl'
          ? 'Mijn Nederlandse bankexport'
          : 'My Dutch bank export'
      );
    }
    const invalid = await request(app)
      .post(`/api/profiles/${pid}/seed-demo`)
      .send({ language: 'de' });
    expect(invalid.status).toBe(400);
    expect(
      query<{ name: string }>(
        'SELECT name FROM import_profiles WHERE profile_id=?',
        [pid]
      )[0].name
    ).toBe('Mijn Nederlandse bankexport');
    db.prepare('DELETE FROM profiles WHERE id=?').run(pid);
    for (const table of [
      'planned_cashflows',
      'savings_goals',
      'savings_contributions',
      'household_planning_preferences',
      'import_profiles',
    ])
      expect(
        query(`SELECT id FROM ${table} WHERE profile_id=?`, [pid])
      ).toEqual([]);
  });
});
