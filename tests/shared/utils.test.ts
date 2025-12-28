import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  parseEuropeanNumber,
  formatDate,
  formatDateISO,
  parseINGDate,
  formatPercentage,
  getMonthName,
  generateTransactionHash,
  truncate,
  calculatePercentageChange,
  groupBy,
} from '@fluxby/shared';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    const result = formatCurrency(1234.56);
    // Uses non-breaking space and nl-NL format
    expect(result).toContain('1.234,56');
    expect(result).toContain('€');
  });

  it('formats negative numbers correctly', () => {
    const result = formatCurrency(-1234.56);
    expect(result).toContain('1.234,56');
    expect(result).toContain('€');
    expect(result).toContain('-');
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
    expect(result).toContain('€');
  });

  it('formats small decimals correctly', () => {
    const result = formatCurrency(0.01);
    expect(result).toContain('0,01');
    expect(result).toContain('€');
  });

  it('formats large numbers correctly', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toContain('1.234.567,89');
    expect(result).toContain('€');
  });
});

describe('parseEuropeanNumber', () => {
  it('parses positive European formatted numbers', () => {
    expect(parseEuropeanNumber('1.234,56')).toBe(1234.56);
  });

  it('parses negative European formatted numbers', () => {
    expect(parseEuropeanNumber('-1.234,56')).toBe(-1234.56);
  });

  it('handles null/undefined', () => {
    expect(parseEuropeanNumber(null)).toBe(0);
    expect(parseEuropeanNumber(undefined)).toBe(0);
  });

  it('handles empty string', () => {
    expect(parseEuropeanNumber('')).toBe(0);
  });

  it('handles numbers without thousand separators', () => {
    expect(parseEuropeanNumber('123,45')).toBe(123.45);
  });
});

describe('formatDate', () => {
  it('formats Date object correctly', () => {
    const date = new Date(2024, 11, 25); // December 25, 2024
    expect(formatDate(date)).toBe('25-12-2024');
  });

  it('formats date string correctly', () => {
    expect(formatDate('2024-12-25')).toBe('25-12-2024');
  });
});

describe('formatDateISO', () => {
  it('formats Date object to ISO format', () => {
    // Use UTC to avoid timezone issues
    const date = new Date(Date.UTC(2024, 0, 5, 12, 0, 0)); // January 5, 2024 at noon UTC
    const result = formatDateISO(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
  });

  it('handles today correctly', () => {
    const today = new Date();
    const result = formatDateISO(today);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Should have today's components
    expect(result).toContain(String(today.getFullYear()));
  });
});

describe('parseINGDate', () => {
  it('parses ING date format (YYYYMMDD)', () => {
    const result = parseINGDate('20241225');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(11); // December = 11
    expect(result.getDate()).toBe(25);
  });

  it('parses beginning of month', () => {
    const result = parseINGDate('20240101');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });
});

describe('formatPercentage', () => {
  it('formats positive percentages with + sign', () => {
    expect(formatPercentage(25.5)).toBe('+25.5%');
  });

  it('formats negative percentages', () => {
    expect(formatPercentage(-15.3)).toBe('-15.3%');
  });

  it('formats zero', () => {
    expect(formatPercentage(0)).toBe('+0.0%');
  });

  it('respects decimal places', () => {
    expect(formatPercentage(33.3333, 2)).toBe('+33.33%');
  });
});

describe('getMonthName', () => {
  it('returns full month name', () => {
    const date = new Date(2024, 0, 1); // January
    expect(getMonthName(date)).toBe('January');
  });

  it('returns short month name', () => {
    const date = new Date(2024, 11, 1); // December
    expect(getMonthName(date, true)).toBe('Dec');
  });
});

describe('generateTransactionHash', () => {
  it('generates consistent hashes for same input', () => {
    const hash1 = generateTransactionHash(
      '2024-01-01',
      100,
      'Test',
      'NL00TEST'
    );
    const hash2 = generateTransactionHash(
      '2024-01-01',
      100,
      'Test',
      'NL00TEST'
    );
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different inputs', () => {
    const hash1 = generateTransactionHash(
      '2024-01-01',
      100,
      'Test',
      'NL00TEST'
    );
    const hash2 = generateTransactionHash(
      '2024-01-02',
      100,
      'Test',
      'NL00TEST'
    );
    expect(hash1).not.toBe(hash2);
  });

  it('returns a hex string', () => {
    const hash = generateTransactionHash('2024-01-01', 100, 'Test', 'NL00TEST');
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe('truncate', () => {
  it('returns original text if shorter than max length', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates with ellipsis if longer than max length', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('calculatePercentageChange', () => {
  it('calculates positive change correctly', () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
  });

  it('calculates negative change correctly', () => {
    expect(calculatePercentageChange(50, 100)).toBe(-50);
  });

  it('handles zero previous value', () => {
    expect(calculatePercentageChange(100, 0)).toBe(100);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });

  it('calculates change from negative values', () => {
    // From -100 to -50 is a 50% increase (less negative = improvement)
    expect(calculatePercentageChange(-50, -100)).toBe(50);
  });
});

describe('groupBy', () => {
  it('groups array by key', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'A', value: 3 },
    ];
    const result = groupBy(data, 'category');
    expect(result.A).toHaveLength(2);
    expect(result.B).toHaveLength(1);
  });

  it('handles empty array', () => {
    const result = groupBy([], 'key' as never);
    expect(result).toEqual({});
  });
});
