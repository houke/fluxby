import { query } from '../db/index.js';
import type { CategoryRule, TransactionCreate } from '@fluxby/shared';

interface DBCategoryRule {
  id: number;
  pattern: string;
  category_id: number;
  priority: number;
  created_at: string;
}

/**
 * Normalize a string for accent-insensitive matching
 * Converts accented characters to their base form (é -> e, ü -> u, etc.)
 */
function normalizeForMatching(text: string): string {
  return text
    .normalize('NFD') // Decompose accented characters (é -> e + combining accent)
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .toLowerCase();
}

export function getCategoryRules(profileId: number = 1): CategoryRule[] {
  const rows = query<DBCategoryRule>(
    'SELECT * FROM category_rules WHERE profile_id = ? ORDER BY priority DESC',
    [profileId]
  );

  return rows.map((row) => ({
    id: row.id,
    pattern: row.pattern,
    categoryId: row.category_id,
    priority: row.priority,
    createdAt: row.created_at,
  }));
}

export function applyCategoryRules(
  transactions: TransactionCreate[],
  profileId: number = 1
): TransactionCreate[] {
  const rules = getCategoryRules(profileId);

  return transactions.map((transaction) => {
    // Skip if already categorized
    if (transaction.categoryId) return transaction;

    // Try to match against rules
    for (const rule of rules) {
      // Normalize both pattern and text for accent-insensitive, case-insensitive matching
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

// Default category patterns for common Dutch merchants/transactions
export const defaultCategoryPatterns: Array<{
  pattern: string;
  categoryId: number;
}> = [
  // Groceries (categoryId: 1)
  {
    pattern:
      'albert heijn|ah |jumbo|lidl|aldi|plus |dirk|vomar|hoogvliet|coop |spar ',
    categoryId: 1,
  },

  // Dining (categoryId: 2)
  {
    pattern:
      'restaurant|cafe|coffee|starbucks|mcdonalds|burger king|kfc|dominos|thuisbezorgd|uber eats|deliveroo',
    categoryId: 2,
  },

  // Transport (categoryId: 3)
  {
    pattern:
      'ns-|ns reizen|ov-chipkaart|shell|bp |esso|total |q8|tinq|tango|parking|parkeren|anwb|9292',
    categoryId: 3,
  },

  // Shopping (categoryId: 4)
  {
    pattern:
      'bol.com|amazon|coolblue|mediamarkt|h&m|zara|primark|action|hema|ikea|blokker|kruidvat|etos',
    categoryId: 4,
  },

  // Entertainment (categoryId: 5)
  {
    pattern:
      'netflix|spotify|disney|pathe|vue|kinepolis|playstation|xbox|steam|nintendo|bioscoop',
    categoryId: 5,
  },

  // Health (categoryId: 6)
  {
    pattern:
      'apotheek|pharmacy|huisarts|tandarts|ziekenhuis|fysio|sportschool|basic-fit|fit for free',
    categoryId: 6,
  },

  // Bills & Utilities (categoryId: 7)
  {
    pattern:
      'vattenfall|eneco|essent|greenchoice|ziggo|kpn|t-mobile|vodafone|tele2|gemeente|belastingdienst|water',
    categoryId: 7,
  },

  // Rent/Mortgage (categoryId: 8)
  {
    pattern: 'huur|hypotheek|woningbouw|vestia|ymere|woonzorg|rabobank hypothe',
    categoryId: 8,
  },

  // Salary (categoryId: 9)
  { pattern: 'salaris|salary|loon|wages|werkgever|employer', categoryId: 9 },

  // Subscriptions (categoryId: 11)
  {
    pattern: 'subscription|abonnement|maandelijks|monthly|recurring',
    categoryId: 11,
  },
];

export function initializeDefaultRules(): void {
  const existingRules = getCategoryRules();

  if (existingRules.length === 0) {
    const { run } = require('../db/index.js');

    defaultCategoryPatterns.forEach((rule, index) => {
      run(
        'INSERT INTO category_rules (pattern, category_id, priority) VALUES (?, ?, ?)',
        [rule.pattern, rule.categoryId, 100 - index]
      );
    });

    console.warn('Default category rules initialized');
  }
}
