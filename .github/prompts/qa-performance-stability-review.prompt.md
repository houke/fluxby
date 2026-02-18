# QA Performance & Stability Review - Fluxby

A comprehensive QA review of the Fluxby application across all platforms (Web/PWA, Mobile Web, Tauri Desktop) with focus on performance and stability.

---

## Dashboard

### Current State

- Uses lazy loading for chart components (good practice)
- Multiple TanStack Query hooks with 2-minute staleTime
- Suspense boundaries for chart loading states

### Performance Recommendations

1. **Consolidate Dashboard Queries**
   - Currently fires 8+ separate queries on mount: `dashboard`, `recentTransactions`, `accounts`, `dailyExpenses`, `budgets`, `balanceForecast`, `topAccounts`, `recurringStats`
   - Consider creating a single `getDashboardData()` API endpoint that returns all dashboard data in one request
   - This reduces OPFS round-trips significantly (each query = worker hop + disk sync)

2. **Memoize Expensive Calculations**
   - The `stats` object from the dashboard query contains computed values
   - Add `useMemo` for any derived state calculations from `stats`

3. **Chart Lazy Loading Improvement**
   - Charts are lazy-loaded but all load at once when Dashboard mounts
   - Consider using `IntersectionObserver` to only load charts when they scroll into view
   - Example: Monthly chart at bottom of dashboard shouldn't load until user scrolls

4. **Account Balance Cards Memory**
   - `AccountBalanceCards` component re-renders on every scroll index change
   - Add `React.memo` with proper dependency comparison

### Stability Recommendations

1. **Handle Empty States Gracefully**
   - When `stats` is undefined or has zero transactions, ensure all chart components handle this
   - Add null checks for `stats.categoryBreakdown`, `stats.monthlyData`, etc.

2. **Date Range Edge Cases**
   - Test with date ranges spanning multiple years
   - Test with future dates (should show "no data" gracefully)

---

## Transactions

### Current State

- 4000+ lines file - very large component
- Virtualized list with @tanstack/react-virtual
- Multiple filter states (search, type, category, IBAN, payment method, etc.)
- Complex modal system for editing, rules, transfers

### Performance Recommendations

1. **Split Component Into Smaller Modules**
   - Extract filter logic into `useTransactionFilters` hook
   - Extract modal handlers into separate hook: `useTransactionModals`
   - Extract mutation handlers: `useTransactionMutations`
   - Current file is too large for maintainability and bundle optimization

2. **Debounce Search Input**
   - Already has 300ms debounce (good)
   - Consider increasing to 400ms for slower devices

3. **Optimize Filter State Synchronization**
   - Multiple `useEffect` hooks sync filter state with context
   - Consider using `useReducer` for complex filter state to reduce re-renders

4. **Lazy Load Address Book Data**
   - `needsAddressBook` query runs when any transaction has `addressBookId`
   - For users with many address book entries, this can be expensive
   - Add pagination to address book filter dropdown

5. **Virtualization Improvements**
   - Current `estimatedItemSize` is 88px - verify this matches actual row heights on all devices
   - Consider adaptive row heights for mobile vs desktop
   - `overscan` of 5 might be too low for fast scrolling - test with 8-10

6. **Deferred Value Usage**
   - Using `useDeferredValue` for transactions (React 19 feature)
   - Ensure fallback for older React versions if needed for Tauri

### Stability Recommendations

1. **Transaction Row Key Stability**
   - Verify `tx.id` is always stable across re-renders
   - If IDs change during optimistic updates, virtualization will break

2. **Scroll Position Preservation**
   - Has `saveScrollPosition`/`restoreScrollPosition` helpers
   - Test that this works correctly after bulk operations (merge, split)

3. **Memory Leaks**
   - Multiple `useState` for modal states - ensure cleanup in `useEffect`
   - Verify observers (IntersectionObserver for load more) are cleaned up

---

## Subscriptions

### Current State

- Pattern detection via ML-like analysis of recurring transactions
- Calendar view with date-based grouping
- Stats cards for monthly costs

### Performance Recommendations

1. **Pattern Detection Optimization**
   - `detectRecurringPatterns` mutation cancels all queries before running
   - This is aggressive - consider only canceling relevant queries
   - Add progress indicator for long detection runs (>5s)

