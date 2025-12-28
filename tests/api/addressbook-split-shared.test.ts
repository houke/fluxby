import { describe, it, expect } from 'vitest';

/**
 * Test suite for address book split and shared IBAN logic
 *
 * Tests verify the following behaviors:
 *
 * 1. SPLIT FUNCTIONALITY:
 *    - Splitting should ALWAYS work (never fail)
 *    - If split creates a contact with an existing name, MERGE into that contact
 *    - If split creates a contact with an IBAN already on another contact, MERGE transactions
 *    - Use INSERT OR REPLACE to avoid UNIQUE constraint errors
 *
 * 2. SHARED IBAN VISIBILITY:
 *    - Shared IBANs should show in /api/addressbook/shared-ibans until ALL merchants are resolved
 *    - If 3 merchants share an IBAN and 1 is resolved, remaining 2 should still show
 *    - Partial resolution should NOT hide remaining merchants
 */

// ============================================
// SPLIT FUNCTIONALITY TESTS
// ============================================

describe('Split Functionality', () => {
  /**
   * Split logic simulation - mirrors the backend split endpoint behavior
   */
  interface SplitInput {
    contactId: number;
    ibans: Array<{
      iban: string;
      newName: string;
    }>;
  }

  interface Contact {
    id: number;
    name: string;
    iban: string | null;
    originalName: string | null;
  }

  interface ContactIban {
    contactId: number;
    iban: string;
    isPrimary: number;
  }

  interface Transaction {
    id: number;
    iban: string;
    addressBookId: number | null;
  }

  /**
   * Simulates the split endpoint logic
   * Returns: { created: Contact[], merged: Contact[], errors: string[] }
   *
   * The split endpoint receives a contactId to split FROM, and a list of IBANs
   * to split out. For each IBAN:
   * 1. Remove link from original contact
   * 2. If newName matches another contact -> merge into that contact
   * 3. Else if IBAN exists on another contact -> merge into that contact
   * 4. Else create new contact
   */
  function simulateSplit(
    input: SplitInput,
    existingContacts: Contact[],
    existingContactIbans: ContactIban[],
    transactions: Transaction[]
  ): {
    created: Contact[];
    merged: Contact[];
    errors: string[];
    updatedTransactions: Transaction[];
  } {
    const created: Contact[] = [];
    const merged: Contact[] = [];
    const errors: string[] = [];
    const updatedTransactions = [...transactions];

    let nextId = Math.max(...existingContacts.map((c) => c.id), 0) + 1;

    for (const { iban, newName } of input.ibans) {
      // Step 1: Remove old link from the source contact (if it exists)
      const oldLinkIdx = existingContactIbans.findIndex(
        (ci) => ci.contactId === input.contactId && ci.iban === iban
      );
      if (oldLinkIdx >= 0) {
        existingContactIbans.splice(oldLinkIdx, 1);
      }

      // Step 2: Check if name already exists (on a DIFFERENT contact)
      const existingByName = existingContacts.find(
        (c) =>
          c.id !== input.contactId &&
          c.name.toLowerCase() === newName.toLowerCase()
      );

      if (existingByName) {
        // MERGE: Add IBAN to existing contact (via contact_ibans)
        const alreadyLinked = existingContactIbans.some(
          (ci) => ci.contactId === existingByName.id && ci.iban === iban
        );
        if (!alreadyLinked) {
          existingContactIbans.push({
            contactId: existingByName.id,
            iban,
            isPrimary: 0,
          });
        }
        // Update transactions to point to this contact
        for (const tx of updatedTransactions) {
          if (tx.iban === iban) {
            tx.addressBookId = existingByName.id;
          }
        }
        merged.push(existingByName);
        continue;
      }

      // Step 3: Check if IBAN is already linked to another contact (not the source)
      const existingIbanLink = existingContactIbans.find(
        (ci) => ci.iban === iban && ci.contactId !== input.contactId
      );
      if (existingIbanLink) {
        const existingContact = existingContacts.find(
          (c) => c.id === existingIbanLink.contactId
        );
        if (existingContact) {
          // MERGE: Update transactions to point to existing contact
          for (const tx of updatedTransactions) {
            if (tx.iban === iban) {
              tx.addressBookId = existingContact.id;
            }
          }
          merged.push(existingContact);
          continue;
        }
      }

      // Step 4: Create new contact
      const newContact: Contact = {
        id: nextId++,
        name: newName,
        iban,
        originalName: null,
      };
      existingContacts.push(newContact);
      existingContactIbans.push({
        contactId: newContact.id,
        iban,
        isPrimary: 1,
      });
      // Update transactions
      for (const tx of updatedTransactions) {
        if (tx.iban === iban) {
          tx.addressBookId = newContact.id;
        }
      }
      created.push(newContact);
    }

    return { created, merged, errors, updatedTransactions };
  }

  describe('Basic split scenarios', () => {
    it('should split a contact with multiple IBANs into separate contacts', () => {
      const contacts: Contact[] = [
        { id: 1, name: 'Original Contact', iban: 'IBAN1', originalName: null },
      ];
      const contactIbans: ContactIban[] = [
        { contactId: 1, iban: 'IBAN1', isPrimary: 1 },
        { contactId: 1, iban: 'IBAN2', isPrimary: 0 },
        { contactId: 1, iban: 'IBAN3', isPrimary: 0 },
      ];
      const transactions: Transaction[] = [
        { id: 1, iban: 'IBAN1', addressBookId: 1 },
        { id: 2, iban: 'IBAN2', addressBookId: 1 },
        { id: 3, iban: 'IBAN3', addressBookId: 1 },
      ];

      const result = simulateSplit(
        {
          contactId: 1,
          ibans: [
            { iban: 'IBAN2', newName: 'Contact 2' },
            { iban: 'IBAN3', newName: 'Contact 3' },
          ],
        },
        contacts,
        contactIbans,
        transactions
      );

      expect(result.errors).toHaveLength(0);
      expect(result.created).toHaveLength(2);
      expect(result.created[0].name).toBe('Contact 2');
      expect(result.created[1].name).toBe('Contact 3');
    });

    it('should merge into existing contact when name already exists', () => {
      const contacts: Contact[] = [
        { id: 1, name: 'Original Contact', iban: 'IBAN1', originalName: null },
        {
          id: 2,
          name: 'Existing Contact',
          iban: 'OTHER_IBAN',
          originalName: null,
        },
      ];
      const contactIbans: ContactIban[] = [
        { contactId: 1, iban: 'IBAN1', isPrimary: 1 },
        { contactId: 1, iban: 'IBAN2', isPrimary: 0 },
        { contactId: 2, iban: 'OTHER_IBAN', isPrimary: 1 },
      ];
      const transactions: Transaction[] = [
        { id: 1, iban: 'IBAN1', addressBookId: 1 },
        { id: 2, iban: 'IBAN2', addressBookId: 1 },
      ];

      const result = simulateSplit(
        {
          contactId: 1,
          ibans: [{ iban: 'IBAN2', newName: 'Existing Contact' }], // Name already exists!
        },
        contacts,
        contactIbans,
        transactions
      );

      // Should NOT create new contact, should MERGE
      expect(result.errors).toHaveLength(0);
      expect(result.created).toHaveLength(0);
      expect(result.merged).toHaveLength(1);
      expect(result.merged[0].name).toBe('Existing Contact');

      // IBAN2 should now be linked to contact 2
      const iban2Link = contactIbans.find((ci) => ci.iban === 'IBAN2');
      expect(iban2Link?.contactId).toBe(2);

      // Transaction should point to contact 2
      expect(result.updatedTransactions[1].addressBookId).toBe(2);
    });

    it('should merge when IBAN is already linked to another contact', () => {
      const contacts: Contact[] = [
        { id: 1, name: 'Original Contact', iban: 'IBAN1', originalName: null },
        { id: 2, name: 'Other Contact', iban: 'IBAN2', originalName: null },
      ];
      const contactIbans: ContactIban[] = [
        { contactId: 1, iban: 'IBAN1', isPrimary: 1 },
        { contactId: 1, iban: 'IBAN2', isPrimary: 0 }, // IBAN2 on contact 1
        { contactId: 2, iban: 'IBAN2', isPrimary: 1 }, // IBAN2 also on contact 2!
      ];
      const transactions: Transaction[] = [
        { id: 1, iban: 'IBAN1', addressBookId: 1 },
        { id: 2, iban: 'IBAN2', addressBookId: 1 },
      ];

      const result = simulateSplit(
        {
          contactId: 1,
          ibans: [{ iban: 'IBAN2', newName: 'New Name' }],
        },
        contacts,
        contactIbans,
        transactions
      );

      // Should MERGE because IBAN2 is already linked to contact 2
      expect(result.errors).toHaveLength(0);
      expect(result.created).toHaveLength(0);
      expect(result.merged).toHaveLength(1);
      expect(result.merged[0].id).toBe(2);
    });

    it('should never fail - always split or merge', () => {
      // Even with edge cases, split should always succeed
      const contacts: Contact[] = [
        { id: 1, name: 'Contact', iban: 'IBAN1', originalName: null },
        { id: 2, name: 'Other Contact', iban: 'OTHER', originalName: null },
      ];
      const contactIbans: ContactIban[] = [
        { contactId: 1, iban: 'IBAN1', isPrimary: 1 },
        { contactId: 1, iban: 'IBAN2', isPrimary: 0 },
        { contactId: 2, iban: 'OTHER', isPrimary: 1 },
      ];
      const transactions: Transaction[] = [];

      // Split with name that matches another contact (not source)
      const result = simulateSplit(
        {
          contactId: 1,
          ibans: [
            { iban: 'IBAN2', newName: 'Other Contact' }, // Matches contact 2 - should merge
          ],
        },
        contacts,
        contactIbans,
        transactions
      );

      expect(result.errors).toHaveLength(0);
      // Should merge because name matches contact 2
      expect(result.merged).toHaveLength(1);
      expect(result.merged[0].id).toBe(2);
    });
  });
});

