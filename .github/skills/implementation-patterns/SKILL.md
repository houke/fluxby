---
name: implementation-patterns
description: TDD workflows, coding standards, debugging strategies, and production code patterns for development.
---

# Implementation Patterns Skill

Patterns for writing production-quality TypeScript/React code with TDD, clean architecture, and robust error handling.

## Quick Start

```typescript
// TDD: Write test first
test('calculateDiscount applies percentage correctly', () => {
  expect(calculateDiscount(100, 20)).toBe(80);
  expect(calculateDiscount(50, 10)).toBe(45);
});

// Then implement
function calculateDiscount(price: number, percentOff: number): number {
  return price * (1 - percentOff / 100);
}
```

## Skill Contents

### Documentation

- `docs/tdd-workflow.md` - Test-Driven Development guide
- `docs/clean-architecture.md` - Layered architecture patterns
- `docs/error-handling.md` - Error patterns and Result types

### Examples

- `examples/service-pattern.ts` - Service layer implementation
- `examples/result-pattern.ts` - Result/Either monad pattern

### Templates

- `templates/implementation-spec.md` - Implementation specification template

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## TDD Workflow

### Red-Green-Refactor Cycle

```
1. 🔴 RED: Write a failing test that defines desired behavior
2. 🟢 GREEN: Write minimal code to make the test pass
3. 🔵 REFACTOR: Improve code quality while keeping tests green
```

### TDD Example

```typescript
// Step 1: RED - Write failing test
describe('UserService', () => {
  it('should create user with valid email', async () => {
    const service = new UserService(mockRepo);
    const result = await service.createUser({
      email: 'test@example.com',
      name: 'Test',
    });

    expect(result.ok).toBe(true);
    expect(result.value?.email).toBe('test@example.com');
  });

  it('should reject invalid email', async () => {
    const service = new UserService(mockRepo);
    const result = await service.createUser({
      email: 'invalid',
      name: 'Test',
    });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('INVALID_EMAIL');
  });
});

// Step 2: GREEN - Minimal implementation
class UserService {
  constructor(private repo: UserRepository) {}

  async createUser(input: CreateUserInput): Promise<Result<User, AppError>> {
    if (!this.isValidEmail(input.email)) {
      return err({ code: 'INVALID_EMAIL', message: 'Invalid email format' });
    }

    const user = await this.repo.create(input);
    return ok(user);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Step 3: REFACTOR - Improve while tests pass
// Extract email validation, add more edge cases, etc.
```

### When to Use TDD

| ✅ Use TDD                        | ❌ Skip TDD                |
| --------------------------------- | -------------------------- |
| Business logic                    | UI exploration/prototyping |
| Data transformations              | One-off scripts            |
| State machines                    | Trivial getters/setters    |
| Algorithm implementation          | Config files               |
| Bug fixes (regression test first) | Styling changes            |
| API integrations                  | Spike/research code        |

## Clean Architecture

### Folder Structure

```
src/
├── features/
│   └── users/
│       ├── components/        # React components
│       │   ├── UserCard.tsx
│       │   └── UserList.tsx
│       ├── hooks/             # React hooks
│       │   └── useUser.ts
│       ├── services/          # Business logic
│       │   └── user.service.ts
│       ├── repositories/      # Data access
│       │   └── user.repository.ts
│       ├── types/             # TypeScript types
│       │   └── user.types.ts
│       └── index.ts           # Public API
├── shared/
│   ├── components/            # Shared UI components
│   ├── hooks/                 # Shared hooks
│   ├── utils/                 # Utility functions
│   └── types/                 # Shared types
└── infrastructure/
    ├── api/                   # API client
    ├── storage/               # Local storage
    └── analytics/             # Analytics
```

### Dependency Flow

```
Components → Hooks → Services → Repositories → Database/API
     ↑          ↑         ↑            ↑
     └──────────┴─────────┴────────────┘
              Types flow upward
```

## Service Pattern

```typescript
// types/user.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
}

// repositories/user.repository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

// services/user.service.ts
export interface UserService {
  getUser(id: string): Promise<Result<User, AppError>>;
  createUser(input: CreateUserInput): Promise<Result<User, AppError>>;
  updateUser(id: string, data: Partial<User>): Promise<Result<User, AppError>>;
}

export function createUserService(repo: UserRepository): UserService {
  return {
    async getUser(id: string) {
      const user = await repo.findById(id);
      if (!user) {
        return err({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return ok(user);
    },

    async createUser(input: CreateUserInput) {
      // Validation
      const validation = validateCreateUserInput(input);
      if (!validation.ok) {
        return validation;
      }

      // Check uniqueness
      const existing = await repo.findByEmail(input.email);
      if (existing) {
        return err({ code: 'EMAIL_EXISTS', message: 'Email already in use' });
      }

      // Create
      const user = await repo.create(input);
      return ok(user);
    },

    async updateUser(id: string, data: Partial<User>) {
      const existing = await repo.findById(id);
      if (!existing) {
        return err({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const updated = await repo.update(id, data);
      return ok(updated);
    },
  };
}
```

