---
title: 'Bulk Transaction Management & Balance Sync'
feature: 'bulk-transaction-management'
date: '2026-02-16'
type: 'new-feature'
agents:
  [
    '@product-manager',
    '@architect',
    '@tech-lead',
    '@software-developer',
    '@ux-designer',
    '@visual-designer',
    '@qa-engineer',
    '@security-agent',
  ]
status: 'complete'
---

# Bulk Transaction Management & Balance Sync

> **⚠️ Status Tracking**: This plan's status should be updated by workflows:
>
> - `draft` → `in-progress`: When execution workflow starts
> - `in-progress` → `review`: When ready for code review
> - `review` → `complete`: When review workflow finishes

## 1. Executive Summary

_(Owners: @product-manager, @tech-lead)_

### Vision

Enable users to efficiently manage large datasets by selecting and deleting multiple transactions at once (via checkboxes, shift-click range, or date filters), and ensure account balances are automatically recalculated after bulk operations and imports. This addresses a critical gap in the current single-item-or-all deletion model and prevents balance inconsistencies after data changes.

### Success Criteria

- [ ] Users can select and delete multiple transactions in a single action
- [ ] Users can delete transactions by date range with a preview count
- [ ] Account balances are automatically recalculated after deletion and import
- [ ] Undo capability available within 5 minutes of deletion
- [ ] 30% of users with >100 transactions use bulk delete within 60 days
- [ ] 50% reduction in "how to delete transactions" support inquiries

### Scope

| In Scope                                     | Out of Scope                                      |
| -------------------------------------------- | ------------------------------------------------- |
| Checkbox multi-selection in transaction list | Permanent hard delete (soft-delete only for sync) |
| Shift-click range selection                  | Undo beyond 5-minute window                       |
| Delete by date range modal                   | Scheduled/automatic deletions                     |
| Delete all filtered transactions             | Export-before-delete workflow                     |
| Balance recalculation after deletion         | Real-time bank API sync                           |
| Balance sync after CSV import                | Multi-currency balance handling                   |
| Undo toast with 5-minute window              | Balance history/audit trail                       |
| Per-account balance preferences              | Automatic reconciliation                          |

---

## 2. Product Requirements

_(Owner: @product-manager)_

### User Stories

**US-1.1: Date Range Deletion**

> **As a** Fluxby user managing my finances  
> **I want** to delete transactions within a specific date range  
> **So that** I can remove incorrect or duplicate data from a specific time period without losing my entire transaction history

**US-1.2: Selection-Based Bulk Deletion**

> **As a** power user reviewing my transactions  
> **I want** to select multiple specific transactions and delete them in one action  
> **So that** I can efficiently clean up scattered errors without repetitive single-transaction deletions

**US-1.3: Filter-Based Bulk Deletion**

> **As a** user who imported transactions from the wrong account  
> **I want** to delete all transactions matching my current filters  
> **So that** I can quickly undo a mistaken import without manual selection

**US-2.1: Balance Sync After Import**

> **As a** user importing bank statements  
> **I want** my account balance to automatically update to match the latest transaction's ending balance  
> **So that** my dashboard reflects real bank data without manual entry

### Acceptance Criteria

**AC-1.1: Multi-Select Deletion**

- [ ] Given I am viewing the transaction list, when I enable selection mode, then checkboxes appear next to each transaction row
- [ ] Given I have selected multiple transactions, when I click "Delete selected", then I see a confirmation with count and total amount
- [ ] Given I confirm multi-select deletion, when the operation completes, then only the selected transactions are soft-deleted
- [ ] Given I am in selection mode, when I shift-click a second transaction, then all transactions between the two are selected

**AC-1.2: Date Range Deletion**

- [ ] Given I am on the Transactions page, when I click "Delete by date range", then a modal appears with start/end date fields
- [ ] Given I have selected a date range, when I click confirm, then I see a count of transactions to be deleted
- [ ] Given I confirm the deletion, when the operation completes, then all transactions within the date range are soft-deleted

**AC-1.3: Undo Capability**

- [ ] Given I have just deleted transactions, when I see the success toast, then an "Undo" button is visible
- [ ] Given I click "Undo" within 5 minutes, when the undo completes, then all deleted transactions are restored
- [ ] Given 5 minutes have passed, when I try to undo, then the undo option is no longer available