2. **Calendar View Rendering**
   - Calendar entries query only runs when `view === 'calendar'`
   - Good conditional querying - maintain this pattern

3. **Stats Query Optimization**
   - `staleTime: 10 * 60 * 1000` (10 minutes) is appropriate
   - Consider adding `gcTime` to prevent garbage collection during session

### Stability Recommendations

1. **WASM Memory During Detection**
   - Comment mentions: "Cancel all pending queries to free up database resources / Pattern detection needs exclusive access to avoid WASM memory issues"
   - Add memory pressure detection before pattern detection
   - Show warning if device has low memory

2. **Dismissed Patterns Persistence**
   - Verify dismissed alerts survive app restarts
   - Test cross-device sync of dismissed state

---

## Analytics

### Current State

- Uses year-based date range (expands user selection to full year boundaries)
- Multiple chart types: Pie, Bar, Line
- Recharts library for visualization

### Performance Recommendations

1. **Year Range Optimization**
   - Currently converts user's date range to full year boundaries
   - For multi-year ranges, this can return huge datasets
   - Add data aggregation on backend for ranges > 1 year

2. **Chart Rendering**
   - Recharts can be slow with 1000+ data points
   - Add data decimation for MonthlyIncomeChart when showing 3+ years
   - Consider using `useDeferredValue` for chart data

3. **Category Breakdown Limit**
   - No visible limit on category breakdown data
   - With many categories, pie chart becomes unreadable
   - Limit to top 10 categories + "Other" category

### Stability Recommendations

1. **Active Index State Management**
   - `activeExpenseIndex`, `pinnedExpenseIndex`, `activeIncomeIndex` state
   - Ensure indices remain valid when data changes

2. **Empty Data Handling**
   - Test analytics with zero transactions in selected period
   - Verify all chart components handle empty arrays

---

## Budgets

### Current State

- CRUD for budget items
- Smart budget suggestions based on spending history
- Progress bars with color coding

### Performance Recommendations

1. **Proposed Budgets Query**
   - Runs automatically without staleTime
   - Add `staleTime: 5 * 60 * 1000` since spending patterns don't change frequently

2. **Budget List Rendering**
   - No virtualization for budget list
   - For users with 50+ budgets, add virtual scrolling

3. **Category Search Filtering**
   - In-memory filtering is fine for <100 categories
   - Consider server-side filtering for edge cases

### Stability Recommendations

1. **Concurrent Mutations**
   - `createMultipleMutation` creates budgets sequentially in a loop
   - Wrap in transaction for atomicity (if one fails, all should rollback)

2. **Edit State Collision**
   - Test editing a budget while another user (via sync) modifies the same budget

---

## Categories

### Current State

- Hierarchical categories with subcategories
- Category rules for auto-assignment
- Preset icons and colors

### Performance Recommendations

1. **Category Tree Rendering**
   - Using `useDeferredValue` for search (good)
   - Add memoization for sorted/filtered category list

2. **Rule Application**
   - When applying rules to existing transactions, show progress
   - Consider batching rule application with progress updates

### Stability Recommendations

1. **Delete Category with Transactions**
   - Verify proper cascade or reassignment of transactions
   - Show count of affected transactions before delete

2. **Subcategory Orphaning**
   - Test deleting parent category with subcategories
   - Ensure subcategories don't become orphaned

---

## Address Book

### Current State

- Contact management with IBAN mapping
- Shared IBAN detection (payment processors)
- Cleanup rules for name normalization

### Performance Recommendations

1. **Contact List Virtualization**
   - Large address books (500+ contacts) need virtualization
   - Current implementation may lag on mobile

2. **Similar Name Detection**
   - `findSimilarNameGroups` utility runs on each render
   - Cache results and only recompute when contacts change

3. **Transaction Count Query**
   - Each contact shows transaction count
   - Batch this into a single query instead of per-contact lookup

### Stability Recommendations

1. **IBAN Validation**
   - Verify IBAN format validation handles all European formats
   - Test with Dutch, German, Belgian IBAN formats

2. **Merge Contacts Atomicity**
   - `mergeContactsMutation` should be atomic
   - If merge fails mid-way, ensure rollback

---

## Import

### Current State

