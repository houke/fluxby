# Example Feature: User Stories

## Feature: Wishlist

### Epic

**As a** customer,
**I want** to save products for later,
**So that** I can easily find and purchase them in the future.

---

### User Stories

#### Story 1: Add to Wishlist (P0)

**As a** registered customer,
**I want** to add products to my wishlist from the product page,
**So that** I can save items I'm interested in.

**Acceptance Criteria**:

```gherkin
Scenario: Add product to wishlist
  Given I am logged in
    And I am viewing a product page
  When I click the "Add to Wishlist" button
  Then the product is added to my wishlist
    And I see a confirmation message "Added to wishlist"
    And the button changes to "In Wishlist ♥"

Scenario: Guest user adds to wishlist
  Given I am not logged in
  When I click the "Add to Wishlist" button
  Then I am prompted to log in or create an account
    And after login, the product is added to my wishlist
```

**Story Points**: 3

---

#### Story 2: View Wishlist (P0)

**As a** registered customer,
**I want** to view all items in my wishlist,
**So that** I can review products I've saved.

**Acceptance Criteria**:

```gherkin
Scenario: View wishlist with items
  Given I have items in my wishlist
  When I navigate to my wishlist page
  Then I see all saved products
    And each product shows image, name, price, and availability

Scenario: View empty wishlist
  Given my wishlist is empty
  When I navigate to my wishlist page
  Then I see a message "Your wishlist is empty"
    And I see a link to "Continue Shopping"
```

**Story Points**: 2

---

#### Story 3: Remove from Wishlist (P0)

**As a** registered customer,
**I want** to remove items from my wishlist,
**So that** I can manage my saved products.

**Acceptance Criteria**:

```gherkin
Scenario: Remove from wishlist page
  Given I am viewing my wishlist
  When I click "Remove" on an item
  Then the item is removed from my wishlist
    And I see a confirmation "Item removed"
    And I can undo within 5 seconds

Scenario: Remove from product page
  Given I am viewing a product that is in my wishlist
  When I click "In Wishlist ♥" button
  Then the product is removed from my wishlist
    And the button changes back to "Add to Wishlist"
```

**Story Points**: 2

---

#### Story 4: Move to Cart (P1)

**As a** registered customer,
**I want** to move wishlist items to my cart,
**So that** I can purchase them easily.

**Acceptance Criteria**:

```gherkin
Scenario: Move single item to cart
  Given I am viewing my wishlist
  When I click "Add to Cart" on an item
  Then the item is added to my cart
    And the item remains in my wishlist
    And I see "Added to cart" confirmation

Scenario: Move all items to cart
  Given I have multiple items in my wishlist
  When I click "Add All to Cart"
  Then all available items are added to my cart
    And out-of-stock items remain in wishlist only
    And I see a summary of items added
```

**Story Points**: 3

---

#### Story 5: Share Wishlist (P1)

**As a** registered customer,
**I want** to share my wishlist with others,
**So that** friends and family can see what I want.

**Acceptance Criteria**:

```gherkin
Scenario: Generate share link
  Given I am viewing my wishlist
  When I click "Share Wishlist"
  Then a unique shareable link is generated
    And I can copy the link
    And I can share via email or social media

Scenario: View shared wishlist
  Given someone has shared their wishlist with me
  When I visit the shared link
  Then I see their wishlist (read-only)
    And I can add items to my own cart
    And I cannot modify their wishlist
```

**Story Points**: 5

---

#### Story 6: Price Drop Notifications (P2)

**As a** registered customer,
**I want** to be notified when wishlist items go on sale,
**So that** I can purchase them at a better price.

**Acceptance Criteria**:

```gherkin
Scenario: Enable price drop alerts
  Given I have items in my wishlist
  When I enable "Notify me of price drops"
  Then I receive email when any item's price decreases
    And the email shows old price, new price, and savings

Scenario: View price history
  Given I am viewing my wishlist
  Then I see if any items have changed price
    And I see "Price dropped!" badge on discounted items
```

**Story Points**: 8

---

#### Story 7: Wishlist Sync (P2)

**As a** registered customer,
**I want** my wishlist to sync across devices,
**So that** I can access it anywhere.

**Acceptance Criteria**:

```gherkin
Scenario: Sync across devices
  Given I added an item to wishlist on my phone
  When I log in on my laptop
  Then I see the same wishlist items
    And changes on either device sync within seconds

Scenario: Merge guest wishlist
  Given I added items to wishlist as guest
  When I log in to my account
  Then guest wishlist items are merged with my account
    And I am asked to confirm the merge
```

**Story Points**: 5

---

## Story Mapping

```
                    WISHLIST EPIC
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
   SAVE              MANAGE             CONVERT
     │                   │                   │
┌────┴────┐       ┌──────┴──────┐      ┌────┴────┐
│         │       │             │      │         │
Add     Guest    View    Remove    Share   Move to  Price
Item    Prompt   List    Item      Link   Cart     Drop
(P0)    (P0)     (P0)    (P0)     (P1)   (P1)     (P2)
```

---

## Sprint Planning

### Sprint 1 (P0 Stories)

- Story 1: Add to Wishlist (3 pts)
- Story 2: View Wishlist (2 pts)
- Story 3: Remove from Wishlist (2 pts)
- **Total: 7 points**

### Sprint 2 (P1 Stories)

- Story 4: Move to Cart (3 pts)
- Story 5: Share Wishlist (5 pts)
- **Total: 8 points**

### Sprint 3 (P2 Stories)

- Story 6: Price Drop Notifications (8 pts)
- Story 7: Wishlist Sync (5 pts)
- **Total: 13 points**

---

## Technical Notes

- Wishlist stored in user profile, synced via API
- Guest wishlist stored in localStorage, merged on login
- Share links use unique UUID, not guessable
- Price drop checks run daily via cron job
