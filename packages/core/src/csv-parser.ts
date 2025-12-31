/**
 * CSV Parser
 * Parses bank CSV files into transactions
 */

import Papa from 'papaparse';
import {
  parseEuropeanNumber,
  parseINGDate,
  formatDateISO,
  generateTransactionHash,
  type TransactionCreate,
} from '@fluxby/shared';

export interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  iban?: string;
  counterparty?: string;
  balance?: string;
  direction?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface GenericCSVResult {
  headers: string[];
  rows: Record<string, string>[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

export interface ParsedTransaction {
  rowIndex: number;
  date: string;
  amount: number;
  description: string;
  iban: string | null;
  counterparty: string | null;
  balance: number | null;
  rawData: Record<string, string>;
  error?: string;
}

/**
 * Parse CSV content and return headers and sample rows for mapping
 */
export function parseGenericCSV(csvContent: string): GenericCSVResult {
  const firstLine = csvContent.split('\n')[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';

  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data,
    sampleRows: result.data.slice(0, 10),
    totalRows: result.data.length,
  };
}

/**
 * Parse various date formats to ISO date string
 */
function parseFlexibleDate(value: string): string | null {
  if (!value) return null;

  const cleaned = value.trim();

  // Try YYYYMMDD (ING format)
  if (/^\d{8}$/.test(cleaned)) {
    const date = parseINGDate(cleaned);
    return formatDateISO(date);
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const euMatch = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return formatDateISO(date);
  }

  // Try YYYY-MM-DD (ISO format)
  const isoMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return formatDateISO(date);
  }

  return null;
}

/**
 * Parse various amount formats
 */
function parseFlexibleAmount(value: string): number | null {
  if (!value) return null;

  let cleaned = value.trim();

  const isNegative =
    cleaned.startsWith('-') ||
    cleaned.toLowerCase().includes('af') ||
    cleaned.toLowerCase().includes('debit');

  cleaned = cleaned.replace(/[€$£¥]/g, '').trim();
  cleaned = cleaned.replace(/^-/, '').trim();
  cleaned = cleaned.replace(/(af|bij|debit|credit)/gi, '').trim();

  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    if (/,\d{2}$/.test(cleaned)) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const amount = parseFloat(cleaned);
  if (isNaN(amount)) return null;

  return isNegative ? -Math.abs(amount) : amount;
}

/**
 * Parse generic CSV with column mapping
 */
export function parseWithMapping(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  _accountIban: string
): ParsedTransaction[] {
  return rows.map((row, index) => {
    const dateStr = row[mapping.date];
    const date = parseFlexibleDate(dateStr);

    let amount = parseFlexibleAmount(row[mapping.amount]);

    // Handle direction column if present
    if (mapping.direction && row[mapping.direction]) {
      const direction = row[mapping.direction].toLowerCase().trim();
      if (direction === 'af' || direction === 'debit' || direction === '-') {
        amount = amount !== null ? -Math.abs(amount) : null;
      } else if (
        direction === 'bij' ||
        direction === 'credit' ||
        direction === '+'
      ) {
        amount = amount !== null ? Math.abs(amount) : null;
      }
    }

    const description = row[mapping.description] || '';
    const iban = mapping.iban ? row[mapping.iban] : null;
    const counterparty = mapping.counterparty
      ? row[mapping.counterparty]
      : null;
    const balance = mapping.balance
      ? parseEuropeanNumber(row[mapping.balance])
      : null;

    const errors: string[] = [];
    if (!date) errors.push(`Invalid date: ${dateStr}`);
    if (amount === null) errors.push(`Invalid amount: ${row[mapping.amount]}`);

    return {
      rowIndex: index,
      date: date || '',
      amount: amount || 0,
      description,
      iban,
      counterparty,
      balance,
      rawData: row,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  });
}

/**
 * Convert parsed transactions to TransactionCreate objects
 */
export function convertToTransactions(
  parsed: ParsedTransaction[],
  accountId: string,
  accountIban: string,
  _profileId: string
): TransactionCreate[] {
  return parsed
    .filter((t) => !t.error)
    .map((t) => {
      const type: 'income' | 'expense' | 'transfer' =
        t.amount > 0 ? 'income' : 'expense';

      return {
        date: t.date,
        amount: t.amount,
        type,
        description: t.description,
        merchantName: t.counterparty || null,
        accountId: accountId,
        opposingAccountIban: t.iban,
        opposingAccountName: t.counterparty,
        balanceAfter: t.balance,
        rawData: JSON.stringify(t.rawData),
        importHash: generateTransactionHash(
          t.date,
          t.amount,
          t.description,
          accountIban
        ),
      };
    });
}

/**
 * Parse ING CSV format specifically
 */
export function parseINGCSV(
  csvContent: string,
  accountIban: string
): ParsedTransaction[] {
  const result = parseGenericCSV(csvContent);

  const mapping: ColumnMapping = {
    date: 'Datum',
    amount: 'Bedrag (EUR)',
    description: 'Naam / Omschrijving',
    iban: 'Tegenrekening',
    counterparty: 'Naam / Omschrijving',
    balance: 'Saldo na mutatie',
    direction: 'Af Bij',
    paymentMethod: 'Mutatiesoort',
    notes: 'Mededelingen',
  };

  return parseWithMapping(result.rows, mapping, accountIban);
}