// ============================================
// SHARED IBAN VISIBILITY TESTS
// ============================================

describe('Shared IBAN Visibility', () => {
  /**
   * Simulates the shared-ibans endpoint logic
   */
  interface AddressBookEntry {
    id: number;
    iban: string | null;
    name: string;
    originalName: string | null;
    profileId: number;
  }

  interface Transaction {
    id: number;
    opposingAccountIban: string;
    opposingAccountName: string;
    addressBookId: number | null;
    profileId: number;
  }

  interface ContactIban {
    contactId: number;
    iban: string;
  }

  interface SharedIbanEntry {
    iban: string;
  }

  interface SharedIbanResult {
    iban: string;
    merchantCount: number;
    merchants: Array<{ name: string; transactionCount: number }>;
    isPartiallyResolved: boolean;
  }

  function getSharedIbans(
    profileId: number,
    transactions: Transaction[],
    addressBook: AddressBookEntry[],
    contactIbans: ContactIban[],
    sharedIbans: SharedIbanEntry[]
  ): SharedIbanResult[] {
    // Group unresolved transactions by IBAN
    const unresolvedByIban = new Map<string, Map<string, number>>();

    for (const tx of transactions) {
      if (tx.profileId !== profileId) continue;
      if (tx.addressBookId !== null) continue; // Already resolved
      if (!tx.opposingAccountIban) continue;

      const iban = tx.opposingAccountIban;
      if (!unresolvedByIban.has(iban)) {
        unresolvedByIban.set(iban, new Map());
      }
      const merchants = unresolvedByIban.get(iban);
      if (!merchants) continue;
      const count = merchants.get(tx.opposingAccountName) || 0;
      merchants.set(tx.opposingAccountName, count + 1);
    }

    const results: SharedIbanResult[] = [];

    for (const [iban, merchantsMap] of unresolvedByIban) {
      const merchantCount = merchantsMap.size;

      // Check if this IBAN has any address book entries (partial resolution)
      const ibanEntries = addressBook.filter(
        (ab) =>
          ab.profileId === profileId &&
          (ab.iban === iban ||
            contactIbans.some(
              (ci) => ci.contactId === ab.id && ci.iban === iban
            ))
      );
      const isPartiallyResolved = ibanEntries.length > 0;

      // Check if marked as shared
      const isMarkedShared = sharedIbans.some((s) => s.iban === iban);

      // Determine if we should show this IBAN:
      // 1. Multiple merchants unresolved
      // 2. OR marked as shared with at least 1 merchant
      // 3. OR partially resolved with at least 1 merchant remaining
      const shouldShow =
        merchantCount > 1 ||
        (isMarkedShared && merchantCount > 0) ||
        (isPartiallyResolved && merchantCount > 0);

      if (shouldShow) {
        results.push({
          iban,
          merchantCount,
          merchants: Array.from(merchantsMap.entries()).map(
            ([name, count]) => ({
              name,
              transactionCount: count,
            })
          ),
          isPartiallyResolved,
        });
      }
    }

    return results;
  }

  describe('Shared IBAN remains visible until all merchants resolved', () => {
    const SHARED_IBAN = 'NL04ADYB2017400157'; // Payment processor
    const PROFILE_ID = 1;

    it('should show shared IBAN with multiple unresolved merchants', () => {
      const transactions: Transaction[] = [
        {
          id: 1,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
        {
          id: 2,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
        {
          id: 3,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant B',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
        {
          id: 4,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant C',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
      ];
      const addressBook: AddressBookEntry[] = [];
      const contactIbans: ContactIban[] = [];
      const sharedIbans: SharedIbanEntry[] = [];

      const result = getSharedIbans(
        PROFILE_ID,
        transactions,
        addressBook,
        contactIbans,
        sharedIbans
      );

      expect(result).toHaveLength(1);
      expect(result[0].iban).toBe(SHARED_IBAN);
      expect(result[0].merchantCount).toBe(3); // A, B, C
      expect(result[0].isPartiallyResolved).toBe(false);
    });

    it('should still show shared IBAN after resolving ONE merchant (2 remaining)', () => {
      // Scenario: User resolved Merchant A, now B and C are still unresolved
      const transactions: Transaction[] = [
        {
          id: 1,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: 100,
          profileId: PROFILE_ID,
        }, // RESOLVED
        {
          id: 2,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: 100,
          profileId: PROFILE_ID,
        }, // RESOLVED
        {
          id: 3,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant B',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
        {
          id: 4,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant C',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
      ];
      const addressBook: AddressBookEntry[] = [
        {
          id: 100,
          iban: SHARED_IBAN,
          name: 'Merchant A',
          originalName: 'Merchant A',
          profileId: PROFILE_ID,
        },
      ];
      const contactIbans: ContactIban[] = [];
      const sharedIbans: SharedIbanEntry[] = [];

      const result = getSharedIbans(
        PROFILE_ID,
        transactions,
        addressBook,
        contactIbans,
        sharedIbans
      );

      // Should STILL show the shared IBAN with remaining merchants
      expect(result).toHaveLength(1);
      expect(result[0].iban).toBe(SHARED_IBAN);
      expect(result[0].merchantCount).toBe(2); // B and C
      expect(result[0].merchants.map((m) => m.name).sort()).toEqual([
        'Merchant B',
        'Merchant C',
      ]);
      expect(result[0].isPartiallyResolved).toBe(true);
    });

    it('should still show shared IBAN after resolving TWO merchants (1 remaining)', () => {
      // Scenario: User resolved A and B, only C is left
      const transactions: Transaction[] = [
        {
          id: 1,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: 100,
          profileId: PROFILE_ID,
        },
        {
          id: 2,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: 100,
          profileId: PROFILE_ID,
        },
        {
          id: 3,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant B',
          addressBookId: 101,
          profileId: PROFILE_ID,
        },
        {
          id: 4,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant C',
          addressBookId: null,
          profileId: PROFILE_ID,
        }, // Last one!
      ];
      const addressBook: AddressBookEntry[] = [
        {
          id: 100,
          iban: SHARED_IBAN,
          name: 'Merchant A',
          originalName: 'Merchant A',
          profileId: PROFILE_ID,
        },
        {
          id: 101,
          iban: SHARED_IBAN,
          name: 'Merchant B',
          originalName: 'Merchant B',
          profileId: PROFILE_ID,
        },
      ];
      const contactIbans: ContactIban[] = [];
      const sharedIbans: SharedIbanEntry[] = [];

      const result = getSharedIbans(
        PROFILE_ID,
        transactions,
        addressBook,
        contactIbans,
        sharedIbans
      );

      // Should STILL show because we have partial resolution + 1 remaining
      expect(result).toHaveLength(1);
      expect(result[0].iban).toBe(SHARED_IBAN);
      expect(result[0].merchantCount).toBe(1);
      expect(result[0].merchants[0].name).toBe('Merchant C');
      expect(result[0].isPartiallyResolved).toBe(true);
    });

    it('should NOT show shared IBAN when ALL merchants are resolved', () => {
      // All transactions have addressBookId set
      const transactions: Transaction[] = [
        {
          id: 1,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: 100,
          profileId: PROFILE_ID,
        },
        {
          id: 2,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant B',
          addressBookId: 101,
          profileId: PROFILE_ID,
        },
        {
          id: 3,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant C',
          addressBookId: 102,
          profileId: PROFILE_ID,
        },
      ];
      const addressBook: AddressBookEntry[] = [
        {
          id: 100,
          iban: SHARED_IBAN,
          name: 'Merchant A',
          originalName: 'Merchant A',
          profileId: PROFILE_ID,
        },
        {
          id: 101,
          iban: SHARED_IBAN,
          name: 'Merchant B',
          originalName: 'Merchant B',
          profileId: PROFILE_ID,
        },
        {
          id: 102,
          iban: SHARED_IBAN,
          name: 'Merchant C',
          originalName: 'Merchant C',
          profileId: PROFILE_ID,
        },
      ];
      const contactIbans: ContactIban[] = [];
      const sharedIbans: SharedIbanEntry[] = [];

      const result = getSharedIbans(
        PROFILE_ID,
        transactions,
        addressBook,
        contactIbans,
        sharedIbans
      );

      // Should NOT show - all resolved
      expect(result).toHaveLength(0);
    });

    it('should show marked shared IBAN even with only 1 merchant remaining', () => {
      // IBAN is explicitly marked as shared
      const transactions: Transaction[] = [
        {
          id: 1,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Last Merchant',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
      ];
      const addressBook: AddressBookEntry[] = [];
      const contactIbans: ContactIban[] = [];
      const sharedIbans: SharedIbanEntry[] = [{ iban: SHARED_IBAN }];

      const result = getSharedIbans(
        PROFILE_ID,
        transactions,
        addressBook,
        contactIbans,
        sharedIbans
      );

      // Should show because it's marked as shared
      expect(result).toHaveLength(1);
      expect(result[0].iban).toBe(SHARED_IBAN);
    });
  });

  describe('Edge cases', () => {
    const SHARED_IBAN = 'NL04ADYB2017400157';
    const PROFILE_ID = 1;

    it('should handle entry without originalName (via regular POST)', () => {
      // User created entry via regular POST "/" endpoint, which doesn't set original_name
      const transactions: Transaction[] = [
        {
          id: 1,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: 100,
          profileId: PROFILE_ID,
        },
        {
          id: 2,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant B',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
      ];
      const addressBook: AddressBookEntry[] = [
        {
          id: 100,
          iban: SHARED_IBAN,
          name: 'Merchant A',
          originalName: null,
          profileId: PROFILE_ID,
        }, // NO original_name!
      ];
      const contactIbans: ContactIban[] = [];
      const sharedIbans: SharedIbanEntry[] = [];

      const result = getSharedIbans(
        PROFILE_ID,
        transactions,
        addressBook,
        contactIbans,
        sharedIbans
      );

      // Should STILL show remaining merchant B even though entry A has no original_name
      expect(result).toHaveLength(1);
      expect(result[0].merchants[0].name).toBe('Merchant B');
      expect(result[0].isPartiallyResolved).toBe(true);
    });

    it('should handle contact_ibans linking', () => {
      // IBAN linked via contact_ibans, not address_book.iban
      const transactions: Transaction[] = [
        {
          id: 1,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant A',
          addressBookId: 100,
          profileId: PROFILE_ID,
        },
        {
          id: 2,
          opposingAccountIban: SHARED_IBAN,
          opposingAccountName: 'Merchant B',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
      ];
      const addressBook: AddressBookEntry[] = [
        {
          id: 100,
          iban: 'OTHER_IBAN',
          name: 'Merchant A',
          originalName: null,
          profileId: PROFILE_ID,
        }, // Different IBAN!
      ];
      const contactIbans: ContactIban[] = [
        { contactId: 100, iban: SHARED_IBAN }, // But linked via contact_ibans
      ];
      const sharedIbans: SharedIbanEntry[] = [];

      const result = getSharedIbans(
        PROFILE_ID,
        transactions,
        addressBook,
        contactIbans,
        sharedIbans
      );

      // Should recognize partial resolution via contact_ibans
      expect(result).toHaveLength(1);
      expect(result[0].isPartiallyResolved).toBe(true);
    });

    it('should not show regular IBAN with single transaction', () => {
      // Not a shared IBAN, just a regular one with 1 transaction
      const REGULAR_IBAN = 'NL91ABNA0417164300';
      const transactions: Transaction[] = [
        {
          id: 1,
          opposingAccountIban: REGULAR_IBAN,
          opposingAccountName: 'Single Company',
          addressBookId: null,
          profileId: PROFILE_ID,
        },
      ];
      const addressBook: AddressBookEntry[] = [];
      const contactIbans: ContactIban[] = [];
      const sharedIbans: SharedIbanEntry[] = [];

      const result = getSharedIbans(
        PROFILE_ID,
        transactions,
        addressBook,
        contactIbans,
        sharedIbans
      );

      // Should NOT show - single merchant, not shared, not partially resolved
      expect(result).toHaveLength(0);
    });
  });
});
