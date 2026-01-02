import { describe, it, expect } from 'vitest';
import {
  parseGenericCSV,
  parseWithMapping,
  convertToTransactions,
  type ColumnMapping,
} from '@fluxby/core';

describe('parseGenericCSV', () => {
  describe('delimiter detection', () => {
    it('detects semicolon delimiter', () => {
      const csv = `Date;Amount;Description
20240101;100.00;Test transaction
20240102;-50.00;Another one`;

      const result = parseGenericCSV(csv);
      expect(result.headers).toContain('Date');
      expect(result.headers).toContain('Amount');
      expect(result.headers).toContain('Description');
      expect(result.totalRows).toBe(2);
    });

    it('detects comma delimiter', () => {
      const csv = `Date,Amount,Description
2024-01-01,100.00,Test transaction
2024-01-02,-50.00,Another one`;

      const result = parseGenericCSV(csv);
      expect(result.headers).toContain('Date');
      expect(result.headers).toContain('Amount');
      expect(result.headers).toContain('Description');
      expect(result.totalRows).toBe(2);
    });

    it('detects tab delimiter', () => {
      const csv = `Date\tAmount\tDescription
2024-01-01\t100.00\tTest transaction
2024-01-02\t-50.00\tAnother one`;

      const result = parseGenericCSV(csv);
      expect(result.headers).toContain('Date');
      expect(result.headers).toContain('Amount');
      expect(result.headers).toContain('Description');
      expect(result.totalRows).toBe(2);
    });
  });

  describe('header parsing', () => {
    it('trims whitespace from headers', () => {
      const csv = `  Date  ;  Amount  ;  Description  
20240101;100.00;Test`;

      const result = parseGenericCSV(csv);
      expect(result.headers).toContain('Date');
      expect(result.headers).toContain('Amount');
      expect(result.headers).toContain('Description');
    });

    it('preserves header order', () => {
      const csv = `Description;Amount;Date
Test;100.00;20240101`;

      const result = parseGenericCSV(csv);
      expect(result.headers[0]).toBe('Description');
      expect(result.headers[1]).toBe('Amount');
      expect(result.headers[2]).toBe('Date');
    });
  });

  describe('row parsing', () => {
    it('parses rows into records', () => {
      const csv = `Date;Amount;Description
20240101;100.00;Test transaction`;

      const result = parseGenericCSV(csv);
      expect(result.rows[0]['Date']).toBe('20240101');
      expect(result.rows[0]['Amount']).toBe('100.00');
      expect(result.rows[0]['Description']).toBe('Test transaction');
    });

    it('skips empty lines', () => {
      const csv = `Date;Amount;Description
20240101;100.00;Test

20240102;-50.00;Another`;

      const result = parseGenericCSV(csv);
      expect(result.totalRows).toBe(2);
    });

    it('returns sample rows (max 10)', () => {
      let csv = 'Date;Amount;Description\n';
      for (let i = 0; i < 20; i++) {
        csv += `2024010${String(i).padStart(2, '0')};${i * 10}.00;Transaction ${i}\n`;
      }

      const result = parseGenericCSV(csv);
      expect(result.sampleRows).toHaveLength(10);
      expect(result.totalRows).toBe(20);
    });
  });

  describe('ING format specifics', () => {
    it('handles ING CSV headers', () => {
      const csv = `Datum;Naam / Omschrijving;Rekening;Tegenrekening;Code;Af Bij;Bedrag (EUR);Mutatiesoort;Mededelingen;Saldo na mutatie
20240115;Albert Heijn;NL91ABNA0417164300;NL01TEST0123456789;GT;Af;25,00;Betaalautomaat;;1234,56`;

      const result = parseGenericCSV(csv);
      expect(result.headers).toContain('Datum');
      expect(result.headers).toContain('Naam / Omschrijving');
      expect(result.headers).toContain('Bedrag (EUR)');
      expect(result.headers).toContain('Af Bij');
    });
  });
});

