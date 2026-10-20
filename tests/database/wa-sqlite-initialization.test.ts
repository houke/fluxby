import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SQLite from 'better-sqlite3';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
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
vi.mock('@journeyapps/wa-sqlite/src/examples/IDBBatchAtomicVFS.js', () => ({
  IDBBatchAtomicVFS: { create: async (name: string) => ({ name }) },
}));

let directory: string;
let native: SQLite.Database;
let nativeDefaultCache: number;
beforeEach(() => {
  Database.resetSingletons(true);
  const temporaryRoot = resolve('.nexus/tmp');
  mkdirSync(temporaryRoot, { recursive: true });
  directory = mkdtempSync(resolve(temporaryRoot, 'opfs-cache-regression-'));
  native = new SQLite(resolve(directory, 'database.sqlite'));
  nativeDefaultCache = Number(native.pragma('cache_size', { simple: true }));
  // Reproduce the measured WASM default, independent of the native build flags.
  native.pragma('cache_size = -2000');
  let statement: SQLite.Statement;
  let iterator: Iterator<unknown>;
  let row: unknown[];
  runtime.api = {
    open_v2: async () => 1,
    close: async () => 0,
    vfs_register: () => 0,
    exec: async (_handle: number, sql: string) => {
      native.exec(sql);
      return 0;
    },
    statements: async function* (_handle: number, sql: string) {
      statement = native.prepare(sql).raw();
      iterator = statement.iterate()[Symbol.iterator]();
      try {
        yield 1;
      } finally {
        iterator.return?.();
      }
    },
    step: async () => {
      const next = iterator.next();
      row = next.value as unknown[];
      return next.done ? 101 : 100;
    },
    column_names: () => statement.columns().map((column) => column.name),
    row: () => row,
    reset: async () => {
      iterator.return?.();
      return 0;
    },
  };
  vi.stubGlobal('window', { location: { hostname: 'fluxby.local' } });
  vi.stubGlobal('navigator', { storage: { getDirectory: vi.fn() } });
});
afterEach(async () => {
  await Database.forceClose();
  native.close();
  rmSync(directory, { recursive: true, force: true });
  vi.unstubAllGlobals();
});

async function initialize() {
  return Database.getSingleton({
    autoMigrate: false,
    adapter: {
      initialize: async () => undefined,
      exists: async () => false,
      close: async () => undefined,
      config: {},
    },
  } as unknown as DatabaseOptions);
}

describe('WASM database connection configuration', () => {
  it('gives OPFS a bounded session cache while retaining spill and durable journaling', async () => {
    const db = await initialize();
    expect(await db.queryOneAsync('PRAGMA cache_size')).toEqual({
      cache_size: -32768,
    });
    expect(await db.queryOneAsync('PRAGMA page_size')).toEqual({
      page_size: 4096,
    });
    const spill = await db.queryOneAsync<{ cache_spill: number }>(
      'PRAGMA cache_spill'
    );
    expect(spill?.cache_spill).toBeGreaterThan(0);
    expect(await db.queryOneAsync('PRAGMA journal_mode')).toEqual({
      journal_mode: 'delete',
    });
    expect(await db.queryOneAsync('PRAGMA synchronous')).toEqual({
      synchronous: 2,
    });

    // cache_size applies only to this connection, never to the database header.
    const reopened = new SQLite(resolve(directory, 'database.sqlite'));
    try {
      expect(reopened.pragma('cache_size', { simple: true })).toBe(
        nativeDefaultCache
      );
    } finally {
      reopened.close();
    }
  });

  it('retains the default cache for IndexedDB development connections', async () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    vi.stubGlobal('indexedDB', {});
    const db = await initialize();
    expect(await db.queryOneAsync('PRAGMA cache_size')).toEqual({
      cache_size: -2000,
    });
    expect(await db.queryOneAsync('PRAGMA synchronous')).toEqual({
      synchronous: 2,
    });
  });
});
