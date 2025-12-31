/**
 * Tests for wa-sqlite API compatibility
 * Verifies that the Database class uses the correct wa-sqlite methods
 */

import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

// Mock the wa-sqlite module
vi.mock('@journeyapps/wa-sqlite/dist/wa-sqlite-async.mjs', () => ({
  default: vi.fn().mockResolvedValue({
    _sqlite3_malloc: vi.fn(),
    _sqlite3_free: vi.fn(),
    _getSqliteFree: vi.fn(),
    HEAPU8: new Uint8Array(1024),
    setValue: vi.fn(),
    getValue: vi.fn(),
  }),
}));

vi.mock('@journeyapps/wa-sqlite', () => ({
  Factory: vi.fn().mockReturnValue({
    open_v2: vi.fn().mockResolvedValue(1),
    close: vi.fn().mockResolvedValue(0),
    exec: vi.fn().mockResolvedValue(0),
    statements: vi.fn().mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield 1; // Mock statement handle
      },
    }),
    step: vi.fn().mockResolvedValue(101), // SQLITE_DONE
    reset: vi.fn().mockResolvedValue(0),
    finalize: vi.fn().mockResolvedValue(0),
    bind: vi.fn().mockReturnValue(0),
    bind_collection: vi.fn().mockReturnValue(0),
    column: vi.fn(),
    column_count: vi.fn().mockReturnValue(0),
    column_name: vi.fn(),
    column_names: vi.fn().mockReturnValue([]),
    row: vi.fn().mockReturnValue([]),
    changes: vi.fn().mockReturnValue(0),
    last_insert_id: vi.fn().mockReturnValue(0),
    vfs_register: vi.fn().mockReturnValue(0),
  }),
}));

vi.mock('@journeyapps/wa-sqlite/src/examples/OPFSAnyContextVFS.js', () => ({
  OPFSAnyContextVFS: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

describe('wa-sqlite API', () => {
  describe('SQLiteAPI type definition', () => {
    it('should use statements() instead of prepare_v2()', async () => {
      // Import the actual source to check the type definition
      const sourceCode = fs.readFileSync(
        path.join(import.meta.dirname, '../../packages/database/src/wa-sqlite.ts'),
        'utf-8'
      );

      // Verify prepare_v2 is NOT in the type definition
      expect(sourceCode).not.toContain('prepare_v2:');
      expect(sourceCode).not.toContain('await this.sqlite3.prepare_v2');

      // Verify statements IS in the type definition
      expect(sourceCode).toContain('statements:');
      expect(sourceCode).toContain('this.sqlite3.statements(');
    });

    it('should use last_insert_id() instead of last_insert_rowid()', async () => {
      const sourceCode = fs.readFileSync(
        path.join(import.meta.dirname, '../../packages/database/src/wa-sqlite.ts'),
        'utf-8'
      );

      // Verify correct method name
      expect(sourceCode).toContain('last_insert_id:');
      expect(sourceCode).toContain('.last_insert_id(');
      expect(sourceCode).not.toContain('last_insert_rowid:');
    });
  });

  describe('compiled output verification', () => {
    it('should not contain prepare_v2 in compiled JS', async () => {
      const compiledCode = fs.readFileSync(
        path.join(import.meta.dirname, '../../packages/database/dist/wa-sqlite.js'),
        'utf-8'
      );

      expect(compiledCode).not.toContain('prepare_v2');
    });

    it('should contain statements method calls in compiled JS', async () => {
      const compiledCode = fs.readFileSync(
        path.join(import.meta.dirname, '../../packages/database/dist/wa-sqlite.js'),
        'utf-8'
      );

      expect(compiledCode).toContain('.statements(');
    });
  });
});

describe('wa-sqlite method availability', () => {
  it('should verify wa-sqlite exports the expected methods', async () => {
    // Read the actual wa-sqlite source to verify available methods
    const waSqliteApi = fs.readFileSync(
      path.join(import.meta.dirname, '../../node_modules/@journeyapps/wa-sqlite/src/sqlite-api.js'),
      'utf-8'
    );

    // Verify the methods we use exist
    expect(waSqliteApi).toContain('sqlite3.statements');
    expect(waSqliteApi).toContain('sqlite3.step');
    expect(waSqliteApi).toContain('sqlite3.finalize');
    expect(waSqliteApi).toContain('sqlite3.bind_collection');
    expect(waSqliteApi).toContain('sqlite3.column_names');
    expect(waSqliteApi).toContain('sqlite3.row');
    expect(waSqliteApi).toContain('sqlite3.exec');
    expect(waSqliteApi).toContain('sqlite3.open_v2');
    expect(waSqliteApi).toContain('sqlite3.close');
    expect(waSqliteApi).toContain('sqlite3.changes');
    expect(waSqliteApi).toContain('sqlite3.last_insert_id');
    expect(waSqliteApi).toContain('sqlite3.vfs_register');

    // Verify prepare_v2 does NOT exist
    expect(waSqliteApi).not.toContain('sqlite3.prepare_v2');
  });
});
