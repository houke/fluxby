import { describe, expect, it } from 'vitest';
import {
  summarizeJudgments,
  percentile,
  type EvaluatedJudgment,
} from '../../scripts/lib/ai-evaluation';
import { buildCategoryRequest } from '../../apps/web/src/lib/typesafe-category-request';
describe('synthetic AI evaluation accounting', () => {
  const rows: EvaluatedJudgment[] = [
    {
      id: '1',
      language: 'en',
      expected: 'food',
      predicted: 'food',
      confidence: 0.9,
    },
    {
      id: '2',
      language: 'nl',
      expected: null,
      predicted: 'food',
      confidence: 0.7,
    },
    {
      id: '3',
      language: 'en',
      expected: 'rent',
      predicted: null,
      confidence: 0.5,
    },
    {
      id: '4',
      language: 'nl',
      expected: null,
      predicted: null,
      confidence: 0,
      error: 'HTTP 503',
    },
    {
      id: '5',
      language: 'en',
      expected: null,
      predicted: null,
      confidence: 0.8,
    },
  ];
  it('counts false actions, service errors, and coverage independently', () => {
    expect(summarizeJudgments(rows, 0.6)).toMatchObject({
      total: 5,
      errors: 1,
      accepted: 2,
      coverage: 0.4,
      precision: 0.5,
      falseActionsOnAmbiguous: 1,
      correctAbstentions: 1,
    });
    expect(summarizeJudgments(rows, 0.8)).toMatchObject({
      accepted: 1,
      precision: 1,
      coverage: 0.2,
    });
  });
  it('does not report perfect accuracy for zero accepted decisions', () => {
    expect(summarizeJudgments([], 0.6)).toMatchObject({
      precision: null,
      coverage: null,
    });
    expect(
      summarizeJudgments([{ ...rows[0], confidence: 1.2 }], 0.6).accepted
    ).toBe(0);
  });
  it('reports request percentiles and shares the production prompt', () => {
    expect(percentile([10, 50, 20], 0.5)).toBe(20);
    expect(percentile([], 0.95)).toBeNull();
    const request = buildCategoryRequest(
      [{ merchantName: 'Café', description: 'Lunch', amount: -20 }],
      [{ id: 'food', name: 'Dining' }]
    );
    expect(request.questions.transaction_0.criteria).toEqual({
      c0: 'Dining',
      none: expect.any(String),
    });
    expect(request.state.transactions[0].amount).toBe(-20);
    expect(JSON.stringify(request)).not.toContain('"id":"food"');
  });
});
