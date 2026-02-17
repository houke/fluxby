# Error Handling Patterns

## The Result Pattern

Never throw exceptions for expected failures. Use typed results instead.

```typescript
// Define Result type
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// Helper functions
function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

### Using Results

```typescript
interface ValidationError {
  field: string;
  message: string;
}

function validateEmail(email: string): Result<string, ValidationError> {
  if (!email.includes('@')) {
    return Err({ field: 'email', message: 'Invalid email format' });
  }
  return Ok(email.toLowerCase());
}

// Usage
const result = validateEmail(input);
if (result.ok) {
  console.log('Valid email:', result.value);
} else {
  console.log('Error:', result.error.message);
}
```

### Chaining Results

```typescript
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
}

function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

// Usage
const emailResult = validateEmail(input);
const userResult = flatMap(emailResult, (email) => findUserByEmail(email));
const profileResult = flatMap(userResult, (user) => loadUserProfile(user.id));
```

## Error Classes

Create specific error classes for different failure types:

```typescript
// Base error class
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
}

// Specific errors
class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly isOperational = true;

  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  readonly isOperational = true;

  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;
  readonly isOperational = true;

  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class InternalError extends AppError {
  readonly code = 'INTERNAL_ERROR';
  readonly statusCode = 500;
  readonly isOperational = false;

  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'InternalError';
  }
}
```

## Error Boundaries (React)

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

## Async Error Handling

### Try-Catch Wrapper

```typescript
async function tryCatch<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return Ok(value);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

// Usage
const result = await tryCatch(fetchUser(id));
if (!result.ok) {
  // Handle error
  return;
}
// Use result.value safely
```

### Promise.allSettled Pattern

```typescript
async function fetchMultiple<T>(
  promises: Promise<T>[],
): Promise<{ successes: T[]; failures: Error[] }> {
  const results = await Promise.allSettled(promises);

  const successes: T[] = [];
  const failures: Error[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      successes.push(result.value);
    } else {
      failures.push(result.reason);
    }
  }

  return { successes, failures };
}
```

## Error Logging

```typescript
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
}

function logError(error: Error, context?: Record<string, unknown>): void {
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    stack: error.stack,
    context,
  };

  if (error instanceof AppError) {
    log.code = error.code;
  }

  // In development
  console.error(log);

  // In production, send to logging service
  // await loggingService.log(log);
}
```

## API Error Responses

```typescript
interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

function formatErrorResponse(error: AppError): APIErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      details:
        error instanceof ValidationError
          ? { [error.field]: [error.message] }
          : undefined,
    },
  };
}

// Express middleware
function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logError(error, { path: req.path, method: req.method });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json(formatErrorResponse(error));
  }

  // Unknown error - don't leak details
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

## Best Practices

1. **Be specific**: Use typed errors, not generic ones
2. **Don't swallow errors**: Always handle or propagate
3. **Log with context**: Include request IDs, user IDs
4. **Fail fast**: Validate early, fail clearly
5. **Graceful degradation**: Provide fallbacks when possible
6. **User-friendly messages**: Technical details for logs, friendly messages for users
7. **Operational vs Programming errors**: Handle them differently
