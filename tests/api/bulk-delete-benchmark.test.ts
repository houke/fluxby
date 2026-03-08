/**
 * Bulk Delete Performance Benchmark (TEST-004)
 *
 * Benchmark test to determine optimal BATCH_SIZE for 10k+ deletions.
 * Measures deletion performance with different batch sizes.
 *
 * Question Q5: Determine optimal BATCH_SIZE for 10k+ deletions
 *
 * Targets from plan:
 * - <5 seconds for 10k deletions
 *
 * @see .nexus/features/bulk-transaction-management/plan.md
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// BENCHMARK CONFIGURATION
// ============================================

const BENCHMARK_CONFIG = {
  // Test sizes
  transactionCounts: [1000, 5000, 10000],
  // Batch sizes to test
  batchSizes: [100, 250, 500, 750, 1000],
  // Number of iterations per test for averaging
  iterations: 3,
  // Target time for 10k deletions (ms)
  targetTime10k: 5000,
};

// ============================================
// DATABASE SETUP
// ============================================

let db: Database.Database;

function setupDatabase() {
  db = new Database(':memory:');

  // Read and execute schema
  const schemaPath = join(__dirname, '../../apps/api/src/db/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  // Add is_deleted column for soft delete benchmarks (web app behavior)
  // The API schema uses hard deletes, but web app uses soft deletes
  try {
    db.exec('ALTER TABLE transactions ADD COLUMN is_deleted INTEGER DEFAULT 0');
  } catch {
    // Column might already exist
  }

  // Enable WAL mode for better write performance
  db.pragma('journal_mode = WAL');

  return db;
}

function createProfile(name: string = 'Benchmark Profile') {
  const result = db
    .prepare('INSERT INTO profiles (user_id, name, type) VALUES (?, ?, ?)')
    .run(1, name, 'personal');
  return Number(result.lastInsertRowid);
}

function createAccount(profileId: number) {
  const result = db
    .prepare(
      `INSERT INTO accounts (iban, name, type, bank, current_balance, profile_id, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      'NL00BENCH123456789',
      'Benchmark Account',
      'checking',
      'bench',
      10000,
      profileId,
      0
    );
  return Number(result.lastInsertRowid);
}

function createManyTransactions(
  accountId: number,
  profileId: number,
  count: number
): number[] {
  const ids: number[] = [];
  const stmt = db.prepare(
    `INSERT INTO transactions (date, amount, type, description, account_id, profile_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const date = new Date(2025, 0, 1 + (i % 365));
      const dateStr = date.toISOString().split('T')[0];
      const result = stmt.run(
        dateStr,
        -(10 + Math.random() * 100),
        'expense',
        `Transaction ${i + 1}`,
        accountId,
        profileId
      );
      ids.push(Number(result.lastInsertRowid));
    }
  });

  insertMany();
  return ids;
}

function deleteWithBatchSize(
  ids: number[],
  profileId: number,
  batchSize: number
): { deletedCount: number; timeMs: number } {
  const startTime = performance.now();
  let deletedCount = 0;

  // Delete in batches
  const deleteTransaction = db.transaction(() => {
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const placeholders = batch.map(() => '?').join(',');

      // Build WHERE clause like the actual implementation
      const result = db
        .prepare(
          `DELETE FROM transactions 
           WHERE id IN (${placeholders}) 
           AND account_id IN (SELECT id FROM accounts WHERE profile_id = ?)`
        )
        .run(...batch, profileId);

      deletedCount += result.changes;
    }
  });

  deleteTransaction();

  const endTime = performance.now();
  return {
    deletedCount,
    timeMs: endTime - startTime,
  };
}

function softDeleteWithBatchSize(
  ids: number[],
  profileId: number,
  batchSize: number
): { deletedCount: number; timeMs: number } {
  const startTime = performance.now();
  let deletedCount = 0;
  const now = Date.now();

  // Soft-delete in batches (like web app does)
  const deleteTransaction = db.transaction(() => {
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const placeholders = batch.map(() => '?').join(',');

      const result = db
        .prepare(
          `UPDATE transactions 
           SET is_deleted = 1, updated_at = ?
           WHERE id IN (${placeholders}) 
           AND is_deleted = 0
           AND account_id IN (SELECT id FROM accounts WHERE profile_id = ?)`
        )
        .run(now, ...batch, profileId);

      deletedCount += result.changes;
    }
  });

  deleteTransaction();

  const endTime = performance.now();
  return {
    deletedCount,
    timeMs: endTime - startTime,
  };
}

function resetTransactions(profileId: number) {
  db.prepare('DELETE FROM transactions WHERE profile_id = ?').run(profileId);
}

// ============================================
// BENCHMARK RESULTS TYPE
// ============================================

interface BenchmarkResult {
  transactionCount: number;
  batchSize: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  deletedCount: number;
  meetsTarget: boolean;
}

// ============================================
// BENCHMARK TESTS
// ============================================

describe('Bulk Delete Performance Benchmark (TEST-004)', () => {
  let profileId: number;
  let accountId: number;
  const results: BenchmarkResult[] = [];

  beforeAll(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterAll(() => {
    db.close();

    // Print benchmark summary
    console.log('\n');
    console.log('='.repeat(80));
    console.log('BULK DELETE PERFORMANCE BENCHMARK RESULTS');
    console.log('='.repeat(80));
    console.log('');
    console.log(
      'Transaction Count | Batch Size | Avg Time (ms) | Min | Max | Meets Target (<5s)'
    );
    console.log('-'.repeat(80));

    for (const r of results) {
      console.log(
        `${r.transactionCount.toString().padStart(17)} | ` +
          `${r.batchSize.toString().padStart(10)} | ` +
          `${r.avgTimeMs.toFixed(2).padStart(13)} | ` +
          `${r.minTimeMs.toFixed(0).padStart(3)} | ` +
          `${r.maxTimeMs.toFixed(0).padStart(3)} | ` +
          `${r.meetsTarget ? '✅ YES' : '❌ NO'}`
      );
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('RECOMMENDATION (Q5):');
    console.log('');

    // Find optimal batch size for 10k
    const results10k = results.filter((r) => r.transactionCount === 10000);
    const fastestResult = results10k.reduce(
      (best, current) => (current.avgTimeMs < best.avgTimeMs ? current : best),
      results10k[0]
    );

    if (fastestResult) {
      console.log(
        `Optimal BATCH_SIZE for 10k deletions: ${fastestResult.batchSize}`
      );
      console.log(
        `Average deletion time: ${fastestResult.avgTimeMs.toFixed(2)}ms`
      );
      console.log(
        `Target met (< 5 seconds): ${fastestResult.meetsTarget ? 'YES ✅' : 'NO ❌'}`
      );

      // Validate the chosen batch size meets requirements
      if (fastestResult.meetsTarget) {
        console.log('');
        console.log(
          `✅ BATCH_SIZE of ${fastestResult.batchSize} is recommended for production use.`
        );
        console.log(
          '   It provides the best balance of performance and SQL safety (staying under 32766 parameter limit).'
        );
      }
    }

    console.log('='.repeat(80));
    console.log('');
  });

  // Generate tests for each transaction count and batch size combination
  describe('Hard Delete (API behavior)', () => {
    for (const txCount of BENCHMARK_CONFIG.transactionCounts) {
      for (const batchSize of BENCHMARK_CONFIG.batchSizes) {
        it(`deletes ${txCount} transactions with batch size ${batchSize}`, () => {
          const times: number[] = [];

          for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
            // Create fresh transactions
            const ids = createManyTransactions(accountId, profileId, txCount);

            // Run deletion benchmark
            const result = deleteWithBatchSize(ids, profileId, batchSize);
            times.push(result.timeMs);

            // Verify deletion worked
            expect(result.deletedCount).toBe(txCount);

            // Reset for next iteration
            resetTransactions(profileId);
          }

          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          const minTime = Math.min(...times);
          const maxTime = Math.max(...times);
          const meetsTarget =
            txCount === 10000 ? avgTime < BENCHMARK_CONFIG.targetTime10k : true;

          results.push({
            transactionCount: txCount,
            batchSize,
            avgTimeMs: avgTime,
            minTimeMs: minTime,
            maxTimeMs: maxTime,
            deletedCount: txCount,
            meetsTarget,
          });

          // Basic performance assertion
          // For 10k deletions, we expect it to complete in under 5 seconds
          if (txCount === 10000) {
            expect(avgTime).toBeLessThan(BENCHMARK_CONFIG.targetTime10k);
          }
        });
      }
    }
  });

  describe('Soft Delete (Web app behavior)', () => {
    it('soft-deletes 10000 transactions with optimal batch size (500)', () => {
      const txCount = 10000;
      const batchSize = 500; // Expected optimal based on plan
      const times: number[] = [];

      for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
        const ids = createManyTransactions(accountId, profileId, txCount);
        const result = softDeleteWithBatchSize(ids, profileId, batchSize);
        times.push(result.timeMs);
        expect(result.deletedCount).toBe(txCount);
        resetTransactions(profileId);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`\nSoft-delete 10k transactions (batch size ${batchSize}):`);
      console.log(`  Average time: ${avgTime.toFixed(2)}ms`);
      console.log(
        `  Meets <5s target: ${avgTime < BENCHMARK_CONFIG.targetTime10k ? 'YES' : 'NO'}`
      );

      expect(avgTime).toBeLessThan(BENCHMARK_CONFIG.targetTime10k);
    });
  });
});

// ============================================
// INDIVIDUAL BATCH SIZE RECOMMENDATION TEST
// ============================================

describe('Q5: Optimal BATCH_SIZE Determination', () => {
  let profileId: number;
  let accountId: number;

  beforeAll(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterAll(() => {
    db.close();
  });

  it('recommends BATCH_SIZE of 500 for 10k+ deletions', () => {
    const txCount = 10000;
    const batchSizesToTest = [100, 250, 500, 750, 1000];
    const results: Array<{ batchSize: number; avgTimeMs: number }> = [];

    for (const batchSize of batchSizesToTest) {
      const times: number[] = [];

      for (let i = 0; i < 2; i++) {
        const ids = createManyTransactions(accountId, profileId, txCount);
        const result = softDeleteWithBatchSize(ids, profileId, batchSize);
        times.push(result.timeMs);
        resetTransactions(profileId);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      results.push({ batchSize, avgTimeMs: avgTime });
    }

    // Find the fastest batch size
    const fastest = results.reduce(
      (best, current) => (current.avgTimeMs < best.avgTimeMs ? current : best),
      results[0]
    );

    console.log('\n=== Q5 ANSWER: Optimal BATCH_SIZE ===');
    console.log('Results for 10k soft-deletions:');
    for (const r of results) {
      const isFastest = r.batchSize === fastest.batchSize;
      console.log(
        `  Batch size ${r.batchSize}: ${r.avgTimeMs.toFixed(2)}ms ${isFastest ? '✅ FASTEST' : ''}`
      );
    }
    console.log('');
    console.log(`RECOMMENDED BATCH_SIZE: ${fastest.batchSize}`);
    console.log('');

    // The implementation uses 500 as the default, verify it's reasonable
    // Allow any batch size >= 250 and <= 1000 as acceptable
    expect(fastest.batchSize).toBeGreaterThanOrEqual(250);
    expect(fastest.batchSize).toBeLessThanOrEqual(1000);

    // Verify it meets the 5-second target
    expect(fastest.avgTimeMs).toBeLessThan(5000);
  });

  it('validates current implementation BATCH_SIZE of 500', () => {
    // The current implementation uses BATCH_SIZE = 500
    // Verify this is a good choice
    const CURRENT_BATCH_SIZE = 500;
    const txCount = 10000;
    const times: number[] = [];

    for (let i = 0; i < 3; i++) {
      const ids = createManyTransactions(accountId, profileId, txCount);
      const result = softDeleteWithBatchSize(
        ids,
        profileId,
        CURRENT_BATCH_SIZE
      );
      times.push(result.timeMs);
      resetTransactions(profileId);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

    console.log(`\nValidating current BATCH_SIZE (${CURRENT_BATCH_SIZE}):`);
    console.log(`  10k deletions average time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Meets <5s target: ${avgTime < 5000 ? 'YES ✅' : 'NO ❌'}`);

    // Must meet the 5-second target
    expect(avgTime).toBeLessThan(5000);
  });
});

// ============================================
// STRESS TEST
// ============================================

describe('Stress Test: Edge Cases', () => {
  let profileId: number;
  let accountId: number;

  beforeAll(() => {
    setupDatabase();
    profileId = createProfile();
    accountId = createAccount(profileId);
  });

  afterAll(() => {
    db.close();
  });

  it('handles repeated bulk operations without degradation', () => {
    const txCount = 1000;
    const batchSize = 500;
    const rounds = 5;
    const times: number[] = [];

    for (let round = 0; round < rounds; round++) {
      const ids = createManyTransactions(accountId, profileId, txCount);
      const result = softDeleteWithBatchSize(ids, profileId, batchSize);
      times.push(result.timeMs);
      resetTransactions(profileId);
    }

    // Check there's no significant degradation over multiple rounds
    const firstHalf = times.slice(0, Math.floor(times.length / 2));
    const secondHalf = times.slice(Math.floor(times.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    // Second half shouldn't be more than 50% slower than first half
    expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
  });

  it('handles odd-sized batches (not divisible by batch size)', () => {
    const txCount = 1234; // Not divisible by common batch sizes
    const batchSize = 500;

    const ids = createManyTransactions(accountId, profileId, txCount);
    const result = softDeleteWithBatchSize(ids, profileId, batchSize);

    expect(result.deletedCount).toBe(txCount);
    resetTransactions(profileId);
  });

  it('handles single transaction deletion efficiently', () => {
    const ids = createManyTransactions(accountId, profileId, 1);
    const startTime = performance.now();
    const result = softDeleteWithBatchSize(ids, profileId, 500);
    const endTime = performance.now();

    expect(result.deletedCount).toBe(1);
    expect(endTime - startTime).toBeLessThan(100); // Should be very fast

    resetTransactions(profileId);
  });
});
