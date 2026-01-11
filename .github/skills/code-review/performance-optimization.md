# Performance Optimization for Fluxby

## OPFS Database Performance (CRITICAL)

### Always Use Transactions for Bulk Operations

**OPFS has high overhead for individual sync operations.** Follow these guidelines:

```typescript
// ❌ Wrong - each INSERT triggers an OPFS sync (~10-50ms each)
for (const item of items) {
  await db.runAsync('INSERT INTO table VALUES (?)', [item]);
}

// ✅ Correct - all INSERTs happen in one transaction, single OPFS sync
await db.transactionAsync(async () => {
  for (const item of items) {
    await db.runAsync('INSERT INTO table VALUES (?)', [item]);
  }
});
```

### When to Use Transactions

- Profile creation: Seeding categories, rules, and settings
- CSV imports: Inserting multiple transactions
- Bulk updates: Reordering accounts, applying rules to transactions
- Migrations: Any operation touching multiple rows

## Query Optimization

- ✅ Prefer selecting specific columns over `SELECT *` for large tables
- ✅ Use indexes for frequently filtered/sorted columns
- ✅ Consider pagination for large result sets
- ✅ Cache frequently accessed static data (categories, rules)

## React Performance

- ✅ Use TanStack Query (React Query) for data fetching and caching
- ✅ Use `queryClient.invalidateQueries()` efficiently after mutations
- ✅ Memoize expensive computations with `useMemo`
- ✅ Avoid unnecessary re-renders with `React.memo` for list items

## Import Performance

- ✅ Process CSV imports in batches within a single transaction
- ✅ Use bulk inserts with prepared statements
- ✅ Show progress indicators for large imports (>1000 rows)
- ✅ Chunk large rule applications (500 items per chunk)

## Bundle Size

- ✅ Code-split routes with lazy loading
- ✅ Tree-shake unused dependencies
- ✅ Use dynamic imports for heavy features
