import Papa from 'papaparse';

export interface ImportColumnMapping {
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
export interface ImportOptions {
  delimiter: 'auto' | ',' | ';' | '\t';
  skipRows: number;
  dateFormat: 'auto' | 'day-first' | 'iso' | 'compact';
  decimal: ',' | '.';
  invertSign: boolean;
  debitColumn: string;
  creditColumn: string;
}
export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  delimiter: 'auto',
  skipRows: 0,
  dateFormat: 'auto',
  decimal: ',',
  invertSign: false,
  debitColumn: '',
  creditColumn: '',
};
export function headerSignature(headers: string[]) {
  return JSON.stringify(
    headers.map((h) => h.trim().toLocaleLowerCase('nl-NL'))
  );
}
export function parseImportAmount(value: string, decimal: ',' | '.') {
  const raw = value.trim().replace(/[€\s\u00a0]/g, '');
  if (!raw) throw new Error('amount');
  const group = decimal === ',' ? '.' : ',';
  // Grouping must be in thousands; never silently reinterpret a decimal.
  const pattern =
    decimal === ','
      ? /^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/
      : /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/;
  if (!pattern.test(raw)) throw new Error('amount');
  const amount = Number(raw.split(group).join('').replace(decimal, '.'));
  if (!Number.isSafeInteger(Math.round(amount * 100)))
    throw new Error('amount');
  return Math.round(amount * 100) / 100;
}
export function parseImportDate(
  raw: string,
  format: ImportOptions['dateFormat']
) {
  const value = raw.trim();
  let iso = '';
  if (
    (format === 'auto' || format === 'iso') &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  )
    iso = value;
  if ((format === 'auto' || format === 'compact') && /^\d{8}$/.test(value))
    iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
  const match = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if ((format === 'auto' || format === 'day-first') && match)
    iso = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  if (
    !iso ||
    !Number.isFinite(Date.parse(`${iso}T00:00:00Z`)) ||
    new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) !== iso
  )
    throw new Error('date');
  return iso;
}
export function parseConfiguredCSV(content: string, options: ImportOptions) {
  if (
    !Number.isInteger(options.skipRows) ||
    options.skipRows < 0 ||
    options.skipRows > 1000
  )
    throw new Error('skipRows');
  // Parse records before removing introductory records so quoted newlines are safe.
  const parsed = Papa.parse<string[]>(content.replace(/^\uFEFF/, ''), {
    delimiter: options.delimiter === 'auto' ? '' : options.delimiter,
    skipEmptyLines: 'greedy',
  });
  if (parsed.errors.some((e) => e.code !== 'UndetectableDelimiter'))
    throw new Error('csv');
  const records = parsed.data.slice(options.skipRows);
  // ABN AMRO's seven-column tab export has no header. Only recognize its
  // complete structural signature; arbitrary numeric CSV headers stay untouched.
  if (
    records.length &&
    records.every(
      (row) =>
        row.length === 7 && /^[A-Z]{3}$/.test(row[1]) && /^\d{8}$/.test(row[2])
    )
  ) {
    if (records.some((row) => row[1] !== 'EUR')) throw new Error('currency');
    records.unshift([
      'Rekeningnummer',
      'Valuta',
      'Transactiedatum',
      'Beginsaldo',
      'Eindsaldo',
      'Transactiebedrag',
      'Omschrijving',
    ]);
  }
  const headers = (records.shift() ?? []).map((h) => h.trim());
  if (
    !headers.length ||
    new Set(headers).size !== headers.length ||
    headers.some((h) => !h)
  )
    throw new Error('headers');
  const rows = records.map((record) => {
    if (record.length !== headers.length) throw new Error('columns');
    return Object.fromEntries(headers.map((h, i) => [h, record[i]]));
  });
  return {
    headers,
    rows,
    sampleRows: rows.slice(0, 10),
    totalRows: rows.length,
  };
}
export function normalizeImportRow(
  row: Record<string, string>,
  mapping: ImportColumnMapping,
  options: ImportOptions
) {
  for (const [header, value] of Object.entries(row)) {
    if (
      /^(valuta|valuta saldo|currency|munt)$/i.test(header.trim()) &&
      value.trim() &&
      value.trim().toUpperCase() !== 'EUR'
    )
      throw new Error('currency');
  }
  const date = parseImportDate(row[mapping.date] ?? '', options.dateFormat);
  let amount: number;
  if (options.debitColumn || options.creditColumn) {
    const debit = row[options.debitColumn]?.trim()
      ? parseImportAmount(row[options.debitColumn], options.decimal)
      : 0;
    const credit = row[options.creditColumn]?.trim()
      ? parseImportAmount(row[options.creditColumn], options.decimal)
      : 0;
    if (debit < 0 || credit < 0 || (debit !== 0 && credit !== 0))
      throw new Error('amount');
    amount = credit - debit;
  } else amount = parseImportAmount(row[mapping.amount] ?? '', options.decimal);
  const direction = mapping.direction
    ? row[mapping.direction]?.trim().toLowerCase()
    : '';
  if (direction && ['af', 'debit', 'd', 'dbit'].includes(direction))
    amount = -Math.abs(amount);
  else if (direction && ['bij', 'credit', 'c', 'crdt'].includes(direction))
    amount = Math.abs(amount);
  else if (direction) throw new Error('direction');
  if (options.invertSign) amount = -amount;
  const balance =
    mapping.balance && row[mapping.balance]?.trim()
      ? parseImportAmount(row[mapping.balance], options.decimal)
      : null;
  return {
    ...row,
    __fluxby_date: date,
    __fluxby_amount: amount.toFixed(2).replace('.', ','),
    __fluxby_balance:
      balance === null ? '' : balance.toFixed(2).replace('.', ','),
  };
}
export function prepareConfiguredImport(
  content: string,
  mapping: ImportColumnMapping,
  options: ImportOptions
) {
  const parsed = parseConfiguredCSV(content, options);
  const rows = parsed.rows.map((row) =>
    normalizeImportRow(row, mapping, options)
  );
  return {
    csv: Papa.unparse(rows),
    mapping: {
      ...mapping,
      date: '__fluxby_date',
      amount: '__fluxby_amount',
      balance: mapping.balance ? '__fluxby_balance' : undefined,
      direction: undefined,
    },
    rows,
  };
}