**AC-2.1: Balance Sync**

- [ ] Given I delete transactions, when the deletion completes, then affected account balances are recalculated
- [ ] Given I import transactions, when the import completes, then account balances reflect the latest transaction's `balance_after`
- [ ] Given all transactions are deleted for an account, when viewing the account, then balance shows €0.00

### User Personas Affected

| Persona            | Impact    | Notes                                                             |
| ------------------ | --------- | ----------------------------------------------------------------- |
| 🆕 The Newcomer    | High      | Likely imports wrong data during setup, needs safe way to undo    |
| 🎯 The Casual User | Medium    | Occasional cleanup after duplicate imports                        |
| ⚡ The Power User  | Very High | Regularly manages large datasets, needs efficient bulk operations |

### Priority & Timeline

- **Priority**: **P1** — Core data management capability, high user demand
- **Target**: Sprint 1 (1.5 weeks) for deletion, Sprint 2 (1 week) for balance sync
- **Dependencies**: None — extends existing soft-delete infrastructure

---

## 3. Technical Architecture

_(Owner: @architect)_

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Date Range      │  │ Account Filter  │  │ Multi-Select Transactions │  │
│  │ Picker          │  │ Dropdown        │  │ Checkboxes                 │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘  │
└───────────┼────────────────────┼─────────────────────────┼──────────────────┘
            │                    │                         │
            └─────────────────┬──┴─────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DELETE ORCHESTRATION LAYER                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  1. Validate filters (date range, account IDs, transaction IDs)       │  │
│  │  2. Calculate affected transactions count (preview)                   │  │
│  │  3. Execute soft-delete (web) or hard-delete (API)                    │  │
│  │  4. Trigger balance recalculation for affected accounts               │  │
│  │  5. Invalidate query cache                                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│    WEB (OPFS Backend)       │   │    API (Node.js Backend)    │
│  ┌───────────────────────┐  │   │  ┌───────────────────────┐  │
│  │ Soft-delete pattern   │  │   │  │ Hard-delete pattern   │  │
│  │ is_deleted = 1        │  │   │  │ DELETE FROM ...       │  │
│  │ updated_at = now()    │  │   │  │                       │  │
│  │ WITHIN TRANSACTION    │  │   │  │                       │  │
│  └───────────────────────┘  │   │  └───────────────────────┘  │
└─────────────────────────────┘   └─────────────────────────────┘
            │                              │
            └──────────────┬───────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BALANCE RECALCULATION ENGINE                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  For each affected account:                                           │  │
│  │  1. Find latest transaction by date with balance_after NOT NULL       │  │
│  │  2. Update accounts.current_balance = latest.balance_after            │  │
│  │  3. If no transactions remain → current_balance = 0                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component                     | Location                                | New/Modified                            |
| ----------------------------- | --------------------------------------- | --------------------------------------- |
| `useTransactionSelection`     | `apps/web/src/hooks/`                   | New                                     |
| `BulkDeleteDialog`            | `apps/web/src/components/transactions/` | New                                     |
| `DateRangeDeleteDialog`       | `apps/web/src/components/transactions/` | New                                     |
| `recalculateAccountBalance()` | `apps/web/src/lib/data-service.ts`      | New                                     |
| `deleteTransactionsByRange()` | `apps/web/src/lib/data-service.ts`      | New                                     |
| `deleteTransactionsByIds()`   | `apps/web/src/lib/data-service.ts`      | New                                     |
| Import balance sync           | `apps/api/src/routes/import.ts`         | Modified (extract to reusable function) |
| Bulk delete endpoint          | `apps/api/src/routes/transactions.ts`   | New                                     |

### Data Model

**No schema changes required.** Existing infrastructure supports both features:

```sql
-- Existing columns used:
accounts.current_balance    -- Updated after operations
transactions.is_deleted     -- Soft-delete flag (sync compatible)
transactions.updated_at     -- LWW timestamp
transactions.balance_after  -- Bank's calculated balance from CSV
```

### API Changes

#### New Endpoint: Bulk Delete Transactions

```
DELETE /api/transactions/bulk
```

