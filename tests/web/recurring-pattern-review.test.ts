import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readFromOPFSSyncMock, askTypeSafeMock, getTypeSafeApiKeyMock } =
  vi.hoisted(() => ({
    readFromOPFSSyncMock: vi.fn(),
    askTypeSafeMock: vi.fn(),
    getTypeSafeApiKeyMock: vi.fn(),
  }));

vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: vi.fn(() => true),
  readFromOPFSSync: readFromOPFSSyncMock,
}));

vi.mock('../../apps/web/src/lib/typesafe-client', () => ({
  askTypeSafe: askTypeSafeMock,
  detectDateFormat: vi.fn(),
  detectDirectionConvention: vi.fn(),
  detectIsPaymentProvider: vi.fn(),
  getTypeSafeApiKey: getTypeSafeApiKeyMock,
  suggestCategories: vi.fn(),
}));

import { createDataService } from '../../apps/web/src/lib/data-service';
import { addMonthsToDateOnly, formatDateISO } from '@fluxby/shared';

const PROFILE_ID = 'profile-recurring-test';

function createMockDb(
  queryHandler: (sql: string) => unknown[] = () => [],
  queryOneHandler: (sql: string) => unknown = () => null
) {
  return {
    queryAsync: vi.fn(async (sql: string) => queryHandler(sql)),
    queryOneAsync: vi.fn(async (sql: string) => queryOneHandler(sql)),
    runAsync: vi.fn(async () => ({ changes: 1 })),
    transactionAsync: vi.fn(async (fn: () => Promise<unknown>) => fn()),
  };
}

