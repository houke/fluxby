import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SQLite from 'better-sqlite3';
import { Database } from '../../packages/database/src/wa-sqlite';
import type {
  DatabaseOptions,
  AsyncDatabaseConnection,
} from '../../packages/database/src/types';

function databaseWithRows(rows: unknown[][] = []) {
  let rowIndex = -1;
  let finalized = 0;
  const sqlite = {
    statements: vi.fn(async function* () {
      rowIndex = -1;
      try {
        yield 1;
      } finally {
        finalized++;
      }
    }),
    step: vi.fn(async () => (++rowIndex < rows.length ? 100 : 101)),
    column_names: vi.fn(() => ['id', 'amount']),
    row: vi.fn(() => rows[rowIndex]),
    reset: vi.fn(async () => 0),
    bind_collection: vi.fn(),
    exec: vi.fn(async () => 0),
    close: vi.fn(async () => 0),
    changes: vi.fn(() => 1),
    last_insert_id: vi.fn(() => 1),
  };
  const db = new Database({ adapter: {} } as DatabaseOptions);
  Object.assign(db, { db: 1, sqlite3: sqlite, _isOpen: true });
  return { db, sqlite, finalized: () => finalized };
}

function databaseWithNativeSqlite() {
  const native = new SQLite(':memory:');
  native.exec('CREATE TABLE ledger(value TEXT);');
  const calls: string[] = [];
  let statement: SQLite.Statement | undefined;
  let iterator: Iterator<unknown> | undefined;
  let row: unknown[] = [];
  const sqlite = {
    statements: async function* (_db: number, sql: string) {
      calls.push(sql);
      statement = native.prepare(sql).raw();
      iterator = statement.iterate()[Symbol.iterator]();
      try {
        yield 1;
      } finally {
        iterator?.return?.();
      }
    },
    step: async () => {
      if (!iterator) throw new Error('Statement was not prepared');
      const next = iterator.next();
      row = next.value as unknown[];
      return next.done ? 101 : 100;
    },
    column_names: () => {
      if (!statement) throw new Error('Statement was not prepared');
      return statement.columns().map((column) => column.name);
    },
    row: () => row,
    reset: async () => {
      iterator?.return?.();
      return 0;
    },
    exec: vi.fn(async (_db: number, sql: string) => {
      calls.push(sql);
      native.exec(sql);
      return 0;
    }),
    changes: () => 1,
    last_insert_id: () => 1,
  };
  const db = new Database({ adapter: {} } as DatabaseOptions);
  Object.assign(db, { db: 1, sqlite3: sqlite, _isOpen: true });
  return { db, native, sqlite, calls };
}

async function flushMicrotasks() {
  for (let i = 0; i < 40; i++) await Promise.resolve();
}