| Field            | Type                             | Required | Description                            |
| ---------------- | -------------------------------- | -------- | -------------------------------------- |
| `transactionIds` | `string[]`                       | No\*     | Specific transaction IDs to delete     |
| `dateRange`      | `{ start: string, end: string }` | No\*     | Delete all in date range (YYYY-MM-DD)  |
| `accountId`      | `string`                         | No       | Limit deletion to specific account     |
| `dryRun`         | `boolean`                        | No       | If true, return count without deleting |

\*At least one of `transactionIds` or `dateRange` is required.

**Response:**

```json
{
  "success": true,
  "deleted": 47,
  "affectedAccounts": ["acc-uuid-1", "acc-uuid-2"],
  "balancesUpdated": true
}
```

#### New Endpoint: Recalculate Account Balance

```
POST /api/accounts/:id/recalculate-balance
```

### Performance Constraints

- [ ] All OPFS mutations wrapped in `transactionAsync()` (single disk sync)
- [ ] Batch IDs in groups of 500 for SQL `IN()` clauses
- [ ] Show progress indicator for >1,000 transactions
- [ ] Preview count always displayed before deletion

---

## 4. Implementation Specifications

_(Owner: @tech-lead)_

### Code Structure

```
apps/web/src/
├── components/transactions/
│   ├── TransactionSelection.tsx       # Selection toolbar
│   ├── BulkDeleteDialog.tsx           # Confirmation modal
│   └── DateRangeDeleteDialog.tsx      # Date range modal
├── hooks/
│   ├── useTransactionSelection.ts     # Selection state
│   └── useBulkDelete.ts               # Delete mutation & undo
└── lib/
    └── data-service.ts                # +deleteTransactionsByIds, etc.

packages/shared/src/types/
└── bulk-operations.ts                 # Shared types
```

### Key Interfaces & Types

```typescript
interface BulkDeleteCriteria {
  mode: 'selection' | 'dateRange' | 'filter';
  transactionIds?: string[];
  dateRange?: { start: string; end: string };
  accountId?: string;
}

interface BulkDeleteResult {
  deletedCount: number;
  affectedAccountIds: string[];
  undoToken?: string;
  expiresAt?: string;
}

interface BalanceRecalculationResult {
  accountId: string;
  previousBalance: number;
  newBalance: number;
  calculationMethod: 'latest_balance_after' | 'sum_transactions';
}
```

### Algorithm Overview

**Balance Recalculation:**

```
1. Find latest transaction: SELECT balance_after FROM transactions
   WHERE account_id = ? AND is_deleted = 0 AND balance_after IS NOT NULL
   ORDER BY date DESC, id DESC LIMIT 1

2. If found: SET current_balance = latest.balance_after
3. If not found: SET current_balance = 0
```

**Bulk Deletion:**

```
1. Preview count (dry run)
2. Capture undo payload (IDs + account balances)
3. BEGIN TRANSACTION
   - Soft-delete all matching transactions
   - Recalculate affected account balances
4. COMMIT
5. Store undo payload (5-min TTL)
6. Show toast with undo action
```

### State Management

**TanStack Query Mutations:**

| Mutation                    | Invalidates                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `useBulkDeleteMutation`     | `transactions`, `accounts`, `dashboard`, `analytics`, `budgets`, `recentTransactions` |
| `useUndoBulkDeleteMutation` | Same as above                                                                         |

### Migration Strategy

- **No breaking changes** — additive feature only
- **No database migrations** — uses existing schema
- **Feature flag optional**: `features.bulkDelete` for gradual rollout

---

## 5. User Experience Design

_(Owner: @ux-designer)_

