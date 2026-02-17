---
name: test-generation
description: Generate robust test suites using Vitest, React Testing Library, and Playwright. Use when writing tests, improving test coverage, or creating E2E user flow tests.
---

# Test Generation Skill

Generate comprehensive test suites for React applications using Vitest, Testing Library, and Playwright.

## Quick Start

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Skill Contents

### Documentation

- `docs/testing-philosophy.md` - Testing principles and strategy
- `docs/vitest-guide.md` - Vitest configuration and patterns
- `docs/rtl-patterns.md` - React Testing Library best practices

### Examples

- `examples/component-tests.tsx` - Component testing patterns
- `examples/hook-tests.ts` - Custom hook testing

### Templates

- `templates/test-file.tsx` - Test file template

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## Testing Philosophy

### Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲         Few, slow, high confidence
                 ╱──────╲
                ╱Integration╲     Some, medium speed
               ╱────────────╲
              ╱    Unit      ╲    Many, fast, isolated
             ╱────────────────╲
```

### Guiding Principles

| Principle           | Description                             |
| ------------------- | --------------------------------------- |
| **Test Behavior**   | Test what users see, not implementation |
| **Avoid Snapshots** | Use explicit assertions instead         |
| **Test Isolation**  | Each test independent, no shared state  |
| **Readable Tests**  | Tests as documentation                  |
| **80% Coverage**    | Aim for meaningful coverage, not 100%   |

## Tool Selection

| Scenario          | Tool                  | Import                                                    |
| ----------------- | --------------------- | --------------------------------------------------------- |
| Logic/Utils       | Vitest                | `import { describe, it, expect, vi } from 'vitest'`       |
| Components        | React Testing Library | `import { render, screen } from '@testing-library/react'` |
| User Interactions | user-event            | `import userEvent from '@testing-library/user-event'`     |
| API Mocking       | MSW                   | `import { http, HttpResponse } from 'msw'`                |
| E2E Tests         | Playwright            | `import { test, expect } from '@playwright/test'`         |

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## Component Testing

### Basic Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('renders initial count', () => {
    render(<Counter initialCount={5} />);
    expect(screen.getByText('Count: 5')).toBeInTheDocument();
  });

  it('increments count when button clicked', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('calls onChange callback with new count', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Counter initialCount={0} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(onChange).toHaveBeenCalledWith(1);
  });
});
```

### Testing Forms

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing with Context/Providers

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './ThemeContext';
import { ThemedButton } from './ThemedButton';

// Custom render function
function renderWithProviders(
  ui: React.ReactElement,
  { theme = 'light', ...options } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider defaultTheme={theme}>
        {children}
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

describe('ThemedButton', () => {
  it('applies light theme styles by default', () => {
    renderWithProviders(<ThemedButton>Click</ThemedButton>);
    expect(screen.getByRole('button')).toHaveClass('light');
  });

  it('applies dark theme styles when configured', () => {
    renderWithProviders(<ThemedButton>Click</ThemedButton>, { theme: 'dark' });
    expect(screen.getByRole('button')).toHaveClass('dark');
  });
});
```

## Custom Hook Testing

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCounter } from './useCounter';
import { useAsync } from './useAsync';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});

describe('useAsync', () => {
  it('handles successful async operation', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() => useAsync(mockFn));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(null);

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ data: 'test' });
    });
  });

  it('handles error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useAsync(mockFn));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error('Failed'));
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

## API Mocking with MSW

```typescript
// src/test/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]);
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ id: Number(id), name: 'John' });
  }),
];

// src/test/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/test/setup.ts
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// Component test with MSW
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { UserList } from './UserList';

describe('UserList', () => {
  it('displays users from API', async () => {
    render(<UserList />);

    expect(await screen.findByText('John')).toBeInTheDocument();
    expect(await screen.findByText('Jane')).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    render(<UserList />);

    expect(await screen.findByText(/error loading users/i)).toBeInTheDocument();
  });
});
```

## Playwright E2E Tests

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Patterns

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can log in with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

### Page Object Model

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Log in' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}

// Usage in test
test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

## Edge Cases to Test

| Category      | Examples                               |
| ------------- | -------------------------------------- |
| Empty States  | Empty arrays, null values, undefined   |
| Boundaries    | 0, -1, MAX_INT, empty string           |
| Error States  | Network failures, timeouts, validation |
| Concurrent    | Race conditions, rapid clicks          |
| Unicode       | Special characters, emoji, RTL text    |
| Accessibility | Keyboard navigation, screen readers    |

## Test File Template

```typescript
/**
 * @file ComponentName.test.tsx
 * @description Tests for ComponentName component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  // Setup
  const defaultProps = {
    title: 'Test Title',
    onAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering tests
  describe('rendering', () => {
    it('renders with required props', () => {
      render(<ComponentName {...defaultProps} />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders optional content when provided', () => {
      render(<ComponentName {...defaultProps} subtitle="Subtitle" />);
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('interactions', () => {
    it('handles primary action', async () => {
      const user = userEvent.setup();
      render(<ComponentName {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      expect(defaultProps.onAction).toHaveBeenCalledTimes(1);
    });
  });

  // Accessibility tests
  describe('accessibility', () => {
    it('has accessible name', () => {
      render(<ComponentName {...defaultProps} />);
      expect(screen.getByRole('region')).toHaveAccessibleName();
    });
  });
});
```

## Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- Button.test.tsx

# Run E2E tests
npm run test:e2e

# Run E2E in headed mode
npm run test:e2e -- --headed

# Update snapshots (if used)
npm run test -- -u
```

## After Test Generation

> [!IMPORTANT]
> After generating tests, you MUST:
>
> 1. Run all tests: `npm run test`
> 2. Ensure new tests pass
> 3. Check coverage hasn't decreased: `npm run test:coverage`
> 4. Verify tests are meaningful (not just snapshot tests)
> 5. Fix ALL errors and warnings
