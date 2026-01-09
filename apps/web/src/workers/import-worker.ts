/**
 * Import Worker
 *
 * Handles CSV parsing and validation in a Web Worker to prevent UI blocking
 * during large file imports (10k+ rows).
 *
 * Architecture:
 * - Main thread sends file content and mapping
 * - Worker parses CSV, validates rows, reports progress
 * - Returns parsed data ready for database insertion
 */

import Papa from 'papaparse';

// Message types for worker communication
export interface WorkerMessage {
  type: 'parse' | 'abort';
  payload?: ParseRequest;
}

export interface ParseRequest {
  csvContent: string;
  mapping?: ColumnMapping;
  bank?: string;
}

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

export interface WorkerResponse {
  type: 'progress' | 'preview' | 'result' | 'error';
  progress?: number;
  stage?: string;
  data?: ParseResult | PreviewResult;
  error?: string;
}

export interface PreviewResult {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

export interface ParsedRow {
  rowIndex: number;
  date: string;
  amount: number;
  description: string;
  iban: string | null;
  counterparty: string | null;
  balance: number | null;
  notes: string | null;
  paymentMethod: string | null;
  direction: string | null;
  rawData: Record<string, string>;
  error?: string;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
}

// ============= Parsing Utilities =============

/**
 * Detect CSV delimiter from content
 */
function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  return ',';
}

/**
 * Parse various date formats to ISO date string
 */
function parseFlexibleDate(value: string): string | null {
  if (!value) return null;

  const cleaned = value.trim();

  // Try YYYYMMDD (ING format)
  if (/^\d{8}$/.test(cleaned)) {
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return `${year}-${month}-${day}`;
    }
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const euMatch = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Try YYYY-MM-DD (ISO format)
  const isoMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Parse various amount formats (European style, currency symbols, etc.)
 */
function parseFlexibleAmount(value: string): number | null {
  if (!value) return null;

  let cleaned = value.trim();

  // Check for negative indicators
  const isNegative =
    cleaned.startsWith('-') ||
    cleaned.toLowerCase().includes('af') ||
    cleaned.toLowerCase().includes('debit');

  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[€$£¥\s]/g, '').trim();
  cleaned = cleaned.replace(/^-/, '').trim();
  cleaned = cleaned.replace(/(af|bij|debit|credit)/gi, '').trim();

  // Handle European vs American number format
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // European: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // American: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Check if comma is decimal separator (ends in ,XX)
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

// ============= Worker Message Handler =============

let aborted = false;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  if (type === 'abort') {
    aborted = true;
    return;
  }

  if (type === 'parse' && payload) {
    aborted = false;
    await handleParse(payload);
  }
};

/**
 * Handle CSV parsing request
 */
async function handleParse(request: ParseRequest): Promise<void> {
  const { csvContent, mapping } = request;

  try {
    // Stage 1: Detect delimiter and parse CSV (10%)
    postProgress(5, 'Detecting format...');

    const delimiter = detectDelimiter(csvContent);

    // Stage 2: Parse CSV with PapaParse (30%)
    postProgress(10, 'Parsing CSV...');

    const parseResult = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (aborted) return;

    const headers = parseResult.meta.fields || [];
    const rows = parseResult.data;
    const totalRows = rows.length;

    postProgress(30, `Parsed ${totalRows} rows`);

    // If no mapping provided, return preview only
    if (!mapping) {
      const response: WorkerResponse = {
        type: 'preview',
        data: {
          headers,
          sampleRows: rows.slice(0, 10),
          totalRows,
        } as PreviewResult,
      };
      self.postMessage(response);
      return;
    }

    // Stage 3: Validate and transform rows (30% -> 90%)
    postProgress(35, 'Validating rows...');

    const parsedRows: ParsedRow[] = [];
    let validRows = 0;
    let errorRows = 0;

    // Process in batches to report progress
    const batchSize = Math.max(100, Math.floor(totalRows / 20));

    for (let i = 0; i < totalRows; i++) {
      if (aborted) return;

      const row = rows[i];
      const parsed = parseRow(row, i, mapping);

      parsedRows.push(parsed);
      if (parsed.error) {
        errorRows++;
      } else {
        validRows++;
      }

      // Report progress every batch
      if (i > 0 && i % batchSize === 0) {
        const progressPct = 35 + Math.floor((i / totalRows) * 55);
        postProgress(progressPct, `Validating row ${i} of ${totalRows}`);
      }
    }

    postProgress(95, 'Finalizing...');

    // Stage 4: Return result (100%)
    const result: ParseResult = {
      headers,
      rows: parsedRows,
      totalRows,
      validRows,
      errorRows,
    };

    const response: WorkerResponse = {
      type: 'result',
      progress: 100,
      data: result,
    };

    self.postMessage(response);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown parsing error';
    const response: WorkerResponse = {
      type: 'error',
      error: errorMessage,
    };
    self.postMessage(response);
  }
}

/**
 * Parse a single row with the given mapping
 */
function parseRow(
  row: Record<string, string>,
  index: number,
  mapping: ColumnMapping
): ParsedRow {
  const dateStr = row[mapping.date];
  const date = parseFlexibleDate(dateStr);

  let amount = parseFlexibleAmount(row[mapping.amount]);

  // Handle direction column if present (Af/Bij, Debit/Credit)
  const directionValue = mapping.direction ? row[mapping.direction] : null;
  if (directionValue && amount !== null) {
    const direction = directionValue.toLowerCase().trim();
    if (direction === 'af' || direction === 'debit' || direction === '-') {
      amount = -Math.abs(amount);
    } else if (
      direction === 'bij' ||
      direction === 'credit' ||
      direction === '+'
    ) {
      amount = Math.abs(amount);
    }
  }

  const description = row[mapping.description] || '';
  const iban = mapping.iban ? row[mapping.iban] || null : null;
  const counterparty = mapping.counterparty
    ? row[mapping.counterparty] || null
    : null;
  const balanceStr = mapping.balance ? row[mapping.balance] : null;
  const balance = balanceStr ? parseFlexibleAmount(balanceStr) : null;
  const notes = mapping.notes ? row[mapping.notes] || null : null;
  const paymentMethod = mapping.paymentMethod
    ? row[mapping.paymentMethod] || null
    : null;

  // Collect validation errors
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
    notes,
    paymentMethod,
    direction: directionValue,
    rawData: row,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

/**
 * Post progress update to main thread
 */
function postProgress(value: number, stage?: string): void {
  const response: WorkerResponse = {
    type: 'progress',
    progress: value,
    stage,
  };
  self.postMessage(response);
}
