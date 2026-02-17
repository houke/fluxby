# Writing User Stories Guide

## What is a User Story?

A user story describes a feature from the end user's perspective, focusing on the value delivered rather than implementation details.

---

## User Story Format

### Standard Format

```
As a [type of user],
I want [goal/desire],
So that [benefit/value].
```

### Examples

**Good**:

```
As a registered customer,
I want to save items to my wishlist,
So that I can purchase them later without searching again.
```

**Bad** (too technical):

```
As a user,
I want a database table for wishlist items,
So that items can be stored.
```

---

## INVEST Criteria

Good user stories follow INVEST:

| Letter | Meaning     | Description                   |
| ------ | ----------- | ----------------------------- |
| **I**  | Independent | Can be developed in any order |
| **N**  | Negotiable  | Details can be discussed      |
| **V**  | Valuable    | Delivers value to users       |
| **E**  | Estimable   | Team can estimate effort      |
| **S**  | Small       | Fits in one sprint            |
| **T**  | Testable    | Clear acceptance criteria     |

---

## Story Sizing

### Story Points Reference

| Points | Complexity | Example                      |
| ------ | ---------- | ---------------------------- |
| 1      | Trivial    | Change button text           |
| 2      | Simple     | Add form validation          |
| 3      | Small      | New API endpoint             |
| 5      | Medium     | New feature with UI          |
| 8      | Large      | Complex feature, integration |
| 13     | Very Large | Should be split              |

### Splitting Large Stories

**Before** (too big):

```
As a user, I want to manage my account settings.
```

**After** (split by capability):

```
1. As a user, I want to update my profile picture.
2. As a user, I want to change my email address.
3. As a user, I want to update my notification preferences.
4. As a user, I want to change my password.
5. As a user, I want to delete my account.
```

---

## Writing Acceptance Criteria

### Given-When-Then Format

```gherkin
Scenario: User saves item to wishlist

Given I am logged in as a customer
  And I am viewing a product page
When I click the "Add to Wishlist" button
Then the item is added to my wishlist
  And I see a confirmation message
  And the button changes to "Remove from Wishlist"
```

### Checklist Format

```markdown
## Acceptance Criteria

- [ ] Wishlist button visible on product pages
- [ ] Only logged-in users can add to wishlist
- [ ] Item persists across sessions
- [ ] Duplicate items are prevented
- [ ] User can remove items from wishlist
- [ ] Wishlist count shows in header
```

---

## Story Types

### Feature Story

```
As a customer,
I want to filter products by price range,
So that I can find items within my budget.
```

### Bug Fix Story

```
As a customer,
I expect the checkout total to include tax,
So that I know the final amount before payment.

Bug: Tax not calculated for shipping addresses in CA.
```

### Technical Story

```
As a developer,
I want to upgrade the payment SDK,
So that we have security patches and new features.

Note: No visible user change, but required for compliance.
```

### Spike (Research)

```
As a team,
We need to investigate payment provider options,
So that we can make an informed decision.

Timebox: 2 days
Output: Comparison document with recommendation
```

---

## Story Mapping

### Horizontal: User Activities

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSE  →  SEARCH  →  SELECT  →  CART  →  CHECKOUT  →  TRACK │
└─────────────────────────────────────────────────────────────────┘
```

### Vertical: Story Priority

```
        BROWSE          SEARCH          CART
        ──────          ──────          ────
MVP     View products   Search box      Add to cart
        ↓               ↓               ↓
v1.1    Categories      Filters         Edit quantity
        ↓               ↓               ↓
v1.2    Recommendations Autocomplete    Save for later
```

---

## Definition of Ready

Before a story enters a sprint:

- [ ] User story follows standard format
- [ ] Acceptance criteria are clear
- [ ] Dependencies identified
- [ ] Story is estimated
- [ ] Design/mocks available (if UI)
- [ ] Technical approach discussed
- [ ] Story fits in sprint capacity

---

## Definition of Done

Before a story is complete:

- [ ] Code complete and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Acceptance criteria met
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA verified
- [ ] Product owner accepted

---

## Common Mistakes

### ❌ Solution in the Story

```
As a user, I want a dropdown menu for categories...
```

**Fix**: Focus on the need, not the solution:

```
As a user, I want to browse products by category...
```

### ❌ Too Vague

```
As a user, I want the site to be fast.
```

**Fix**: Be specific and measurable:

```
As a user, I want pages to load in under 2 seconds,
So that I don't abandon the site due to slow performance.
```

### ❌ No Value Statement

```
As a user, I want to see my order history.
```

**Fix**: Include the "so that":

```
As a user, I want to see my order history,
So that I can track past purchases and reorder items.
```

### ❌ Epic Disguised as Story

```
As a user, I want to manage my account.
```

**Fix**: Break into smaller stories (see Splitting section).

---

## User Story Template

````markdown
## User Story: [Title]

**As a** [user type],
**I want** [goal],
**So that** [benefit].

### Acceptance Criteria

```gherkin
Scenario: [Happy path]
Given [context]
When [action]
Then [outcome]

Scenario: [Edge case]
Given [context]
When [action]
Then [outcome]
```
````

### Technical Notes

- [Implementation considerations]
- [Dependencies]

### Out of Scope

- [What this story does NOT include]

### Design

- [Link to mockups]

### Story Points: [X]

```

```
