# Fluxby Test Suite

This directory contains all tests for the Fluxby application.

## Test Structure

```
tests/
├── setup.ts              # Global test setup
├── README.md             # This file
├── api/                  # API/Backend tests
│   ├── routes/           # Route handler tests
│   └── services/         # Service layer tests
├── web/                  # Frontend tests
│   ├── components/       # Component tests
│   ├── hooks/            # Custom hook tests
│   └── utils/            # Utility function tests
└── shared/               # Shared package tests
```

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run all tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage Overview

| Module | Category | File                      | Tests                                           | Status     |
| ------ | -------- | ------------------------- | ----------------------------------------------- | ---------- |
| shared | utils    | `utils.ts`                | `formatCurrency`, `cn`, `findSimilarNameGroups` | ✅ Covered |
| api    | utils    | `addressbook-utils.ts`    | Regex safety, cleanup rules                     | ✅ Covered |
| api    | services | `csv-parser.ts`           | CSV parsing logic                               | 🔲 Pending |
| api    | services | `categorization.ts`       | Auto-categorization                             | 🔲 Pending |
| api    | services | `analytics.ts`            | Analytics calculations                          | 🔲 Pending |
| api    | routes   | `transactions.ts`         | Transaction CRUD                                | 🔲 Pending |
| api    | routes   | `addressbook.ts`          | Address book endpoints                          | 🔲 Pending |
| api    | routes   | `categories.ts`           | Category management                             | 🔲 Pending |
| api    | routes   | `budgets.ts`              | Budget calculations                             | 🔲 Pending |
| web    | utils    | `api.ts`                  | API client functions                            | 🔲 Pending |
| web    | utils    | `contact-filter.ts`       | Contact search/filter/sort logic                | ✅ Covered |
| web    | hooks    | `useDocumentTitle.ts`     | Document title hook                             | 🔲 Pending |
| web    | hooks    | `useTransactionTotals.ts` | Transaction totals calculation                  | 🔲 Pending |

### Legend

- ✅ Covered - Tests exist and pass
- 🔲 Pending - Tests need to be written
- ⚠️ Partial - Some tests exist but coverage incomplete
- ❌ Failing - Tests exist but currently failing

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@shared/utils';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('€ 1.234,56');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-€ 1.234,56');
  });
});
```

### API Route Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '@api/index';

describe('GET /api/transactions', () => {
  it('returns transactions list', async () => {
    const response = await request(app).get('/api/transactions');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Best Practices

1. **Naming**: Use descriptive test names that explain what is being tested
2. **Isolation**: Each test should be independent and not rely on other tests
3. **Coverage**: Aim for high coverage of business logic and edge cases
4. **Mocking**: Mock external dependencies (database, APIs) appropriately
5. **Speed**: Keep tests fast - use mocks instead of real I/O operations