- Web Worker for CSV parsing
- Supports ING, ASN Bank formats
- Generic CSV mapping for other banks

### Performance Recommendations

1. **Worker Communication Optimization**
   - Progress updates at 10% intervals might be too infrequent for large files
   - Update progress every 500 rows for better UX

2. **Memory Management for Large Files**
   - 50k+ row CSV files can exhaust browser memory
   - Add file size warning for files > 10MB
   - Consider streaming parser for very large files

3. **Duplicate Detection**
   - Current duplicate check queries database per transaction
   - Batch duplicate detection into single query with all dates/amounts

### Stability Recommendations

1. **Worker Error Recovery**
   - Ensure worker errors don't leave import in broken state
   - Add "retry import" button on failure

2. **Partial Import Handling**
   - If import fails at row 5000 of 10000, what happens?
   - Implement transactional import (all-or-nothing)

3. **Date Parsing Edge Cases**
   - Test with various date formats: DD-MM-YYYY, DD/MM/YY, YYYYMMDD
   - Handle timezone issues for midnight dates

---

## Settings

### Current State

- Tabbed interface (Active Profile, Manage Profiles, App Settings)
- Modular settings components
- Sync settings with QR pairing

### Performance Recommendations

1. **Lazy Load Settings Tabs**
   - All settings components load on mount
   - Use `React.lazy` for tab content not immediately visible

2. **Profile Switcher Performance**
   - Switching profiles triggers full database reload
   - Show loading state during profile switch

### Stability Recommendations

1. **Profile Deletion Safety**
   - Require confirmation with profile name typing
   - Prevent deletion of last/only profile

2. **Sync Connection Recovery**
   - Test reconnection after network interruption
   - Verify pending sync queue survives app restart

---

## Help

### Current State

- Help articles with markdown content
- Links to developer documentation

### Performance Recommendations

1. **Static Content Caching**
   - Help content is static - ensure aggressive caching
   - Consider pre-rendering help pages at build time

### Stability Recommendations

1. **Offline Help Access**
   - Help should be available offline (PWA use case)
   - Verify help pages are included in service worker cache

---

## Database Layer (OPFS)

### Current State

- SQLite WASM via @journeyapps/wa-sqlite
- OPFS for persistent storage
- Worker-based architecture for non-blocking I/O

### Performance Recommendations

1. **Transaction Batching Critical**
   - AGENTS.md emphasizes this but it's critical: every individual write = OPFS sync
   - Audit all `db.runAsync()` calls outside transactions
   - Add lint rule to warn on non-transactional writes

2. **Query Result Caching**
   - Add application-level caching for frequently-accessed static data
   - Categories, accounts, rules rarely change - cache aggressively

3. **Prepared Statement Reuse**
   - Verify prepared statements are reused, not recreated per query
   - `wa-sqlite.ts` has statement caching but verify it's working

4. **Index Optimization**
   - Verify indexes exist for common query patterns:
     - `transactions(date, profile_id)`
     - `transactions(category_id, profile_id)`
     - `transactions(opposing_account_iban)`
   - Add EXPLAIN QUERY PLAN logging in dev mode

### Stability Recommendations

1. **Database Corruption Recovery**
   - Has `shouldShowReset()` for WASM errors
   - Add automatic backup before risky operations
   - Implement database integrity check on startup

2. **Migration Failure Handling**
   - If migration fails mid-way, database could be in inconsistent state
   - Implement migration rollback mechanism

3. **OPFS Quota**
   - Check available OPFS quota before large imports
   - Handle quota exceeded errors gracefully

---

## Sync Engine (P2P)

### Current State

- PeerJS for WebRTC connections
- Last-Write-Wins conflict resolution
- QR code pairing

### Performance Recommendations

1. **Delta Sync**
   - Verify sync only sends changed records since last sync
   - Full sync on first connection is expected, but subsequent syncs should be incremental

2. **Sync Batching**
   - Group small changes into batches before syncing
   - Don't sync every keystroke - debounce sync pushes

3. **Connection Pooling**
   - If user has 3+ paired devices, manage connections efficiently
   - Consider star topology with one device as hub

### Stability Recommendations

1. **TURN Server Fallback**
   - Using Metered free TURN servers - these have rate limits
   - Add monitoring for TURN server failures
   - Consider self-hosted coturn for production

