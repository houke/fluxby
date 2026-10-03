import SQLite from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migration022 } from '../../packages/database/src/migrations/022_manual_bill_amounts';

let sqlite: SQLite.Database;
beforeEach(() => {
  sqlite = new SQLite(':memory:');
  sqlite.exec(`CREATE TABLE recurring_patterns (
    id TEXT PRIMARY KEY,avg_amount REAL,last_amount REAL,manual_source INTEGER,
    last_date TEXT,next_expected_date TEXT,pattern_type TEXT,is_confirmed INTEGER,
    updated_at INTEGER,is_deleted INTEGER DEFAULT 0
  );
  INSERT INTO recurring_patterns VALUES
    ('legacy-bill',25,27,1,'2026-09-30','2026-12-30','quarterly',1,100,0),
    ('salary',2500,2500,0,'2026-09-25','2026-10-25','monthly',1,100,0),
    ('fixed-bill',-20,-22,1,'2026-09-20','2026-10-20','monthly',1,100,0);`);
});
afterEach(() => sqlite.close());
describe('legacy manual bill amount migration', () => {
  it('repairs only expense-only manual provenance and preserves dates, cadence, status and recurring income', async () => {
    const before = sqlite
      .prepare('SELECT * FROM recurring_patterns ORDER BY id')
      .all() as Record<string, unknown>[];
    const db = {
      runAsync: async (sql: string, params: unknown[] = []) => {
        const result = sqlite.prepare(sql).run(...params);
        return {
          changes: result.changes,
          lastInsertRowId: Number(result.lastInsertRowid),
        };
      },
    };
    await migration022.up(db as never);
    const after = sqlite
      .prepare('SELECT * FROM recurring_patterns ORDER BY id')
      .all() as Record<string, unknown>[];
    expect(after.find((row) => row.id === 'legacy-bill')).toMatchObject({
      ...before.find((row) => row.id === 'legacy-bill'),
      avg_amount: -25,
      last_amount: -27,
      updated_at: expect.any(Number),
    });
    expect(
      Number(after.find((row) => row.id === 'legacy-bill')?.updated_at)
    ).toBeGreaterThan(100);
    expect(after.filter((row) => row.id !== 'legacy-bill')).toEqual(
      before.filter((row) => row.id !== 'legacy-bill')
    );
    await migration022.up(db as never);
    expect(
      sqlite.prepare('SELECT * FROM recurring_patterns ORDER BY id').all()
    ).toEqual(after);
  });
});
