# Migration System Documentation

## Overview

Fluxby uses a versioned migration system to manage database schema changes. The migration system is designed to handle various edge cases including corrupted state, stale code, and missing schema elements.

## Key Components

| Component                     | Location                                     | Purpose                                    |
| ----------------------------- | -------------------------------------------- | ------------------------------------------ |
| `runner.ts`                   | `packages/database/src/migrations/runner.ts` | Core migration execution and verification  |
| `index.ts`                    | `packages/database/src/migrations/index.ts`  | Migration definitions and version constant |
| `001_initial.ts` - `006_*.ts` | `packages/database/src/migrations/`          | Individual migration scripts               |
| `MigrationGate.tsx`           | `apps/web/src/components/MigrationGate.tsx`  | React component to show migration prompt   |
| `useMigrationCheck.ts`        | `apps/web/src/hooks/useMigrationCheck.ts`    | Hook to check migration status             |

## Storage Keys

| Key                                  | Storage        | Purpose                                   |
| ------------------------------------ | -------------- | ----------------------------------------- |
| `fluxby-db-schema-version`           | localStorage   | Cached DB schema version for quick checks |
| `fluxby-code-migration-version`      | localStorage   | Code's migration version (rarely used)    |
| `fluxby-migrations-complete-session` | sessionStorage | Prevents re-prompting in same session     |

## Migration Scenarios

### Normal Operation

| Scenario              | localStorage | DB schema_version | Code Version | Behavior               |
| --------------------- | ------------ | ----------------- | ------------ | ---------------------- |
| Fresh install         | null         | 0                 | 6            | Run all migrations 1-6 |
| Up to date            | 6            | 6                 | 6            | No action needed       |
| Normal upgrade        | 5            | 5                 | 6            | Run migration 6        |
| Multi-version upgrade | 3            | 3                 | 6            | Run migrations 4, 5, 6 |

### Edge Cases

| Scenario                          | localStorage | DB schema_version | Code Version | Detection                     | Repair Action                               |
| --------------------------------- | ------------ | ----------------- | ------------ | ----------------------------- | ------------------------------------------- |
| Stale code                        | 7            | 7                 | 6            | `isStaleCode()` returns true  | Show "Update your app" warning              |
| Corrupted localStorage (too high) | 15           | 6                 | 6            | Version > `LATEST + 2`        | Reset localStorage to LATEST                |
| localStorage out of sync          | 6            | 3                 | 6            | `verifyAndRepairMigrations()` | Sync localStorage to DB version             |
| Missing table                     | 5            | 5                 | 6            | `verifyTablesExist()`         | Roll back schema_version, re-run migrations |
| Missing column                    | 6            | 6                 | 6            | `verifyColumnsExist()`        | Roll back schema_version, re-run migrations |

### The "is_dismissed" Bug Scenario

**Problem**: User has `fluxby-db-schema-version = 6` in localStorage, but the `is_dismissed` column doesn't exist in `recurring_patterns` table.

**Root Cause**: Migration 6 was recorded as complete in localStorage before the actual ALTER TABLE statement succeeded, possibly due to:

- React StrictMode double-initialization
- Browser crash during migration
- Race condition between localStorage update and DB commit

**Fix Applied**:

1. Added `CRITICAL_COLUMNS_BY_VERSION` to verify columns exist
2. `verifyAndRepairMigrations()` now checks columns, not just tables
3. If `is_dismissed` column is missing but version says 6, rolls back to version 5 and re-runs migration 6

## Verification System

### Critical Tables by Version

```typescript
const CRITICAL_TABLES_BY_VERSION: Record<number, string[]> = {
  1: ['accounts', 'transactions', 'categories', 'profiles', 'schema_version'],
  5: ['recurring_patterns'],
};
```

### Critical Columns by Version

```typescript
const CRITICAL_COLUMNS_BY_VERSION: Record<number, Record<string, string[]>> = {
  6: { recurring_patterns: ['is_dismissed'] },
};
```

## Migration Execution Flow

```
┌─────────────────────────┐
│   App Startup           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Check localStorage      │
│ for pending migrations  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐     ┌──────────────────┐
│ hasNewMigrations()?     │──No─►│ Continue to App  │
└───────────┬─────────────┘     └──────────────────┘
            │ Yes
            ▼
┌─────────────────────────┐
│ Show MigrationPrompt    │
└───────────┬─────────────┘
            │ User clicks "Continue"
            ▼
┌─────────────────────────┐
│ DatabaseProvider init   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ verifyAndRepairMigrations()│
│ - Check critical tables │
│ - Check critical columns│
│ - Fix localStorage sync │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ runMigrations()         │
│ - Run pending migrations│
│ - Update schema_version │
│ - Update localStorage   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ markMigrationsComplete()│
└─────────────────────────┘
```

## AppSettings Version Display

The AppSettings component now displays both database and code versions:

- **Green badge** (normal): Versions match, e.g., `📊 6 / 💻 6`
- **Red badge** (mismatch): Versions differ, shows warning icon. Click to trigger repair.

## Adding New Migrations

When adding a new migration:

1. Create `packages/database/src/migrations/XXX_name.ts`
2. Register in `packages/database/src/migrations/index.ts`
3. Update `LATEST_MIGRATION_VERSION`
4. If migration adds a table: Add to `CRITICAL_TABLES_BY_VERSION`
5. If migration adds columns: Add to `CRITICAL_COLUMNS_BY_VERSION`
6. Add tests in `tests/database/migrations.test.ts`

Example for adding migration 7:

```typescript
// 1. Create 007_new_feature.ts
export const migration007: Migration = {
  version: 7,
  name: 'Add new_feature table',
  up: async (db) => {
    await db.execAsync(`CREATE TABLE new_feature (...)`);
  },
  down: async (db) => {
    await db.execAsync(`DROP TABLE IF EXISTS new_feature`);
  },
};

// 2. Update index.ts
import { migration007 } from './007_new_feature.js';
export const migrations = [..., migration007];
export const LATEST_MIGRATION_VERSION = 7;

// 3. Update runner.ts verification
const CRITICAL_TABLES_BY_VERSION = {
  ...existing,
  7: ['new_feature'],
};
```

## Debugging Migration Issues

### Check Current State

```javascript
// In browser console
localStorage.getItem('fluxby-db-schema-version');
sessionStorage.getItem('fluxby-migrations-complete-session');
```

### Force Re-migration

```javascript
// In browser console
localStorage.removeItem('fluxby-db-schema-version');
sessionStorage.removeItem('fluxby-migrations-complete-session');
location.reload();
```

### Check Actual DB Version

The actual version is stored in the `schema_version` table inside the SQLite database in OPFS.