describe('subscription pattern review and stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'window', {
      value: {},
      configurable: true,
      writable: true,
    });
    readFromOPFSSyncMock.mockReturnValue(PROFILE_ID);
    getTypeSafeApiKeyMock.mockReturnValue('test-key');
  });

  it.each([
    {
      scenario: 'merchant name changes while the IBAN and amount stay the same',
      transactionName: 'new provider name',
      transactionIban: 'NL00TESTIBAN',
      transactionAmount: -10,
    },
    {
      scenario: 'amount changes while the merchant name and IBAN stay the same',
      transactionName: 'old provider name',
      transactionIban: 'NL00TESTIBAN',
      transactionAmount: -15,
    },
    {
      scenario: 'IBAN changes while the merchant name and amount stay the same',
      transactionName: 'old provider name',
      transactionIban: 'NL00NEWIBAN',
      transactionAmount: -10,
    },
  ])('asks Jev to match when $scenario', async (scenario) => {
    const pattern = {
      id: 'pattern-1',
      opposing_iban: 'NL00TESTIBAN',
      merchant_name: 'old provider name',
      pattern_type: 'monthly',
      avg_amount: -10,
      last_amount: -10,
      last_date: '2026-05-01',
      next_expected_date: '2026-06-01',
      transaction_count: 6,
      is_confirmed: 1,
    };
    const transaction = {
      id: 'transaction-new',
      date: '2026-06-01',
      amount: scenario.transactionAmount,
      description: scenario.transactionName,
      merchant_name: scenario.transactionName,
      opposing_account_name: scenario.transactionName,
      opposing_iban: scenario.transactionIban,
    };
    const db = createMockDb((sql) => {
      if (sql.includes('FROM recurring_pattern_source_decisions')) return [];
      if (sql.includes('FROM recurring_patterns')) return [pattern];
      if (sql.includes('FROM transactions t')) return [transaction];
      throw new Error(`Unexpected query: ${sql}`);
    });
    askTypeSafeMock.mockResolvedValue({
      answers: {
        source_0: {
          type: 'choice',
          choice: 'subscription_0',
          confidence: 0.92,
        },
      },
    });

    const suggestions = await createDataService(
      db as never
    ).findRecurringPatternSourceSuggestions();

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      sourceIban: scenario.transactionIban,
      sourceMerchantName: scenario.transactionName,
      paymentCount: 1,
      targetPattern: { id: 'pattern-1' },
      confidence: 0.92,
    });
    expect(askTypeSafeMock).toHaveBeenCalledTimes(1);
  });

  it('keeps a material new price change for Jev instead of updating the existing pattern', async () => {
    const firstPaymentDate = addMonthsToDateOnly(
      formatDateISO(new Date()),
      -12
    );
    const payments = Array.from({ length: 7 }, (_, index) => ({
      id: `transaction-${index}`,
      opposing_iban: 'NL00TESTIBAN',
      merchant_name: 'sample provider',
      date: addMonthsToDateOnly(firstPaymentDate, index),
      amount: index === 6 ? -110 : -100,
    }));
    const existingPattern = {
      id: 'pattern-1',
      merchant_name: 'sample provider',
      is_dismissed: 0,
      avg_amount: -100,
      last_amount: -100,
      last_date: payments[5].date,
      opposing_iban: 'NL00TESTIBAN',
    };
    getTypeSafeApiKeyMock.mockReturnValue(null);
    const db = createMockDb((sql) => {
      if (sql.includes('FROM recurring_pattern_source_decisions')) return [];
      if (sql.includes('FROM recurring_patterns')) return [existingPattern];
      if (sql.includes('FROM transactions t')) return payments;
      throw new Error(`Unexpected query: ${sql}`);
    });

    const result = await createDataService(
      db as never
    ).detectRecurringPatterns();

    expect(result).toEqual({ detected: 0, updated: 0 });
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  it('persists an accepted source and closes its matching unconfirmed duplicate', async () => {
    const db = createMockDb(
      (sql) => {
        if (sql.includes('FROM recurring_patterns')) {
          return [
            {
              id: 'target-pattern',
              opposing_iban: 'NL00OLDIBAN',
              merchant_name: 'old provider',
              is_confirmed: 1,
            },
            {
              id: 'duplicate-pattern',
              opposing_iban: 'NL00NEWIBAN',
              merchant_name: 'new provider',
              is_confirmed: 0,
            },
          ];
        }
        return [];
      },
      (sql) => {
        if (sql.includes('SELECT id FROM recurring_patterns')) {
          return { id: 'target-pattern' };
        }
        return null;
      }
    );

    await createDataService(db as never).decideRecurringPatternSource({
      patternId: 'target-pattern',
      sourceIban: 'nl00newiban',
      sourceMerchantName: 'New Provider',
      decision: 'accepted',
    });

    expect(db.transactionAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledTimes(2);
    expect(db.runAsync.mock.calls[0][0]).toContain(
      'INSERT INTO recurring_pattern_source_decisions'
    );
    expect(db.runAsync.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        'target-pattern',
        'NL00NEWIBAN',
        'new provider',
        'accepted',
      ])
    );
    expect(db.runAsync.mock.calls[1][0]).toContain('SET is_dismissed = 1');
    expect(db.runAsync.mock.calls[1][1]).toEqual(
      expect.arrayContaining(['duplicate-pattern', PROFILE_ID])
    );
  });

  it('keeps pending patterns out of confirmed counts and spending KPIs', async () => {
    const rows = [
      {
        id: 'confirmed-active',
        pattern_type: 'monthly',
        avg_amount: -30,
        last_date: '2024-12-01',
        is_active: 1,
        is_confirmed: 1,
      },
      {
        id: 'pending-active',
        pattern_type: 'monthly',
        avg_amount: -10,
        last_date: '2024-12-01',
        is_active: 1,
        is_confirmed: 0,
      },
      {
        id: 'confirmed-inactive',
        pattern_type: 'monthly',
        avg_amount: -80,
        last_date: '2024-12-01',
        is_active: 0,
        is_confirmed: 1,
      },
    ];
    const db = createMockDb((sql) => {
      if (sql.includes('FROM recurring_patterns')) return rows;
      throw new Error(`Unexpected query: ${sql}`);
    });

    const stats = await createDataService(db as never).getRecurringStats(
      '2025-01-01',
      '2025-01-31'
    );

    expect(stats).toEqual({
      totalMonthlySpend: -30,
      activeSubscriptions: 1,
      confirmedSubscriptions: 1,
      pendingConfirmation: 1,
      expectedPeriodExpenses: 30,
    });
  });
});
