import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Database } from '../../packages/database/src/wa-sqlite';
import type { DatabaseOptions } from '../../packages/database/src/types';

const runtime = vi.hoisted(() => ({ api: {} as Record<string, unknown> }));
vi.mock('@journeyapps/wa-sqlite/dist/wa-sqlite-async.mjs', () => ({
  default: async () => ({}),
}));
vi.mock('@journeyapps/wa-sqlite', () => ({ Factory: () => runtime.api }));
vi.mock('@journeyapps/wa-sqlite/src/examples/OPFSAnyContextVFS.js', () => ({
  OPFSAnyContextVFS: {
    create: async (name: string) => ({ name, jWrite: async () => 0 }),
  },
}));

const options = {
  autoMigrate: false,
  adapter: {
    initialize: async () => undefined,
    exists: async () => false,
    close: async () => undefined,
    config: {},
  },
} as unknown as DatabaseOptions;

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

async function flushMicrotasks() {
  for (let index = 0; index < 60; index++) await Promise.resolve();
}

beforeEach(() => {
  Database.resetSingletons(true);
  runtime.api = {
    open_v2: vi.fn(async () => 1),
    close: vi.fn(async () => 0),
    vfs_register: vi.fn(() => 0),
    exec: vi.fn(async () => 0),
    statements: async function* () {
      yield 1;
    },
    step: async () => 101,
    reset: async () => 0,
    changes: () => 1,
    last_insert_id: () => 1,
  };
  vi.stubGlobal('window', { location: { hostname: 'fluxby.local' } });
  vi.stubGlobal('navigator', { storage: { getDirectory: vi.fn() } });
});
afterEach(async () => {
  await Database.forceClose();
  vi.unstubAllGlobals();
});

