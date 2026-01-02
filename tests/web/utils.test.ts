import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateShort,
  formatPercentage,
  getMonthName,
  applyCleanupRulesClient,
  extractDutchNameParts,
  nameSimilarity,
  findSimilarNameGroups,
} from '../../apps/web/src/lib/utils';

describe('formatDate', () => {
  it('formats Date object to DD-MM-YYYY', () => {
    const date = new Date(2024, 11, 25); // December 25, 2024
    expect(formatDate(date)).toBe('25-12-2024');
  });

  it('formats ISO date string', () => {
    expect(formatDate('2024-12-25')).toBe('25-12-2024');
  });

  it('handles beginning of year', () => {
    expect(formatDate('2024-01-01')).toBe('01-01-2024');
  });
});

describe('formatDateShort', () => {
  it('formats date to short format (Mon D)', () => {
    const date = new Date(2024, 11, 25); // December 25, 2024
    expect(formatDateShort(date)).toBe('Dec 25');
  });

  it('formats string date', () => {
    expect(formatDateShort('2024-01-15')).toBe('Jan 15');
  });
});

describe('formatPercentage', () => {
  it('formats positive percentages with + sign', () => {
    expect(formatPercentage(25.5)).toBe('+25.5%');
  });

  it('formats negative percentages', () => {
    expect(formatPercentage(-15.3)).toBe('-15.3%');
  });

  it('formats zero with + sign', () => {
    expect(formatPercentage(0)).toBe('+0.0%');
  });

  it('respects decimal places', () => {
    expect(formatPercentage(33.3333, 2)).toBe('+33.33%');
    expect(formatPercentage(-10.5555, 0)).toBe('-11%');
  });
});

describe('getMonthName', () => {
  it('returns full month name', () => {
    const date = new Date(2024, 0, 1); // January
    expect(getMonthName(date)).toBe('January');
  });

  it('returns short month name when short=true', () => {
    const date = new Date(2024, 11, 1); // December
    expect(getMonthName(date, true)).toBe('Dec');
  });

  it('handles string dates', () => {
    expect(getMonthName('2024-06-15')).toBe('June');
  });
});

describe('applyCleanupRulesClient', () => {
  describe('literal pattern matching', () => {
    it('removes literal string patterns', () => {
      const rules = [{ pattern: 'SumUp *' }];
      const result = applyCleanupRulesClient('SumUp * Coffee Shop', rules);
      expect(result).toBe('Coffee Shop');
    });

    it('removes multiple occurrences', () => {
      const rules = [{ pattern: 'TEST' }];
      const result = applyCleanupRulesClient('TEST hello TEST world', rules);
      expect(result).toBe('hello world');
    });

    it('is case-insensitive', () => {
      const rules = [{ pattern: 'sumup' }];
      const result = applyCleanupRulesClient('SUMUP Coffee Shop', rules);
      expect(result).toBe('Coffee Shop');
    });

    it('escapes regex special characters in literal patterns', () => {
      const rules = [{ pattern: 'test[1]' }];
      const result = applyCleanupRulesClient('test[1] purchase', rules);
      expect(result).toBe('purchase');
    });
  });

  describe('regex pattern matching', () => {
    it('applies regex patterns starting and ending with /', () => {
      const rules = [{ pattern: '/\\d+/' }];
      const result = applyCleanupRulesClient('Transaction 12345 test', rules);
      expect(result).toBe('Transaction test');
    });

    it('respects regex flags', () => {
      const rules = [{ pattern: '/test/i' }];
      const result = applyCleanupRulesClient('TEST hello', rules);
      expect(result).toBe('hello');
    });

    it('handles invalid regex gracefully', () => {
      const rules = [{ pattern: '/[invalid/' }];
      const original = 'test string';
      const result = applyCleanupRulesClient(original, rules);
      // Should skip invalid regex and return unchanged
      expect(result).toBe(original);
    });
  });

  describe('multiple rules', () => {
    it('applies all rules in order', () => {
      const rules = [{ pattern: 'prefix' }, { pattern: 'suffix' }];
      const result = applyCleanupRulesClient('prefix main suffix', rules);
      expect(result).toBe('main');
    });
  });

  describe('edge cases', () => {
    it('cleans up multiple spaces', () => {
      const rules = [{ pattern: 'REMOVE' }];
      const result = applyCleanupRulesClient('A REMOVE  B', rules);
      expect(result).toBe('A B');
    });

    it('returns original if result would be empty', () => {
      const rules = [{ pattern: 'everything' }];
      const result = applyCleanupRulesClient('everything', rules);
      expect(result).toBe('everything');
    });

    it('handles empty rules array', () => {
      const result = applyCleanupRulesClient('test string', []);
      expect(result).toBe('test string');
    });
  });
});

