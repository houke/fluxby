import { describe, it, expect } from 'vitest';
import {
  buildRecurringPatternFromTemplate,
  DemoRecurringPatternTemplate,
} from '../../packages/shared/src/recurring-seed';

describe('buildRecurringPatternFromTemplate', () => {
  const template: DemoRecurringPatternTemplate = {
    merchantName: 'Netflix',
    patternType: 'monthly',
    avgAmount: -12.99,
    lastAmount: -12.99,
    isConfirmed: true,
    isVariable: false,
    transactionCount: 5,
  };

  it('prefers latest transaction when provided', () => {
    const latestTx = { date: '2025-12-15', amount: -13.5 };
    const out = buildRecurringPatternFromTemplate(
      template,
      latestTx,
      new Date('2025-12-20')
    );
    expect(out.lastAmount).toBe(-13.5);
    expect(out.lastDate).toBe('2025-12-15');
    // nextExpectedDate should be one month after lastDate
    expect(out.nextExpectedDate).toBe('2026-01-15');
  });

  it('falls back to template and previous month day 3 when no tx', () => {
    const ref = new Date('2025-12-20');
    const out = buildRecurringPatternFromTemplate(template, undefined, ref);
    // expects lastDate -> 2025-11-03
    expect(out.lastDate).toBe('2025-11-03');
    expect(out.lastAmount).toBe(template.lastAmount);
    // nextExpectedDate should be 2025-12-03
    expect(out.nextExpectedDate).toBe('2025-12-03');
  });
});