describe('WASM connection retirement and rollback recovery', () => {
  it('keeps cached wrapper close local while remaining wrappers share the active queue', async () => {
    const db = await Database.getSingleton(options);
    const gate = deferred();
    const calls: string[] = [];
    vi.mocked(
      runtime.api.exec as (_handle: number, sql: string) => Promise<number>
    ).mockImplementation(async (_handle, sql) => {
      calls.push(sql);
      if (sql === 'UPDATE active') await gate.promise;
      return 0;
    });
    const active = db.runAsync('UPDATE active');
    await flushMicrotasks();
    await db.close();
    expect(db.isOpen()).toBe(false);
    expect(runtime.api.close).not.toHaveBeenCalled();
    const wrapper = new Database(options);
    await wrapper.initialize();
    const queued = wrapper.runAsync('UPDATE following wrapper');
    await flushMicrotasks();
    expect(calls).toEqual(['UPDATE active']);
    gate.resolve();
    await Promise.all([active, queued]);
    expect(calls).toEqual(['UPDATE active', 'UPDATE following wrapper']);
    expect(runtime.api.close).not.toHaveBeenCalled();
  });

  it('closes a handle after failed rollback and opens a replacement without reviving old wrappers', async () => {
    const db = await Database.getSingleton(options);
    const wrapper = new Database(options);
    await wrapper.initialize();
    const exec = vi.mocked(
      runtime.api.exec as (...args: unknown[]) => Promise<number>
    );
    exec.mockImplementation(async (_handle, sql) => {
      if (sql === 'ROLLBACK') throw new Error('Rollback failed');
      return 0;
    });
    await expect(
      db.transactionAsync(async () => {
        throw new Error('Abort');
      })
    ).rejects.toThrow('Abort');
    expect(runtime.api.close).toHaveBeenCalledTimes(1);
    expect(db.isOpen()).toBe(false);
    expect(wrapper.isOpen()).toBe(false);
    await expect(wrapper.runAsync('UPDATE unsafe')).rejects.toThrow('not open');
    await expect(db.initialize()).rejects.toThrow('not open');
    const replacement = await Database.getSingleton(options);
    expect(replacement).not.toBe(db);
    expect(runtime.api.open_v2).toHaveBeenCalledTimes(2);
    await replacement.runAsync('UPDATE safe');
  });

  it('refuses to reuse an uncertain cached handle when native close also fails', async () => {
    const db = await Database.getSingleton(options);
    const exec = vi.mocked(
      runtime.api.exec as (...args: unknown[]) => Promise<number>
    );
    exec.mockImplementation(async (_handle, sql) => {
      if (sql === 'ROLLBACK') throw new Error('Rollback failed');
      return 0;
    });
    vi.mocked(runtime.api.close as () => Promise<number>).mockResolvedValue(5);
    await expect(
      db.transactionAsync(async () => {
        throw new Error('Abort');
      })
    ).rejects.toThrow('Abort');
    await expect(Database.getSingleton(options)).rejects.toThrow(
      'could not be closed after rollback failed'
    );
    expect(runtime.api.open_v2).toHaveBeenCalledTimes(1);
  });

  it('shares the operation queue between initialized wrappers and drains it before reinit', async () => {
    const db = await Database.getSingleton(options);
    const wrapper = new Database(options);
    await wrapper.initialize();
    const first = deferred();
    const close = deferred();
    const calls: string[] = [];
    vi.mocked(
      runtime.api.exec as (_handle: number, sql: string) => Promise<number>
    ).mockImplementation(async (_handle, sql) => {
      calls.push(sql);
      if (sql === 'UPDATE active wrapper') await first.promise;
      return 0;
    });
    vi.mocked(runtime.api.close as () => Promise<number>).mockImplementation(
      async () => {
        calls.push('CLOSE');
        await close.promise;
        return 0;
      }
    );
    const active = wrapper.runAsync('UPDATE active wrapper');
    const queued = db.runAsync('UPDATE accepted root');
    await flushMicrotasks();
    const retiring = Database.closeHandleForReinit();
    await expect(wrapper.runAsync('UPDATE late wrapper')).rejects.toThrow(
      'not open'
    );
    await expect(db.queryAsync('SELECT late root')).rejects.toThrow('not open');
    const replacement = Database.getSingleton(options);
    await flushMicrotasks();
    expect(calls).toEqual(['UPDATE active wrapper']);
    expect(runtime.api.open_v2).toHaveBeenCalledTimes(1);
    first.resolve();
    await Promise.all([active, queued]);
    await flushMicrotasks();
    expect(calls).toEqual([
      'UPDATE active wrapper',
      'UPDATE accepted root',
      'CLOSE',
    ]);
    expect(db.isOpen()).toBe(false);
    expect(wrapper.isOpen()).toBe(false);
    close.resolve();
    await retiring;
    expect(await replacement).not.toBe(db);
    expect(runtime.api.open_v2).toHaveBeenCalledTimes(2);
    await expect(wrapper.execAsync('UPDATE obsolete')).rejects.toThrow(
      'not open'
    );
  });

  it('lets active scoped callbacks finish before the retired native handle closes', async () => {
    const db = await Database.getSingleton(options);
    const gate = deferred();
    const calls: string[] = [];
    vi.mocked(
      runtime.api.exec as (_handle: number, sql: string) => Promise<number>
    ).mockImplementation(async (_handle, sql) => {
      calls.push(sql);
      return 0;
    });
    vi.mocked(runtime.api.close as () => Promise<number>).mockImplementation(
      async () => {
        calls.push('CLOSE');
        return 0;
      }
    );
    const transaction = db.transactionAsync(async (connection) => {
      await gate.promise;
      await connection.runAsync('UPDATE accepted transaction');
    });
    await flushMicrotasks();
    const retiring = Database.closeHandleForReinit();
    await flushMicrotasks();
    expect(calls).toEqual(['BEGIN TRANSACTION']);
    gate.resolve();
    await transaction;
    await retiring;
    expect(calls).toEqual([
      'BEGIN TRANSACTION',
      'UPDATE accepted transaction',
      'COMMIT',
      'CLOSE',
    ]);
  });

  it('shares a concurrent retirement without resetting an initializer waiting for it', async () => {
    await Database.getSingleton(options);
    const close = deferred();
    vi.mocked(
      runtime.api.close as () => Promise<number>
    ).mockImplementationOnce(async () => {
      await close.promise;
      return 0;
    });
    const first = Database.closeHandleForReinit();
    const replacement = Database.getSingleton(options);
    const second = Database.closeHandleForReinit();
    close.resolve();
    await Promise.all([first, second]);
    const db = await replacement;
    expect(await Database.getSingleton(options)).toBe(db);
    expect(runtime.api.close).toHaveBeenCalledTimes(1);
    expect(runtime.api.open_v2).toHaveBeenCalledTimes(2);
  });

  it('closes once without deadlock when rollback fails while retirement is draining', async () => {
    const db = await Database.getSingleton(options);
    const gate = deferred();
    vi.mocked(
      runtime.api.exec as (_handle: number, sql: string) => Promise<number>
    ).mockImplementation(async (_handle, sql) => {
      if (sql === 'ROLLBACK') throw new Error('Rollback failed');
      return 0;
    });
    const transaction = db.transactionAsync(async () => {
      await gate.promise;
      throw new Error('Abort');
    });
    const rejected = expect(transaction).rejects.toThrow('Abort');
    await flushMicrotasks();
    const retiring = Database.closeHandleForReinit();
    gate.resolve();
    await Promise.all([rejected, retiring]);
    expect(runtime.api.close).toHaveBeenCalledTimes(1);
    expect((await Database.getSingleton(options)).isOpen()).toBe(true);
    expect(runtime.api.open_v2).toHaveBeenCalledTimes(2);
  });

  it('drains an active statement before beforeunload closes its native handle', async () => {
    vi.resetModules();
    const addEventListener = vi.fn();
    vi.stubGlobal('window', {
      location: { hostname: 'fluxby.local' },
      addEventListener,
    });
    const { Database: UnloadDatabase } =
      await import('../../packages/database/src/wa-sqlite');
    const db = await UnloadDatabase.getSingleton(options);
    const gate = deferred();
    const calls: string[] = [];
    vi.mocked(
      runtime.api.exec as (_handle: number, sql: string) => Promise<number>
    ).mockImplementation(async (_handle, sql) => {
      calls.push(sql);
      await gate.promise;
      return 0;
    });
    vi.mocked(runtime.api.close as () => Promise<number>).mockImplementation(
      async () => {
        calls.push('CLOSE');
        return 0;
      }
    );
    const active = db.runAsync('UPDATE active at unload');
    await flushMicrotasks();
    const handler = addEventListener.mock.calls.find(
      ([event]) => event === 'beforeunload'
    )?.[1] as (() => void) | undefined;
    expect(handler).toBeTypeOf('function');
    handler?.();
    await flushMicrotasks();
    expect(calls).toEqual(['UPDATE active at unload']);
    await expect(db.runAsync('UPDATE after unload')).rejects.toThrow(
      'not open'
    );
    gate.resolve();
    await active;
    await UnloadDatabase.forceClose();
    expect(calls).toEqual(['UPDATE active at unload', 'CLOSE']);
    expect(db.isOpen()).toBe(false);
  });
});
