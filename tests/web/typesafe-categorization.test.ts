import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readFromOPFSSyncMock, suggestCategoriesMock } = vi.hoisted(() => ({
  readFromOPFSSyncMock: vi.fn(),
  suggestCategoriesMock: vi.fn(),
}));

vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: vi.fn(() => true),
  readFromOPFSSync: readFromOPFSSyncMock,
}));

vi.mock('../../apps/web/src/lib/typesafe-client', () => ({
  askTypeSafe: vi.fn(),
  detectDateFormat: vi.fn(),
  detectDirectionConvention: vi.fn(),
  detectIsPaymentProvider: vi.fn(),
  getTypeSafeApiKey: vi.fn(() => 'test-key'),
  suggestCategories: suggestCategoriesMock,
}));

import { createDataService } from '../../apps/web/src/lib/data-service';
import { getTypeSafeApiKey } from '../../apps/web/src/lib/typesafe-client';

const PROFILE_ID = '00000000-0000-0000-0000-000000000001';

function createLegacyTauriFixture(
  rules: { pattern: string; category_id: string; priority: number }[] = []
) {
  Object.defineProperty(globalThis, 'window', {
    value: {},
    configurable: true,
    writable: true,
  });
  readFromOPFSSyncMock.mockReturnValue(PROFILE_ID);

  const category = { id: 'category-groceries', name: 'Groceries' };
  const transaction = {
    id: 'transaction-1',
    merchant_name: 'Legacy supermarket',
    description: 'Legacy supermarket',
    opposing_account_name: 'Legacy supermarket',
    amount: -12,
  };
  const db = {
    queryAsync: vi.fn(async (sql: string) => {
      if (sql.includes('FROM category_rules')) return rules;
      if (sql.includes('transaction_count')) {
        return [
          {
            merchant: transaction.merchant_name,
            description: transaction.description,
            amount: transaction.amount,
            transaction_count: 2,
          },
        ];
      }
      if (sql.includes('SELECT id, name FROM categories')) return [category];
      if (sql.includes('SELECT t.id, t.merchant_name')) {
        return [transaction];
      }
      throw new Error(`Unexpected query: ${sql}`);
    }),
    queryOneAsync: vi.fn().mockResolvedValue({ category_id: category.id }),
    runAsync: vi.fn().mockResolvedValue({ changes: 1 }),
    transactionAsync: vi.fn(async (fn: () => Promise<void>) => fn()),
  };
  const dataService = createDataService(db as never);

  return { db, dataService, category };
}

describe('Tauri TypeSafe categorisation database gates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    suggestCategoriesMock.mockResolvedValue([
      { categoryId: 'category-placeholder', confidence: 0.99 },
    ]);
  });

  it('still applies deterministic category rules without a Jev key', async () => {
    vi.mocked(getTypeSafeApiKey).mockReturnValueOnce('');
    const { db, dataService, category } = createLegacyTauriFixture([
      {
        pattern: 'Legacy supermarket',
        category_id: 'category-groceries',
        priority: 0,
      },
    ]);

    const result = await dataService.applyCategoriesToUncategorized();

    expect(result).toMatchObject({ rulesApplied: 1, aiApplied: 0 });
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE transactions SET category_id'),
      expect.arrayContaining([category.id])
    );
    expect(suggestCategoriesMock).not.toHaveBeenCalled();
  });

  it('sends uncategorised legacy rows to Jev even without transaction profile_id', async () => {
    const { db, dataService, category } = createLegacyTauriFixture();
    suggestCategoriesMock.mockResolvedValue([
      { categoryId: category.id, confidence: 0.99 },
    ]);

    const result = await dataService.applyCategoriesToUncategorized();

    const uncategorizedQuery = db.queryAsync.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' && sql.includes('SELECT t.id, t.merchant_name')
    )?.[0] as string;
    expect(uncategorizedQuery).toContain(
      '(a.profile_id = ? OR t.profile_id = ?)'
    );
    expect(uncategorizedQuery).toContain(
      "TRIM(CAST(t.category_id AS TEXT)) = ''"
    );
    expect(suggestCategoriesMock).toHaveBeenCalledTimes(1);
    expect(result.aiApplied).toBe(1);
  });

  it('discovers rules for legacy rows scoped through their account', async () => {
    const { db, dataService, category } = createLegacyTauriFixture();
    suggestCategoriesMock.mockResolvedValue([
      { categoryId: category.id, confidence: 0.99 },
    ]);

    const result = await dataService.discoverCategoryRulesWithAI();

    const candidateQuery = db.queryAsync.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('transaction_count')
    )?.[0] as string;
    expect(candidateQuery).toContain('(a.profile_id = ? OR t.profile_id = ?)');
    expect(candidateQuery).toContain("TRIM(CAST(t.category_id AS TEXT)) = ''");
    expect(suggestCategoriesMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ created: 1, categorized: 1, reviewed: 1 });
  });
});
