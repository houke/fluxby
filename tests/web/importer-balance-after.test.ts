import { describe, expect, it, vi } from 'vitest';
import { processINGRow } from '../../apps/web/src/lib/importers/ing-importer';
import { processASNRow } from '../../apps/web/src/lib/importers/asn-importer';

describe('importers balance_after mapping', () => {
  it('stores ING balance column as balanceAfter', async () => {
    const db = {
      queryOneAsync: vi.fn().mockResolvedValue({ iban: 'NL11INGB0001234567' }),
      runAsync: vi.fn(),
    };

    const result = await processINGRow(
      db as never,
      {
        Datum: '02-01-2026',
        Bedrag: '10,00',
        Omschrijving: 'Supermarkt',
        Tegenrekening: 'NL12INGB0007654321',
        'Saldo na mutatie': '1.234,56',
      },
      {
        accountId: 'acc-main',
        profileId: 'profile-1',
        mapping: {
          date: 'Datum',
          amount: 'Bedrag',
          description: 'Omschrijving',
          counterparty: 'Tegenrekening',
          balance: 'Saldo na mutatie',
        },
        ownAccountIbans: new Set<string>(),
      },
      {
        parseDate: () => '2026-01-02',
        parseAmount: (val) => {
          if (!val) return null;
          const normalized = val.replace(/\./g, '').replace(',', '.');
          const parsed = Number.parseFloat(normalized);
          return Number.isNaN(parsed) ? null : parsed;
        },
        applyCleanupRules: (name) => name,
        generateHash: () => 'hash-ing',
      }
    );

    if ('error' in result) {
      throw new Error(`Expected successful ING parse, got: ${result.error}`);
    }

    expect(result.transaction.balanceAfter).toBe(1234.56);
  });

  it('converts ASN saldo voor boeking into balanceAfter', async () => {
    const db = {
      queryOneAsync: vi.fn().mockResolvedValue({ iban: 'NL91ASNB0123456789' }),
      runAsync: vi.fn(),
    };

    const result = await processASNRow(
      db as never,
      {
        Datum: '15-01-2026',
        'Bedrag bij / af': '-25,50',
        Omschrijving: 'Boodschappen',
        Naam: 'Albert Heijn',
        'Van / naar': 'NL01TEST9876543210',
        Type: 'bea',
        'Saldo voor boeking': '2.500,00',
      },
      {
        accountId: 'acc-asn',
        profileId: 'profile-1',
        mapping: {
          date: 'Datum',
          amount: 'Bedrag bij / af',
          description: 'Omschrijving',
          counterparty: 'Van / naar',
          counterpartyName: 'Naam',
          type: 'Type',
          balance: 'Saldo voor boeking',
        },
        ownAccountIbans: new Set<string>(),
      },
      {
        parseDate: () => '2026-01-15',
        parseAmount: (val) => {
          if (!val) return null;
          const normalized = val.replace(/\./g, '').replace(',', '.');
          const parsed = Number.parseFloat(normalized);
          return Number.isNaN(parsed) ? null : parsed;
        },
        applyCleanupRules: (name) => name,
        generateHash: () => 'hash-asn',
      }
    );

    if ('error' in result) {
      throw new Error(`Expected successful ASN parse, got: ${result.error}`);
    }

    expect(result.transaction.balanceAfter).toBe(2474.5);
  });
});
