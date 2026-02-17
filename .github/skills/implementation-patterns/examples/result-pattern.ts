/**
 * Result Pattern Implementation
 *
 * Type-safe error handling without exceptions.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type Result<T, E = Error> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

// ============================================================================
// CONSTRUCTORS
// ============================================================================

export function Ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function Err<E>(error: E): Err<E> {
  return { ok: false, error };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

// ============================================================================
// TRANSFORMATIONS
// ============================================================================

/**
 * Transform the success value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
}

/**
 * Transform the error value
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (!result.ok) {
    return Err(fn(result.error));
  }
  return result;
}

/**
 * Chain results (flatMap/bind)
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/**
 * Provide default value on error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Provide default value lazily
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T,
): T {
  if (result.ok) {
    return result.value;
  }
  return fn(result.error);
}

/**
 * Throw on error (escape hatch)
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wrap a promise in a Result
 */
export async function tryCatch<T>(
  promise: Promise<T>,
): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return Ok(value);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Async map
 */
export async function mapAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>,
): Promise<Result<U, E>> {
  if (result.ok) {
    return Ok(await fn(result.value));
  }
  return result;
}

/**
 * Async flatMap
 */
export async function flatMapAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>,
): Promise<Result<U, E>> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

// ============================================================================
// COMBINING RESULTS
// ============================================================================

/**
 * Combine multiple results into one
 */
export function all<T extends Result<any, any>[]>(
  results: T,
): Result<
  { [K in keyof T]: T[K] extends Result<infer U, any> ? U : never },
  T[number] extends Result<any, infer E> ? E : never
> {
  const values: any[] = [];

  for (const result of results) {
    if (!result.ok) {
      return result as any;
    }
    values.push(result.value);
  }

  return Ok(values) as any;
}

/**
 * Return first success or collect all errors
 */
export function any<T, E>(results: Result<T, E>[]): Result<T, E[]> {
  const errors: E[] = [];

  for (const result of results) {
    if (result.ok) {
      return result;
    }
    errors.push(result.error);
  }

  return Err(errors);
}

// ============================================================================
// RESULT BUILDER (Fluent API)
// ============================================================================

export class ResultBuilder<T, E> {
  constructor(private result: Result<T, E>) {}

  map<U>(fn: (value: T) => U): ResultBuilder<U, E> {
    return new ResultBuilder(map(this.result, fn));
  }

  mapErr<F>(fn: (error: E) => F): ResultBuilder<T, F> {
    return new ResultBuilder(mapErr(this.result, fn));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): ResultBuilder<U, E> {
    return new ResultBuilder(flatMap(this.result, fn));
  }

  async flatMapAsync<U>(
    fn: (value: T) => Promise<Result<U, E>>,
  ): Promise<ResultBuilder<U, E>> {
    return new ResultBuilder(await flatMapAsync(this.result, fn));
  }

  unwrapOr(defaultValue: T): T {
    return unwrapOr(this.result, defaultValue);
  }

  unwrap(): T {
    return unwrap(this.result);
  }

  get(): Result<T, E> {
    return this.result;
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    if (this.result.ok) {
      return handlers.ok(this.result.value);
    }
    return handlers.err(this.result.error);
  }
}

export function from<T, E>(result: Result<T, E>): ResultBuilder<T, E> {
  return new ResultBuilder(result);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Domain errors
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

function validatePassword(password: string): Result<string, ValidationError> {
  if (password.length < 8) {
    return Err({
      field: 'password',
      message: 'Password must be at least 8 characters',
    });
  }
  return Ok(password);
}

// Combining validations
function validateCredentials(
  email: string,
  password: string,
): Result<{ email: string; password: string }, ValidationError> {
  const emailResult = validateEmail(email);
  if (!emailResult.ok) return emailResult;

  const passwordResult = validatePassword(password);
  if (!passwordResult.ok) return passwordResult;

  return Ok({ email: emailResult.value, password: passwordResult.value });
}

// Using the fluent API
async function example() {
  const result = from(validateEmail('test@example.com'))
    .map((email) => email.toUpperCase())
    .flatMap((email) =>
      validatePassword('secret123').ok
        ? Ok({ email, valid: true })
        : Err({ field: 'password', message: 'Invalid' }),
    )
    .match({
      ok: (value) => `Valid: ${value.email}`,
      err: (error) => `Error: ${error.message}`,
    });

  console.log(result);
}