## Result Type Pattern

```typescript
// Result type for explicit error handling
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// Helper functions
function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Application error type
interface AppError {
  code: string;
  message: string;
  cause?: unknown;
}

// Usage
async function processPayment(
  amount: number,
): Promise<Result<Payment, AppError>> {
  if (amount <= 0) {
    return err({ code: 'INVALID_AMOUNT', message: 'Amount must be positive' });
  }

  try {
    const payment = await paymentGateway.charge(amount);
    return ok(payment);
  } catch (e) {
    return err({
      code: 'PAYMENT_FAILED',
      message: 'Payment processing failed',
      cause: e,
    });
  }
}

// Consuming Result
const result = await processPayment(100);

if (result.ok) {
  console.log('Payment successful:', result.value.id);
} else {
  console.error('Payment failed:', result.error.message);
}
```

## React Component Patterns

### Container/Presentational Split

```typescript
// Presentational (dumb) component
interface UserCardProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export const UserCard: FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  return (
    <article className={styles.card}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <div className={styles.actions}>
        <button onClick={onEdit} disabled={isLoading}>Edit</button>
        <button onClick={onDelete} disabled={isLoading}>Delete</button>
      </div>
    </article>
  );
};

// Container (smart) component
export const UserCardContainer: FC<{ userId: string }> = ({ userId }) => {
  const { user, isLoading, error } = useUser(userId);
  const { deleteUser, updateUser } = useUserActions();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteUser(userId);
    setIsDeleting(false);
  };

  if (error) return <ErrorState error={error} />;
  if (!user) return <UserCardSkeleton />;

  return (
    <UserCard
      user={user}
      onEdit={() => openEditModal(user)}
      onDelete={handleDelete}
      isLoading={isDeleting}
    />
  );
};
```

### Custom Hook Pattern

```typescript
interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

function useAsync<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {},
) {
  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    isLoading: boolean;
  }>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await asyncFn(...args);
        setState({ data, error: null, isLoading: false });
        options.onSuccess?.(data);
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, error: err, isLoading: false });
        options.onError?.(err);
        throw err;
      }
    },
    [asyncFn, options.onSuccess, options.onError],
  );

  return { ...state, execute };
}

// Usage
const { data, error, isLoading, execute } = useAsync(
  (id: string) => userService.getUser(id),
  { onSuccess: (user) => console.log('Loaded:', user.name) },
);
```

## Error Handling Patterns

### Error Boundaries

```typescript
interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error caught by boundary:', error, info);
    // Send to error tracking service
    errorTracker.capture(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Typed Error Classes

```typescript
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly fields: Record<string, string[]>,
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;
}

// Usage
function handleError(error: unknown): Response {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        code: error.code,
        message: error.message,
      }),
      { status: error.statusCode },
    );
  }

  // Unknown error
  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }),
    { status: 500 },
  );
}
```

## Debugging Strategy

### Systematic Approach

```
1. REPRODUCE: Create minimal reproduction case
2. ISOLATE: Binary search to find the cause
3. UNDERSTAND: Read code carefully, don't guess
4. FIX: Make the smallest possible change
5. VERIFY: Test fix and check for regressions
6. DOCUMENT: Update comments if behavior was unclear
```

### Debug Utilities

```typescript
// Conditional logging
const DEBUG = process.env.NODE_ENV === 'development';

function debug(label: string, ...args: unknown[]): void {
  if (DEBUG) {
    console.log(`[${label}]`, ...args);
  }
}

// Performance timing
function timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    debug(label, `${duration.toFixed(2)}ms`);
  });
}

// Usage
const users = await timeAsync('fetchUsers', () => userRepository.findAll());
```

## Implementation Checklist

### Before Starting

- [ ] Read and understand the requirement
- [ ] Identify existing patterns in codebase
- [ ] List edge cases to handle
- [ ] Determine test strategy

### During Implementation

- [ ] Write test first (if TDD)
- [ ] Implement minimal solution
- [ ] Handle error cases explicitly
- [ ] Add JSDoc for public APIs

### Before Completing

- [ ] All tests pass (`npm run test`)
- [ ] No lint errors (`npm run lint`)
- [ ] No type errors (`npm run typecheck`)
- [ ] Code reviewed for clarity

## Commands

```bash
# Run before every commit
npm run test        # Unit and integration tests
npm run lint        # ESLint checks
npm run typecheck   # TypeScript compiler

# Run periodically
npm run test:e2e    # End-to-end tests
npm audit           # Security vulnerabilities

# Debug
DEBUG=app:* npm run dev  # Enable debug logging
```

## After Implementation

> [!IMPORTANT]
> After implementing any feature, you MUST:
>
> 1. Run all tests: `npm run test`
> 2. Run linting: `npm run lint`
> 3. Run type checking: `npm run typecheck`
> 4. Fix ALL errors and warnings
> 5. Verify the feature works manually
