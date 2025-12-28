# AddressBook Test Verification Table

## Data Model Overview

### Tables

- **address_book**: Main contacts table (`id`, `iban`, `name`, `original_name`, `profile_id`)
- **contact_ibans**: Junction table for multiple IBANs per contact (`contact_id`, `iban`, `is_primary`)
- **shared_ibans**: IBANs marked as payment processors (`iban`, `provider_name`)
- **transactions**: Transactions with `address_book_id` foreign key and `opposing_account_iban`/`opposing_account_name`

### Key Concepts

- **Regular IBAN**: One company = one IBAN (e.g., Albert Heijn)
- **Shared IBAN**: Multiple merchants use same IBAN (e.g., Adyen, Mollie payment processors)
- **Partial Resolution**: When some merchants on a shared IBAN are resolved, but others remain

---

## Test Scenarios Table

| #     | Scenario                           | Setup                                      | Action            | Expected Result                   | Current Status |
| ----- | ---------------------------------- | ------------------------------------------ | ----------------- | --------------------------------- | -------------- |
| **1** | Regular IBAN with 1 merchant       | IBAN X has 3 transactions, all "Company A" | View shared-ibans | NOT shown (not a shared IBAN)     | ✅             |
| **2** | Shared IBAN with 3 merchants       | IBAN X has transactions from A, B, C       | View shared-ibans | Show IBAN with 3 merchants        | ✅             |
| **3** | Resolve 1 of 3 merchants           | Resolve merchant A to addressbook          | View shared-ibans | Show IBAN with 2 remaining (B, C) | ⚠️ VERIFY      |
| **4** | Resolve 2 of 3 merchants           | Resolve A and B                            | View shared-ibans | Show IBAN with 1 remaining (C)    | ⚠️ VERIFY      |
| **5** | Resolve all 3 merchants            | Resolve A, B, and C                        | View shared-ibans | NOT shown (all resolved)          | ⚠️ VERIFY      |
| **6** | Marked shared IBAN with 1 merchant | IBAN in shared_ibans table                 | View shared-ibans | Show IBAN (even single merchant)  | ⚠️ VERIFY      |

---

## Transaction Count Scenarios

| #      | Scenario                                  | Setup                                                                        | Expected Count                             | Current Status |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------ | -------------- |
| **7**  | Contact with address_book_id linked       | 5 transactions have `address_book_id = 100`                                  | 5                                          | ✅             |
| **8**  | Contact via IBAN match (no original_name) | Contact has IBAN X, 5 transactions have same IBAN, `address_book_id IS NULL` | 5                                          | ⚠️ VERIFY      |
| **9**  | Contact via original_name match           | Contact has `original_name = "Merchant A"`, IBAN X                           | Only transactions with name = "Merchant A" | ⚠️ VERIFY      |
| **10** | Contact via contact_ibans                 | Contact linked to IBAN via contact_ibans junction table                      | Should count those transactions            | ⚠️ VERIFY      |

---

## "New Contact" Badge Display Scenarios

| #      | Scenario                                    | Setup                                                         | Expected Display              | Current Status |
| ------ | ------------------------------------------- | ------------------------------------------------------------- | ----------------------------- | -------------- |
| **11** | Transaction linked via address_book_id      | `tx.address_book_id = 100`                                    | Green badge with contact name | ✅             |
| **12** | Transaction matched via IBAN (regular)      | Contact has IBAN X, tx has same IBAN, no address_book_id      | Green badge with contact name | ⚠️ VERIFY      |
| **13** | Transaction matched via IBAN (shared)       | Contact has IBAN X + `original_name`, tx has same IBAN + name | Green badge with contact name | ⚠️ VERIFY      |
| **14** | Same IBAN, different merchants (unresolved) | IBAN X has merchants A and B, neither resolved                | Blue badge "Shared IBAN"      | ⚠️ VERIFY      |
| **15** | Same IBAN, one resolved, one not            | Merchant A resolved, B not                                    | A: Green badge, B: Blue badge | ⚠️ BUG?        |

---

## Add to AddressBook Scenarios

| #      | Scenario                         | Setup                                    | Action                                | Expected Result                  | Current Status |
| ------ | -------------------------------- | ---------------------------------------- | ------------------------------------- | -------------------------------- | -------------- |
| **16** | Add merchant from shared IBAN    | Click "Add to AddressBook" on Merchant B | Creates contact, updates transactions | Contact created, tx count > 0    | ⚠️ BUG         |
| **17** | Add merchant to existing contact | Select "Add to existing contact"         | Links IBAN via contact_ibans          | IBAN added, transactions updated | ⚠️ VERIFY      |
| **18** | Add same merchant twice          | Already resolved, click add again        | Should not create duplicate           | No duplicate                     | ⚠️ VERIFY      |

---

## Known Issues (Reported)

### Issue 1: Shared IBAN completely gone

**User report**: "Shared iban is now completely gone"
**Potential causes**:

- Query condition filtering out all results
- Profile ID mismatch
- All merchants already have `address_book_id` set

### Issue 2: New contact badge on both transactions

**User report**: "transaction has an iban that is multiple times, the transaction views shows the new contact badge on both transactions"
**Analysis**: The `findAddressBookEntry` function uses IBAN matching as fallback, so all transactions with same IBAN show same badge
**Root cause**: When adding ONE merchant to addressbook, ALL transactions with that IBAN might get matched

### Issue 3: 0 transactions on new contact

**User report**: "when i add merchant B to addressbook it gets added to two rows, but the addressbook shows 0 transactions"
**Analysis**: The transaction count query requires either:

- `address_book_id` to be set, OR
- IBAN match with `address_book_id IS NULL` AND `original_name` match
  **Root cause**: If `address_book_id` is not being set on resolve, AND IBAN match has extra conditions, count = 0

---

## SQL Query Analysis

### GET /api/addressbook (transaction count)

```sql
LEFT JOIN transactions t ON (
  t.address_book_id = ab.id
  OR (
    t.address_book_id IS NULL
    AND t.opposing_account_iban IN (SELECT iban FROM contact_ibans WHERE contact_id = ab.id)
    AND (
      ab.original_name IS NULL
      OR (t.opposing_account_name = ab.original_name OR t.merchant_name = ab.original_name)
    )
  )
)
```

**Problem**: This OR condition might not work as expected:

1. If `address_book_id` is set → counts via first condition ✅
2. If `address_book_id` is NULL AND IBAN in contact_ibans → counts only if original_name matches ⚠️

### POST /api/addressbook/resolve-shared

```sql
UPDATE transactions SET merchant_name = ?, address_book_id = ?
WHERE profile_id = ? AND opposing_account_iban = ?
AND (opposing_account_name = ? OR merchant_name = ?)
```

**This DOES set address_book_id** - so if this works, transaction count should work too.

---

## Fix Recommendations

1. **Verify address_book_id is being set**: Add logging to resolve-shared endpoint
2. **Simplify transaction count query**: Don't mix OR conditions with original_name logic
3. **Badge display logic**: Use `tx.addressBookId` as primary source, not IBAN matching
4. **Add integration tests**: Test actual API endpoints, not just simulated logic