### User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TRANSACTION LIST (NORMAL MODE)                  │
│   [ ] Select All    [Search...]    [Filters ▼]    [Date Range]     │
├─────────────────────────────────────────────────────────────────────┤
│   [ ]  2026-02-15   Grocery Store       -€45.50    🏷 Food          │
│   [ ]  2026-02-14   Netflix             -€15.99    🏷 Entertainment │
└─────────────────────────────────────────────────────────────────────┘
           │
           │ (User clicks checkbox)
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TRANSACTION LIST (SELECTION MODE)                │
│   [✓] 3 selected   [Cancel Selection]              [🗑 Delete ▼]   │
├─────────────────────────────────────────────────────────────────────┤
│   [✓] 2026-02-15   Grocery Store       -€45.50    🏷 Food          │
│   [✓] 2026-02-14   Netflix             -€15.99    🏷 Entertainment │
└─────────────────────────────────────────────────────────────────────┘
           │
           │ (User clicks Delete)
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│   ⚠️ CONFIRMATION DIALOG                                     [×]   │
│                                                                     │
│   🗑️  Delete 3 transaction(s)?                                     │
│                                                                     │
│   • 2026-02-15  Grocery Store         -€45.50                      │
│   • 2026-02-14  Netflix               -€15.99                      │
│   • 2026-02-13  Salary              +€3,200.00                     │
│                                                                     │
│   Total impact: -€3,138.51                                         │
│   ⚠️ This action cannot be undone after 5 minutes.                  │
│                                                                     │
│            [Cancel]        [🗑 Delete 3 transactions]               │
└─────────────────────────────────────────────────────────────────────┘
```

### Selection Patterns

| Pattern            | Desktop               | Mobile           | Behavior                            |
| ------------------ | --------------------- | ---------------- | ----------------------------------- |
| Single select      | Click checkbox        | Tap checkbox     | Toggle individual row               |
| Range select       | Shift+Click           | N/A              | Select all between last and current |
| Multi-select add   | Ctrl/Cmd+Click        | N/A              | Add/remove without clearing         |
| Select all visible | Click header checkbox | Tap "Select all" | Select all filtered                 |
| Long press         | N/A                   | Long press card  | Enter selection mode                |

### Interaction States

| Element                  | State         | Visual                           |
| ------------------------ | ------------- | -------------------------------- |
| Checkbox (checked)       | Selected      | Purple checkmark                 |
| Checkbox (indeterminate) | Some selected | Horizontal dash                  |
| Selected row             | Highlighted   | `bg-purple-50` / `bg-purple-950` |
| Delete button            | Default       | `bg-red-600` red background      |
| Delete button            | Loading       | Spinner, disabled                |

### Accessibility Requirements

- [ ] Keyboard navigation: Tab, Space, Shift+Space, Escape
- [ ] Screen reader: "X transactions selected" announcements
- [ ] Focus management: Return focus after dialog close
- [ ] `@media (prefers-reduced-motion)`: Disable animations

---

## 6. Visual Design & Polish

_(Owner: @visual-designer)_

### Selection Mode Animations

**Entering Selection Mode:**  
| Property | From | To | Duration | Easing |
|----------|------|-----|----------|--------|
| Selection toolbar | `opacity: 0, y: -8` | `opacity: 1, y: 0` | `200ms` | `ease-out` |
| Checkbox column | `width: 0` | `width: 48px` | `250ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Row hover states | Standard | Purple-tinted | `150ms` | `ease-out` |

**Checkbox Animation (Unchecked → Checked):**

1. Background fills with `purple-600` (scale 0 → 1, 50ms)
2. Checkmark stroke draws in (80ms)
3. Subtle bounce overshoot (scale 1.1 → 1.0, 150ms)

**Row Selection States:**
| State | Light Mode | Dark Mode |
|-------|------------|-----------|
| Selected bg | `purple-50` | `purple-950/40` |
| Left border | `3px solid purple-600` | `3px solid purple-400` |
| Transition | `150ms ease-out` | Same |

### Delete Button Micro-interactions

| State   | Visual                                                                   |
| ------- | ------------------------------------------------------------------------ |
| Default | `bg-red-600`, trash icon `16px`                                          |
| Hover   | Scale `1.02`, red glow shadow, icon shake (`rotate -3deg → 3deg`, 300ms) |
| Active  | Scale `0.98`, `bg-red-700`                                               |
| Loading | Spinner replaces icon, "Deleting...", `opacity: 0.7`                     |

### Confirmation Dialog Design

