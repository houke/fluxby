import { afterEach, describe, expect, it, vi } from 'vitest';

const { readFromOPFSSyncMock } = vi.hoisted(() => ({
  readFromOPFSSyncMock: vi.fn(),
}));

vi.mock('@fluxby/database', () => ({
  readFromOPFSSync: readFromOPFSSyncMock,
}));

import {
  AUTO_CATEGORY_CONFIDENCE_THRESHOLD,
  askTypeSafe,
  clearTypeSafeTraceEvents,
  getTypeSafeTraceEvents,
  getTypeSafeRequestEndpoint,
  suggestCategories,
} from '@/lib/typesafe-client';

describe('TypeSafe category suggestions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    readFromOPFSSyncMock.mockReset();
    clearTypeSafeTraceEvents();
  });

  it('batches transactions and only returns choices strictly above 70%', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: 'jev-latest',
        usage: { input_tokens: 10, output_tokens: 2 },
        answers: {
          transaction_0: {
            type: 'choice',
            choice: 'c0',
            probabilities: { groceries: 0.7, none: 0.3 },
            confidence: AUTO_CATEGORY_CONFIDENCE_THRESHOLD,
          },
          transaction_1: {
            type: 'choice',
            choice: 'c0',
            probabilities: { groceries: 0.71, none: 0.29 },
            confidence: 0.71,
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await suggestCategories({
      apiKey: 'test-key',
      categories: [{ id: 'groceries', name: 'Groceries' }],
      transactions: [
        { merchantName: 'Unclear shop', description: null, amount: -10 },
        {
          merchantName: 'Supermarket',
          description: 'Weekly shop',
          amount: -42,
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(Object.keys(request.questions)).toEqual([
      'transaction_0',
      'transaction_1',
    ]);
    expect(result).toEqual([
      null,
      { categoryId: 'groceries', confidence: 0.71 },
    ]);
  });

  it('rejects none and unknown category choices', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'jev-latest',
          usage: { input_tokens: 5, output_tokens: 1 },
          answers: {
            transaction_0: {
              type: 'choice',
              choice: 'none',
              probabilities: { none: 0.99 },
              confidence: 0.99,
            },
          },
        }),
      })
    );

    await expect(
      suggestCategories({
        apiKey: 'test-key',
        categories: [{ id: 'travel', name: 'Travel' }],
        transactions: [
          { merchantName: null, description: 'Unknown', amount: -1 },
        ],
      })
    ).resolves.toEqual([null]);
  });

  it('records the request and response locally when the trace is enabled', async () => {
    readFromOPFSSyncMock.mockImplementation((key: string) =>
      key === 'typesafe-ai-trace-enabled' ? true : ''
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'jev-latest',
          usage: { input_tokens: 3, output_tokens: 1 },
          answers: { reachable: { type: 'noul', noul: 1 } },
        }),
      })
    );

    await askTypeSafe(
      { merchant: 'Example merchant' },
      { reachable: { type: 'noul', instructions: 'Is this a test?' } },
      'test-key'
    );

    expect(getTypeSafeTraceEvents()).toHaveLength(1);
    expect(getTypeSafeTraceEvents()[0]).toMatchObject({
      status: 'success',
      request: {
        endpoint: '/typesafe-api/v1/systemone',
        state: { merchant: 'Example merchant' },
      },
      response: { usage: { input_tokens: 3, output_tokens: 1 } },
    });
  });

  it('uses the direct TypeSafe endpoint in Tauri', () => {
    vi.stubGlobal('window', { __TAURI__: true });

    expect(getTypeSafeRequestEndpoint()).toBe(
      'https://api.typesafe.ai/v1/systemone'
    );
  });

  it('uses native IPC in Tauri and preserves HTTP errors without browser fetch', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue({ status: 401, body: 'invalid key' });
    const fetch = vi.fn();
    vi.stubGlobal('window', { __TAURI__: { core: { invoke } } });
    vi.stubGlobal('fetch', fetch);
    await expect(
      askTypeSafe(
        {},
        { connection: { type: 'noul', instructions: 'Received?' } },
        'test-key'
      )
    ).rejects.toThrow('TypeSafe 401: invalid key');
    expect(fetch).not.toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith(
      'typesafe_request',
      expect.objectContaining({ apiKey: 'test-key' })
    );
    invoke.mockResolvedValue({
      status: 200,
      body: JSON.stringify({
        answers: { connection: { type: 'noul', noul: 1 } },
      }),
    });
    await expect(
      askTypeSafe(
        {},
        { connection: { type: 'noul', instructions: 'Received?' } },
        'test-key'
      )
    ).resolves.toMatchObject({ answers: { connection: { noul: 1 } } });
  });

  const transactions = Array.from({ length: 13 }, (_, index) => ({
    merchantName: String(index),
    description: 'Shop',
    amount: -index,
  }));
  const categories = [
    { id: 'db-groceries', name: 'Groceries' },
    { id: 'db-travel', name: 'Travel' },
  ];
  const respond = (body: string) => {
    const request = JSON.parse(body);
    return {
      ok: true,
      json: async () => ({
        answers: Object.fromEntries(
          request.state.transactions.map(
            (tx: { merchant: string }, index: number) => [
              `transaction_${index}`,
              {
                type: 'choice',
                choice: Number(tx.merchant) % 2 ? 'c1' : 'c0',
                confidence: 0.99,
              },
            ]
          )
        ),
      }),
    };
  };

  it('bounds every batch and preserves transaction order and database category IDs', async () => {
    const fetch = vi
      .fn()
      .mockImplementation((_url, options) =>
        Promise.resolve(respond(options.body))
      );
    vi.stubGlobal('fetch', fetch);
    const results = await suggestCategories({
      transactions,
      categories,
      apiKey: 'test-key',
    });
    expect(
      fetch.mock.calls.map(
        ([, options]) => JSON.parse(options.body).state.transactions.length
      )
    ).toEqual([5, 5, 3]);
    expect(results.map((result) => result?.categoryId)).toEqual(
      transactions.map((_, i) => (i % 2 ? 'db-travel' : 'db-groceries'))
    );
  });

  it('splits token-rejected batches down to successful single items', async () => {
    const fetch = vi.fn().mockImplementation((_url, options) => {
      const count = JSON.parse(options.body).state.transactions.length;
      return Promise.resolve(
        count > 1
          ? {
              ok: false,
              status: 400,
              text: async () =>
                '{"detail":{"error_type":"max_tokens_exceeded"}}',
            }
          : respond(options.body)
      );
    });
    vi.stubGlobal('fetch', fetch);
    const results = await suggestCategories({
      transactions: transactions.slice(0, 3),
      categories,
      apiKey: 'test-key',
    });
    expect(results.map((result) => result?.categoryId)).toEqual([
      'db-groceries',
      'db-travel',
      'db-groceries',
    ]);
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('uses payload size as well as item count to split long descriptions', async () => {
    const fetch = vi
      .fn()
      .mockImplementation((_url, options) =>
        Promise.resolve(respond(options.body))
      );
    vi.stubGlobal('fetch', fetch);
    await suggestCategories({
      transactions: transactions
        .slice(0, 3)
        .map((tx) => ({ ...tx, description: '長'.repeat(2000) })),
      categories,
      apiKey: 'test-key',
    });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('surfaces permanent and single-item token failures without endless retries', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'max_tokens_exceeded',
    });
    vi.stubGlobal('fetch', fetch);
    await expect(
      suggestCategories({
        transactions: transactions.slice(0, 1),
        categories,
        apiKey: 'test-key',
      })
    ).rejects.toThrow('max_tokens_exceeded');
    expect(fetch).toHaveBeenCalledTimes(1);
    fetch.mockClear().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'invalid key',
    });
    await expect(
      suggestCategories({ transactions, categories, apiKey: 'test-key' })
    ).rejects.toThrow('TypeSafe 401');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
