import Papa from 'papaparse';
import {
  parseEuropeanNumber,
  parseINGDate,
  formatDateISO,
  generateTransactionHash,
  type INGTransaction,
  type TransactionCreate,
} from '@fluxby/shared';

// Column mapping for generic CSV import
export interface ColumnMapping {
  date: string;
  amount: string;
  description: string;
  iban?: string;
  counterparty?: string;
  balance?: string;
  direction?: string; // Column indicating income/expense (e.g., 'Af Bij' for ING)
  paymentMethod?: string; // Payment method column (e.g., 'Mutatiesoort' for ING)
  notes?: string; // Transaction details/notes column (e.g., 'Mededelingen' for ING)
}

export interface GenericCSVResult {
  headers: string[];
  rows: Record<string, string>[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

export interface ParsedGenericTransaction {
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
  // Try to detect delimiter (comma, semicolon, tab)
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

  // Try MM/DD/YYYY (US format)
  const usMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
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

  // Check for negative indicators
  const isNegative =
    cleaned.startsWith('-') ||
    cleaned.toLowerCase().includes('af') ||
    cleaned.toLowerCase().includes('debit');

  // Remove currency symbols and text
  cleaned = cleaned.replace(/[€$£¥]/g, '').trim();
  cleaned = cleaned.replace(/^-/, '').trim();
  cleaned = cleaned.replace(/(af|bij|debit|credit)/gi, '').trim();

  // Try European format (1.234,56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Check which is the decimal separator (last one is decimal)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // European: dots are thousands, comma is decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US: commas are thousands, dot is decimal
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Could be European decimal or US thousands
    // If comma is followed by exactly 2 digits at end, it's decimal
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
 * Convert generic CSV rows to transactions using column mapping
 */
export function convertGenericToTransactions(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  accountId: number
): { transactions: TransactionCreate[]; errors: ParsedGenericTransaction[] } {
  const transactions: TransactionCreate[] = [];
  const errors: ParsedGenericTransaction[] = [];

  rows.forEach((row, index) => {
    const dateStr = parseFlexibleDate(row[mapping.date]);
    let amount = parseFlexibleAmount(row[mapping.amount]);
    const description = row[mapping.description]?.trim() || '';
    // 'iban' in mapping = user's own account IBAN (Rekening)
    const ownIban = mapping.iban
      ? row[mapping.iban]?.trim().toUpperCase()
      : null;
    // 'counterparty' in mapping = opposing account IBAN (Tegenrekening)
    const opposingIban = mapping.counterparty
      ? row[mapping.counterparty]?.trim().toUpperCase()
      : null;
    const balance = mapping.balance
      ? parseFlexibleAmount(row[mapping.balance])
      : null;

    // Handle separate direction column (e.g., ING's 'Af Bij')
    if (mapping.direction && amount !== null) {
      const direction = row[mapping.direction]?.trim().toLowerCase();
      // If direction indicates expense (Af, Debit, D, -)
      if (
        direction === 'af' ||
        direction === 'debit' ||
        direction === 'd' ||
        direction === '-'
      ) {
        amount = -Math.abs(amount);
      } else if (
        direction === 'bij' ||
        direction === 'credit' ||
        direction === 'c' ||
        direction === '+'
      ) {
        amount = Math.abs(amount);
      }
    }

    // Validate required fields
    if (!dateStr) {
      errors.push({
        rowIndex: index + 1,
        date: row[mapping.date],
        amount: amount || 0,
        description,
        iban: ownIban,
        counterparty: opposingIban,
        balance,
        rawData: row,
        error: 'invalidDate',
      });
      return;
    }

    if (amount === null) {
      errors.push({
        rowIndex: index + 1,
        date: dateStr,
        amount: 0,
        description,
        iban: ownIban,
        counterparty: opposingIban,
        balance,
        rawData: row,
        error: 'invalidAmount',
      });
      return;
    }

    // Get payment method from mapping or default to 'overig'
    let paymentMethod = 'overig';
    if (mapping.paymentMethod && row[mapping.paymentMethod]) {
      const rawMethod = row[mapping.paymentMethod]?.trim().toLowerCase();
      // Map common payment method names
      const methodMap: Record<string, string> = {
        betaalautomaat: 'pin',
        pin: 'pin',
        ba: 'pin',
        ideal: 'ideal',
        id: 'ideal',
        overschrijving: 'transfer',
        overboeking: 'transfer',
        gt: 'transfer',
        ov: 'transfer',
        incasso: 'incasso',
        ic: 'incasso',
        dv: 'incasso',
        diversen: 'incasso',
        geldautomaat: 'geldautomaat',
        gm: 'geldautomaat',
        storting: 'storting',
        st: 'storting',
        'online bankieren': 'transfer',
      };
      paymentMethod = methodMap[rawMethod] || rawMethod || 'overig';
    }

    // Get notes from mapping if available
    const notes =
      mapping.notes && row[mapping.notes] ? row[mapping.notes].trim() : null;

    const type: 'income' | 'expense' | 'transfer' =
      amount >= 0 ? 'income' : 'expense';
    // Use own IBAN + opposing IBAN in hash for uniqueness
    const importHash = generateTransactionHash(
      dateStr,
      amount,
      notes || description,
      opposingIban || ownIban || ''
    );

    transactions.push({
      date: dateStr,
      amount,
      type,
      description,
      // Use description as merchant name (often contains the counterparty name)
      merchantName: description,
      accountId,
      // opposingAccountIban should be the OPPOSING account (Tegenrekening), not own account
      opposingAccountIban: opposingIban,
      // Extract name from description if available
      opposingAccountName: description || null,
      categoryId: null,
      notes,
      balanceAfter: balance,
      paymentMethod,
      rawData: JSON.stringify(row),
      importHash,
    });
  });

  return { transactions, errors };
}

interface RawINGRow {
  Datum: string;
  'Naam / Omschrijving': string;
  Rekening: string;
  Tegenrekening: string;
  Code: string;
  'Af Bij': string;
  'Bedrag (EUR)': string;
  Mutatiesoort: string;
  Mededelingen: string;
  'Saldo na mutatie': string;
  Tag: string;
}

export function parseINGCSV(csvContent: string): INGTransaction[] {
  const result = Papa.parse<RawINGRow>(csvContent, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    console.error('CSV parsing errors:', result.errors);
  }

  return result.data.map((row) => ({
    datum: row.Datum,
    naamOmschrijving: row['Naam / Omschrijving'],
    rekening: row.Rekening,
    tegenrekening: row.Tegenrekening,
    code: row.Code,
    afBij: row['Af Bij'] as 'Af' | 'Bij',
    bedrag: row['Bedrag (EUR)'],
    mutatiesoort: row.Mutatiesoort,
    mededelingen: row.Mededelingen,
    saldoNaMutatie: row['Saldo na mutatie'],
    tag: row.Tag,
  }));
}

// Map ING mutatiesoort/code to payment method
function getPaymentMethod(code: string, mutatiesoort: string): string {
  // ING codes: BA=Betaalautomaat (PIN), ID=iDEAL, GT=Giro Transfer, OV=Overschrijving, IC=Incasso
  const codeMap: Record<string, string> = {
    BA: 'pin',
    ID: 'ideal',
    GT: 'transfer',
    OV: 'transfer',
    IC: 'incasso',
    DV: 'incasso',
    GM: 'geldautomaat',
    ST: 'storting',
  };
  return codeMap[code] || mutatiesoort?.toLowerCase() || 'overig';
}

export function convertINGToTransactions(
  ingTransactions: INGTransaction[],
  accountId: number
): TransactionCreate[] {
  return ingTransactions.map((ing) => {
    const absAmount = parseEuropeanNumber(ing.bedrag);
    const isExpense = ing.afBij === 'Af';
    const amount = isExpense ? -absAmount : absAmount;
    const date = parseINGDate(ing.datum);
    const dateStr = formatDateISO(date);
    const balanceAfter = ing.saldoNaMutatie
      ? parseEuropeanNumber(ing.saldoNaMutatie)
      : null;
    const paymentMethod = getPaymentMethod(ing.code, ing.mutatiesoort);

    // Determine transaction type
    let type: 'income' | 'expense' | 'transfer' = isExpense
      ? 'expense'
      : 'income';

    // Check if it's a transfer to savings or internal
    const isToSavings =
      ing.mededelingen?.includes('Oranje spaarrekening') ||
      ing.mededelingen?.includes('spaarrekening');
    if (isToSavings) {
      type = 'transfer';
    }

    // Generate hash for duplicate detection
    const importHash = generateTransactionHash(
      dateStr,
      amount,
      ing.mededelingen || ing.naamOmschrijving,
      ing.rekening
    );

    return {
      date: dateStr,
      amount,
      type,
      description: ing.naamOmschrijving || '',
      merchantName: ing.naamOmschrijving,
      accountId,
      opposingAccountIban: ing.tegenrekening?.toUpperCase().trim() || null,
      opposingAccountName: ing.naamOmschrijving,
      categoryId: type === 'transfer' ? 10 : null, // Auto-assign Overboekingen (id=10) for transfers
      notes: ing.mededelingen || null,
      balanceAfter,
      paymentMethod,
      rawData: JSON.stringify(ing),
      importHash,
    };
  });
}

export function detectDuplicates(
  transactions: TransactionCreate[],
  existingHashes: Set<string>
): { new: TransactionCreate[]; duplicates: TransactionCreate[] } {
  const newTransactions: TransactionCreate[] = [];
  const duplicates: TransactionCreate[] = [];

  for (const transaction of transactions) {
    if (existingHashes.has(transaction.importHash)) {
      duplicates.push(transaction);
    } else {
      newTransactions.push(transaction);
    }
  }

  return { new: newTransactions, duplicates };
}
