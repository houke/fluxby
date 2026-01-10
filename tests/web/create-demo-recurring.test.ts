import { describe, it, expect } from 'vitest';

// Lightweight test that verifies insertDemoRecurringPatterns uses the latest tx when present
import { insertDemoRecurringPatterns } from '../../apps/web/src/lib/data-service';

describe('web createDemoData recurring patterns', () => {
  it('uses latest transaction date/amount for Netflix (fake db)', async () => {
    const inserts: Array<{ sql: string; params: any[] }> = [];

    // Fake DB with queryOneAsync returning Netflix latest tx
    const fakeDb: any = {
      queryOneAsync: async (sql: string, params: any[]) => {
        if (params[1] && (params[1] as string).includes('Netflix')) {
          return { date: '2025-12-10', amount: -13.5 };
        }
        return null;
      },
      runAsync: async (sql: string, params: any[]) => {
        inserts.push({ sql, params });
        return { lastInsertRowid: 1 };
      },
    };

    await insertDemoRecurringPatterns(
      fakeDb,
      'demo-profile',
      new Date('2025-12-20')
    );

    // Find an INSERT into recurring_patterns in captured inserts
    const recInsert = inserts.find((i) =>
      i.sql.includes('INSERT INTO recurring_patterns')
    );
    expect(recInsert).toBeDefined();
    if (!recInsert) throw new Error('No recurring_patterns insert captured');

    const lastAmount = recInsert.params[5];
    const lastDate = recInsert.params[6];

    expect(lastAmount).toBe(-13.5);
    expect(lastDate).toBe('2025-12-10');
  });
});
