import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  prepareSpreadsheetImport,
  SpreadsheetImportError,
} from '../../apps/web/src/lib/importers/spreadsheet-importer';

function makeWorkbookFile(rows: unknown[][], name = 'ing-export.xlsx'): File {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new File([bytes], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('spreadsheet import preparation', () => {
  it('converts an ING workbook from its transaction header row and keeps its filename', async () => {
    const source = makeWorkbookFile([
      ['ING export 01-01-2026 to 18-09-2026'],
      [
        'Date',
        'Name / Description',
        'Account',
        'Counterparty',
        'Code',
        'Debit/credit',
        'Amount (EUR)',
        'Transaction type',
        'Notifications',
        'Resulting balance',
        'Tag',
      ],
      [
        20260918,
        'Market purchase',
        'NL00TEST0000000000',
        '',
        'BA',
        'Debit',
        9.52,
        'Payment terminal',
        'Card details',
        88.1,
        '',
      ],
    ]);

    const prepared = await prepareSpreadsheetImport(source);
    const csv = await prepared.text();

    expect(prepared.name).toBe('ing-export.xlsx');
    expect(prepared.type).toBe('text/csv');
    expect(csv).toContain('Date,Name / Description,Account');
    expect(csv).toContain('20260918,Market purchase');
    expect(csv).not.toContain('ING export 01-01-2026');
  });

  it('returns CSV files unchanged', async () => {
    const source = new File(
      ['Date,Amount,Description\n20260918,9.52,Market'],
      'bank.csv',
      {
        type: 'text/csv',
      }
    );

    await expect(prepareSpreadsheetImport(source)).resolves.toBe(source);
  });

  it('rejects workbooks without transaction headers', async () => {
    const source = makeWorkbookFile([['Heading'], ['No transaction columns']]);

    await expect(prepareSpreadsheetImport(source)).rejects.toMatchObject({
      name: 'SpreadsheetImportError',
      code: 'spreadsheetHeadersMissing',
    } satisfies Partial<SpreadsheetImportError>);
  });
});
