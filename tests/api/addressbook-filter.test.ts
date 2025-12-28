import { describe, it, expect } from 'vitest';

/**
 * Test suite for address book filtering logic
 *
 * This tests the core matching logic used to:
 * 1. Link transactions to address book entries (frontend badge display)
 * 2. Count transactions per address book entry (backend stats)
 * 3. Filter transactions by address book ID (backend query)
 *
 * Key concepts:
 * - Regular address book entries (positive IDs): Match by direct link or IBAN only
 * - Shared IBAN merchants (negative IDs): Match by IBAN + bidirectional name matching
 * - Original names: For shared merchants with edited display names, also match against original_name
 */

// Mock transaction interface
interface Transaction {
  id: number;
  opposingAccountIban: string | null;
  opposingAccountName: string | null;
  merchantName: string | null;
  addressBookId: number | null;
}

// Mock address book entry interface
interface AddressBookEntry {
  id: number;
  iban: string;
  name: string;
  description: string | null;
  originalNames?: string[];
}

// Mock shared IBAN data
interface SharedIbanData {
  iban: string;
  merchantCount: number;
}

/**
 * Core matching function - replicates the frontend findAddressBookEntry logic
 */
function findAddressBookEntry(
  tx: Transaction,
  addressBook: AddressBookEntry[],
  sharedIbans: SharedIbanData[]
): AddressBookEntry | null {
  if (!addressBook) return null;

  // First check if transaction has a direct link to address book
  if (tx.addressBookId) {
    const byId = addressBook.find((entry) => entry.id === tx.addressBookId);
    if (byId) return byId;
  }

  // Check if this is a shared IBAN (payment processor)
  const sharedData = tx.opposingAccountIban
    ? sharedIbans.find((s) => s.iban === tx.opposingAccountIban)
    : null;

  if (sharedData && sharedData.merchantCount > 1) {
    // For shared IBANs, match by IBAN + name (bidirectional)
    const txName = tx.opposingAccountName || tx.merchantName;
    if (txName) {
      const lowerTxName = txName.toLowerCase();
      const byName = addressBook.find((entry) => {
        if (entry.iban !== tx.opposingAccountIban) return false;

        // Match against display name (bidirectional)
        if (
          lowerTxName.includes(entry.name.toLowerCase()) ||
          entry.name.toLowerCase().includes(lowerTxName)
        ) {
          return true;
        }

        // Also match against original names (for shared merchants with edited display names)
        if (entry.originalNames) {
          for (const origName of entry.originalNames) {
            const lowerOrig = origName.toLowerCase();
            if (
              lowerTxName.includes(lowerOrig) ||
              lowerOrig.includes(lowerTxName)
            ) {
              return true;
            }
          }
        }

        return false;
      });
      if (byName) return byName;
    }
  } else if (tx.opposingAccountIban) {
    // For regular IBANs, match by IBAN only
    const byIban = addressBook.find((e) => e.iban === tx.opposingAccountIban);
    if (byIban) return byIban;
  }

  return null;
}

/**
 * Backend SQL matching logic - simulates the SQL conditions
 * This is used for both transaction counting and filtering
 */
function matchTransactionToSharedMerchant(
  tx: Transaction,
  merchantIban: string,
  displayName: string,
  originalName: string
): boolean {
  // Must match IBAN first
  if (tx.opposingAccountIban !== merchantIban) return false;

  const txOpposingName = tx.opposingAccountName?.toLowerCase() || '';
  const txMerchantName = tx.merchantName?.toLowerCase() || '';
  const lowerDisplayName = displayName.toLowerCase();
  const lowerOriginalName = originalName.toLowerCase();

  // Need at least one non-empty name to match
  if (!txOpposingName && !txMerchantName) return false;

  // Match by display_name (bidirectional) - only if names are non-empty
  if (
    txOpposingName &&
    (txOpposingName.includes(lowerDisplayName) ||
      lowerDisplayName.includes(txOpposingName))
  ) {
    return true;
  }
  if (
    txMerchantName &&
    (txMerchantName.includes(lowerDisplayName) ||
      lowerDisplayName.includes(txMerchantName))
  ) {
    return true;
  }

  // Also match by original_name (for when display_name has been edited/shortened)
  if (
    txOpposingName &&
    (txOpposingName.includes(lowerOriginalName) ||
      lowerOriginalName.includes(txOpposingName))
  ) {
    return true;
  }
  if (
    txMerchantName &&
    (txMerchantName.includes(lowerOriginalName) ||
      lowerOriginalName.includes(txMerchantName))
  ) {
    return true;
  }

  return false;
}

