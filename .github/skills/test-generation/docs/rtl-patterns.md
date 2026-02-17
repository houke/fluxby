# React Testing Library Patterns

## Philosophy

1. **Test what users see and do**, not implementation details
2. **Query by accessibility roles** when possible
3. **Avoid testing internal state**
4. **Simulate real user interactions**

---

## Setup

```typescript
// test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Add providers as needed
function AllTheProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

---

## Queries

### Priority Order (Best → Worst)

1. **Accessible to everyone**
   - `getByRole` - buttons, links, headings, etc.
   - `getByLabelText` - form inputs
   - `getByPlaceholderText` - when no label
   - `getByText` - non-interactive elements
   - `getByDisplayValue` - filled form elements

2. **Semantic queries**
   - `getByAltText` - images
   - `getByTitle` - elements with title attribute

3. **Test IDs (last resort)**
   - `getByTestId` - when nothing else works

### Query Types

```typescript
// getBy - throws if not found (use for elements that should exist)
const button = screen.getByRole('button', { name: /submit/i });

// queryBy - returns null if not found (use to assert absence)
const error = screen.queryByText(/error/i);
expect(error).not.toBeInTheDocument();

// findBy - async, waits for element (use for elements that appear later)
const message = await screen.findByText(/success/i);

// getAllBy, queryAllBy, findAllBy - for multiple elements
const items = screen.getAllByRole('listitem');
expect(items).toHaveLength(3);
```

### Role Query Examples

```typescript
// Buttons
screen.getByRole('button', { name: /submit/i });
screen.getByRole('button', { name: 'Delete' });

// Links
screen.getByRole('link', { name: /home/i });

// Headings
screen.getByRole('heading', { level: 1 });
screen.getByRole('heading', { name: /welcome/i });

// Form elements
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('checkbox', { name: /agree/i });
screen.getByRole('combobox', { name: /country/i });
screen.getByRole('spinbutton', { name: /quantity/i }); // number input

// Lists
screen.getByRole('list');
screen.getAllByRole('listitem');

// Other
screen.getByRole('img', { name: /logo/i });
screen.getByRole('progressbar');
screen.getByRole('alert');
screen.getByRole('dialog');
screen.getByRole('tab');
screen.getByRole('tabpanel');
```

---

## User Events

```typescript
import userEvent from '@testing-library/user-event';

it('handles user interactions', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  // Click
  await user.click(screen.getByRole('button'));

  // Double click
  await user.dblClick(screen.getByText('item'));

  // Type
  await user.type(screen.getByRole('textbox'), 'hello');

  // Type with special keys
  await user.type(screen.getByRole('textbox'), 'hello{enter}');

  // Clear and type
  await user.clear(screen.getByRole('textbox'));
  await user.type(screen.getByRole('textbox'), 'new value');

  // Keyboard
  await user.keyboard('{Shift>}A{/Shift}'); // Shift+A
  await user.keyboard('{Control>}a{/Control}'); // Ctrl+A

  // Tab navigation
  await user.tab();
  expect(screen.getByRole('button')).toHaveFocus();

  // Hover
  await user.hover(screen.getByText('tooltip trigger'));
  await user.unhover(screen.getByText('tooltip trigger'));

  // Select option
  await user.selectOptions(screen.getByRole('combobox'), 'option-value');

  // Upload file
  const file = new File(['content'], 'file.txt', { type: 'text/plain' });
  await user.upload(screen.getByLabelText(/upload/i), file);

  // Paste
  await user.paste('pasted text');
});
```

---

## Common Patterns

### Form Testing

```typescript
it('submits form with valid data', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<LoginForm onSubmit={onSubmit} />);

  // Fill form
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');

  // Submit
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  // Assert
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  });
});

it('shows validation errors', async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={vi.fn()} />);

  // Submit empty form
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  // Check for errors
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  expect(screen.getByText(/password is required/i)).toBeInTheDocument();
});
```

### Async Loading

```typescript
it('shows loading state then data', async () => {
  render(<UserProfile userId="123" />);

  // Loading state
  expect(screen.getByRole('progressbar')).toBeInTheDocument();

  // Wait for data
  expect(await screen.findByText('John Doe')).toBeInTheDocument();

  // Loading gone
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

### Modals/Dialogs

```typescript
it('opens and closes modal', async () => {
  const user = userEvent.setup();
  render(<App />);

  // Open modal
  await user.click(screen.getByRole('button', { name: /open/i }));

  // Modal visible
  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /confirm/i })).toBeInTheDocument();

  // Close modal
  await user.click(screen.getByRole('button', { name: /cancel/i }));

  // Modal gone
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

### Lists

```typescript
it('renders list of items', async () => {
  render(<TodoList todos={mockTodos} />);

  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(3);

  // Check content
  expect(items[0]).toHaveTextContent('Buy groceries');
});

it('removes item from list', async () => {
  const user = userEvent.setup();
  render(<TodoList todos={mockTodos} />);

  // Delete first item
  const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
  await user.click(deleteButtons[0]);

  // Item removed
  expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
});
```

---

## waitFor and findBy

```typescript
// waitFor - wait for condition
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// With options
await waitFor(() => expect(mockFn).toHaveBeenCalled(), {
  timeout: 5000,
  interval: 100,
});

// findBy - shorthand for waitFor + getBy
const element = await screen.findByText('Loaded');
const elements = await screen.findAllByRole('listitem');

// waitForElementToBeRemoved
await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));
```

---

## Custom Matchers (jest-dom)

```typescript
// Visibility
expect(element).toBeVisible();
expect(element).toBeInTheDocument();

// Form state
expect(input).toBeDisabled();
expect(input).toBeEnabled();
expect(input).toBeRequired();
expect(input).toBeInvalid();
expect(input).toBeValid();
expect(checkbox).toBeChecked();
expect(input).toHaveValue('text');

// Content
expect(element).toHaveTextContent('text');
expect(element).toContainHTML('<span>');
expect(element).toBeEmptyDOMElement();

// Attributes
expect(element).toHaveAttribute('href', '/home');
expect(element).toHaveClass('active');
expect(element).toHaveStyle({ color: 'red' });

// Focus
expect(input).toHaveFocus();

// Accessibility
expect(element).toHaveAccessibleName('Submit form');
expect(element).toHaveAccessibleDescription('Click to submit');
```

---

## Debugging

```typescript
// Print DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));

// Log testing playground URL
screen.logTestingPlaygroundURL();

// Increase debug output
import { configure } from '@testing-library/react';
configure({ getElementError: (message) => new Error(message) });
```