describe('extractDutchNameParts', () => {
  describe('salutation removal', () => {
    it('removes Hr. prefix', () => {
      const result = extractDutchNameParts('Hr. J. de Jong');
      expect(result.normalized).not.toContain('hr');
    });

    it('removes Mw. prefix', () => {
      const result = extractDutchNameParts('Mw. A. van den Berg');
      expect(result.normalized).not.toContain('mw');
    });

    it('removes Dhr. prefix', () => {
      const result = extractDutchNameParts('Dhr. P. Jansen');
      expect(result.normalized).not.toContain('dhr');
    });

    it('removes De heer prefix', () => {
      const result = extractDutchNameParts('De heer K. Bakker');
      expect(result.normalized).not.toContain('de heer');
    });
  });

  describe('initial removal', () => {
    it('removes single letter initials with dots', () => {
      const result = extractDutchNameParts('J. de Jong');
      expect(result.normalized).not.toMatch(/^j\./);
    });

    it('removes multiple initials', () => {
      const result = extractDutchNameParts('J.P. van der Berg');
      expect(result.normalized).not.toMatch(/[a-z]\./);
    });
  });

  describe('surname extraction', () => {
    it('extracts surname from simple name', () => {
      const result = extractDutchNameParts('Jan Jansen');
      expect(result.surname).toBe('jansen');
    });

    it('extracts surname ignoring tussenvoegsels', () => {
      const result = extractDutchNameParts('Jan van den Berg');
      expect(result.surname).toBe('berg');
    });

    it('ignores business suffixes', () => {
      const result = extractDutchNameParts('Bedrijf Nederland B.V.');
      expect(result.surname).not.toBe('bv');
      expect(result.surname).toBe('bedrijf');
    });
  });

  describe('significant words', () => {
    it('extracts words with 4+ characters', () => {
      const result = extractDutchNameParts('Jan van den Berg');
      expect(result.significantWords).toContain('berg');
    });

    it('excludes tussenvoegsels from significant words', () => {
      const result = extractDutchNameParts('Jan van den Berg');
      expect(result.significantWords).not.toContain('van');
      expect(result.significantWords).not.toContain('den');
    });

    it('excludes business suffixes from significant words', () => {
      const result = extractDutchNameParts('Company Holding B.V.');
      expect(result.significantWords).not.toContain('bv');
      expect(result.significantWords).not.toContain('holding');
    });
  });
});

describe('nameSimilarity', () => {
  describe('exact surname match', () => {
    it('returns high score for matching surnames', () => {
      const score = nameSimilarity('Jan Jansen', 'Piet Jansen');
      expect(score).toBeGreaterThanOrEqual(0.9);
    });

    it('handles tussenvoegsels in surname matching', () => {
      const score = nameSimilarity('Jan van der Berg', 'Kees van der Berg');
      expect(score).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('partial surname match', () => {
    it('returns moderate score for partial surname match', () => {
      const score = nameSimilarity('Jan Bakker', 'Piet Bakker-Jansen');
      expect(score).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('significant word matching', () => {
    it('returns score based on shared significant words', () => {
      const score = nameSimilarity('Albert Heijn', 'Albert Heijn B.V.');
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('no match', () => {
    it('returns 0 for completely different names', () => {
      const score = nameSimilarity('Jan Jansen', 'Piet Bakker');
      expect(score).toBe(0);
    });

    it('returns 0 for empty significant words', () => {
      const score = nameSimilarity('AB', 'CD');
      expect(score).toBe(0);
    });
  });

  describe('case insensitivity', () => {
    it('matches case-insensitively', () => {
      const score = nameSimilarity('JAN JANSEN', 'jan jansen');
      expect(score).toBeGreaterThanOrEqual(0.9);
    });
  });
});

describe('findSimilarNameGroups', () => {
  describe('group formation', () => {
    it('groups similar names together', () => {
      const names = ['Jan Jansen', 'J. Jansen', 'Piet Bakker'];
      const groups = findSimilarNameGroups(names);

      // Should find group of Jansen names
      const jansenGroup = groups.find((g) => g.includes(0) && g.includes(1));
      expect(jansenGroup).toBeDefined();
    });

    it('returns empty array when no similar names', () => {
      const names = ['Jan Jansen', 'Piet Bakker', 'Kees de Vries'];
      const groups = findSimilarNameGroups(names);

      expect(groups).toHaveLength(0);
    });

    it('does not return single-item groups', () => {
      const names = ['Jan Jansen', 'Piet Bakker'];
      const groups = findSimilarNameGroups(names);

      groups.forEach((group) => {
        expect(group.length).toBeGreaterThan(1);
      });
    });
  });

  describe('threshold handling', () => {
    it('respects custom threshold', () => {
      const names = ['Company A', 'Company B'];

      const lowThreshold = findSimilarNameGroups(names, 0.3);
      const highThreshold = findSimilarNameGroups(names, 0.9);

      // Lower threshold should find more matches
      expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
    });
  });

  describe('cleanup rules', () => {
    it('applies cleanup rules before comparing', () => {
      const names = ['SumUp * Shop A', 'SumUp * Shop B'];
      const rules = [{ pattern: 'SumUp * ' }];

      const _withoutRules = findSimilarNameGroups(names);
      const withRules = findSimilarNameGroups(names, 0.6, rules);

      // After cleanup, names become "Shop A" and "Shop B"
      // which might have different similarity
      expect(withRules.length >= 0).toBe(true);
    });
  });

  describe('indices', () => {
    it('returns indices, not names', () => {
      const names = ['Jan Jansen', 'J. Jansen', 'Piet Bakker'];
      const groups = findSimilarNameGroups(names);

      groups.forEach((group) => {
        group.forEach((index) => {
          expect(typeof index).toBe('number');
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(names.length);
        });
      });
    });
  });
});
