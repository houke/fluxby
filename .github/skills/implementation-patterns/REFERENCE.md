# Implementation Patterns Quick Reference

## TDD Cycle

```
   ┌──────────────────────────────────┐
   │                                  │
   ▼                                  │
[ RED ] ──────► [ GREEN ] ──────► [ REFACTOR ]
Write            Make it             Improve
failing          pass                code
test
```

## Test Structure

```typescript
describe('Component/Module', () => {
  // Setup
  beforeEach(() => {
    /* reset state */
  });

  describe('method/feature', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = fn(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Result Pattern

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// Create results
const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Usage
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err('Division by zero');
  return ok(a / b);
}

// Handle result
const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```

## Folder Structure

```
src/
├── features/           # Feature modules
│   └── auth/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
├── shared/             # Shared utilities
│   ├── components/
│   ├── hooks/
│   └── utils/
├── services/           # API/external services
└── types/              # Global types
```

## Service Pattern

```typescript
// Interface
interface UserService {
  getUser(id: string): Promise<Result<User>>;
  updateUser(id: string, data: Partial<User>): Promise<Result<User>>;
}

// Implementation
class ApiUserService implements UserService {
  async getUser(id: string): Promise<Result<User>> {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) return err(new ApiError(response.status));
      return ok(await response.json());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}

// Mock for testing
class MockUserService implements UserService {
  users: Map<string, User> = new Map();

  async getUser(id: string): Promise<Result<User>> {
    const user = this.users.get(id);
    return user ? ok(user) : err(new Error('Not found'));
  }
}
```

## React Component Pattern

```typescript
// Container (logic)
export function UserProfileContainer({ userId }: { userId: string }) {
  const { data, isLoading, error } = useUser(userId);

  if (isLoading) return <UserProfileSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return <UserProfileView user={data} />;
}

// Presentational (UI)
interface UserProfileViewProps {
  user: User;
}

export function UserProfileView({ user }: UserProfileViewProps) {
  return (
    <div className="profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## Custom Hook Pattern

```typescript
interface UseAsyncResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
}

function useAsync<T>(fn: () => Promise<T>): UseAsyncResult<T> {
  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    error: Error | null;
  }>({ data: null, isLoading: false, error: null });

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [fn]);

  return { ...state, execute };
}
```

## Error Classes

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
```

## Guard Clauses

```typescript
// ❌ Nested
function process(user: User | null) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        return doWork(user);
      }
    }
  }
  return null;
}

// ✅ Guards
function process(user: User | null) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;

  return doWork(user);
}
```

## Type Narrowing

```typescript
// Type guard function
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' && obj !== null && 'id' in obj && 'name' in obj
  );
}

// Discriminated union
type Result =
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error };

function handle(result: Result) {
  switch (result.status) {
    case 'success':
      return result.data; // TypeScript knows data exists
    case 'error':
      throw result.error; // TypeScript knows error exists
  }
}
```

## Debugging Strategy

```
1. REPRODUCE   → Isolate the issue
2. HYPOTHESIZE → Form theory about cause
3. VERIFY      → Test hypothesis
4. FIX         → Implement solution
5. VALIDATE    → Confirm fix works
6. PREVENT     → Add test for regression
```

## Async Patterns

```typescript
// Sequential
for (const item of items) {
  await processItem(item);
}

// Parallel (all at once)
await Promise.all(items.map(processItem));

// Parallel (limited concurrency)
const pool = new PromisePool(items, 5, processItem);
await pool.execute();

// With timeout
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms),
    ),
  ]);
```

## Common Patterns

| Pattern    | Use Case                          |
| ---------- | --------------------------------- |
| Result     | Error handling without exceptions |
| Service    | Abstract external dependencies    |
| Repository | Data access abstraction           |
| Factory    | Complex object creation           |
| Strategy   | Interchangeable algorithms        |
| Observer   | Event-driven communication        |

## Code Review Checklist

```
□ Tests pass and cover new code
□ Types are explicit and correct
□ Errors handled appropriately
□ No magic numbers/strings
□ Functions are small and focused
□ Naming is clear and descriptive
□ No unnecessary complexity
□ Performance considered
```