2. **Schema Version Mismatch**
   - Good error handling for version mismatch exists
   - Add automatic prompt to update app when mismatch detected

3. **Conflict Resolution Audit**
   - LWW can lose data in race conditions
   - Log conflicts for debugging
   - Consider user-facing conflict resolution for important data

---

## Tauri Desktop App

### Current State

- Minimal Rust wrapper
- Uses same web codebase
- SQLite via OPFS (not native SQLite)

### Performance Recommendations

1. **Native SQLite Option**
   - Tauri could use native SQLite instead of WASM+OPFS
   - Native SQLite would be significantly faster
   - Consider `tauri-plugin-sql` for native database

2. **File System Access**
   - Tauri has direct filesystem access
   - Use native file picker for CSV import instead of web API

3. **Window State Persistence**
   - Save window size/position between sessions
   - Implement via Tauri's window state plugin

### Stability Recommendations

1. **macOS Hardened Runtime**
   - Verify app works with macOS Gatekeeper
   - Test code signing for distribution

2. **Windows Defender**
   - Test that Windows Defender doesn't flag the app
   - Add proper code signing certificate

3. **Auto-Update Mechanism**
   - Implement Tauri's updater plugin for seamless updates
   - Show changelog on update

---

## Mobile Web (PWA)

### Current State

- Responsive design with `useIsMobile` hook
- PWA manifest and service worker
- Touch-optimized interactions

### Performance Recommendations

1. **Touch Scroll Performance**
   - Add `touch-action: pan-y` to scroll containers
   - Verify 60fps scroll on mid-range Android devices

2. **Initial Load Optimization**
   - Measure and optimize First Contentful Paint (FCP)
   - Target < 2s on 3G connection
   - Lazy load non-critical components

3. **Image Optimization**
   - Verify icons/images are properly sized for mobile
   - Use WebP format where supported

### Stability Recommendations

1. **iOS Safari Quirks**
   - Test OPFS support in iOS Safari (16.4+)
   - Test Service Worker on iOS
   - Handle iOS viewport issues (100vh problem)

2. **Background Tab Handling**
   - iOS aggressively kills background tabs
   - Save state before tab suspension
   - Restore state on tab focus

3. **Offline First**
   - Verify app is fully functional offline
   - Test sync queue when going online after offline period

---

## Cross-Platform Testing Checklist

### Web (Chrome, Firefox, Safari, Edge)

- [ ] OPFS support verification
- [ ] Service Worker registration
- [ ] IndexedDB fallback (if needed)
- [ ] WebRTC peer connections

### Mobile Web

- [ ] iOS Safari 16.4+ (OPFS support)
- [ ] Chrome Android
- [ ] Touch interactions (swipe, long-press)
- [ ] Viewport handling
- [ ] PWA install prompt

### Tauri (macOS, Windows, Linux)

- [ ] Application startup time
- [ ] File system permissions
- [ ] System tray integration (if any)
- [ ] Auto-update mechanism
- [ ] Native menu integration

---

## Priority Action Items

### High Priority (Stability)

1. Add database integrity check on startup
2. Implement migration rollback
3. Add OPFS quota checking
4. Improve TURN server reliability

### High Priority (Performance)

1. Consolidate Dashboard queries into single endpoint
2. Split Transactions.tsx into smaller modules
3. Audit all non-transactional database writes
4. Add virtualization to Address Book

### Medium Priority

1. Lazy load settings tabs
2. Add memory pressure detection for pattern detection
3. Implement native SQLite for Tauri
4. Optimize Analytics for multi-year ranges

### Low Priority

1. Pre-render help pages at build time
2. Add EXPLAIN QUERY PLAN logging in dev
3. Implement star topology for multi-device sync

---

## Monitoring Recommendations

1. **Error Tracking**
   - Integrate Sentry or similar for error tracking
   - Track WASM crashes specifically
   - Monitor sync failures

2. **Performance Metrics**
   - Track page load times
   - Track database query times
   - Monitor bundle sizes over time

3. **User Analytics**
   - Track feature usage (respecting privacy)
   - Monitor import success rates
   - Track sync completion rates

---

_Generated by QA Review - Claude Opus 4.5_
_Review Date: January 2026_
