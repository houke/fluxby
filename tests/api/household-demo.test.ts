import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../apps/api/src/app';
import { db, initializeDatabase, query } from '../../apps/api/src/db/index';

describe('API household demo data', () => {
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