```
┌─────────────────────────────────────────────────────────────────┐
│  [padding: 24px]                                                │
│                                                                 │
│  ⚠️  48px red-100 circle, red-600 AlertTriangle icon           │
│                                                                 │
│  Delete 3 transaction(s)?              ← text-xl, semibold     │
│  This action cannot be undone after 5 minutes.  ← text-sm      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐
│  │  PREVIEW LIST (neutral-50 bg, rounded-lg, max-h: 240px)     │
│  │  • 2026-02-15  Grocery Store         -€45.50               │
│  │  • 2026-02-14  Netflix               -€15.99               │
│  │  ...and 3 more                                              │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  Total impact: -€3,138.51              ← red-600 or green-600  │
│                                                                 │
│         [Cancel]              [🗑 Delete 3 transactions]       │
│         ghost btn             red-600 solid btn                 │
└─────────────────────────────────────────────────────────────────┘
```

**Dialog Animation:**

- Enter: `opacity 0, scale 0.95, y: 20` → `opacity 1, scale 1, y: 0` (250ms)
- Exit: Reverse (150ms)

### Undo Toast Design

```
┌──────────────────────────────────────────────────────────────────────┐
│  ✓  Deleted 3 transactions    ⏱ 4:32    [Undo]    [×]              │
│     ↑                          ↑         ↑        ↑                 │
│     success icon            countdown  purple    dismiss            │
└──────────────────────────────────────────────────────────────────────┘
```

**Position:** Bottom-center, `margin-bottom: 24px`  
**Countdown:** `neutral-400` → `orange-500` (1:00) → `red-500` (0:30, pulses)  
**Optional:** Progress bar under toast, `purple-600` → `red-500` over 5 minutes

### Mobile Adaptations

| Element         | Desktop              | Mobile                        |
| --------------- | -------------------- | ----------------------------- |
| Checkbox        | `18px`, `40px` touch | `22px`, `48px` touch          |
| Selection entry | Checkbox click       | Tap or long-press (`400ms`)   |
| Confirmation    | Centered modal       | Bottom sheet with drag handle |
| Toolbar         | Full text            | Icons only with count badge   |

**Bottom Sheet specs:**

- Drag handle: `40px × 4px`, `neutral-300`, centered
- Max height: `85vh`
- Border radius top: `16px`
- Buttons: Full-width stacked

### Dark Mode Colors

| Element      | Light                  | Dark                      |
| ------------ | ---------------------- | ------------------------- |
| Selected row | `purple-50`            | `purple-950/40`           |
| Dialog bg    | `white`                | `neutral-800`             |
| Preview bg   | `neutral-50`           | `neutral-900`             |
| Toast bg     | `neutral-900`          | `neutral-800`             |
| Warning icon | `red-600` on `red-100` | `red-400` on `red-900/40` |

### Responsive Breakpoints

| Breakpoint   | Selection Toolbar           | Dialog        |
| ------------ | --------------------------- | ------------- |
| `< 640px`    | `✓ 3 [Cancel] [🗑]` (icons) | Bottom sheet  |
| `640-1024px` | Full labels, inline         | Modal `480px` |
| `> 1024px`   | Full toolbar                | Modal `520px` |

### Reduced Motion

For `prefers-reduced-motion: reduce`:

- No checkbox bounce, instant state
- No toolbar slide, instant appear
- Dialog: fade only (200ms)
- Toast: fade only (150ms)
- No delete button shake
- No countdown pulse

---

## 8. Security Considerations

_(Owner: @security-agent)_

### Threat Model

| Threat                      | Risk Level   | Mitigation                                                    |
| --------------------------- | ------------ | ------------------------------------------------------------- |
| Cross-profile data deletion | **Critical** | Enforce `profile_id` in ALL WHERE clauses                     |
| Mass accidental deletion    | **High**     | Multi-step confirmation, preview count, soft-delete with undo |
| Undetected data tampering   | **High**     | Transactional integrity, atomic balance recalculation         |
| CSRF on deletion endpoints  | **Medium**   | SameSite cookies, explicit user action required               |
| Denial of Service           | **Medium**   | Rate limiting, batch size limits (max 1000 IDs)               |

### Data Security

1. **Two-step confirmation** — Show preview before deletion
2. **Profile isolation** — Every query includes `profile_id` filter
3. **Soft-delete pattern** — 30-day recovery window before permanent purge
4. **Audit logging** — Track bulk deletions (count, date range, timestamp)

### Input Validation

