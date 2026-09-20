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
            choice: 'groceries',
            probabilities: { groceries: 0.7, none: 0.3 },
            confidence: AUTO_CATEGORY_CONFIDENCE_THRESHOLD,
          },
          transaction_1: {
            type: 'choice',
            choice: 'groceries',
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
        endpoint: 'https://api.typesafe.ai/v1/systemone',
        state: { merchant: 'Example merchant' },
      },
      response: { usage: { input_tokens: 3, output_tokens: 1 } },
    });
  });
});
