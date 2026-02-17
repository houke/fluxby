# Testing Philosophy Guide

## The Testing Pyramid

```
          /\
         /  \
        / E2E\         <- Few, slow, expensive
       /------\
      /  Inte- \       <- Some, medium
     /  gration \
    /------------\
   /    Unit      \    <- Many, fast, cheap
  /________________\
```

### Layer Responsibilities

| Layer           | Purpose                           | Speed  | Isolation |
| --------------- | --------------------------------- | ------ | --------- |
| **Unit**        | Test individual functions/classes | < 10ms | Complete  |
| **Integration** | Test components working together  | < 1s   | Partial   |
| **E2E**         | Test full user flows              | < 30s  | None      |

---

## Testing Principles

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Testing implementation details
it('should set loading state to true', () => {
  const { result } = renderHook(() => useData());
  act(() => result.current.fetch());
  expect(result.current.isLoading).toBe(true);  // Internal state
});

// ✅ Good: Testing observable behavior
it('should show loading indicator while fetching', async () => {
  render(<DataComponent />);
  fireEvent.click(screen.getByText('Load'));
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### 2. Arrange-Act-Assert (AAA)

```typescript
it('should calculate discount correctly', () => {
  // Arrange: Set up test data
  const cart = new Cart();
  cart.addItem({ id: '1', price: 100, quantity: 2 });
  const coupon = { code: 'SAVE10', discount: 0.1 };

  // Act: Perform the action
  cart.applyCoupon(coupon);

  // Assert: Verify the result
  expect(cart.total).toBe(180);
});
```

### 3. Given-When-Then (BDD Style)

```typescript
describe('Shopping Cart', () => {
  describe('when applying a percentage coupon', () => {
    it('should reduce total by the percentage', () => {
      // Given
      const cart = createCartWithItems([
        { price: 100, quantity: 1 },
        { price: 50, quantity: 2 },
      ]);

      // When
      cart.applyCoupon({ type: 'percentage', value: 10 });

      // Then
      expect(cart.total).toBe(180); // 200 - 10%
    });
  });
});
```

### 4. FIRST Principles

- **F**ast: Tests should run quickly
- **I**ndependent: Tests shouldn't depend on each other
- **R**epeatable: Same results every time
- **S**elf-validating: Pass or fail, no manual checking
- **T**imely: Written with the code, not after

---

## What to Test

### High Value Tests

✅ **Business logic**: Calculations, transformations, rules
✅ **Edge cases**: Empty inputs, boundaries, errors
✅ **User interactions**: Forms, navigation, feedback
✅ **Integration points**: API calls, database operations
✅ **Accessibility**: Keyboard navigation, screen readers

### Low Value Tests

❌ **Implementation details**: Private methods, internal state
❌ **Framework code**: React renders, library functions
❌ **Trivial code**: Getters/setters, pass-through functions
❌ **Visual layout**: Pixel positions (use visual regression testing)

---

## Test Structure

### Describe Blocks

```typescript
describe('UserService', () => {
  // Group by method
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw on duplicate email', () => {});
    it('should hash password before saving', () => {});
  });

  describe('authenticateUser', () => {
    it('should return user on valid credentials', () => {});
    it('should return null on invalid password', () => {});
    it('should lock account after 5 failed attempts', () => {});
  });
});
```

### Test Naming

```typescript
// Pattern: should [expected behavior] when [condition]
it('should show error message when form is invalid', () => {});
it('should redirect to dashboard when login succeeds', () => {});
it('should disable submit button when fields are empty', () => {});

// Or: [verb] [expected outcome]
it('returns null for non-existent user', () => {});
it('throws ValidationError for invalid email', () => {});
it('emits event when state changes', () => {});
```

---

## Test Data Management

### Factories

```typescript
// userFactory.ts
export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'user',
    createdAt: new Date(),
    ...overrides,
  };
}

// Usage
const user = createUser({ role: 'admin' });
const users = Array.from({ length: 10 }, () => createUser());
```

### Fixtures

```typescript
// fixtures/users.ts
export const testUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
};

export const adminUser = {
  ...testUser,
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'admin@example.com',
  role: 'admin' as const,
};
```

---

## Code Coverage

### What Coverage Measures

- **Line coverage**: Were all lines executed?
- **Branch coverage**: Were all if/else branches taken?
- **Function coverage**: Were all functions called?
- **Statement coverage**: Were all statements executed?

### Coverage Guidelines

| Type           | Minimum | Ideal |
| -------------- | ------- | ----- |
| Overall        | 70%     | 80%+  |
| Business logic | 90%     | 95%+  |
| Utilities      | 90%     | 100%  |
| UI Components  | 60%     | 80%   |

### Coverage ≠ Quality

```typescript
// 100% coverage but useless test
it('should work', () => {
  const result = calculateTax(100);
  expect(result).toBeDefined(); // ❌ Meaningless assertion
});

// Better: Test actual behavior
it('should calculate 10% tax', () => {
  const result = calculateTax(100);
  expect(result).toBe(10); // ✅ Meaningful assertion
});
```

---

## Anti-Patterns to Avoid

### 1. Testing Multiple Things

```typescript
// ❌ Bad
it('should handle user operations', async () => {
  const user = await createUser(data);
  expect(user.id).toBeDefined();

  const updated = await updateUser(user.id, { name: 'New' });
  expect(updated.name).toBe('New');

  await deleteUser(user.id);
  const found = await getUser(user.id);
  expect(found).toBeNull();
});

// ✅ Good: Separate tests
it('should create user', async () => {});
it('should update user name', async () => {});
it('should delete user', async () => {});
```

### 2. Shared Mutable State

```typescript
// ❌ Bad
let user: User;

beforeAll(() => {
  user = createUser();
});

it('test 1', () => {
  user.name = 'Changed'; // Mutates shared state
});

it('test 2', () => {
  expect(user.name).toBe('Original'); // Fails unpredictably
});

// ✅ Good: Fresh state per test
beforeEach(() => {
  user = createUser();
});
```

### 3. Over-Mocking

```typescript
// ❌ Bad: Mocking everything
it('should work', () => {
  const mockService = { getUser: vi.fn().mockReturnValue(mockUser) };
  const mockRepo = { save: vi.fn() };
  const mockEmail = { send: vi.fn() };
  // Testing mocks, not real code
});

// ✅ Good: Mock only boundaries
it('should work', () => {
  const mockApi = vi.fn(); // Only mock external API
  // Use real service, repo, etc.
});
```

---

## Test Maintenance

### When to Update Tests

- ✅ Business requirements change
- ✅ API contracts change
- ❌ Implementation refactoring (tests should still pass)
- ❌ Adding new features (add new tests, don't modify old)

### Flaky Test Handling

```typescript
// Identify flaky tests
it.skip('flaky test to fix', () => {});

// Increase timeout for slow tests
it('slow async operation', async () => {}, 10000);

// Use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```
