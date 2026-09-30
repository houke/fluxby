/**
 * Format an amount with an explicit currency and locale (Dutch by default).
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'nl-NL'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Parse European number format (1.234,56) to number
 */
export function parseEuropeanNumber(value: string | undefined | null): number {
  if (!value) return 0;
  // Remove thousand separators (.) and replace decimal comma with dot
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}

/**
 * Format a date as DD-MM-YYYY (European format)
 */
export function formatDate(
  date: Date | string,
  locale: string = 'nl-NL'
): string {
  const isDateOnlyString =
    typeof date === 'string' && DATE_ONLY_REGEX.test(date);
  const d = typeof date === 'string' ? parseFlexibleDate(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(isDateOnlyString ? { timeZone: 'UTC' } : {}),
  }).format(d);
}

/**
 * Format a date as YYYY-MM-DD (ISO format for database)
 * Uses local timezone to avoid date shifts when converting to UTC
 */
export function formatDateISO(date: Date | string): string {
  if (typeof date === 'string' && DATE_ONLY_REGEX.test(date)) {
    return formatUTCDateISO(parseDateOnly(date));
  }

  const d = typeof date === 'string' ? parseFlexibleDate(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseFlexibleDate(value: string): Date {
  return DATE_ONLY_REGEX.test(value) ? parseDateOnly(value) : new Date(value);
}

/**
 * Parse a date-only string as a UTC calendar date.
 */
export function parseDateOnly(date: string): Date {
  const match = DATE_ONLY_REGEX.exec(date);
  if (!match) {
    throw new Error(`Invalid date-only value: ${date}`);
  }

  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/**
 * Format a UTC date as YYYY-MM-DD without applying local timezone shifts.
 */
export function formatUTCDateISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a date-only string using UTC calendar math.
 */
export function addDaysToDateOnly(date: string, days: number): string {
  const next = parseDateOnly(date);
  next.setUTCDate(next.getUTCDate() + days);
  return formatUTCDateISO(next);
}

/**
 * Add months to a date-only string using UTC calendar math.
 */
export function addMonthsToDateOnly(date: string, months: number): string {
  const next = parseDateOnly(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return formatUTCDateISO(next);
}

/**
 * Calculate the day difference between two date-only strings.
 */
export function diffDateOnlyInDays(startDate: string, endDate: string): number {
  return Math.round(
    (parseDateOnly(endDate).getTime() - parseDateOnly(startDate).getTime()) /
      MS_PER_DAY
  );
}

/**
 * Parse ING date format (YYYYMMDD) to Date
 */
export function parseINGDate(value: string): Date {
  const year = parseInt(value.substring(0, 4), 10);
  const month = parseInt(value.substring(4, 6), 10) - 1;
  const day = parseInt(value.substring(6, 8), 10);
  return new Date(year, month, day);
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Get month name from date
 */
export function getMonthName(
  date: Date | string,
  short: boolean = false
): string {
  const isDateOnlyString =
    typeof date === 'string' && DATE_ONLY_REGEX.test(date);
  const d = typeof date === 'string' ? parseFlexibleDate(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: short ? 'short' : 'long',
    ...(isDateOnlyString ? { timeZone: 'UTC' } : {}),
  }).format(d);
}

/**
 * Generate a SHA-256 based hash for duplicate detection
 * Uses first 64 bits (16 hex chars) of SHA-256 for collision resistance
 * Works in both browser (Web Crypto API) and Node.js
 */
export async function generateTransactionHash(
  date: string,
  amount: number,
  description: string,
  iban: string
): Promise<string> {
  const data = `${date}|${amount}|${description}|${iban}`;
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Return first 16 hex chars (64 bits) - vastly more collision-resistant than 32-bit
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Legacy synchronous hash function for backwards compatibility with migrations
 * @deprecated Use generateTransactionHash for new imports
 */
export function generateTransactionHashLegacy(
  date: string,
  amount: number,
  description: string,
  iban: string
): string {
  const data = `${date}|${amount}|${description}|${iban}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

// ============= Security Utilities =============

/**
 * UUID v4 validation regex
 * Matches standard UUID format: 8-4-4-4-12 hex characters
 * Also accepts demo profile ID format (all zeros with 1 at end)
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID v4 format
 * @param id - The string to validate
 * @returns true if the string is a valid UUID format
 */
export function isValidUUID(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
}

/**
 * Validate an array of UUIDs
 * @param ids - Array of strings to validate
 * @returns true if all strings are valid UUIDs
 */
export function areValidUUIDs(ids: unknown[]): ids is string[] {
  if (!Array.isArray(ids)) return false;
  return ids.every((id) => isValidUUID(id));
}

/**
 * Security constants for bulk operations
 */
export const SECURITY_LIMITS = {
  /** Maximum transaction IDs per bulk delete request */
  MAX_BULK_DELETE_IDS: 1000,
  /** Maximum transaction IDs per restore request */
  MAX_RESTORE_IDS: 1000,
  /** Maximum date range lookback in years */
  MAX_DATE_RANGE_YEARS: 10,
} as const;