describe('parseWithMapping', () => {
  describe('date parsing', () => {
    const baseMapping: ColumnMapping = {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
    };

    it('parses YYYYMMDD format', () => {
      const rows = [{ Date: '20241225', Amount: '100', Description: 'Test' }];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].date).toBe('2024-12-25');
    });

    it('parses DD-MM-YYYY format', () => {
      const rows = [{ Date: '25-12-2024', Amount: '100', Description: 'Test' }];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].date).toBe('2024-12-25');
    });

    it('parses DD/MM/YYYY format', () => {
      const rows = [{ Date: '25/12/2024', Amount: '100', Description: 'Test' }];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].date).toBe('2024-12-25');
    });

    it('parses YYYY-MM-DD format', () => {
      const rows = [{ Date: '2024-12-25', Amount: '100', Description: 'Test' }];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].date).toBe('2024-12-25');
    });

    it('handles invalid date with error', () => {
      const rows = [{ Date: 'not-a-date', Amount: '100', Description: 'Test' }];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].error).toContain('Invalid date');
    });
  });

  describe('amount parsing', () => {
    const baseMapping: ColumnMapping = {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
    };

    it('parses European format (1.234,56)', () => {
      const rows = [
        { Date: '20240101', Amount: '1.234,56', Description: 'Test' },
      ];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].amount).toBe(1234.56);
    });

    it('parses US format (1,234.56)', () => {
      const rows = [
        { Date: '20240101', Amount: '1,234.56', Description: 'Test' },
      ];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].amount).toBe(1234.56);
    });

    it('handles negative amounts with minus sign', () => {
      const rows = [
        { Date: '20240101', Amount: '-100,00', Description: 'Test' },
      ];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].amount).toBe(-100);
    });

    it('handles amounts with currency symbols', () => {
      const rows = [
        { Date: '20240101', Amount: '€ 100,00', Description: 'Test' },
      ];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].amount).toBe(100);
    });

    it('handles amounts with "af" indicator (Dutch)', () => {
      const rows = [
        { Date: '20240101', Amount: '100,00 af', Description: 'Test' },
      ];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].amount).toBe(-100);
    });

    it('handles amounts with "debit" indicator', () => {
      const rows = [
        { Date: '20240101', Amount: 'debit 100.00', Description: 'Test' },
      ];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].amount).toBe(-100);
    });

    it('handles invalid amount with error', () => {
      const rows = [{ Date: '20240101', Amount: 'abc', Description: 'Test' }];
      const result = parseWithMapping(rows, baseMapping, 'NL00TEST');
      expect(result[0].error).toContain('Invalid amount');
    });
  });

  describe('direction column handling', () => {
    const mappingWithDirection: ColumnMapping = {
      date: 'Date',
      amount: 'Amount',
      description: 'Description',
      direction: 'Direction',
    };

    it('handles "Af" direction as negative', () => {
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          Direction: 'Af',
        },
      ];
      const result = parseWithMapping(rows, mappingWithDirection, 'NL00TEST');
      expect(result[0].amount).toBe(-100);
    });

    it('handles "Bij" direction as positive', () => {
      const rows = [
        {
          Date: '20240101',
          Amount: '-100',
          Description: 'Test',
          Direction: 'Bij',
        },
      ];
      const result = parseWithMapping(rows, mappingWithDirection, 'NL00TEST');
      expect(result[0].amount).toBe(100);
    });

    it('handles "debit" direction as negative', () => {
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          Direction: 'DEBIT',
        },
      ];
      const result = parseWithMapping(rows, mappingWithDirection, 'NL00TEST');
      expect(result[0].amount).toBe(-100);
    });

    it('handles "credit" direction as positive', () => {
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          Direction: 'Credit',
        },
      ];
      const result = parseWithMapping(rows, mappingWithDirection, 'NL00TEST');
      expect(result[0].amount).toBe(100);
    });

    it('handles "+" direction as positive', () => {
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          Direction: '+',
        },
      ];
      const result = parseWithMapping(rows, mappingWithDirection, 'NL00TEST');
      expect(result[0].amount).toBe(100);
    });

    it('handles "-" direction as negative', () => {
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          Direction: '-',
        },
      ];
      const result = parseWithMapping(rows, mappingWithDirection, 'NL00TEST');
      expect(result[0].amount).toBe(-100);
    });
  });

  describe('optional columns', () => {
    it('extracts IBAN when mapped', () => {
      const mapping: ColumnMapping = {
        date: 'Date',
        amount: 'Amount',
        description: 'Description',
        iban: 'IBAN',
      };
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          IBAN: 'NL91ABNA0417164300',
        },
      ];
      const result = parseWithMapping(rows, mapping, 'NL00TEST');
      expect(result[0].iban).toBe('NL91ABNA0417164300');
    });

    it('extracts counterparty when mapped', () => {
      const mapping: ColumnMapping = {
        date: 'Date',
        amount: 'Amount',
        description: 'Description',
        counterparty: 'Name',
      };
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          Name: 'Albert Heijn',
        },
      ];
      const result = parseWithMapping(rows, mapping, 'NL00TEST');
      expect(result[0].counterparty).toBe('Albert Heijn');
    });

    it('extracts balance when mapped', () => {
      const mapping: ColumnMapping = {
        date: 'Date',
        amount: 'Amount',
        description: 'Description',
        balance: 'Balance',
      };
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          Balance: '1.234,56',
        },
      ];
      const result = parseWithMapping(rows, mapping, 'NL00TEST');
      expect(result[0].balance).toBe(1234.56);
    });
  });

  describe('row metadata', () => {
    it('includes row index', () => {
      const mapping: ColumnMapping = {
        date: 'Date',
        amount: 'Amount',
        description: 'Description',
      };
      const rows = [
        { Date: '20240101', Amount: '100', Description: 'First' },
        { Date: '20240102', Amount: '200', Description: 'Second' },
      ];
      const result = parseWithMapping(rows, mapping, 'NL00TEST');
      expect(result[0].rowIndex).toBe(0);
      expect(result[1].rowIndex).toBe(1);
    });

    it('includes raw data', () => {
      const mapping: ColumnMapping = {
        date: 'Date',
        amount: 'Amount',
        description: 'Description',
      };
      const rows = [
        {
          Date: '20240101',
          Amount: '100',
          Description: 'Test',
          Extra: 'data',
        },
      ];
      const result = parseWithMapping(rows, mapping, 'NL00TEST');
      expect(result[0].rawData).toEqual(rows[0]);
    });
  });
});

