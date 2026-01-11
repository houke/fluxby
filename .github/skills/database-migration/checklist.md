# Migration Checklist

Use this checklist when creating a new migration to ensure nothing is missed.

## Before Creating Migration

- [ ] Understand the schema change needed
- [ ] Check if similar migrations exist (use as reference)
- [ ] Determine if data needs to be seeded or migrated
- [ ] Review existing table structure

## Creating the Migration File

- [ ] Copy template from `migration-template.ts` or use existing migration as base
- [ ] Name file: `00X_descriptive_name.ts` (X = next sequential number)
- [ ] Set correct version number
- [ ] Write descriptive name (shows in logs)

## Implementation

### Schema Changes

- [ ] Wrap operations in `db.transactionAsync()` for performance
- [ ] Use `CREATE TABLE IF NOT EXISTS` for new tables
- [ ] Include all sync fields: `id`, `profile_id`, `updated_at`, `is_deleted`, `device_id`, `created_at`
- [ ] Add `ON DELETE CASCADE` for foreign keys where appropriate
- [ ] Use CHECK constraints for enum-like fields
- [ ] Create indexes for:
  - [ ] `profile_id` (multi-tenant queries)
  - [ ] `updated_at` (sync operations)
  - [ ] Frequently filtered columns

### Adding Columns

- [ ] Wrap ALTER TABLE in try/catch
- [ ] Handle 'duplicate column' error gracefully
- [ ] Set appropriate DEFAULT value
- [ ] Consider NOT NULL constraints

### Seeding Data

- [ ] Check if data should be seeded conditionally
- [ ] Use parameterized queries: `db.runAsync(sql, params)`
- [ ] Import constants from `@fluxby/shared` (don't hardcode)
- [ ] Never use string concatenation for values

### Rollback (down migration)

- [ ] Implement `down` function when possible
- [ ] For DROP COLUMN: Note SQLite limitation
- [ ] Use `DROP TABLE IF EXISTS` for table removal
- [ ] Clean up seeded data using same constants

## Security Checks

- [ ] ✅ All queries use parameterized values
- [ ] ❌ No string concatenation or template literals with variables
- [ ] ✅ All user input validated
- [ ] ✅ Profile isolation maintained (WHERE profile_id = ?)

## Performance Checks

- [ ] ✅ Bulk operations wrapped in transaction
- [ ] ✅ Indexes created for frequently queried columns
- [ ] ✅ No N+1 query patterns
- [ ] ✅ Efficient data types used

## Registering Migration

- [ ] Import migration in `packages/database/src/migrations/index.ts`
- [ ] Add to `migrations` array
- [ ] Update `LATEST_MIGRATION_VERSION = X`

## Verification Setup (if needed)

- [ ] Add critical tables to `CRITICAL_TABLES_BY_VERSION` in `runner.ts`
- [ ] Add critical columns to `CRITICAL_COLUMNS_BY_VERSION` in `runner.ts`

## Testing

- [ ] Build packages: `npm run build:packages`
- [ ] Run migration tests: `npx vitest tests/database/migrations.test.ts`
- [ ] Test on fresh OPFS database:
  - [ ] Clear OPFS: `localStorage.clear()` in browser console
  - [ ] Reload page and verify migration runs
  - [ ] Check browser console for errors
- [ ] Test rollback if applicable

## Documentation

- [ ] Update `docs/MIGRATIONS.md`:
  - [ ] Add migration to the list
  - [ ] Update version numbers in scenario tables
- [ ] Update `AGENTS.md` if:
  - [ ] New demo data added
  - [ ] Critical feature changes
  - [ ] New tables affect feature checklist

## Final Checks

- [ ] Typecheck passes: `npm run typecheck`
- [ ] Linter passes: `npm run lint`
- [ ] All tests pass: `npm run test:run`
- [ ] Migration name is descriptive
- [ ] Code is well-commented
- [ ] No console.log statements left in code

## Commit Message

Use conventional commit format:

```
feat(database): add [feature] migration

- Create [table/column] for [purpose]
- Add indexes for [optimization]
- Seed demo data for [feature]
- Update LATEST_MIGRATION_VERSION to X

---
Developed by [your model name]
```
