import { describe, expect, it } from 'vitest';
import { getAccountFreshnessStatus } from '@/lib/importers/account-freshness';

describe('account statement freshness', () => {
  const now = Date.parse('2026-10-02T00:00:00Z');
  const imported = (date: string) => ({
    lastImportedAt: now,
    newestTransactionDate: date,
  });
  it('uses both statement coverage and import age at the inclusive day boundaries', () => {
    expect(getAccountFreshnessStatus(imported('2026-09-25'), now)).toBe(
      'fresh'
    );
    expect(getAccountFreshnessStatus(imported('2026-09-24'), now)).toBe(
      'aging'
    );
    expect(getAccountFreshnessStatus(imported('2026-09-02'), now)).toBe(
      'aging'
    );
    expect(getAccountFreshnessStatus(imported('2026-09-01'), now)).toBe(
      'stale'
    );
    expect(
      getAccountFreshnessStatus(
        {
          lastImportedAt: Date.parse('2026-09-01T00:00:00Z'),
          newestTransactionDate: '2026-10-02',
        },
        now
      )
    ).toBe('stale');
  });
  it('does not call a newly uploaded old statement fresh', () => {
    expect(getAccountFreshnessStatus(imported('2020-01-01'), now)).toBe(
      'stale'
    );
    expect(
      getAccountFreshnessStatus(
        { lastImportedAt: null, newestTransactionDate: '2026-10-02' },
        now
      )
    ).toBe('never');
    expect(getAccountFreshnessStatus(imported('invalid'), now)).toBe('stale');
  });
  it('counts calendar days consistently across the Dutch daylight-saving boundary', () => {
    const afterDst = Date.parse('2026-10-26T00:00:00Z');
    expect(
      getAccountFreshnessStatus(
        { lastImportedAt: afterDst, newestTransactionDate: '2026-10-19' },
        afterDst
      )
    ).toBe('fresh');
    expect(
      getAccountFreshnessStatus(
        { lastImportedAt: afterDst, newestTransactionDate: '2026-10-18' },
        afterDst
      )
    ).toBe('aging');
  });
});
