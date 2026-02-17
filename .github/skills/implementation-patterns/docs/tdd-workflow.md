# TDD Workflow Guide

## Test-Driven Development Cycle

```
       ┌─────────────────────────────────────────────┐
       │                                             │
       │    ┌──────────┐                             │
       │    │   RED    │ Write a failing test       │
       │    └────┬─────┘                             │
       │         │                                   │
       │         ▼                                   │
       │    ┌──────────┐                             │
       │    │  GREEN   │ Make test pass (minimal)   │
       │    └────┬─────┘                             │
       │         │                                   │
       │         ▼                                   │
       │    ┌──────────┐                             │
       └────│ REFACTOR │ Improve code               │
            └──────────┘                             │
```

## The Three Laws of TDD

1. **Write no production code except to pass a failing test**
2. **Write only enough test code to demonstrate failure**
3. **Write only enough production code to pass the test**

## Step-by-Step Process

### 1. RED: Write a Failing Test

```typescript
// Start with the simplest case
describe('Calculator', () => {
  it('should add two numbers', () => {
    const calc = new Calculator();
    expect(calc.add(1, 2)).toBe(3);
  });
});
```

**Guidelines:**

- Test ONE behavior per test
- Use descriptive test names
- Start with the happy path
- Write the assertion first, then work backwards

### 2. GREEN: Make It Pass

```typescript
class Calculator {
  add(a: number, b: number): number {
    return a + b; // Simplest implementation
  }
}
```

**Guidelines:**

- Write the minimum code to pass
- It's okay if code is "ugly"
- Don't over-engineer
- Commit when green

### 3. REFACTOR: Improve the Code

```typescript
class Calculator {
  add(...numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0);
  }
}
```

**Guidelines:**

- Clean up code smells
- Extract methods/classes
- Remove duplication
- Keep tests green throughout

## Test Types in TDD

### Unit Tests (Primary focus)

```typescript
describe('UserService', () => {
  it('should hash password before saving', async () => {
    const mockRepo = { save: vi.fn() };
    const service = new UserService(mockRepo);

    await service.createUser({ email: 'test@example.com', password: 'secret' });

    const savedUser = mockRepo.save.mock.calls[0][0];
    expect(savedUser.password).not.toBe('secret');
    expect(savedUser.password).toMatch(/^\$2[aby]\$/); // bcrypt pattern
  });
});
```

### Integration Tests (Secondary)

```typescript
describe('UserAPI', () => {
  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/users')
      .send({ email: 'test@example.com', password: 'secret123' });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

### E2E Tests (Tertiary)

```typescript
test('user can sign up and log in', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'secret123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

## TDD Patterns

### Triangulation

Add more test cases to drive generalization:

```typescript
it('adds 1 + 2 = 3', () => expect(add(1, 2)).toBe(3));
it('adds 2 + 3 = 5', () => expect(add(2, 3)).toBe(5));
it('adds 0 + 0 = 0', () => expect(add(0, 0)).toBe(0));
it('adds -1 + 1 = 0', () => expect(add(-1, 1)).toBe(0));
```

### Obvious Implementation

When the solution is clear, just implement it:

```typescript
// Test
it('returns greeting with name', () => {
  expect(greet('Alice')).toBe('Hello, Alice!');
});

// Implementation (obvious)
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

### Fake It Till You Make It

Start with hardcoded values, then generalize:

```typescript
// First: hardcoded
add(a: number, b: number): number {
  return 3;  // Makes first test pass
}

// Then: generalize with more tests
add(a: number, b: number): number {
  return a + b;
}
```

## Common TDD Mistakes

### ❌ Testing Implementation, Not Behavior

```typescript
// Bad: Tests internal state
it('should set loading to true', () => {
  component.fetchData();
  expect(component.loading).toBe(true);
});

// Good: Tests observable behavior
it('should show loading spinner while fetching', async () => {
  render(<Component />);
  fireEvent.click(screen.getByText('Load'));
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### ❌ Writing Too Many Tests at Once

```typescript
// Bad: Multiple tests failing at once
// Good: One test at a time, all green before next
```

### ❌ Skipping the Refactor Step

```typescript
// Bad: Accumulating technical debt
// Good: Refactor while tests are green
```

### ❌ Making Tests Too Specific

```typescript
// Bad: Brittle test
expect(result).toBe('Hello, Alice! Today is Monday, January 1st.');

// Good: Flexible assertion
expect(result).toContain('Hello, Alice');
expect(result).toMatch(/Today is \w+/);
```

## TDD with React Components

```typescript
describe('LoginForm', () => {
  it('should disable submit button when form is empty', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('should enable submit button when form is valid', async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');

    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('should show error message on invalid credentials', async () => {
    server.use(
      rest.post('/api/login', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
      })
    );

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

## When to Use TDD

✅ **Good candidates:**

- Business logic
- Data transformations
- State machines
- API endpoints
- Form validation
- Pure functions

⚠️ **Use judgment:**

- UI layout (may be better with visual testing)
- Third-party integrations
- Prototype/spike code
- One-off scripts

## TDD Rhythm

1. **Test list**: Write down all the tests you can think of
2. **Pick the simplest**: Start with easiest to implement
3. **RED**: Write failing test
4. **GREEN**: Make it pass
5. **REFACTOR**: Clean up
6. **Repeat**: Pick next test from list
7. **Update list**: Add new tests as you think of them
