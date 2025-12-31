/**
 * Categorization Logic
 * Auto-categorizes transactions based on rules
 */

import type { TransactionCreate, CategoryRule } from '@fluxby/shared';

/**
 * Normalize text for accent-insensitive matching
 */
function normalizeForMatching(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Apply category rules to transactions
 */
export function applyCategoryRules(
  transactions: TransactionCreate[],
  rules: CategoryRule[]
): TransactionCreate[] {
  // Sort rules by priority (highest first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  return transactions.map((transaction) => {
    // Skip if already categorized
    if (transaction.categoryId) return transaction;

    // Try to match against rules
    for (const rule of sortedRules) {
      const normalizedPattern = normalizeForMatching(rule.pattern);
      const pattern = new RegExp(normalizedPattern, 'i');
      const textToMatch = normalizeForMatching(
        `${transaction.merchantName || ''} ${transaction.description || ''}`
      );

      if (pattern.test(textToMatch)) {
        return { ...transaction, categoryId: rule.categoryId };
      }
    }

    return transaction;
  });
}

/**
 * Default category patterns for Dutch merchants
 */
export const defaultCategoryPatterns: Array<{
  pattern: string;
  categoryId: string;
}> = [
  // Groceries
  {
    pattern:
      'albert heijn|ah |jumbo|lidl|aldi|plus |dirk|vomar|hoogvliet|coop |spar ',
    categoryId: '00000000-0000-0000-0000-000000000001',
  },
  // Dining
  {
    pattern:
      'restaurant|cafe|coffee|starbucks|mcdonalds|burger king|kfc|dominos|thuisbezorgd|uber eats|deliveroo',
    categoryId: '00000000-0000-0000-0000-000000000002',
  },
  // Transport
  {
    pattern:
      'ns-|ns reizen|ov-chipkaart|shell|bp |esso|total |q8|tinq|tango|parking|parkeren|anwb',
    categoryId: '00000000-0000-0000-0000-000000000003',
  },
  // Shopping
  {
    pattern:
      'bol.com|amazon|coolblue|mediamarkt|h&m|zara|primark|action|hema|ikea|blokker|kruidvat|etos',
    categoryId: '00000000-0000-0000-0000-000000000004',
  },
  // Entertainment
  {
    pattern:
      'netflix|spotify|disney|youtube|playstation|xbox|steam|bioscoop|cinema|pathe',
    categoryId: '00000000-0000-0000-0000-000000000005',
  },
  // Health
  {
    pattern:
      'apotheek|pharmacy|huisarts|tandarts|ziekenhuis|hospital|gym|sportschool',
    categoryId: '00000000-0000-0000-0000-000000000006',
  },
  // Bills
  {
    pattern:
      'eneco|vattenfall|nuon|essent|ziggo|kpn|t-mobile|vodafone|belasting|waternet',
    categoryId: '00000000-0000-0000-0000-000000000007',
  },
  // Rent/Mortgage
  {
    pattern: 'huur|hypotheek|mortgage|rent|woningbouw|vesteda|ymere',
    categoryId: '00000000-0000-0000-0000-000000000008',
  },
  // Salary
  {
    pattern: 'salaris|salary|loon|uitbetaling|werkgever',
    categoryId: '00000000-0000-0000-0000-000000000009',
  },
  // Subscriptions
  {
    pattern: 'abonnement|subscription|maandelijks|monthly',
    categoryId: '00000000-0000-0000-0000-00000000000b',
  },
  // Food delivery
  {
    pattern: 'thuisbezorgd|just eat|uber eats|deliveroo|gorillas|getir|flink',
    categoryId: '00000000-0000-0000-0000-00000000000d',
  },
];

/**
 * Suggest category based on transaction content
 */
export function suggestCategory(
  transaction: Partial<TransactionCreate>,
  rules: CategoryRule[]
): string | null {
  const text = `${transaction.merchantName || ''} ${transaction.description || ''}`;

  // Check custom rules first
  for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
    const normalizedPattern = normalizeForMatching(rule.pattern);
    const normalizedText = normalizeForMatching(text);

    if (new RegExp(normalizedPattern, 'i').test(normalizedText)) {
      return String(rule.categoryId);
    }
  }

  // Check default patterns
  for (const pattern of defaultCategoryPatterns) {
    const normalizedPattern = normalizeForMatching(pattern.pattern);
    const normalizedText = normalizeForMatching(text);

    if (new RegExp(normalizedPattern, 'i').test(normalizedText)) {
      return pattern.categoryId;
    }
  }

  return null;
}
