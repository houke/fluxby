import { describe, it, expect } from 'vitest';

// Lightweight test that verifies insertDemoRecurringPatterns uses the latest tx when present
import {
  createDataService,
  insertDemoRecurringPatterns,
} from '../../apps/web/src/lib/data-service';
import { DEMO_UNCATEGORIZED_EXPENSES } from '@fluxby/shared';

describe('web createDemoData recurring patterns', () => {
  it('seeds the shared uncategorized Jev examples', async () => {
    const transactionRows: unknown[][] = [];
    const fakeDb = {
      queryOneAsync: async () => null,
      runAsync: async (sql: string, params: unknown[]) => {
        if (sql.includes('INSERT INTO transactions')) {
          for (let index = 0; index < params.length; index += 17) {
            transactionRows.push(params.slice(index, index + 17));
          }
        }
        return { changes: 1 };
      },
    };

    await createDataService(fakeDb as never).createDemoData('demo-profile');

    for (const expense of DEMO_UNCATEGORIZED_EXPENSES) {
      expect(
        transactionRows.some(
          (row) =>
            row[5] === expense.name &&
            row[2] === expense.amount &&
            row[9] === null
        )
      ).toBe(true);
    }
  });

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

  it('keeps next expected date stable for monthly date-only recurring patterns', async () => {
    const inserts: Array<{ sql: string; params: any[] }> = [];

    const fakeDb: any = {
      queryOneAsync: async (sql: string, params: any[]) => {
        if (params[1] && (params[1] as string).includes('Netflix')) {
          return { date: '2025-03-01', amount: -12.99 };
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
      new Date('2025-03-15')
    );

    const netflixInsert = inserts.find(
      (insert) =>
        insert.sql.includes('INSERT INTO recurring_patterns') &&
        insert.params[2] === 'Netflix'
    );

    expect(netflixInsert).toBeDefined();
    if (!netflixInsert) {
      throw new Error('No Netflix recurring_patterns insert captured');
    }

    expect(netflixInsert.params[6]).toBe('2025-03-01');
    expect(netflixInsert.params[7]).toBe('2025-04-01');
  });
});
