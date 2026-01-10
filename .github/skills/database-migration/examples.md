# Migration Examples

This file contains real-world examples from the Fluxby codebase.

## Example 1: Adding a Single Column (Simple)

**File**: `006_recurring_dismissed.ts`

```typescript
import type { Migration, MigrationContext } from './index.js';

export const migration006: Migration = {
  version: 6,
  name: 'Add is_dismissed to recurring_patterns',
  up: async (db: MigrationContext) => {
    // Add is_dismissed column to track permanently dismissed suggestions
    try {
      await db.execAsync(
        'ALTER TABLE recurring_patterns ADD COLUMN is_dismissed INTEGER NOT NULL DEFAULT 0;'
      );
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('duplicate column') ||
          err.message.includes('already exists'))
      ) {
        // Already exists
      } else {
        throw err;
      }
    }

    // Migrate existing is_active=0 patterns to is_dismissed=1
    await db.execAsync(
      `UPDATE recurring_patterns SET is_dismissed = 1 WHERE is_active = 0`
    );
  },
  down: async (_db: MigrationContext) => {
    // No-op - SQLite doesn't support DROP COLUMN easily
  },
};
```

**Key Points**:
- Error handling for duplicate column
- Data migration after schema change
- Simple `down` migration (SQLite limitation)

---

## Example 2: Creating a New Table with Indexes

**File**: `005_recurring_patterns.ts`

```typescript
import type { Migration, MigrationContext } from './index.js';

export const migration005: Migration = {
  version: 5,
  name: 'Add recurring patterns for subscriptions',
  up: async (db: MigrationContext) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurring_patterns (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          opposing_iban TEXT,
          merchant_name TEXT,
          pattern_type TEXT CHECK(pattern_type IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
          avg_amount REAL,
          last_amount REAL,
          last_date TEXT,
          next_expected_date TEXT,
          is_active INTEGER DEFAULT 1,
          is_confirmed INTEGER DEFAULT 0,
          is_variable INTEGER DEFAULT 0,
          transaction_count INTEGER DEFAULT 0,
          profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          is_deleted INTEGER NOT NULL DEFAULT 0,
          device_id TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      );
    `);

    // Add indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_patterns_profile ON recurring_patterns(profile_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_patterns_updated_at ON recurring_patterns(updated_at);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_recurring_patterns_merchant ON recurring_patterns(opposing_iban, merchant_name);
    `);
  },
  down: async (db: MigrationContext) => {
    await db.execAsync('DROP TABLE IF EXISTS recurring_patterns');
  },
};
```

**Key Points**:
- Full table definition with constraints
- Multiple indexes for query performance
- Clean rollback with DROP TABLE

---

## Example 3: Seeding Demo Data with Shared Constants

**File**: `007_seed_recurring_patterns.ts`

```typescript
import type { Migration, MigrationContext } from './index.js';
import { DEMO_PROFILE_ID, DEMO_RECURRING_PATTERNS } from '@fluxby/shared';

export const migration007: Migration = {
  version: 7,
  name: 'Seed demo recurring patterns for demo profile',
  up: async (db: MigrationContext) => {
    // Only seed demo recurring patterns if demo profile exists
    const rows = await db.queryAsync<{ id: string }>(
      'SELECT id FROM profiles WHERE id = ? LIMIT 1',
      [DEMO_PROFILE_ID]
    );

    if (!rows || rows.length === 0) return; // No demo profile present

    const patternDate = new Date();
    const now = Date.now();

    for (const p of DEMO_RECURRING_PATTERNS) {
      const id = `demo_${DEMO_PROFILE_ID}_${p.merchantName
        .replace(/\s+/g, '_')
        .toLowerCase()}_${now}`;

      const lastDate = new Date(patternDate);
      lastDate.setDate(3);
      lastDate.setMonth(lastDate.getMonth() - 1);
      const lastDateStr = lastDate.toISOString().split('T')[0];

      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      await db.runAsync(
        `INSERT OR IGNORE INTO recurring_patterns (
          id,
          opposing_iban,
          merchant_name,
          pattern_type,
          avg_amount,
          last_amount,
          last_date,
          next_expected_date,
          is_active,
          is_confirmed,
          is_variable,
          transaction_count,
          profile_id,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          null,
          p.merchantName,
          p.patternType,
          p.avgAmount,
          p.lastAmount,
          lastDateStr,
          nextDateStr,
          1,
          p.isConfirmed ? 1 : 0,
          p.isVariable ? 1 : 0,
          p.transactionCount,
          DEMO_PROFILE_ID,
          now,
        ]
      );
    }
  },

  down: async (db: MigrationContext) => {
    const merchants = DEMO_RECURRING_PATTERNS.map((p) => p.merchantName);
    const placeholders = merchants.map(() => '?').join(',');

    await db.runAsync(
      `DELETE FROM recurring_patterns WHERE profile_id = ? AND merchant_name IN (${placeholders})`,
      [DEMO_PROFILE_ID, ...merchants]
    );
  },
};
```

**Key Points**:
- ✅ Uses shared constants from `@fluxby/shared`
- ✅ Parameterized queries for security
- ✅ Conditional seeding (checks if demo profile exists)
- ✅ Clean rollback using same constants

---

## Example 4: Adding Multiple Columns

**File**: `002_v5_transaction_columns.ts`

```typescript
import type { Migration, MigrationContext } from './index.js';

export const migration002: Migration = {
  version: 2,
  name: 'v5_transaction_columns',
  up: async (db: MigrationContext) => {
    // Add payment_provider
    try {
      await db.execAsync(
        'ALTER TABLE transactions ADD COLUMN payment_provider TEXT;'
      );
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('duplicate column') ||
          err.message.includes('already exists'))
      ) {
        // Already exists, ignore
      } else {
        throw err;
      }
    }

    // Add address_book_id
    try {
      await db.execAsync(
        'ALTER TABLE transactions ADD COLUMN address_book_id TEXT;'
      );
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('duplicate column') ||
          err.message.includes('already exists'))
      ) {
        // Already exists, ignore
      } else {
        throw err;
      }
    }
  },
  down: async (db: MigrationContext) => {
    // No-op
  },
};
```

**Key Points**:
- Multiple ALTER TABLE statements
- Consistent error handling pattern
- Each column change is independent

---

## Common Patterns

### 1. Transaction Wrapper (Performance)
```typescript
await db.transactionAsync(async () => {
  // All operations here
  // Single OPFS sync
});
```

### 2. Parameterized Queries (Security)
```typescript
await db.runAsync(
  'INSERT INTO table (col1, col2) VALUES (?, ?)',
  [value1, value2]
);
```

### 3. Conditional Seeding
```typescript
const exists = await db.queryAsync<{ id: string }>(
  'SELECT id FROM table WHERE condition = ? LIMIT 1',
  [value]
);

if (exists && exists.length > 0) {
  // Seed data
}
```

### 4. Error Handling for ALTER TABLE
```typescript
try {
  await db.execAsync('ALTER TABLE table ADD COLUMN col TEXT');
} catch (err) {
  if (err instanceof Error && err.message.includes('duplicate column')) {
    // Ignore - column exists
  } else {
    throw err;
  }
}
```

### 5. Using Shared Constants
```typescript
import { CONSTANT } from '@fluxby/shared';

// Use in migration
await db.runAsync('INSERT INTO table (id) VALUES (?)', [CONSTANT]);
```