describe('convertToTransactions', () => {
  const createParsedTransaction = (
    overrides: Partial<{
      rowIndex: number;
      date: string;
      amount: number;
      description: string;
      iban: string | null;
      counterparty: string | null;
      balance: number | null;
      rawData: Record<string, string>;
      error?: string;
    }> = {}
  ) => ({
    rowIndex: 0,
    date: '2024-01-01',
    amount: 100,
    description: 'Test transaction',
    iban: null,
    counterparty: null,
    balance: null,
    rawData: {},
    ...overrides,
  });

  it('converts parsed transactions to TransactionCreate objects', () => {
    const parsed = [createParsedTransaction()];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-01-01');
    expect(result[0].amount).toBe(100);
    expect(result[0].description).toBe('Test transaction');
    expect(result[0].accountId).toBe('account-123');
  });

  it('sets type to income for positive amounts', () => {
    const parsed = [createParsedTransaction({ amount: 500 })];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );
    expect(result[0].type).toBe('income');
  });

  it('sets type to expense for negative amounts', () => {
    const parsed = [createParsedTransaction({ amount: -500 })];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );
    expect(result[0].type).toBe('expense');
  });

  it('filters out transactions with errors', () => {
    const parsed = [
      createParsedTransaction({ error: 'Invalid date' }),
      createParsedTransaction({ amount: 200 }),
    ];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(200);
  });

  it('includes opposing account info', () => {
    const parsed = [
      createParsedTransaction({
        iban: 'NL91ABNA0417164300',
        counterparty: 'Albert Heijn',
      }),
    ];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );
    expect(result[0].opposingAccountIban).toBe('NL91ABNA0417164300');
    expect(result[0].opposingAccountName).toBe('Albert Heijn');
  });

  it('includes balance after transaction', () => {
    const parsed = [createParsedTransaction({ balance: 1234.56 })];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );
    expect(result[0].balanceAfter).toBe(1234.56);
  });

  it('generates import hash for deduplication', () => {
    const parsed = [createParsedTransaction()];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );
    expect(result[0].importHash).toBeDefined();
    expect(result[0].importHash).toMatch(/^[0-9a-f]+$/);
  });

  it('includes raw data as JSON string', () => {
    const rawData = { Column1: 'value1', Column2: 'value2' };
    const parsed = [createParsedTransaction({ rawData })];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );
    expect(result[0].rawData).toBe(JSON.stringify(rawData));
  });

  it('sets merchantName from counterparty', () => {
    const parsed = [createParsedTransaction({ counterparty: 'IKEA' })];
    const result = convertToTransactions(
      parsed,
      'account-123',
      'NL00TEST',
      'profile-456'
    );
    expect(result[0].merchantName).toBe('IKEA');
  });
});
