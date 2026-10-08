import type { Transaction } from '@fluxby/shared';

export interface TransactionView {
  search: string;
  type: 'all' | 'income' | 'expense' | 'transfer';
  startDate: string;
  endDate: string;
  categories: string[];
  ibans: string[];
  accountName: string | null;
  addressBookId: string | null;
  methods: string[];
  providers: string[];
  compact: boolean;
}
export interface MatchingRule {
  id: string;
  pattern: string;
  categoryId: string;
  priority: number;
}
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function matchesCategoryRule(pattern: string, text: string): boolean {
  try {
    return new RegExp(normalize(pattern), 'i').test(normalize(text));
  } catch {
    return false;
  }
}
export function findMatchingRule(
  tx: Pick<Transaction, 'merchantName' | 'description'> & {
    opposingAccountName?: string | null;
  },
  rules: MatchingRule[]
): MatchingRule | null {
  const text = `${tx.merchantName || ''} ${tx.description || ''} ${tx.opposingAccountName || ''}`;
  for (const rule of [...rules].sort(
    (a, b) => b.priority - a.priority || a.id.localeCompare(b.id)
  )) {
    if (matchesCategoryRule(rule.pattern, text)) return rule;
  }
  return null;
}
