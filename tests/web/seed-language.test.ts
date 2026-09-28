import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDataService } from '../../apps/web/src/lib/data-service';
import * as i18n from '../../apps/web/src/lib/i18n';

function captureSeededRows() {
  const rows = new Map<string, Record<string, unknown>[]>();
  const db = {
    queryAsync: async () => [{ id: 'user' }],
    queryOneAsync: async (sql: string) =>
      sql.includes('FROM profiles')
        ? {
            id: 'profile',
            userId: 'user',
            name: 'Test',
            type: 'personal',
            createdAt: 0,
          }
        : null,
    transactionAsync: async (callback: () => Promise<void>) => callback(),
    runAsync: async (sql: string, params: unknown[] = []) => {
      const insert = sql.match(
        /INSERT(?: OR IGNORE)? INTO (\w+) \(([^)]+)\)\s*VALUES/i
      );
      if (insert) {
        const [, table, columnList] = insert;
        const columns = columnList.split(',').map((column) => column.trim());
        const valueGroup = sql.match(/VALUES\s*\(([^)]+)\)/i);
        if (!valueGroup) throw new Error(`Missing insert values: ${sql}`);
        const slots = valueGroup[1].split(',').map((slot) => slot.trim());
        const parameterCount = slots.filter((slot) => slot === '?').length;
        const tableRows = rows.get(table) ?? [];
        for (let index = 0; index < params.length; index += parameterCount) {
          let parameterIndex = index;
          tableRows.push(
            Object.fromEntries(
              columns.map((column, offset) => [
                column,
                slots[offset] === '?'
                  ? params[parameterIndex++]
                  : Number(slots[offset]),
              ])
            )
          );
        }
        rows.set(table, tableRows);
      }
      return { changes: 1 };
    },
  };
  return { service: createDataService(db as never), rows };
}

afterEach(() => vi.restoreAllMocks());

describe('seeded data language', () => {
  it.each([
    [
      'en',
      'Demo checking account',
      'Demo savings account',
      'Salary',
      'Employer Ltd.',
    ],
    [
      'nl',
      'Demo Betaalrekening',
      'Demo Spaarrekening',
      'Salaris',
      'Werkgever B.V.',
    ],
  ] as const)(
    'creates %s demo records with working categories, budgets, and recurring income',
    async (language, checking, savings, salary, employer) => {
      const { service, rows } = captureSeededRows();
      const result = await service.createDemoData('profile', language);
      expect(rows.get('accounts')?.map((account) => account.name)).toEqual([
        checking,
        savings,
      ]);
      const categories = rows.get('categories') ?? [];
      const salaryCategory = categories.find(
        (category) => category.name === salary
      );
      expect(salaryCategory).toBeDefined();
      expect(result.categories).toBe(categories.length);
      const transactions = rows.get('transactions') ?? [];
      const salaryTransactions = transactions.filter(
        (transaction) => transaction.opposing_account_name === employer
      );
      expect(salaryTransactions.length).toBeGreaterThan(0);
      expect(
        salaryTransactions.every(
          (transaction) =>
            transaction.description === salary &&
            transaction.category_id === salaryCategory?.id &&
            transaction.payment_method === 'transfer'
        )
      ).toBe(true);
      expect(rows.get('budgets')).toHaveLength(5);
      expect(
        transactions.every((transaction) =>
          ['transfer', 'incasso', 'pin', 'iDEAL'].includes(
            String(transaction.payment_method)
          )
        )
      ).toBe(true);
      const uncategorizedNames = new Set([
        'Salon Nova',
        'Bistro Kora',
        'Albert Heijn',
        'Jan de Vries',
        language === 'en' ? 'Jansen family' : 'Familie Jansen',
        language === 'en' ? 'Marktplaats seller' : 'Marktplaats Verkoper',
      ]);
      expect(
        transactions
          .filter((transaction) => transaction.category_id === null)
          .every(
            (transaction) =>
              transaction.type === 'transfer' ||
              uncategorizedNames.has(String(transaction.opposing_account_name))
          )
      ).toBe(true);
      expect(rows.get('recurring_patterns')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ merchant_name: employer }),
        ])
      );
      expect(transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            merchant_name: 'Salon Nova',
            description: language === 'en' ? 'Haircut' : 'Knipbeurt',
            category_id: null,
          }),
          expect.objectContaining({
            merchant_name: 'Bistro Kora',
            description: language === 'en' ? 'Dinner menu' : 'Avondmenu',
            category_id: null,
          }),
          expect.objectContaining({ opposing_account_name: savings }),
        ])
      );
      expect(rows.get('address_book')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: language === 'en' ? 'Jansen family' : 'Familie Jansen',
          }),
          expect.objectContaining({ name: 'Albert Heijn' }),
        ])
      );
    }
  );

  it('uses the currently selected language each time demo data is created', async () => {
    const storedLanguage = vi
      .spyOn(i18n, 'getStoredLanguage')
      .mockReturnValue('en');
    const { service, rows } = captureSeededRows();
    await service.createDemoData('profile');
    expect(rows.get('accounts')?.[0].name).toBe('Demo checking account');

    rows.clear();
    storedLanguage.mockReturnValue('nl');
    await service.createDemoData('profile');
    expect(rows.get('accounts')?.[0].name).toBe('Demo Betaalrekening');
  });

  it('captures the selected language before profile creation starts awaiting database work', async () => {
    const storedLanguage = vi
      .spyOn(i18n, 'getStoredLanguage')
      .mockReturnValue('en');
    const { service, rows } = captureSeededRows();
    const creation = service.createProfile({
      id: 'profile',
      name: 'Test',
      type: 'personal',
    });
    storedLanguage.mockReturnValue('nl');
    await creation;
    expect(rows.get('categories')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Housing & Living' }),
      ])
    );
    expect(
      rows
        .get('categories')
        ?.some((category) => category.name === 'Wonen & Huisvesting')
    ).toBe(false);
  });

  it('uses an explicit first-setup language even when stored language is stale', async () => {
    vi.spyOn(i18n, 'getStoredLanguage').mockReturnValue('nl');
    const { service, rows } = captureSeededRows();
    await service.createProfile({
      id: 'profile',
      name: 'Test',
      type: 'personal',
      language: 'en',
    });
    expect(rows.get('categories')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Housing & Living' }),
      ])
    );
  });
});
