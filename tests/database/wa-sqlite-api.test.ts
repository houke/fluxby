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
        path.join(
          import.meta.dirname,
          '../../packages/database/src/wa-sqlite.ts'
        ),
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
        path.join(
          import.meta.dirname,
          '../../packages/database/src/wa-sqlite.ts'
        ),
        'utf-8'
      );

      // Verify correct method name
      expect(sourceCode).toContain('last_insert_id:');
      expect(sourceCode).toContain('.last_insert_id(');
      expect(sourceCode).not.toContain('last_insert_rowid:');
    });

    it('should serialize transaction control statements through runAsync()', async () => {
      const sourceCode = fs.readFileSync(
        path.join(
          import.meta.dirname,
          '../../packages/database/src/wa-sqlite.ts'
        ),
        'utf-8'
      );

      expect(sourceCode).toContain("await this.runAsync('BEGIN TRANSACTION')");
      expect(sourceCode).toContain("await this.runAsync('COMMIT')");
      expect(sourceCode).toContain("await this.runAsync('ROLLBACK')");
      expect(sourceCode).not.toContain(
        "await this.execAsync('BEGIN TRANSACTION')"
      );
      expect(sourceCode).not.toContain("await this.execAsync('COMMIT')");
      expect(sourceCode).not.toContain("await this.execAsync('ROLLBACK')");
    });
  });

  describe('compiled output verification', () => {
    const distPath = path.join(
      import.meta.dirname,
      '../../packages/database/dist/wa-sqlite.js'
    );
    const distExists = fs.existsSync(distPath);

    it.skipIf(!distExists)(
      'should not contain prepare_v2 in compiled JS',
      async () => {
        const compiledCode = fs.readFileSync(distPath, 'utf-8');

        expect(compiledCode).not.toContain('prepare_v2');
      }
    );

    it.skipIf(!distExists)(
      'should contain statements method calls in compiled JS',
      async () => {
        const compiledCode = fs.readFileSync(distPath, 'utf-8');

        expect(compiledCode).toContain('.statements(');
      }
    );
  });
});

describe('wa-sqlite method availability', () => {
  it('should verify wa-sqlite exports the expected methods', async () => {
    // Read the actual wa-sqlite source to verify available methods
    const waSqliteApi = fs.readFileSync(
      path.join(
        import.meta.dirname,
        '../../node_modules/@journeyapps/wa-sqlite/src/sqlite-api.js'
      ),
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

// ============================================
// REGRESSION TESTS: transactionAsync Serialization Fix
// ============================================

describe('transactionAsync serialization regression tests', () => {
  it('should use runAsync for BEGIN/COMMIT/ROLLBACK (not execAsync)', async () => {
    // This is a regression test for a critical bug where using execAsync
    // for transaction control caused WASM memory corruption when concurrent
    // queries were running. See wa-sqlite.ts comment for details.
    const sourceCode = fs.readFileSync(
      path.join(
        import.meta.dirname,
        '../../packages/database/src/wa-sqlite.ts'
      ),
      'utf-8'
    );

    // Verify transaction control uses runAsync (which goes through withLock)
    expect(sourceCode).toContain("await this.runAsync('BEGIN TRANSACTION')");
    expect(sourceCode).toContain("await this.runAsync('COMMIT')");
    expect(sourceCode).toContain("await this.runAsync('ROLLBACK')");

    // Verify execAsync is NOT used for transaction control
    expect(sourceCode).not.toContain(
      "await this.execAsync('BEGIN TRANSACTION')"
    );
    expect(sourceCode).not.toContain("await this.execAsync('COMMIT')");
    expect(sourceCode).not.toContain("await this.execAsync('ROLLBACK')");
  });

  it('should have retry logic for OPFS stream errors', async () => {
    const sourceCode = fs.readFileSync(
      path.join(
        import.meta.dirname,
        '../../packages/database/src/wa-sqlite.ts'
      ),
      'utf-8'
    );

    // Verify retry logic exists
    expect(sourceCode).toContain('MAX_RETRIES');
    expect(sourceCode).toContain(
      'for (let attempt = 1; attempt <= MAX_RETRIES'
    );

    // Verify specific OPFS stream error detection
    expect(sourceCode).toContain('closing writable stream');
    expect(sourceCode).toContain('disk I/O error');

    // Verify backoff delay between retries
    expect(sourceCode).toContain('setTimeout(resolve, 100 * attempt)');
  });

  it('should have rollback error handling that does not mask original errors', async () => {
    const sourceCode = fs.readFileSync(
      path.join(
        import.meta.dirname,
        '../../packages/database/src/wa-sqlite.ts'
      ),
      'utf-8'
    );

    // The implementation should catch rollback errors separately and log them,
    // then re-throw the original error
    expect(sourceCode).toContain('catch (rollbackError)');
    expect(sourceCode).toContain('Rollback failed:');
    expect(sourceCode).toContain('throw error'); // Re-throw original error after logging rollback failure
  });

  it('should not use execAsync which bypasses the operation lock', async () => {
    const sourceCode = fs.readFileSync(
      path.join(
        import.meta.dirname,
        '../../packages/database/src/wa-sqlite.ts'
      ),
      'utf-8'
    );

    // Count occurrences of execAsync in transactionAsync method
    // Extract the transactionAsync method body
    const transactionAsyncMatch = sourceCode.match(
      /async transactionAsync<T>\(fn: \(\) => Promise<T>\): Promise<T> \{[\s\S]*?^\s{2}\}/m
    );

    if (transactionAsyncMatch) {
      const methodBody = transactionAsyncMatch[0];
      // execAsync should NOT appear in the transactionAsync method body
      expect(methodBody).not.toContain('this.execAsync');
      // runAsync SHOULD appear
      expect(methodBody).toContain('this.runAsync');
    }
  });

  describe('retry logic implementation', () => {
    it('should have MAX_RETRIES set to 3', async () => {
      const sourceCode = fs.readFileSync(
        path.join(
          import.meta.dirname,
          '../../packages/database/src/wa-sqlite.ts'
        ),
        'utf-8'
      );

      expect(sourceCode).toContain('const MAX_RETRIES = 3');
    });

    it('should check for recoverable stream errors before retrying', async () => {
      const sourceCode = fs.readFileSync(
        path.join(
          import.meta.dirname,
          '../../packages/database/src/wa-sqlite.ts'
        ),
        'utf-8'
      );

      // Should check for specific error patterns
      expect(sourceCode).toContain('isStreamError');
      expect(sourceCode).toContain(
        "errorMessage.includes('closing writable stream')"
      );
      expect(sourceCode).toContain("errorMessage.includes('disk I/O error')");
      expect(sourceCode).toContain("errorMessage.includes('cannot rollback')");
    });
  });
});

// ============================================
// TESTS: Database Type Interface Completeness
// ============================================

describe('Database interface completeness', () => {
  it('should export transactionAsync method in type definition', async () => {
    const sourceCode = fs.readFileSync(
      path.join(
        import.meta.dirname,
        '../../packages/database/src/wa-sqlite.ts'
      ),
      'utf-8'
    );

    // Verify transactionAsync is defined as an async method
    expect(sourceCode).toContain(
      'async transactionAsync<T>(fn: () => Promise<T>): Promise<T>'
    );
  });

  it('should export synchronous transaction method as well', async () => {
    const sourceCode = fs.readFileSync(
      path.join(
        import.meta.dirname,
        '../../packages/database/src/wa-sqlite.ts'
      ),
      'utf-8'
    );

    // Verify synchronous transaction method exists
    expect(sourceCode).toContain('transaction<T>(fn: () => T): T');
  });
});
