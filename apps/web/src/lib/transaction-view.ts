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
const date = /^\d{4}-\d{2}-\d{2}$/;
const types = new Set(['all', 'income', 'expense', 'transfer']);
export function encodeTransactionView(
  view: TransactionView
): Record<string, string> {
  return { version: '1', view: JSON.stringify(view) };
}
export function decodeTransactionView(
  filters: Record<string, string>
): TransactionView | null {
  try {
    if (filters.version !== '1' || filters.view.length > 20000) return null;
    const value = JSON.parse(filters.view) as TransactionView;
    if (
      !value ||
      typeof value.search !== 'string' ||
      value.search.length > 2000 ||
      !types.has(value.type) ||
      !date.test(value.startDate) ||
      !date.test(value.endDate) ||
      value.startDate > value.endDate ||
      typeof value.compact !== 'boolean'
    )
      return null;
    for (const key of [
      'categories',
      'ibans',
      'methods',
      'providers',
    ] as const) {
      if (
        !Array.isArray(value[key]) ||
        value[key].length > 1000 ||
        value[key].some((item) => typeof item !== 'string' || item.length > 256)
      )
        return null;
    }
    for (const key of ['accountName', 'addressBookId'] as const) {
      if (value[key] !== null && typeof value[key] !== 'string') return null;
    }
    for (const key of ['startDate', 'endDate'] as const) {
      const parsed = new Date(`${value[key]}T12:00:00`);
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== Number(value[key].slice(0, 4)) ||
        parsed.getMonth() + 1 !== Number(value[key].slice(5, 7)) ||
        parsed.getDate() !== Number(value[key].slice(8))
      )
        return null;
    }
    return value;
  } catch {
    return null;
  }
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
