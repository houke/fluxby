# Acceptance Criteria Patterns

## What are Acceptance Criteria?

Acceptance criteria define the conditions that must be met for a user story to be considered complete. They are the contract between product and development teams.

---

## Formats

### Given-When-Then (BDD/Gherkin)

Best for: Behavior-driven scenarios

```gherkin
Scenario: User logs in successfully
  Given the user is on the login page
    And the user has a valid account
  When the user enters correct credentials
    And clicks the login button
  Then the user is redirected to the dashboard
    And sees a welcome message with their name
```

### Checklist Format

Best for: Quick validation items

```markdown
- [ ] Login form has email and password fields
- [ ] Password field masks input
- [ ] "Forgot password" link is visible
- [ ] Error message shows for invalid credentials
- [ ] User is redirected to intended page after login
- [ ] Session persists across browser tabs
```

### Rule-Based Format

Best for: Complex business rules

```markdown
**Rule**: Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&\*)
- Cannot match previous 5 passwords
```

---

## Writing Good Acceptance Criteria

### The 3 C's

| C            | Meaning     | Description             |
| ------------ | ----------- | ----------------------- |
| **Clear**    | Unambiguous | Anyone can understand   |
| **Concise**  | Brief       | No unnecessary words    |
| **Testable** | Verifiable  | Can write a test for it |

### Good vs Bad Examples

**❌ Bad**: Vague, subjective

```
The page should load quickly
```

**✅ Good**: Specific, measurable

```
Given the user has a stable internet connection
When the user navigates to the dashboard
Then the page fully loads within 2 seconds
```

**❌ Bad**: Implementation detail

```
Use Redis for session caching
```

**✅ Good**: Behavioral requirement

```
Given the user has logged in
When the user opens a new browser tab
Then the user remains logged in
```

---

## Scenario Patterns

### Happy Path

The main success scenario:

```gherkin
Scenario: Successful purchase
  Given I have items in my cart
    And I am logged in
    And my payment method is valid
  When I complete checkout
  Then my order is placed
    And I receive a confirmation email
    And my cart is cleared
```

### Error/Failure Path

What happens when things go wrong:

```gherkin
Scenario: Payment declined
  Given I have items in my cart
    And my payment method is invalid
  When I attempt to complete checkout
  Then I see an error message "Payment declined"
    And my cart items are preserved
    And I can try a different payment method
```

### Edge Cases

Boundary conditions:

```gherkin
Scenario: Cart quantity limits
  Given I have 99 of an item in my cart
  When I try to add one more of the same item
  Then the quantity updates to 100
    And I see a message "Maximum quantity reached"

Scenario: Empty cart checkout
  Given my cart is empty
  When I navigate to checkout
  Then I am redirected to the cart page
    And I see a message "Your cart is empty"
```

### Security Scenarios

```gherkin
Scenario: Rate limiting on login
  Given I have failed to log in 5 times
  When I attempt to log in again
  Then I am blocked for 15 minutes
    And I see a message with remaining lockout time

Scenario: Session timeout
  Given I have been inactive for 30 minutes
  When I try to perform any action
  Then I am redirected to the login page
    And I see a message "Session expired"
```

---

## Acceptance Criteria by Feature Type

### Form Submission

```markdown
## Acceptance Criteria: Contact Form

### Validation

- [ ] Name field required, max 100 characters
- [ ] Email field required, valid email format
- [ ] Message field required, max 1000 characters
- [ ] Submit button disabled until all required fields valid

### Submission

- [ ] Loading indicator shows during submission
- [ ] Success message appears on completion
- [ ] Form clears after successful submission
- [ ] Error message shows if submission fails
- [ ] User can retry after failure

### Accessibility

- [ ] All fields have visible labels
- [ ] Error messages associated with fields
- [ ] Focus moves to first error on validation failure
```

### Search Feature

```gherkin
Scenario: Basic search
  Given I am on any page
  When I type "wireless headphones" in the search box
    And press Enter
  Then I see search results for "wireless headphones"
    And results show product name, image, and price

Scenario: No results
  Given I search for "xyznonexistent123"
  Then I see "No results found"
    And I see suggested search terms
    And I see popular products

Scenario: Search autocomplete
  Given I type "wire" in the search box
  When I pause typing for 300ms
  Then I see autocomplete suggestions
    And suggestions highlight the matching text
```

### Authentication

```gherkin
Feature: User Authentication

Scenario: Successful login
  Given I am on the login page
  When I enter valid credentials
  Then I am logged in
    And redirected to my intended destination
    And I see my account menu

Scenario: Invalid password
  Given I am on the login page
  When I enter a valid email with wrong password
  Then I see "Invalid email or password"
    And the password field is cleared
    And focus is on the password field

Scenario: Remember me
  Given I check "Remember me" during login
  When I close and reopen the browser
  Then I remain logged in

Scenario: Password reset
  Given I click "Forgot password"
  When I enter my registered email
  Then I see "Reset link sent"
    And I receive an email within 5 minutes
    And the link expires after 24 hours
```

---

## Acceptance Criteria Template

````markdown
## Feature: [Feature Name]

### Story

As a [user type],
I want [goal],
So that [benefit].

### Acceptance Criteria

#### Functional Requirements

```gherkin
Scenario: [Primary happy path]
  Given [precondition]
  When [action]
  Then [result]
```
````

#### Validation Rules

- [ ] [Validation rule 1]
- [ ] [Validation rule 2]

#### Error Handling

- [ ] [Error case 1]: [Expected behavior]
- [ ] [Error case 2]: [Expected behavior]

#### Performance

- [ ] [Performance requirement with metric]

#### Security

- [ ] [Security requirement]

#### Accessibility

- [ ] [Accessibility requirement]

### Out of Scope

- [What is NOT included in this story]

### Open Questions

- [ ] [Question needing clarification]

```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| "Should work properly" | Vague, untestable | Define specific behavior |
| "User-friendly" | Subjective | Use measurable UX criteria |
| "Handle all errors" | Incomplete | List specific error cases |
| "Secure" | Too broad | Specify security requirements |
| UI implementation | Premature design | Focus on behavior |
| No negative cases | Incomplete coverage | Add error scenarios |

---

## Review Checklist

Before finalizing acceptance criteria:

- [ ] Each criterion is independently testable
- [ ] Happy path is covered
- [ ] Error cases are covered
- [ ] Edge cases are covered
- [ ] Performance expectations stated
- [ ] Security considerations included
- [ ] Accessibility requirements included
- [ ] No implementation details
- [ ] Clear and unambiguous language
- [ ] Stakeholders have reviewed
```
