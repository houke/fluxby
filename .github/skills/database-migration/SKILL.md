---
name: database-migration
description: Safe database schema changes for Fluxby's custom migration system. Handles OPFS, Tauri, and Node.js SQLite backends with verification and repair capabilities.
---

# Skill Instructions

## Purpose

This skill helps accomplish safe database schema changes in Fluxby's custom migration system, which supports:

- **OPFS** (Origin Private File System) for web browsers
- **Tauri** local SQLite for desktop apps
- **Node.js** SQLite for the optional API server

The system includes automatic verification, repair of corrupted states, and localStorage tracking.

## When to Use

Activate this skill when you need to:

- Add or modify database tables
- Add or remove columns
- Create indexes
- Seed demo data
- Handle edge cases (corrupted localStorage, missing columns)

## Migration System Architecture

### Key Files

- `packages/database/src/migrations/index.ts` - Migration registry and version constant
- `packages/database/src/migrations/runner.ts` - Execution and verification engine
- `packages/database/src/migrations/00X_*.ts` - Individual migration files
- `docs/MIGRATIONS.md` - Complete system documentation

### Storage Keys

- `fluxby-db-schema-version` (localStorage) - Cached DB version
- `fluxby-migrations-complete-session` (sessionStorage) - Prevents re-prompting

## Resources

This skill includes several helper files to make migration development easier:

- **`migration-template.ts`**: Copy-paste template for new migrations with all common patterns
- **`examples.md`**: Real-world migration examples from the Fluxby codebase
- **`checklist.md`**: Step-by-step checklist to ensure nothing is missed

## Creating a New Migration

### Quick Start

1. **Copy the template**:

   ```bash
   cp .github/skills/database-migration/migration-template.ts \
      packages/database/src/migrations/008_your_feature.ts
   ```

2. **Update the migration** (follow examples.md for patterns)

3. **Use the checklist** (checklist.md) to verify everything

### Step 1: Create Migration File

Create `packages/database/src/migrations/00X_feature_name.ts`:

```typescript
import type { Migration, MigrationContext } from './index.js';

export const migration00X: Migration = {
  version: X,
  name: 'Brief description of what this migration does',
  up: async (db: MigrationContext) => {
    // Forward migration - use transactions for performance
    await db.transactionAsync(async () => {
      // Create tables
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS new_table (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          name TEXT NOT NULL,
          profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          is_deleted INTEGER NOT NULL DEFAULT 0,
          device_id TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);

      // Create indexes
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_new_table_profile 
        ON new_table(profile_id)
      `);

      // Add columns to existing tables
      try {
        await db.execAsync(
          'ALTER TABLE existing_table ADD COLUMN new_col TEXT'
        );
      } catch (err) {
        if (err instanceof Error && err.message.includes('duplicate column')) {
          // Already exists, ignore
        } else {
          throw err;
        }
      }

      // Seed data with parameterized queries
      await db.runAsync(
        'INSERT INTO new_table (id, name, profile_id) VALUES (?, ?, ?)',
        [crypto.randomUUID(), 'Example', 'demo-profile-id']
      );
    });
  },

  down: async (db: MigrationContext) => {
    // Rollback migration (optional but recommended)
    await db.execAsync('DROP TABLE IF EXISTS new_table');
  },
};
```

### Step 2: Register Migration

Update `packages/database/src/migrations/index.ts`:

```typescript
import { migration00X } from './00X_feature_name.js';

export const migrations: Migration[] = [
  migration001,
  migration002,
  // ... existing migrations
  migration00X,
];

export const LATEST_MIGRATION_VERSION = X;
```

### Step 3: Add Verification (if critical)

If your migration adds critical tables or columns, add verification in `runner.ts`:

```typescript
const CRITICAL_TABLES_BY_VERSION: Record<number, string[]> = {
  1: ['accounts', 'transactions', 'categories'],
  X: ['new_table'], // Your new table
};

const CRITICAL_COLUMNS_BY_VERSION: Record<number, Record<string, string[]>> = {
  6: { recurring_patterns: ['is_dismissed'] },
  X: { existing_table: ['new_col'] }, // Your new column
};
```

## Performance Best Practices

### ✅ Use Transactions for Bulk Operations

```typescript
// Wrap all migration operations in a transaction
await db.transactionAsync(async () => {
  // All your schema changes here
  // Single OPFS sync at commit
});
```

### ✅ Use Parameterized Queries

```typescript
// Secure and efficient
await db.runAsync('INSERT INTO table (col1, col2) VALUES (?, ?)', [
  value1,
  value2,
]);
```

### ❌ Avoid String Concatenation

```typescript
// SQL injection risk and parsing overhead
await db.execAsync(`INSERT INTO table VALUES ('${value1}', '${value2}')`);
```

### ✅ Use Shared Constants

```typescript
// Import from @fluxby/shared for consistency
import { DEMO_PROFILE_ID, DEMO_RECURRING_PATTERNS } from '@fluxby/shared';
```

## Testing Migrations

1. Build packages: `npm run build:packages`
2. Run migration tests: `npx vitest tests/database/migrations.test.ts`
3. Test full migration flow: `npm run dev` (fresh OPFS database)

## Edge Case Handling

The migration system automatically handles:

- **Corrupted localStorage** (version > LATEST + 2) → Reset to LATEST
- **Missing tables** → Roll back version, re-run migrations
- **Missing columns** → Roll back version, re-run migrations
- **Stale code** (DB version > code version) → Show "Update your app" warning

## Troubleshooting

### Migration Fails to Run

- Check `LATEST_MIGRATION_VERSION` matches highest migration number
- Verify migration is imported in `index.ts`
- Check browser console for errors

### Column Already Exists Error

- Wrap ALTER TABLE in try/catch with duplicate column check
- See migration 002 or 006 for examples

### localStorage Out of Sync

- System automatically repairs via `verifyAndRepairMigrations()`
- Manually clear: `localStorage.removeItem('fluxby-db-schema-version')`

## Documentation

After creating a migration:

- [ ] Update `LATEST_MIGRATION_VERSION` in `index.ts`
- [ ] Update version tables in `docs/MIGRATIONS.md`
- [ ] Add to AGENTS.md if it affects demo data or critical features
- [ ] Test on fresh database (clear OPFS, reload page)
