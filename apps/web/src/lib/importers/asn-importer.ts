import { type Database } from '@fluxby/database';
import { type TransactionCreate } from '@fluxby/shared';

interface ASNImportOptions {
  accountId: string;
  profileId: string;
  mapping: {
    date: string; // "Datum"
    amount: string; // "Bedrag bij / af"
    description: string; // "Omschrijving"
    iban?: string; // "Je rekening"
    counterparty?: string; // "Van / naar"
    counterpartyName?: string; // "Naam"
    balance?: string; // "Saldo voor boeking"
    code?: string; // "Code"
    type?: string; // "Type"
    notes?: string; // "Betalingskenmerk"
  };
  ownAccountIbans: Set<string>;
}

/**
 * Map ASN payment type codes to standardized payment method names
 * ASN uses codes like "iom", "ic", "ovs", "ngo", "afb", "bea", "gea"
 */
export function mapASNPaymentType(type: string | null | undefined): string {
  if (!type) return 'overig';

  const normalizedType = type.toLowerCase().trim();

  switch (normalizedType) {
    // Direct Debits / Incassos
    case 'iom': // Incasso Onderneming Machtiging
    case 'ic': // Incasso
      return 'incasso';

    // Standard Transfers
    case 'ovs': // Overschrijving
    case 'ngo': // Niet Girale Overschrijving
    case 'afb': // Afboeking (often fees/costs)
      return 'overschrijving';

    // Card Payments (Terminal)
    case 'bea': // Betaalautomaat
      return 'pin';

    // ATM/Cash
    case 'gea': // Geldautomaat
      return 'geldautomaat';

    // iDEAL payments
    case 'id':
    case 'ideal':
      return 'ideal';

    // Deposit
    case 'st': // Storting
      return 'storting';

    // Default fallback
    default:
      console.warn('Unknown ASN Type:', type);
      return 'overig';
  }
}

/**
 * Parse ASN-style European amount format
 * Handles: "1.000,50" -> 1000.50, "-10,50" -> -10.50, "10,50" -> 10.50
 */
export function parseASNAmount(
  value: string | null | undefined
): number | null {
  if (!value) return null;

  let cleaned = value.trim();

  // Check for negative sign
  const isNegative = cleaned.startsWith('-');
  cleaned = cleaned.replace(/^-/, '').trim();

  // Remove thousands separators (.) and replace decimal comma with dot
  // European format: 1.234,56 -> 1234.56
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');

  const amount = parseFloat(cleaned);
  if (isNaN(amount)) return null;

  return isNegative ? -amount : amount;
}

/**
 * Parse ASN date format (DD-MM-YYYY) to ISO string (YYYY-MM-DD)
 */
export function parseASNDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const cleaned = value.trim();

  // ASN uses DD-MM-YYYY format
  const match = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    // Validate
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  return null;
}

/**
 * ASN Specific row processor
 *
 * ASN CSV columns:
 * "Datum";"Je rekening";"Van / naar";"Naam";"Adres";"Postcode";"Woonplaats";
 * "Valuta saldo";"Saldo voor boeking";"Valuta";"Bedrag bij / af";"Verwerkingsdatum";
 * "Valutadatum";"Code";"Type";"Volgnummer";"Betalingskenmerk";"Omschrijving";"Afschriftnummer"
 */
export async function processASNRow(
  db: Database,
  row: Record<string, string>,
  options: ASNImportOptions,
  helpers: {
    parseDate: (val: string) => string | null;
    parseAmount: (val: string) => number | null;
    applyCleanupRules: (name: string) => string;
    generateHash: (
      date: string,
      amount: number,
      desc: string,
      iban: string
    ) => string;
  }
) {
  const { mapping, profileId, ownAccountIbans, accountId } = options;

  // Parse date (DD-MM-YYYY format for ASN)
  const dateStr = row[mapping.date];
  const date = parseASNDate(dateStr) || helpers.parseDate(dateStr);
  if (!date) return { error: `Invalid date "${dateStr}"` };

  // Parse amount - ASN includes sign in the amount field (Bedrag bij / af)
  // Format: European with sign, e.g., "1.000,50" or "-10,50"
  const rawAmount = row[mapping.amount];
  const amount = parseASNAmount(rawAmount);
  if (amount === null) {
    return { error: `Invalid amount "${rawAmount}"` };
  }

  // Get description from Omschrijving and Betalingskenmerk
  const omschrijving = row[mapping.description] || '';
  const betalingskenmerk = mapping.notes ? row[mapping.notes] || '' : '';

  // Combine for full description
  const description = [omschrijving, betalingskenmerk]
    .filter(Boolean)
    .join(' - ')
    .trim();

  // Get counterparty name from "Naam" field
  const counterpartyNameField = mapping.counterpartyName || 'Naam';
  const rawCounterpartyName = row[counterpartyNameField] || '';

  // Use "Naam" as merchant name if available, otherwise use description
  const rawMerchantName = rawCounterpartyName || omschrijving;
  const merchantName = helpers.applyCleanupRules(rawMerchantName);

  // Get opposing IBAN from "Van / naar" field
  const counterpartyField = mapping.counterparty || 'Van / naar';
  const opposingIban = row[counterpartyField]
    ? row[counterpartyField].replace(/\s/g, '').toUpperCase()
    : null;

  // Map payment type from "Type" column
  const typeField = mapping.type || 'Type';
  const rawType = row[typeField];
  const paymentMethod = mapASNPaymentType(rawType);

  // Determine transaction type
  let type: 'income' | 'expense' | 'transfer' =
    amount > 0 ? 'income' : 'expense';

  // Check if opposing IBAN is one of our own accounts (internal transfer)
  if (opposingIban && ownAccountIbans.has(opposingIban)) {
    type = 'transfer';
  }

  // Check if description contains 'ASN Sparen' (internal savings transfer)
  if (
    description.toLowerCase().includes('asn sparen') ||
    omschrijving.toLowerCase().includes('asn sparen')
  ) {
    type = 'transfer';
  }

  // Get own IBAN for hash generation
  const account = await db.queryOneAsync<{ iban: string }>(
    'SELECT iban FROM accounts WHERE id = ? AND profile_id = ?',
    [accountId, profileId]
  );

  const hash = helpers.generateHash(
    date,
    amount,
    omschrijving || description, // Use original description for hash consistency
    account?.iban || ''
  );

  return {
    transaction: {
      date,
      amount,
      type,
      description,
      merchantName,
      accountId,
      opposingAccountIban: opposingIban,
      opposingAccountName: merchantName,
      notes: betalingskenmerk || null,
      paymentMethod,
      importHash: hash,
    } as TransactionCreate,
    hash,
    opposingIban,
    merchantName,
  };
}
