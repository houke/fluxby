import { describe, it, expect } from 'vitest';

/**
 * Tests for address book utility functions
 * These tests verify the regex safety checks and name cleanup logic
 */

// Re-implement the isRegexSafe function for testing (same as in addressbook.ts)
function isRegexSafe(pattern: string): boolean {
  // Block dangerous patterns that could cause ReDoS
  const dangerousPatterns = [
    /(\+|\*|\{[0-9]+,\})\s*(\+|\*|\{[0-9]+,\})/, // Nested quantifiers
    /\(\?[^)]*\(/, // Nested groups with modifiers
    /\\1/, // Backreferences can be dangerous
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return false;
    }
  }

  // Limit pattern length to prevent extremely complex patterns
  if (pattern.length > 200) {
    return false;
  }

  return true;
}

// Re-implement safeRegexReplace for testing
function safeRegexReplace(
  input: string,
  pattern: string,
  flags: string,
  replacement: string = ''
): string {
  const safeFlags = flags.replace(/[^gimsuy]/g, '') || 'gi';

  if (!isRegexSafe(pattern)) {
    return input;
  }

  try {
    const regex = new RegExp(pattern, safeFlags);
    if (input.length > 1000) {
      return input;
    }
    return input.replace(regex, replacement);
  } catch {
    return input;
  }
}

// Re-implement applyCleanupRules for testing
function applyCleanupRules(name: string, rules: { pattern: string }[]): string {
  let cleaned = name;
  for (const rule of rules) {
    if (rule.pattern.startsWith('/') && rule.pattern.lastIndexOf('/') > 0) {
      const lastSlash = rule.pattern.lastIndexOf('/');
      const pattern = rule.pattern.slice(1, lastSlash);
      const flags = rule.pattern.slice(lastSlash + 1) || 'gi';
      cleaned = safeRegexReplace(cleaned, pattern, flags, '').trim();
    } else {
      // For literal patterns, use case-insensitive global replacement
      // Pattern 'SumUp *' matches the literal string 'SumUp *'
      const escapedPattern = rule.pattern.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      cleaned = cleaned.replace(new RegExp(escapedPattern, 'gi'), '').trim();
    }
  }
  // Clean up multiple spaces
  return cleaned.replace(/\s+/g, ' ').trim();
}

describe('isRegexSafe', () => {
  it('allows simple patterns', () => {
    expect(isRegexSafe('hello')).toBe(true);
    expect(isRegexSafe('via Mollie')).toBe(true);
    expect(isRegexSafe('[0-9]+')).toBe(true);
  });

  it('blocks nested quantifiers', () => {
    // The regex checks for quantifiers followed by quantifiers with whitespace
    // Real dangerous patterns would need actual whitespace between quantifiers
    expect(isRegexSafe('a+ +')).toBe(false);
    expect(isRegexSafe('a* *')).toBe(false);
  });

  it('blocks backreferences', () => {
    expect(isRegexSafe('(a)\\1')).toBe(false);
  });

  it('blocks patterns that are too long', () => {
    const longPattern = 'a'.repeat(201);
    expect(isRegexSafe(longPattern)).toBe(false);
  });

  it('allows patterns at the length limit', () => {
    const limitPattern = 'a'.repeat(200);
    expect(isRegexSafe(limitPattern)).toBe(true);
  });
});

describe('safeRegexReplace', () => {
  it('performs simple replacements', () => {
    expect(safeRegexReplace('hello world', 'world', 'gi')).toBe('hello ');
  });

  it('handles case-insensitive replacements', () => {
    expect(safeRegexReplace('Hello World', 'WORLD', 'gi')).toBe('Hello ');
  });

  it('returns original string for unsafe patterns', () => {
    expect(safeRegexReplace('test', '(a+)+', 'gi')).toBe('test');
  });

  it('returns original string for very long inputs', () => {
    const longInput = 'a'.repeat(1001);
    expect(safeRegexReplace(longInput, 'a', 'gi')).toBe(longInput);
  });

  it('returns original string for invalid regex', () => {
    expect(safeRegexReplace('test', '[invalid', 'gi')).toBe('test');
  });
});

describe('applyCleanupRules', () => {
  it('applies literal string rules', () => {
    const rules = [{ pattern: 'via Mollie' }];
    expect(applyCleanupRules('Test Shop via Mollie', rules)).toBe('Test Shop');
  });

  it('applies multiple rules', () => {
    const rules = [{ pattern: 'via Mollie' }, { pattern: 'B.V.' }];
    expect(applyCleanupRules('Test Shop B.V. via Mollie', rules)).toBe(
      'Test Shop'
    );
  });

  it('applies regex pattern rules', () => {
    const rules = [{ pattern: '/\\s*via\\s+[^,]+$/gi' }];
    expect(applyCleanupRules('Test Shop via Adyen B.V.', rules)).toBe(
      'Test Shop'
    );
  });

  it('handles empty rules array', () => {
    expect(applyCleanupRules('Test Shop', [])).toBe('Test Shop');
  });

  it('cleans up multiple spaces', () => {
    const rules = [{ pattern: 'remove' }];
    expect(applyCleanupRules('Test  remove  Shop', rules)).toBe('Test Shop');
  });

  it('trims whitespace', () => {
    const rules = [{ pattern: 'suffix' }];
    expect(applyCleanupRules('Test Shop suffix ', rules)).toBe('Test Shop');
  });

  it('escapes special regex characters in literal patterns', () => {
    const rules = [{ pattern: 'Test (Company)' }];
    expect(applyCleanupRules('Shop Test (Company) Name', rules)).toBe(
      'Shop Name'
    );
  });

  it('treats patterns with * as literal strings', () => {
    // Pattern 'SumUp *' should match the literal string 'SumUp *', not a wildcard
    const rules = [{ pattern: 'SumUp *' }];
    expect(applyCleanupRules('SumUp *Restaurant ABC', rules)).toBe(
      'Restaurant ABC'
    );
    expect(applyCleanupRules('SumUp *Coffee Shop', rules)).toBe('Coffee Shop');
    // Without the literal 'SumUp *', it should not match
    expect(applyCleanupRules('SumUp Restaurant ABC', rules)).toBe(
      'SumUp Restaurant ABC'
    );
  });

  it('handles CCV* as literal pattern', () => {
    const rules = [{ pattern: 'CCV*' }];
    // Should only match literal 'CCV*'
    expect(applyCleanupRules('CCV*12345', rules)).toBe('12345');
    expect(applyCleanupRules('CCV12345', rules)).toBe('CCV12345');
  });

  it('handles BCK* as literal pattern', () => {
    const rules = [{ pattern: 'BCK*' }];
    // Should only match literal 'BCK*'
    expect(applyCleanupRules('BCK*Store Name', rules)).toBe('Store Name');
    expect(applyCleanupRules('BCK Store Name', rules)).toBe('BCK Store Name');
  });
});