function requiredConnection(
  connection: AsyncDatabaseConnection | undefined
): AsyncDatabaseConnection {
  if (!connection) throw new Error('Transaction callback did not start');
  return connection;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('WASM database operation resource use', () => {
  it('releases completed operation timers during a large batch', async () => {
    const { db } = databaseWithRows();
    for (let index = 0; index < 300; index++)
      await db.runAsync('UPDATE transactions SET amount = ?', [index]);
    expect(vi.getTimerCount()).toBe(0);
    expect(db.getPendingOperationsInfo()).toEqual([]);
  });

  it('releases the timeout when SQLite rejects an operation', async () => {
    const { db, sqlite, finalized } = databaseWithRows();
    sqlite.step.mockRejectedValueOnce(new Error('Disk full'));
    await expect(
      db.queryAsync('SELECT id, amount FROM transactions')
    ).rejects.toThrow('Disk full');
    expect(vi.getTimerCount()).toBe(0);
    expect(finalized()).toBe(1);
  });

  it('keeps the deadline for an operation that does not complete', async () => {
    const { db, sqlite } = databaseWithRows();
    sqlite.step.mockImplementationOnce(() => new Promise(() => undefined));
    const rejected = expect(
      db.queryAsync('SELECT id, amount FROM transactions')
    ).rejects.toThrow('Database operation timed out');
    await vi.advanceTimersByTimeAsync(60000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('skips a timed-out queued mutation while retaining the running queue owner', async () => {
    const { db, sqlite } = databaseWithRows();
    let release: () => void = () => undefined;
    sqlite.exec.mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          release = () => resolve(0);
        })
    );
    const slow = expect(db.runAsync('UPDATE slow')).rejects.toThrow(
      'timed out'
    );
    const queued = expect(db.runAsync('UPDATE expired')).rejects.toThrow(
      'timed out'
    );
    await vi.advanceTimersByTimeAsync(60000);
    await Promise.all([slow, queued]);
    const next = db.runAsync('UPDATE next');
    await Promise.resolve();
    expect(sqlite.exec).toHaveBeenCalledTimes(1);
    release();
    await next;
    expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
      'UPDATE slow',
      'UPDATE next',
    ]);
    expect(db.getPendingOperationsInfo()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('serializes concurrent transaction bodies until the first commit completes', async () => {
    const { db, sqlite } = databaseWithRows();
    let entered = false;
    let release: () => void = () => undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = db.transactionAsync(async (transaction) => {
      await transaction.runAsync('UPDATE first');
      entered = true;
      await waiting;
      return 1;
    });
    for (let i = 0; i < 20 && !entered; i++) await Promise.resolve();
    expect(entered).toBe(true);
    const second = db.transactionAsync(async (transaction) => {
      await transaction.runAsync('UPDATE second');
      return 2;
    });
    for (let i = 0; i < 20; i++) await Promise.resolve();
    expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
      'BEGIN TRANSACTION',
      'UPDATE first',
    ]);
    release();
    expect(await Promise.all([first, second])).toEqual([1, 2]);
    expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
      'BEGIN TRANSACTION',
      'UPDATE first',
      'COMMIT',
      'BEGIN TRANSACTION',
      'UPDATE second',
      'COMMIT',
    ]);
  });

  it('keeps ordinary reads, writes and raw SQL outside a transaction that rolls back', async () => {
    const { db, native, calls } = databaseWithNativeSqlite();
    let release: () => void = () => undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transaction = db.transactionAsync(async (connection) => {
      await connection.runAsync("INSERT INTO ledger VALUES('rolled back')");
      await waiting;
      throw new Error('Abort transaction');
    });
    const rejected = expect(transaction).rejects.toThrow('Abort transaction');
    await flushMicrotasks();
    const read = db.queryOneAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM ledger'
    );
    const write = db.runAsync("INSERT INTO ledger VALUES('outside write')");
    const raw = db.execAsync("INSERT INTO ledger VALUES('outside exec')");
    await flushMicrotasks();
    expect(calls).toEqual([
      'BEGIN TRANSACTION',
      "INSERT INTO ledger VALUES('rolled back')",
    ]);
    release();
    await rejected;
    expect(await read).toEqual({ count: 0 });
    await Promise.all([write, raw]);
    expect(native.prepare('SELECT value FROM ledger').all()).toEqual([
      { value: 'outside write' },
      { value: 'outside exec' },
    ]);
    native.close();
  });

  it.each(['COMMIT', 'ROLLBACK'])(
    'closes callback acceptance before %s while retaining the connection queue',
    async (ending) => {
      const { db, sqlite } = databaseWithRows();
      let retained: AsyncDatabaseConnection | undefined;
      let release: () => void = () => undefined;
      let entered: () => void = () => undefined;
      const started = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const waiting = new Promise<void>((resolve) => {
        release = resolve;
      });
      sqlite.exec.mockImplementation(async (_handle, sql) => {
        if (sql === ending) {
          entered();
          await waiting;
        }
        return 0;
      });
      const transaction = db.transactionAsync(async (connection) => {
        retained = connection;
        if (ending === 'ROLLBACK') throw new Error('Abort');
      });
      const finished =
        ending === 'ROLLBACK'
          ? expect(transaction).rejects.toThrow('Abort')
          : transaction;
      await started;
      await expect(
        requiredConnection(retained).runAsync('UPDATE late')
      ).rejects.toThrow('not open');
      await expect(
        requiredConnection(retained).execAsync('UPDATE late raw')
      ).rejects.toThrow('not open');
      await expect(
        requiredConnection(retained).queryAsync('SELECT late')
      ).rejects.toThrow('not open');
      await expect(
        requiredConnection(retained).transactionAsync(async () => undefined)
      ).rejects.toThrow('not open');
      const outside = db.runAsync('UPDATE outside');
      await flushMicrotasks();
      expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
        'BEGIN TRANSACTION',
        ending,
      ]);
      release();
      await finished;
      await outside;
      expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
        'BEGIN TRANSACTION',
        ending,
        'UPDATE outside',
      ]);
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it('drains work accepted before the callback returns and rejects new work during that drain', async () => {
    const { db, sqlite } = databaseWithRows();
    let retained: AsyncDatabaseConnection | undefined;
    let accepted: Promise<unknown> | undefined;
    let release: () => void = () => undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    sqlite.exec.mockImplementation(async (_handle, sql) => {
      if (sql === 'UPDATE accepted') await waiting;
      return 0;
    });
    const transaction = db.transactionAsync(async (connection) => {
      retained = connection;
      accepted = connection.runAsync('UPDATE accepted');
      return 42;
    });
    await flushMicrotasks();
    await expect(
      requiredConnection(retained).runAsync('UPDATE late')
    ).rejects.toThrow('not open');
    expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
      'BEGIN TRANSACTION',
      'UPDATE accepted',
    ]);
    release();
    await accepted;
    expect(await transaction).toBe(42);
    expect(sqlite.exec.mock.calls.at(-1)?.[1]).toBe('COMMIT');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('allows an already accepted nested callback to finish after the outer callback returns', async () => {
    const { db, sqlite } = databaseWithRows();
    let outer: AsyncDatabaseConnection | undefined;
    let nestedWork: Promise<unknown> | undefined;
    let release: () => void = () => undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transaction = db.transactionAsync(async (connection) => {
      outer = connection;
      nestedWork = connection.transactionAsync(async (nested) => {
        await waiting;
        await nested.runAsync('UPDATE nested');
      });
    });
    await flushMicrotasks();
    await expect(
      requiredConnection(outer).runAsync('UPDATE late outer')
    ).rejects.toThrow('not open');
    release();
    await nestedWork;
    await transaction;
    const sql = sqlite.exec.mock.calls.map(([, statement]) => statement);
    expect(sql[0]).toBe('BEGIN TRANSACTION');
    expect(sql[1]).toMatch(/^SAVEPOINT fluxby_transaction_/);
    expect(sql[2]).toBe('UPDATE nested');
    expect(sql[3]).toMatch(/^RELEASE SAVEPOINT fluxby_transaction_/);
    expect(sql[4]).toBe('COMMIT');
  });

  it('never reopens a retained scope when retrying a recoverable transaction error', async () => {
    const { db } = databaseWithRows();
    let retained: AsyncDatabaseConnection | undefined;
    let attempts = 0;
    const transaction = db.transactionAsync(async (connection) => {
      attempts++;
      if (attempts === 1) {
        retained = connection;
        throw new Error('disk I/O error');
      }
      await expect(
        requiredConnection(retained).runAsync('UPDATE previous attempt')
      ).rejects.toThrow('not open');
      await connection.runAsync('UPDATE successful retry');
    });
    await vi.advanceTimersByTimeAsync(100);
    await transaction;
    expect(attempts).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits for a timed-out active statement before rolling back and releasing other writes', async () => {
    const { db, native, sqlite, calls } = databaseWithNativeSqlite();
    const execute = sqlite.exec.getMockImplementation();
    if (!execute) throw new Error('SQLite mock was not initialized');
    let release: () => void = () => undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    sqlite.exec.mockImplementation(async (...args) => {
      if (args[1].includes('slow')) await waiting;
      return execute(...args);
    });
    const transaction = db.transactionAsync(async (connection) => {
      await connection.runAsync("INSERT INTO ledger VALUES('slow')");
    });
    const rejected = expect(transaction).rejects.toThrow('timed out');
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(60000);
    const outside = db.runAsync("INSERT INTO ledger VALUES('outside')");
    await flushMicrotasks();
    expect(calls).toEqual(['BEGIN TRANSACTION']);
    release();
    await rejected;
    await outside;
    expect(calls).toEqual([
      'BEGIN TRANSACTION',
      "INSERT INTO ledger VALUES('slow')",
      'ROLLBACK',
      "INSERT INTO ledger VALUES('outside')",
    ]);
    expect(native.prepare('SELECT value FROM ledger').all()).toEqual([
      { value: 'outside' },
    ]);
    native.close();
  });

  it('does not roll back or call the callback when BEGIN fails', async () => {
    const { db, sqlite } = databaseWithRows();
    sqlite.exec.mockRejectedValueOnce(new Error('BEGIN unavailable'));
    const callback = vi.fn(async () => 1);
    await expect(db.transactionAsync(callback)).rejects.toThrow(
      'BEGIN unavailable'
    );
    expect(callback).not.toHaveBeenCalled();
    expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
      'BEGIN TRANSACTION',
    ]);
    await db.runAsync('UPDATE next');
    expect(sqlite.exec.mock.calls.at(-1)?.[1]).toBe('UPDATE next');
  });

  it('expires a queued transaction before BEGIN without abandoning the active owner', async () => {
    const { db, sqlite } = databaseWithRows();
    let release: () => void = () => undefined;
    sqlite.exec.mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          release = () => resolve(0);
        })
    );
    const slow = expect(db.runAsync('UPDATE slow')).rejects.toThrow(
      'timed out'
    );
    const callback = vi.fn(async () => 1);
    const queued = expect(db.transactionAsync(callback)).rejects.toThrow(
      'timed out'
    );
    await vi.advanceTimersByTimeAsync(60000);
    await Promise.all([slow, queued]);
    release();
    await db.runAsync('UPDATE next');
    expect(callback).not.toHaveBeenCalled();
    expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
      'UPDATE slow',
      'UPDATE next',
    ]);
  });

  it('allows an active transaction to span many fast statements beyond the statement deadline', async () => {
    const { db, sqlite } = databaseWithRows();
    let release: () => void = () => undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transaction = db.transactionAsync(async (connection) => {
      await connection.runAsync('UPDATE first');
      await waiting;
      await connection.runAsync('UPDATE final');
      return 'complete';
    });
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(120000);
    release();
    expect(await transaction).toBe('complete');
    expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
      'BEGIN TRANSACTION',
      'UPDATE first',
      'UPDATE final',
      'COMMIT',
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects future operations when rollback cannot establish a clean connection state', async () => {
    const { db, sqlite } = databaseWithRows();
    const original = new Error('Abort original');
    sqlite.exec
      .mockResolvedValueOnce(0)
      .mockRejectedValueOnce(new Error('Rollback failed'));
    await expect(
      db.transactionAsync(async () => {
        throw original;
      })
    ).rejects.toBe(original);
    await expect(db.runAsync('UPDATE unsafe')).rejects.toThrow('not open');
    expect(sqlite.exec.mock.calls.map(([, sql]) => sql)).toEqual([
      'BEGIN TRANSACTION',
      'ROLLBACK',
    ]);
    expect(sqlite.close).toHaveBeenCalledTimes(1);
    await expect(db.initialize()).rejects.toThrow('not open');
  });

  it('keeps nested scoped work isolated with savepoints and closes the callback connection', async () => {
    const { db, native, calls } = databaseWithNativeSqlite();
    let retained: AsyncDatabaseConnection | undefined;
    await db.transactionAsync(async (connection) => {
      retained = connection;
      await connection.runAsync("INSERT INTO ledger VALUES('outer')");
      await expect(
        connection.transactionAsync(async (nested) => {
          await nested.runAsync("INSERT INTO ledger VALUES('inner')");
          throw new Error('Rollback inner');
        })
      ).rejects.toThrow('Rollback inner');
      await connection.runAsync("INSERT INTO ledger VALUES('outer after')");
    });
    expect(
      calls.some((sql) => sql.startsWith('SAVEPOINT fluxby_transaction_'))
    ).toBe(true);
    expect(native.prepare('SELECT value FROM ledger').all()).toEqual([
      { value: 'outer' },
      { value: 'outer after' },
    ]);
    await expect(
      requiredConnection(retained).runAsync("INSERT INTO ledger VALUES('late')")
    ).rejects.toThrow('not open');
    native.close();
  });

  it('reads column metadata once while mapping every result row', async () => {
    const rows = Array.from({ length: 300 }, (_, index) => [index, -index]);
    const { db, sqlite, finalized } = databaseWithRows(rows);
    const result = await db.queryAsync('SELECT id, amount FROM transactions');
    expect(result).toEqual(rows.map(([id, amount]) => ({ id, amount })));
    expect(sqlite.column_names).toHaveBeenCalledTimes(1);
    expect(sqlite.reset).toHaveBeenCalledTimes(1);
    expect(finalized()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops a single-row read after the first result and finalizes it', async () => {
    const { db, sqlite, finalized } = databaseWithRows([
      ['first', 1],
      ['second', 2],
      ['third', 3],
    ]);
    expect(
      await db.queryOneAsync('SELECT id, amount FROM transactions')
    ).toEqual({ id: 'first', amount: 1 });
    expect(sqlite.step).toHaveBeenCalledTimes(1);
    expect(sqlite.row).toHaveBeenCalledTimes(1);
    expect(sqlite.reset).toHaveBeenCalledTimes(1);
    expect(finalized()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns null and finalizes a single-row read without results', async () => {
    const { db, sqlite, finalized } = databaseWithRows();
    expect(await db.queryOneAsync('SELECT id FROM transactions')).toBeNull();
    expect(sqlite.row).not.toHaveBeenCalled();
    expect(sqlite.reset).toHaveBeenCalledTimes(1);
    expect(finalized()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('checks pending migrations without waiting behind its own queue lock', async () => {
    const { db, sqlite } = databaseWithRows([[23]]);
    sqlite.column_names.mockReturnValue(['version']);
    expect(await db.checkPendingMigrations()).toBe(0);
    expect(sqlite.step).toHaveBeenCalledTimes(2);
    expect(db.getPendingOperationsInfo()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
