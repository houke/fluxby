import { type Database } from '@fluxby/database';
import { type TransactionCreate } from '@fluxby/shared';

interface INGImportOptions {
  accountId: string;
  profileId: string;
  mapping: {
    date: string;
    amount: string;
    description: string;
    iban?: string;
    counterparty?: string;
    balance?: string;
    direction?: string;
    notes?: string;
    paymentMethod?: string;
  };
  ownAccountIbans: Set<string>;
}

/**
 * ING Specific row processor
 */
export async function processINGRow(
  db: Database,
  row: Record<string, string>,
  options: INGImportOptions,
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

  const dateStr = row[mapping.date];
  const date = helpers.parseDate(dateStr);
  if (!date) return { error: `Invalid date "${dateStr}"` };

  let amount = helpers.parseAmount(row[mapping.amount]);
  if (amount === null) {
    return { error: `Invalid amount "${row[mapping.amount]}"` };
  }

  // Handle direction column (Af/Bij)
  const directionColumn = mapping.direction || 'Af Bij'; // Use mapping or fallback to ING default
  const direction = row[directionColumn];
  if (direction) {
    const dir = direction.toLowerCase().trim();
    if (dir === 'af') {
      amount = -Math.abs(amount);
    } else if (dir === 'bij') {
      amount = Math.abs(amount);
    }
  }

  const rawDescription = row[mapping.description] || '';
  const mededelingen = mapping.notes ? row[mapping.notes] : '';
  const rawPaymentMethod = mapping.paymentMethod
    ? row[mapping.paymentMethod]
    : null;

  // Map ING payment method names to standardized terms (lowercase to match UI badges)
  let paymentMethod = rawPaymentMethod;
  if (rawPaymentMethod) {
    const methodLower = rawPaymentMethod.toLowerCase().trim();
    // Map to lowercase payment method values that match the transaction badge filter
    const methodMap: Record<string, string> = {
      betaalautomaat: 'pin',
      pin: 'pin',
      overschrijving: 'overschrijving', // Keep as overschrijving to match badge filter
      overboeking: 'overschrijving',
      incasso: 'incasso',
      diversen: 'incasso',
      geldautomaat: 'geldautomaat',
      storting: 'storting',
      ideal: 'ideal',
      'online bankieren': 'overschrijving',
    };
    paymentMethod = methodMap[methodLower] || methodLower || 'overig';
  }

  // Use counterparty field for opposing IBAN (Tegenrekening)
  const opposingIban = mapping.counterparty
    ? row[mapping.counterparty]?.replace(/\s/g, '').toUpperCase()
    : null;

  // For ING:
  // - Mededelingen -> description (shows in tooltip)
  // - Naam / Omschrijving -> merchantName (shows in list)
  const description = mededelingen || rawDescription;
  const merchantName = helpers.applyCleanupRules(rawDescription);

  let type: 'income' | 'expense' | 'transfer' =
    amount > 0 ? 'income' : 'expense';

  // Check if opposing IBAN is one of our own accounts (internal transfer)
  if (opposingIban && ownAccountIbans.has(opposingIban)) {
    type = 'transfer';
  }

  let opposingAccountName = rawDescription;

  // Oranje Spaarrekening logic - detect transfers to/from ING savings account
  // Check both mededelingen (notes) and description fields for the pattern
  const isOranjeSpaar =
    (mededelingen && /oranje\s*spaarrekening/i.test(mededelingen)) ||
    (rawDescription && /oranje\s*spaarrekening/i.test(rawDescription)) ||
    (description && /oranje\s*spaarrekening/i.test(description));

  if (isOranjeSpaar) {
    opposingAccountName = 'ING Oranje Spaarrekening';
    // Always mark as transfer regardless of whether opposingIban exists
    type = 'transfer';

    // If we have an opposing IBAN, create/verify the savings account
    if (opposingIban) {
      // Check if this savings account already exists in the selected profile
      const existingSavings = await db.queryOneAsync<{ id: string }>(
        'SELECT id FROM accounts WHERE profile_id = ? AND (iban = ? OR name = ?) AND is_deleted = 0',
        [profileId, opposingIban, 'ING Oranje Spaarrekening']
      );

      if (!existingSavings) {
        // Create the Oranje spaarrekening as a savings account in the selected profile
        const savingsAccountId = crypto.randomUUID();
        const now = Date.now();
        await db.runAsync(
          `INSERT INTO accounts (id, iban, name, type, bank, profile_id, order_index, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            savingsAccountId,
            opposingIban,
            'ING Oranje Spaarrekening',
            'savings',
            'ING',
            profileId,
            99,
            now,
            now,
          ]
        );
        // Add to ownAccountIbans so it's recognized as a transfer
        ownAccountIbans.add(opposingIban);
      }
    }
  }

  // Get own IBAN for hash
  const account = await db.queryOneAsync<{ iban: string }>(
    'SELECT iban FROM accounts WHERE id = ? AND profile_id = ?',
    [accountId, profileId]
  );

  const hash = helpers.generateHash(
    date,
    amount,
    rawDescription, // Use original description for hash consistency
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
      opposingAccountName,
      notes: null, // Remove redundant notes, keep only description
      paymentMethod,
      importHash: hash,
    } as TransactionCreate,
    hash,
    opposingIban,
    merchantName,
  };
}