| Parameter             | Validation                                                   |
| --------------------- | ------------------------------------------------------------ |
| `startDate`/`endDate` | ISO 8601 format, not in future, max 10 years ago             |
| `transactionIds`      | Array of strings, max 1000 items, all must belong to profile |
| `accountId`           | Valid UUID, must belong to profile                           |

---

## 7. Quality Assurance Strategy

_(Owner: @qa-engineer)_

### Test Scenarios

#### Happy Path

| ID    | Scenario                            | Expected Result                                      |
| ----- | ----------------------------------- | ---------------------------------------------------- |
| HP-01 | Select 3 transactions, click delete | Confirmation shows "3 transactions", delete succeeds |
| HP-02 | Shift-click to select range of 10   | All 10 highlighted, count badge updates              |
| HP-03 | Delete transactions, click undo     | All transactions restored, balance recalculated      |
| HP-04 | Import CSV with balance_after       | Account balance = latest transaction's balance       |

#### Edge Cases

| ID    | Edge Case                           | Expected Behavior                     |
| ----- | ----------------------------------- | ------------------------------------- |
| EC-01 | Delete ALL transactions for account | Balance set to €0.00                  |
| EC-02 | Delete range with no matches        | Delete button disabled, message shown |
| EC-03 | Undo after making new transaction   | Undo only affects deleted items       |
| EC-04 | Delete >10,000 transactions         | Progress indicator, batch processing  |
| EC-05 | Undo at exactly 5-minute boundary   | Graceful expiration message           |

### Test Types Required

- [ ] Unit tests: SQL builders, balance calculation, undo timer (coverage: 95%+)
- [ ] Integration tests: Full deletion flow with SQLite
- [ ] E2E tests (Playwright): User flows, accessibility
- [ ] Performance tests: 10k+ deletions benchmark (<5s target)

### Data-testid Attributes

- `data-testid="transaction-checkbox"`
- `data-testid="bulk-delete-button"`
- `data-testid="delete-preview-count"`
- `data-testid="undo-toast"`

---

## 8. Action Items

### Setup

- [ ] **SETUP-001**: Review existing deletion logic in data-service.ts — @software-developer (S)
- [ ] **SETUP-002**: Review import balance calculation in import.ts — @software-developer (S)
- [ ] **SETUP-003**: Design bulk selection UX mockup — @ux-designer (M)

### Core Implementation

- [ ] **IMPL-001**: Add `deleteTransactionsByIds()` to data-service.ts — @software-developer (M)
- [ ] **IMPL-002**: Add `deleteTransactionsByDateRange()` to data-service.ts — @software-developer (M)
- [ ] **IMPL-003**: Add `DELETE /api/transactions/bulk` endpoint — @software-developer (M)
- [ ] **IMPL-004**: Add `recalculateAccountBalance()` utility — @software-developer (M)
- [ ] **IMPL-005**: Add selection state hook `useTransactionSelection` — @software-developer (L)
- [ ] **IMPL-006**: Add bulk action toolbar component — @software-developer (M)
- [ ] **IMPL-007**: Add date range delete modal — @software-developer (M)
- [ ] **IMPL-008**: Add confirmation dialog with preview — @software-developer (S)
- [ ] **IMPL-009**: Add undo toast with 5-min timeout — @software-developer (M)
- [ ] **IMPL-010**: Add translations (NL/EN) for bulk delete UI — @software-developer (S)
- [ ] **IMPL-011**: Ensure balance recalculation after import — @software-developer (S)

### Polish & Testing

- [ ] **POLISH-001**: Add loading states and progress indicator — @software-developer (S)
- [ ] **TEST-001**: Unit tests for bulk delete functions — @qa-engineer (M)
- [ ] **TEST-002**: API integration tests for bulk endpoint — @qa-engineer (M)
- [ ] **TEST-003**: E2E tests for selection and deletion flow — @qa-engineer (L)
- [ ] **TEST-004**: Performance benchmark (10k deletions) — @qa-engineer (S)
- [ ] **TEST-005**: Accessibility audit — @qa-engineer (S)

### Review & Deploy

- [ ] **REVIEW-001**: Security review for profile isolation — @security-agent (M)
- [ ] **REVIEW-002**: Code review for OPFS performance — @tech-lead (M)
- [ ] **DEPLOY-001**: Update Swagger docs — @software-developer (S)
- [ ] **DEPLOY-002**: Add Bruno request files — @software-developer (S)
- [ ] **DEPLOY-003**: Update Help Center documentation — @software-developer (S)

