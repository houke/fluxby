# Test Generation Quick Reference

## Vitest Assertions

```typescript
// Equality
expect(value).toBe(expected); // Strict equality (===)
expect(value).toEqual(expected); // Deep equality
expect(value).toStrictEqual(expected); // Deep + same type

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(n);
expect(value).toBeGreaterThanOrEqual(n);
expect(value).toBeLessThan(n);
expect(value).toBeCloseTo(n, decimals);

// Strings
expect(str).toMatch(/regex/);
expect(str).toContain(substr);
expect(str).toHaveLength(n);

// Arrays/Iterables
expect(arr).toContain(item);
expect(arr).toContainEqual(item);
expect(arr).toHaveLength(n);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', value);
expect(obj).toMatchObject(partial);

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('message');
expect(() => fn()).toThrow(ErrorClass);

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## Testing Library Queries

```typescript
// Priority order (use first available):
// 1. Accessible to everyone
getByRole('button', { name: 'Submit' })
getByLabelText('Email')
getByPlaceholderText('Search...')
getByText('Welcome')
getByDisplayValue('input value')

// 2. Semantic queries
getByAltText('profile picture')
getByTitle('tooltip')

// 3. Test IDs (last resort)
getByTestId('submit-btn')

// Query types
getBy*()       // Throws if not found
queryBy*()     // Returns null if not found
findBy*()      // Async, waits for element
getAllBy*()    // Returns array, throws if none
queryAllBy*()  // Returns array, empty if none
findAllBy*()   // Async array
```

## user-event Cheatsheet

```typescript
const user = userEvent.setup();

// Click
await user.click(element);
await user.dblClick(element);
await user.tripleClick(element);

// Type
await user.type(input, 'text');
await user.clear(input);
await user.type(input, '{Enter}');
await user.type(input, '{Backspace}');

// Keyboard
await user.keyboard('abc');
await user.keyboard('{Shift>}A{/Shift}');
await user.tab();
await user.tab({ shift: true });

// Selection
await user.selectOptions(select, 'value');
await user.selectOptions(select, ['a', 'b']);
await user.deselectOptions(select, 'value');

// Other
await user.hover(element);
await user.unhover(element);
await user.upload(input, file);
await user.pointer('[MouseLeft]');
```

## Async Utilities

```typescript
// Wait for element
await screen.findByText('Loaded');

// Wait for condition
await waitFor(() => {
  expect(something).toBe(true);
});

// Wait for element removal
await waitForElementToBeRemoved(() => screen.queryByText('Loading'));

// Custom timeout
await waitFor(() => {}, { timeout: 5000 });
```

## Mocking Patterns

```typescript
// Mock function
const mock = vi.fn();
const mock = vi.fn(() => 'value');
const mock = vi.fn().mockReturnValue('value');
const mock = vi.fn().mockResolvedValue('async');
const mock = vi.fn().mockRejectedValue(new Error());

// Mock implementation
mock.mockImplementation((x) => x * 2);
mock.mockImplementationOnce((x) => x * 3);

// Mock assertions
expect(mock).toHaveBeenCalled();
expect(mock).toHaveBeenCalledTimes(2);
expect(mock).toHaveBeenCalledWith('arg');
expect(mock).toHaveBeenLastCalledWith('arg');
expect(mock).toHaveReturnedWith('value');

// Spy on object method
const spy = vi.spyOn(object, 'method');
spy.mockReturnValue('mocked');

// Mock module
vi.mock('./module', () => ({
  exportedFn: vi.fn(),
}));

// Mock timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.runAllTimers();
vi.useRealTimers();
```

## Playwright Selectors

```typescript
// Role (preferred)
page.getByRole('button', { name: 'Submit' });
page.getByRole('link', { name: /learn more/i });
page.getByRole('textbox', { name: 'Email' });
page.getByRole('checkbox', { name: 'Agree' });

// Label
page.getByLabel('Email');
page.getByPlaceholder('Search');

// Text
page.getByText('Welcome');
page.getByText(/welcome/i);

// Test ID
page.getByTestId('submit');

// CSS / XPath (avoid)
page.locator('.button');
page.locator('//button');
```

## Playwright Actions

```typescript
// Navigation
await page.goto('/path');
await page.goBack();
await page.goForward();
await page.reload();

// Actions
await locator.click();
await locator.dblclick();
await locator.fill('text');
await locator.clear();
await locator.press('Enter');
await locator.selectOption('value');
await locator.check();
await locator.uncheck();
await locator.hover();

// Assertions
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();
await expect(locator).toHaveText('text');
await expect(locator).toHaveValue('value');
await expect(locator).toHaveAttribute('name', 'value');
await expect(locator).toHaveClass(/active/);
await expect(locator).toHaveCount(3);

await expect(page).toHaveURL('/path');
await expect(page).toHaveTitle('Title');
```

## MSW Handlers

```typescript
import { http, HttpResponse } from 'msw';

// GET
http.get('/api/users', () => {
  return HttpResponse.json([{ id: 1 }]);
});

// POST
http.post('/api/users', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json(body, { status: 201 });
});

// Dynamic params
http.get('/api/users/:id', ({ params }) => {
  return HttpResponse.json({ id: params.id });
});

// Query params
http.get('/api/search', ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  return HttpResponse.json({ query: q });
});

// Error response
http.get('/api/data', () => {
  return HttpResponse.json({ error: 'Not found' }, { status: 404 });
});

// Network error
http.get('/api/data', () => {
  return HttpResponse.error();
});

// Override in test
server.use(
  http.get('/api/users', () => {
    return HttpResponse.json([]);
  }),
);
```

## Test Patterns

```typescript
// Arrange-Act-Assert
it('does something', () => {
  // Arrange
  const input = 'test';

  // Act
  const result = process(input);

  // Assert
  expect(result).toBe('TEST');
});

// Cleanup
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Test hooks
beforeAll(() => {
  /* setup once */
});
beforeEach(() => {
  /* setup each */
});
afterEach(() => {
  /* cleanup each */
});
afterAll(() => {
  /* cleanup once */
});

// Skip/focus
it.skip('skipped test', () => {});
it.only('focused test', () => {});
describe.skip('skipped suite', () => {});
describe.only('focused suite', () => {});

// Parameterized
it.each([
  [1, 1, 2],
  [2, 2, 4],
  [3, 3, 6],
])('adds %i + %i = %i', (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```
