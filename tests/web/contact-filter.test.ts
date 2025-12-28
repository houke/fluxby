import { describe, it, expect } from 'vitest';

/**
 * Tests for contact search and filter logic used in AddressBook component
 * These test the filter functions used when assigning contacts
 */

interface Contact {
  id: number;
  name: string;
  iban?: string;
  ibans?: string[];
}

/**
 * Filter contacts by search term (name or IBAN)
 * and prioritize contacts with matching IBAN
 */
function filterAndSortContacts(
  contacts: Contact[],
  searchTerm: string,
  currentIban?: string,
  excludeId?: number
): Contact[] {
  const searchLower = searchTerm.toLowerCase();

  return contacts
    .filter(
      (c) =>
        (c.name.toLowerCase().includes(searchLower) ||
          c.iban?.toLowerCase().includes(searchLower) ||
          c.ibans?.some((i) => i.toLowerCase().includes(searchLower))) &&
        c.id > 0 &&
        (excludeId === undefined || c.id !== excludeId)
    )
    .sort((a, b) => {
      // Prioritize contacts with the same IBAN
      const aHasIban =
        currentIban &&
        (a.iban === currentIban || a.ibans?.includes(currentIban));
      const bHasIban =
        currentIban &&
        (b.iban === currentIban || b.ibans?.includes(currentIban));
      if (aHasIban && !bHasIban) return -1;
      if (bHasIban && !aHasIban) return 1;
      return 0;
    });
}

describe('filterAndSortContacts', () => {
  const contacts: Contact[] = [
    { id: 1, name: 'Albert Heijn', iban: 'NL01BANK0001' },
    { id: 2, name: 'Bol.com', iban: 'NL02BANK0002' },
    { id: 3, name: 'Coolblue', iban: 'NL03BANK0003' },
    {
      id: 4,
      name: 'Merged Contact',
      iban: 'NL04BANK0004',
      ibans: ['NL04BANK0004', 'NL05BANK0005'],
    },
    { id: -1, name: 'Shared IBAN Contact', iban: 'NL99SHARED' }, // id <= 0 should be excluded
  ];

  describe('name filtering', () => {
    it('filters by name case-insensitively', () => {
      const result = filterAndSortContacts(contacts, 'bol');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bol.com');
    });

    it('filters by partial name match', () => {
      const result = filterAndSortContacts(contacts, 'al');
      expect(result.map((c) => c.name)).toContain('Albert Heijn');
    });

    it('returns empty array when no matches', () => {
      const result = filterAndSortContacts(contacts, 'xyz');
      expect(result).toHaveLength(0);
    });
  });

  describe('IBAN filtering', () => {
    it('filters by primary IBAN', () => {
      const result = filterAndSortContacts(contacts, 'NL02BANK');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bol.com');
    });

    it('filters by secondary IBAN in merged contacts', () => {
      const result = filterAndSortContacts(contacts, 'NL05BANK0005');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Merged Contact');
    });

    it('IBAN search is case-insensitive', () => {
      const result = filterAndSortContacts(contacts, 'nl02bank');
      expect(result).toHaveLength(1);
    });
  });

  describe('exclusion', () => {
    it('excludes contacts with id <= 0', () => {
      const result = filterAndSortContacts(contacts, 'shared');
      expect(result).toHaveLength(0);
    });

    it('excludes contact by ID when excludeId is provided', () => {
      const result = filterAndSortContacts(contacts, 'Heijn', undefined, 1);
      expect(result).toHaveLength(0);
    });
  });

  describe('IBAN prioritization', () => {
    it('prioritizes contacts with matching IBAN', () => {
      const result = filterAndSortContacts(contacts, '', 'NL02BANK0002');
      // Bol.com should be first because it has the matching IBAN
      expect(result[0].name).toBe('Bol.com');
    });

    it('prioritizes merged contacts with matching secondary IBAN', () => {
      const result = filterAndSortContacts(contacts, '', 'NL05BANK0005');
      // Merged Contact should be first because NL05BANK0005 is in its ibans array
      expect(result[0].name).toBe('Merged Contact');
    });

    it('maintains order when no IBAN prioritization needed', () => {
      const result = filterAndSortContacts(contacts, '');
      // Order should be same as input (no prioritization without currentIban)
      expect(result).toHaveLength(4); // Excludes id=-1
    });
  });

  describe('combined filtering and sorting', () => {
    it('filters and then sorts by IBAN priority', () => {
      const moreContacts: Contact[] = [
        { id: 1, name: 'Shop A', iban: 'NL01TEST' },
        { id: 2, name: 'Shop B', iban: 'NL99MATCH' },
        { id: 3, name: 'Shop C', iban: 'NL03TEST' },
      ];

      const result = filterAndSortContacts(moreContacts, 'Shop', 'NL99MATCH');

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Shop B'); // Has matching IBAN
    });
  });
});