---

## 9. Risk Register

| Risk                                        | Probability | Impact | Mitigation                          | Owner               |
| ------------------------------------------- | ----------- | ------ | ----------------------------------- | ------------------- |
| OPFS performance with large deletions       | Medium      | High   | Batch processing, progress UI       | @tech-lead          |
| Undo payload exceeds localStorage limit     | Low         | Medium | Use IndexedDB for >500 transactions | @software-developer |
| Sync conflict during deletion               | Low         | Medium | Rely on existing LWW pattern        | @architect          |
| User confusion about soft vs hard delete    | Medium      | Low    | Clear UI copy, help documentation   | @ux-designer        |
| Balance inconsistency after partial failure | Low         | High   | SQLite transaction rollback         | @architect          |

---

## 10. Open Questions & Answers

### Resolved During Planning ✅

| ID  | Question                               | Answer                                                       | Answered By      | Date       |
| --- | -------------------------------------- | ------------------------------------------------------------ | ---------------- | ---------- |
| Q1  | Where is undo state stored?            | localStorage with 5-min TTL, IndexedDB for >500 transactions | @tech-lead       | 2026-02-16 |
| Q2  | Balance when all transactions deleted? | Set to €0.00                                                 | @product-manager | 2026-02-16 |
| Q3  | Undo across multiple accounts?         | Restores ALL deleted transactions at once                    | @ux-designer     | 2026-02-16 |
| Q4  | API vs Web deletion parity?            | API gets bulk endpoint with same capabilities                | @architect       | 2026-02-16 |

### Deferred to Execution 📋

| ID  | Question                              | Reason Deferred                   | Assigned To      |
| --- | ------------------------------------- | --------------------------------- | ---------------- |
| Q5  | Optimal BATCH_SIZE for 10k+ deletions | Requires performance benchmarking | @qa-engineer     |
| Q6  | Exact undo countdown UI design        | Visual design decision            | @visual-designer |

---

## 11. Sign-offs

### QA Engineer Sign-off

**🟡 APPROVED WITH CONDITIONS**

The plan is testable and well-structured. Address during execution:

- Clarify undo persistence strategy (localStorage vs IndexedDB threshold)
- Confirm BATCH_SIZE for >10k deletions via benchmarking
- Add `data-testid` attributes to component specs

_Reviewed by: @qa-engineer_

### Tech Lead Sign-off

**🟡 APPROVED WITH CONDITIONS**

Architecture is sound and aligns with existing patterns. Address during implementation:

- **P0**: Add `['accounts']` to query invalidation list
- **P1**: Define TypeScript interfaces upfront
- **P1**: Document undo payload size limits
- **P2**: Address sync conflict scenario in implementation
- **P2**: Add request size guard for API bulk endpoint (max 1000 IDs)

_Reviewed by: @tech-lead_

---

## 12. Glossary

| Term          | Definition                                                                      |
| ------------- | ------------------------------------------------------------------------------- |
| Soft-delete   | Setting `is_deleted = 1` instead of removing row (preserves sync compatibility) |
| Hard-delete   | `DELETE FROM` SQL (used in API only)                                            |
| LWW           | Last-Write-Wins conflict resolution based on `updated_at` timestamp             |
| balance_after | Bank-provided balance after a transaction, imported from CSV                    |
| OPFS          | Origin Private File System, browser storage used for local-first SQLite         |

---

## 📌 Document Location

This document lives at: `.nexus/features/bulk-transaction-management/plan.md`

Related documents:

- `execution.md` - Implementation tracking (to be created)
- `review.md` - Code review results (to be created)

---

## Revision History

| Date & Time         | Agent            | Changes                                                                                                                                                 |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-16 15:30:00 | @nexus           | Initial plan created with contributions from @product-manager, @architect, @tech-lead, @software-developer, @ux-designer, @qa-engineer, @security-agent |
| 2026-02-16 16:00:00 | @visual-designer | Added Visual Design & Polish section (Section 6) with animations, dialog specs, undo toast, mobile adaptations, dark mode, reduced motion               |