describe('Address Book Filtering', () => {
  // Test data
  const ADYEN_IBAN = 'NL04ADYB2017400157';
  const RABO_SMART_PAY_IBAN = 'NL29RABO0350803331';
  const REGULAR_IBAN = 'NL91ABNA0417164300';

  // Shared IBANs configuration
  const sharedIbans: SharedIbanData[] = [
    { iban: ADYEN_IBAN, merchantCount: 23 },
    { iban: RABO_SMART_PAY_IBAN, merchantCount: 5 },
  ];

  describe('Frontend: findAddressBookEntry', () => {
    describe('Direct addressBookId link', () => {
      it('should find entry by direct addressBookId link', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: REGULAR_IBAN,
          opposingAccountName: 'Some Name',
          merchantName: null,
          addressBookId: 42,
        };
        const addressBook: AddressBookEntry[] = [
          {
            id: 42,
            iban: 'DIFFERENT_IBAN',
            name: 'Different Name',
            description: null,
          },
        ];

        const result = findAddressBookEntry(tx, addressBook, []);
        expect(result).toEqual(addressBook[0]);
      });
    });

    describe('Regular IBAN matching (non-shared)', () => {
      it('should match by IBAN only for regular IBANs', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: REGULAR_IBAN,
          opposingAccountName: 'Transaction Name',
          merchantName: null,
          addressBookId: null,
        };
        const addressBook: AddressBookEntry[] = [
          {
            id: 1,
            iban: REGULAR_IBAN,
            name: 'Completely Different Name',
            description: null,
          },
        ];

        const result = findAddressBookEntry(tx, addressBook, sharedIbans);
        expect(result).toEqual(addressBook[0]);
      });

      it('should NOT require name matching for regular IBANs', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: REGULAR_IBAN,
          opposingAccountName: 'ABC Corp',
          merchantName: null,
          addressBookId: null,
        };
        const addressBook: AddressBookEntry[] = [
          { id: 1, iban: REGULAR_IBAN, name: 'XYZ Ltd', description: null },
        ];

        const result = findAddressBookEntry(tx, addressBook, sharedIbans);
        expect(result).toEqual(addressBook[0]);
      });
    });

    describe('Shared IBAN matching (payment processors)', () => {
      it('should match Booking.com transaction to Booking.com entry', () => {
        const tx: Transaction = {
          id: 2400,
          opposingAccountIban: ADYEN_IBAN,
          opposingAccountName: 'Booking',
          merchantName: null,
          addressBookId: null,
        };
        const addressBook: AddressBookEntry[] = [
          { id: -59, iban: ADYEN_IBAN, name: 'Booking.com', description: null },
          {
            id: -60,
            iban: ADYEN_IBAN,
            name: 'Thuisbezorgd',
            description: null,
          },
        ];

        const result = findAddressBookEntry(tx, addressBook, sharedIbans);
        expect(result?.name).toBe('Booking.com');
      });

      it('should NOT match Booking.com transaction to Thuisbezorgd entry', () => {
        const tx: Transaction = {
          id: 2400,
          opposingAccountIban: ADYEN_IBAN,
          opposingAccountName: 'Booking',
          merchantName: null,
          addressBookId: null,
        };
        const addressBook: AddressBookEntry[] = [
          {
            id: -60,
            iban: ADYEN_IBAN,
            name: 'Thuisbezorgd',
            description: null,
          },
        ];

        const result = findAddressBookEntry(tx, addressBook, sharedIbans);
        expect(result).toBeNull();
      });

      it('should match 220webshop transaction via originalNames', () => {
        // Transaction has the full original name from bank
        const tx: Transaction = {
          id: 1098,
          opposingAccountIban: RABO_SMART_PAY_IBAN,
          opposingAccountName: '220webshop.nexusportal.nl',
          merchantName: null,
          addressBookId: null,
        };
        // Address book has the shortened display name with original name in array
        const addressBook: AddressBookEntry[] = [
          {
            id: -40,
            iban: RABO_SMART_PAY_IBAN,
            name: '220webshop.nl',
            description: null,
            originalNames: ['220webshop.nexusportal.nl'],
          },
        ];

        const result = findAddressBookEntry(tx, addressBook, sharedIbans);
        expect(result?.name).toBe('220webshop.nl');
      });

      it('should NOT match when neither display name nor original names match', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: RABO_SMART_PAY_IBAN,
          opposingAccountName: 'lidl.nl',
          merchantName: null,
          addressBookId: null,
        };
        const addressBook: AddressBookEntry[] = [
          {
            id: -40,
            iban: RABO_SMART_PAY_IBAN,
            name: '220webshop.nl',
            description: null,
            originalNames: ['220webshop.nexusportal.nl'],
          },
        ];

        const result = findAddressBookEntry(tx, addressBook, sharedIbans);
        expect(result).toBeNull();
      });

      it('should handle bidirectional matching for partial names', () => {
        // Transaction name is contained in the address book name
        const tx1: Transaction = {
          id: 1,
          opposingAccountIban: ADYEN_IBAN,
          opposingAccountName: 'Booking',
          merchantName: null,
          addressBookId: null,
        };
        // Address book name is contained in the transaction name
        const tx2: Transaction = {
          id: 2,
          opposingAccountIban: ADYEN_IBAN,
          opposingAccountName: 'Booking.com Amsterdam',
          merchantName: null,
          addressBookId: null,
        };

        const addressBook: AddressBookEntry[] = [
          { id: -59, iban: ADYEN_IBAN, name: 'Booking.com', description: null },
        ];

        // "Booking" is contained in "Booking.com"
        expect(findAddressBookEntry(tx1, addressBook, sharedIbans)?.name).toBe(
          'Booking.com'
        );

        // "Booking.com" is contained in "Booking.com Amsterdam"
        expect(findAddressBookEntry(tx2, addressBook, sharedIbans)?.name).toBe(
          'Booking.com'
        );
      });
    });

    describe('Edge cases', () => {
      it('should return null for empty address book', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: REGULAR_IBAN,
          opposingAccountName: 'Test',
          merchantName: null,
          addressBookId: null,
        };

        const result = findAddressBookEntry(tx, [], sharedIbans);
        expect(result).toBeNull();
      });

      it('should return null for transaction without IBAN', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: null,
          opposingAccountName: 'Cash Payment',
          merchantName: null,
          addressBookId: null,
        };
        const addressBook: AddressBookEntry[] = [
          { id: 1, iban: REGULAR_IBAN, name: 'Test', description: null },
        ];

        const result = findAddressBookEntry(tx, addressBook, sharedIbans);
        expect(result).toBeNull();
      });

      it('should handle case-insensitive matching', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: ADYEN_IBAN,
          opposingAccountName: 'BOOKING',
          merchantName: null,
          addressBookId: null,
        };
        const addressBook: AddressBookEntry[] = [
          { id: -59, iban: ADYEN_IBAN, name: 'booking.com', description: null },
        ];

        const result = findAddressBookEntry(tx, addressBook, sharedIbans);
        expect(result?.name).toBe('booking.com');
      });
    });
  });

  describe('Backend: matchTransactionToSharedMerchant', () => {
    describe('Display name matching', () => {
      it('should match when transaction name contains display name', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: ADYEN_IBAN,
          opposingAccountName: 'Booking Amsterdam Hotel',
          merchantName: null,
          addressBookId: null,
        };

        expect(
          matchTransactionToSharedMerchant(tx, ADYEN_IBAN, 'Booking', 'Booking')
        ).toBe(true);
      });

      it('should match when display name contains transaction name', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: ADYEN_IBAN,
          opposingAccountName: 'Book',
          merchantName: null,
          addressBookId: null,
        };

        expect(
          matchTransactionToSharedMerchant(
            tx,
            ADYEN_IBAN,
            'Booking.com',
            'Booking.com'
          )
        ).toBe(true);
      });
    });

    describe('Original name matching', () => {
      it('should match via original_name when display_name is edited', () => {
        const tx: Transaction = {
          id: 1098,
          opposingAccountIban: RABO_SMART_PAY_IBAN,
          opposingAccountName: '220webshop.nexusportal.nl',
          merchantName: null,
          addressBookId: null,
        };

        // display_name = '220webshop.nl' (shortened)
        // original_name = '220webshop.nexusportal.nl' (full from bank)
        expect(
          matchTransactionToSharedMerchant(
            tx,
            RABO_SMART_PAY_IBAN,
            '220webshop.nl', // won't match directly
            '220webshop.nexusportal.nl' // will match
          )
        ).toBe(true);
      });

      it('should NOT match when display and original are both different', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: RABO_SMART_PAY_IBAN,
          opposingAccountName: 'lidl.nl',
          merchantName: null,
          addressBookId: null,
        };

        expect(
          matchTransactionToSharedMerchant(
            tx,
            RABO_SMART_PAY_IBAN,
            '220webshop.nl',
            '220webshop.nexusportal.nl'
          )
        ).toBe(false);
      });
    });

    describe('IBAN requirement', () => {
      it('should NOT match when IBAN is different', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: REGULAR_IBAN,
          opposingAccountName: 'Booking',
          merchantName: null,
          addressBookId: null,
        };

        expect(
          matchTransactionToSharedMerchant(
            tx,
            ADYEN_IBAN,
            'Booking.com',
            'Booking.com'
          )
        ).toBe(false);
      });
    });

    describe('merchantName fallback', () => {
      it('should match using merchantName when opposingAccountName is null', () => {
        const tx: Transaction = {
          id: 1,
          opposingAccountIban: ADYEN_IBAN,
          opposingAccountName: null,
          merchantName: 'Booking Hotel',
          addressBookId: null,
        };

        expect(
          matchTransactionToSharedMerchant(tx, ADYEN_IBAN, 'Booking', 'Booking')
        ).toBe(true);
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('Scenario: Booking.com via Adyen payment processor', () => {
      // This tests the complete flow for Booking.com
      const transaction: Transaction = {
        id: 2400,
        opposingAccountIban: ADYEN_IBAN, // Adyen IBAN (shared by many merchants)
        opposingAccountName: 'Booking',
        merchantName: null,
        addressBookId: null,
      };

      const addressBook: AddressBookEntry[] = [
        { id: -59, iban: ADYEN_IBAN, name: 'Booking.com', description: null },
        { id: -60, iban: ADYEN_IBAN, name: 'Thuisbezorgd', description: null },
        { id: -61, iban: ADYEN_IBAN, name: 'Zalando', description: null },
      ];

      // Frontend should find the correct entry
      const frontendMatch = findAddressBookEntry(
        transaction,
        addressBook,
        sharedIbans
      );
      expect(frontendMatch?.name).toBe('Booking.com');

      // Backend should also match
      const backendMatch = matchTransactionToSharedMerchant(
        transaction,
        ADYEN_IBAN,
        'Booking.com',
        'Booking.com'
      );
      expect(backendMatch).toBe(true);

      // Backend should NOT match to other merchants on same IBAN
      const wrongMatch = matchTransactionToSharedMerchant(
        transaction,
        ADYEN_IBAN,
        'Thuisbezorgd',
        'Thuisbezorgd'
      );
      expect(wrongMatch).toBe(false);
    });

    it('Scenario: 220webshop via Rabo Smart Pay with edited display name', () => {
      // This tests the case where display_name has been shortened/edited
      const transaction: Transaction = {
        id: 1098,
        opposingAccountIban: RABO_SMART_PAY_IBAN,
        opposingAccountName: '220webshop.nexusportal.nl', // Full name from bank
        merchantName: null,
        addressBookId: null,
      };

      const addressBook: AddressBookEntry[] = [
        {
          id: -40,
          iban: RABO_SMART_PAY_IBAN,
          name: '220webshop.nl', // Shortened display name
          description: null,
          originalNames: ['220webshop.nexusportal.nl'], // Original name for matching
        },
        {
          id: -41,
          iban: RABO_SMART_PAY_IBAN,
          name: 'Lidl',
          description: null,
        },
      ];

      // Frontend should find the correct entry via originalNames
      const frontendMatch = findAddressBookEntry(
        transaction,
        addressBook,
        sharedIbans
      );
      expect(frontendMatch?.name).toBe('220webshop.nl');

      // Backend should match via original_name
      const backendMatch = matchTransactionToSharedMerchant(
        transaction,
        RABO_SMART_PAY_IBAN,
        '220webshop.nl',
        '220webshop.nexusportal.nl'
      );
      expect(backendMatch).toBe(true);

      // Backend should NOT match to Lidl
      const wrongMatch = matchTransactionToSharedMerchant(
        transaction,
        RABO_SMART_PAY_IBAN,
        'Lidl',
        'Lidl'
      );
      expect(wrongMatch).toBe(false);
    });

    it('Scenario: AP den Ouden - regular IBAN (non-shared)', () => {
      // This tests a regular contact with dedicated IBAN
      const AP_DEN_OUDEN_IBAN = 'NL12RABO0123456789';

      const transaction: Transaction = {
        id: 500,
        opposingAccountIban: AP_DEN_OUDEN_IBAN,
        opposingAccountName: 'AP den Ouden BV',
        merchantName: null,
        addressBookId: null,
      };

      const addressBook: AddressBookEntry[] = [
        {
          id: 5,
          iban: AP_DEN_OUDEN_IBAN,
          name: 'AP den Ouden',
          description: null,
        },
      ];

      // Since this IBAN is NOT in sharedIbans, it should match by IBAN only
      const frontendMatch = findAddressBookEntry(
        transaction,
        addressBook,
        sharedIbans
      );
      expect(frontendMatch?.name).toBe('AP den Ouden');
    });
  });

  describe('Filter parameter edge cases', () => {
    /**
     * This tests a bug that was found where selecting an address book entry
     * with a display name different from the transaction name would cause
     * filtering to fail.
     *
     * BUG: When clicking "Booking.com" in dropdown:
     * 1. setSelectedAccountName('Booking.com') - for display
     * 2. setAddressBookId(-59) - for filtering
     * 3. API call was made with BOTH addressBookId=-59 AND opposingAccountName=Booking.com
     * 4. Transaction has opposingAccountName='Booking' (not 'Booking.com')
     * 5. The opposingAccountName filter failed, returning 0 results
     *
     * FIX: When addressBookId is set, don't also filter by opposingAccountName
     * The selectedAccountName should only be used for display in the UI button.
     */
    it('should NOT combine addressBookId and opposingAccountName filters', () => {
      // This simulates what the frontend should do
      function buildFilterParams(
        selectedAddressBookId: number | null,
        selectedAccountName: string | null
      ): { addressBookId?: string; opposingAccountName?: string } {
        const params: { addressBookId?: string; opposingAccountName?: string } =
          {};

        // When filtering by addressBookId, don't also filter by name
        // selectedAccountName is only for display
        if (selectedAddressBookId !== null) {
          params.addressBookId = selectedAddressBookId.toString();
          // Do NOT set opposingAccountName when addressBookId is set
        } else if (selectedAccountName) {
          params.opposingAccountName = selectedAccountName;
        }

        return params;
      }

      // When selecting Booking.com from dropdown
      const params = buildFilterParams(-59, 'Booking.com');
      expect(params.addressBookId).toBe('-59');
      expect(params.opposingAccountName).toBeUndefined();

      // When selecting by name only (not via address book)
      const params2 = buildFilterParams(null, 'Some Name');
      expect(params2.addressBookId).toBeUndefined();
      expect(params2.opposingAccountName).toBe('Some Name');

      // When no filter is selected
      const params3 = buildFilterParams(null, null);
      expect(params3.addressBookId).toBeUndefined();
      expect(params3.opposingAccountName).toBeUndefined();
    });
  });
});
