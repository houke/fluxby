# Vitest Guide

## Setup

### Installation

```bash
npm install -D vitest @vitest/coverage-v8 @vitest/ui
```

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{js,ts,jsx,tsx}',
        'src/test/**',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## Basic Testing

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('add', () => {
    it('adds two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('handles negative numbers', () => {
      expect(calculator.add(-1, 5)).toBe(4);
    });
  });
});
```

### Assertions

```typescript
// Equality
expect(value).toBe(expected); // Strict equality (===)
expect(value).toEqual(expected); // Deep equality
expect(value).toStrictEqual(expected); // Deep equality + type

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3, 5); // For floats

// Strings
expect(value).toMatch(/pattern/);
expect(value).toContain('substring');

// Arrays/Objects
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('nested.key', value);

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');
expect(() => fn()).toThrow(ErrorClass);

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow('error');

// Negation
expect(value).not.toBe(wrong);
```

---

## Mocking

### Function Mocks

```typescript
import { vi } from 'vitest';

// Create mock function
const mockFn = vi.fn();
const mockFnWithReturn = vi.fn().mockReturnValue(42);
const mockFnAsync = vi.fn().mockResolvedValue({ data: 'test' });

// Implementation
const mockFnImpl = vi.fn().mockImplementation((x) => x * 2);

// Return different values on successive calls
const mockSequence = vi
  .fn()
  .mockReturnValueOnce(1)
  .mockReturnValueOnce(2)
  .mockReturnValue(3);

// Assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenLastCalledWith('last', 'call');
expect(mockFn).toHaveBeenNthCalledWith(1, 'first', 'call');

// Get call info
mockFn.mock.calls; // All calls
mockFn.mock.results; // All return values
mockFn.mock.lastCall; // Last call arguments
```

### Module Mocks

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('./myModule', () => ({
  myFunction: vi.fn().mockReturnValue('mocked'),
  MyClass: vi.fn().mockImplementation(() => ({
    method: vi.fn(),
  })),
}));

// Partial mock (keep some implementations)
vi.mock('./myModule', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    functionToMock: vi.fn(),
  };
});

// Auto mock
vi.mock('./myModule');

// Mock with factory
vi.mock('./config', () => ({
  default: {
    apiUrl: 'http://test.com',
    debug: true,
  },
}));
```

### Spy

```typescript
import { vi } from 'vitest';

const object = {
  method: (x: number) => x * 2,
};

// Spy on method
const spy = vi.spyOn(object, 'method');

object.method(5);

expect(spy).toHaveBeenCalledWith(5);
expect(spy).toHaveReturnedWith(10);

// Replace implementation
vi.spyOn(object, 'method').mockImplementation(() => 99);

// Restore original
spy.mockRestore();
```

### Timer Mocks

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('handles setTimeout', () => {
  const callback = vi.fn();
  setTimeout(callback, 1000);

  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1000);

  expect(callback).toHaveBeenCalledOnce();
});

it('handles setInterval', () => {
  const callback = vi.fn();
  setInterval(callback, 1000);

  vi.advanceTimersByTime(3000);

  expect(callback).toHaveBeenCalledTimes(3);
});

it('runs all timers', () => {
  const callback = vi.fn();
  setTimeout(callback, 5000);
  setTimeout(callback, 10000);

  vi.runAllTimers();

  expect(callback).toHaveBeenCalledTimes(2);
});
```

---

## Async Testing

```typescript
// Async/await
it('fetches data', async () => {
  const data = await fetchData();
  expect(data).toEqual({ id: 1 });
});

// Resolved/rejected
it('resolves with data', async () => {
  await expect(fetchData()).resolves.toEqual({ id: 1 });
});

it('rejects with error', async () => {
  await expect(fetchBadData()).rejects.toThrow('Not found');
});

// With timeout
it('completes within timeout', async () => {
  const result = await slowOperation();
  expect(result).toBeDefined();
}, 10000); // 10 second timeout
```

---

## Test Organization

### Grouping with describe.each

```typescript
describe.each([
  { input: 1, expected: 2 },
  { input: 2, expected: 4 },
  { input: 3, expected: 6 },
])('double($input)', ({ input, expected }) => {
  it(`returns ${expected}`, () => {
    expect(double(input)).toBe(expected);
  });
});
```

### Conditional Tests

```typescript
// Skip
it.skip('skipped test', () => {});
describe.skip('skipped suite', () => {});

// Only (run only these)
it.only('focused test', () => {});
describe.only('focused suite', () => {});

// Conditional
it.skipIf(process.env.CI)('not in CI', () => {});
it.runIf(process.env.CI)('only in CI', () => {});

// Todo
it.todo('implement this test');
```

---

## Running Tests

```bash
# Run all tests
vitest

# Run in watch mode
vitest --watch

# Run specific file
vitest src/utils/math.test.ts

# Run matching pattern
vitest -t "should add"

# Run with coverage
vitest --coverage

# Run with UI
vitest --ui

# Run once (CI mode)
vitest run
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:ci": "vitest run --coverage --reporter=junit"
  }
}
```
