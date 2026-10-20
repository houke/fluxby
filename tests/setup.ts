/**
 * Vitest Test Setup
 *
 * This file runs before each test file.
 * Use it to set up global mocks, test utilities, or environment configuration.
 */

import { beforeAll } from 'vitest';

// Extend expect with custom matchers if needed
// import { expect } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';

// CRITICAL: Set DB_PATH to in-memory BEFORE any test imports the database module
// This ensures tests never modify the real database
process.env.DB_PATH = ':memory:';

// Recharts' ResponsiveContainer uses ResizeObserver in the browser; jsdom doesn't
// provide it. Add a small mock so components relying on ResizeObserver don't blow up.
// This mock is intentionally minimal and only provides no-op methods used by the
// library.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - define on global for tests
global.ResizeObserver = class {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {}
};

// matchMedia mock for JSDOM
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addListener: () => {}, // deprecated
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeListener: () => {}, // deprecated
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addEventListener: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// The web app loads only the active language before its first render
// (apps/web/src/main.tsx). Tests render components without that bootstrap, so
// make both languages available synchronously. This runs in beforeAll, after
// the test file's vi.mock calls, so the translation modules see the same mocks
// they would have seen as static imports.
beforeAll(async () => {
  try {
    const { loadTranslations } =
      await import('../apps/web/src/lib/i18n/loader');
    await Promise.all([loadTranslations('nl'), loadTranslations('en')]);
  } catch {
    // Files that mock the modules translations import do not use them.
  }
});
