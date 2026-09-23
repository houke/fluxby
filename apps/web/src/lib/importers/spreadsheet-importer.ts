import * as XLSX from 'xlsx';

export class SpreadsheetImportError extends Error {
  constructor(
    public readonly code: 'emptySpreadsheet' | 'spreadsheetHeadersMissing'
  ) {
    super(code);
    this.name = 'SpreadsheetImportError';
  }
}

const HEADER_MATCHERS = {
  date: /^(date|datum|booking date|boekdatum|transactiedatum)$/i,
  amount: /^(amount(?:\s*\([^)]*\))?|bedrag(?:\s*\([^)]*\))?|waarde)$/i,
  description:
    /^(name\s*\/\s*description|naam\s*\/\s*omschrijving|description|omschrijving|merchant|payee)$/i,
};

function isTransactionHeaderRow(row: unknown[]): boolean {
  const headers = row.map((value) => String(value ?? '').trim());
  return (
    headers.some((header) => HEADER_MATCHERS.date.test(header)) &&
    headers.some((header) => HEADER_MATCHERS.amount.test(header)) &&
    headers.some((header) => HEADER_MATCHERS.description.test(header))
  );
}

/** Read an ING XLSX export and adapt its first transaction sheet to the CSV import path. */
export async function prepareSpreadsheetImport(file: File): Promise<File> {
  if (!/\.xlsx$/i.test(file.name)) return file;

  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: false,
  });
  const sheetName = workbook.SheetNames.find((name) => {
    const sheet = workbook.Sheets[name];
    return !!sheet && !!sheet['!ref'];
  });
  const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!worksheet) throw new SpreadsheetImportError('emptySpreadsheet');

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  });
  const headerIndex = rows.findIndex(isTransactionHeaderRow);
  if (headerIndex < 0) {
    throw new SpreadsheetImportError('spreadsheetHeadersMissing');
  }

  const transactionRows = rows
    .slice(headerIndex)
    .filter((row) => row.some((value) => String(value ?? '').trim() !== ''));
  const csv = XLSX.utils.sheet_to_csv(
    XLSX.utils.aoa_to_sheet(transactionRows),
    {
      strip: true,
    }
  );
  return new File([csv], file.name, {
    type: 'text/csv',
    lastModified: file.lastModified,
  });
}
