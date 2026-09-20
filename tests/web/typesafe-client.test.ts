import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTO_CATEGORY_CONFIDENCE_THRESHOLD,
  suggestCategories,
} from '@/lib/typesafe-client';

describe('TypeSafe category suggestions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('batches transactions and only returns choices strictly above 90%', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: 'jev-latest',
        usage: { input_tokens: 10, output_tokens: 2 },
        answers: {
          transaction_0: {
            type: 'choice',
            choice: 'groceries',
            probabilities: { groceries: 0.9, none: 0.1 },
            confidence: AUTO_CATEGORY_CONFIDENCE_THRESHOLD,
          },
          transaction_1: {
            type: 'choice',
            choice: 'groceries',
            probabilities: { groceries: 0.95, none: 0.05 },
            confidence: 0.95,
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
      { categoryId: 'groceries', confidence: 0.95 },
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
});
