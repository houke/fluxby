import { describe, it, expect } from 'vitest';
import {
  validateIBAN,
  validateAmount,
  validateDate,
  validateProfileName,
  validateCategoryName,
  validateBudgetAmount,
  combineValidations,
} from '@fluxby/core';

describe('validateIBAN', () => {
  describe('valid IBANs', () => {
    it('accepts empty IBAN (optional field)', () => {
      const result = validateIBAN('');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates Dutch IBANs', () => {
      // This is a valid Dutch IBAN format with correct checksum
      const result = validateIBAN('NL91ABNA0417164300');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates IBANs with spaces', () => {
      const result = validateIBAN('NL91 ABNA 0417 1643 00');
      expect(result.valid).toBe(true);
    });

    it('validates lowercase IBANs', () => {
      const result = validateIBAN('nl91abna0417164300');
      expect(result.valid).toBe(true);
    });

    it('validates German IBANs', () => {
      // German IBAN format
      const result = validateIBAN('DE89370400440532013000');
      expect(result.valid).toBe(true);
    });

    it('validates Belgian IBANs', () => {
      // Belgian IBAN format
      const result = validateIBAN('BE68539007547034');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid IBANs', () => {
    it('rejects too short IBANs', () => {
      const result = validateIBAN('NL91ABNA041');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'IBAN_LENGTH')).toBe(true);
    });

    it('rejects too long IBANs', () => {
      const result = validateIBAN('NL91ABNA0417164300000000000000000000');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'IBAN_LENGTH')).toBe(true);
    });

    it('rejects invalid format (numbers in country code)', () => {
      const result = validateIBAN('11ABNA0417164300');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'IBAN_FORMAT')).toBe(true);
    });

    it('rejects invalid format (letters in check digits)', () => {
      const result = validateIBAN('NLXXABNA0417164300');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'IBAN_FORMAT')).toBe(true);
    });

    it('rejects invalid checksum', () => {
      // Valid format but wrong checksum
      const result = validateIBAN('NL00ABNA0417164300');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'IBAN_CHECKSUM')).toBe(true);
    });

    it('rejects IBANs with special characters', () => {
      const result = validateIBAN('NL91ABNA041716@300');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'IBAN_FORMAT')).toBe(true);
    });
  });
});

describe('validateAmount', () => {
  describe('valid amounts', () => {
    it('accepts positive numbers', () => {
      const result = validateAmount(100.5);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts negative numbers', () => {
      const result = validateAmount(-250.99);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts zero', () => {
      const result = validateAmount(0);
      expect(result.valid).toBe(true);
    });

    it('accepts very small amounts', () => {
      const result = validateAmount(0.01);
      expect(result.valid).toBe(true);
    });

    it('accepts large but reasonable amounts', () => {
      const result = validateAmount(999_999_999);
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid amounts', () => {
    it('rejects NaN', () => {
      const result = validateAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'AMOUNT_NAN')).toBe(true);
    });

    it('rejects positive Infinity', () => {
      const result = validateAmount(Infinity);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'AMOUNT_INFINITE')).toBe(
        true
      );
    });

    it('rejects negative Infinity', () => {
      const result = validateAmount(-Infinity);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'AMOUNT_INFINITE')).toBe(
        true
      );
    });

    it('rejects amounts exceeding positive bounds', () => {
      const result = validateAmount(1_000_000_001);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'AMOUNT_BOUNDS')).toBe(true);
    });

    it('rejects amounts exceeding negative bounds', () => {
      const result = validateAmount(-1_000_000_001);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'AMOUNT_BOUNDS')).toBe(true);
    });
  });
});

describe('validateDate', () => {
  describe('valid dates', () => {
    it('accepts ISO format dates', () => {
      const result = validateDate('2024-12-25');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts beginning of year', () => {
      const result = validateDate('2024-01-01');
      expect(result.valid).toBe(true);
    });

    it('accepts end of year', () => {
      const result = validateDate('2024-12-31');
      expect(result.valid).toBe(true);
    });

    it('accepts leap year date', () => {
      const result = validateDate('2024-02-29');
      expect(result.valid).toBe(true);
    });

    it('accepts dates within reasonable range', () => {
      const result = validateDate('1950-06-15');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid dates', () => {
    it('rejects empty string', () => {
      const result = validateDate('');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DATE_REQUIRED')).toBe(true);
    });

    it('rejects wrong format (DD-MM-YYYY)', () => {
      const result = validateDate('25-12-2024');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DATE_FORMAT')).toBe(true);
    });

    it('rejects wrong format (MM/DD/YYYY)', () => {
      const result = validateDate('12/25/2024');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DATE_FORMAT')).toBe(true);
    });

    it('rejects non-date strings', () => {
      const result = validateDate('not-a-date');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DATE_FORMAT')).toBe(true);
    });

    it('rejects invalid day (32nd)', () => {
      const result = validateDate('2024-01-32');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DATE_INVALID')).toBe(true);
    });

    it('rejects invalid month (13th)', () => {
      const result = validateDate('2024-13-01');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DATE_INVALID')).toBe(true);
    });

    it('rejects dates too far in the past', () => {
      const result = validateDate('1800-01-01');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DATE_BOUNDS')).toBe(true);
    });

    it('rejects dates too far in the future', () => {
      const result = validateDate('2200-01-01');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DATE_BOUNDS')).toBe(true);
    });
  });
});

describe('validateProfileName', () => {
  describe('valid names', () => {
    it('accepts normal names', () => {
      const result = validateProfileName('My Profile');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts names with numbers', () => {
      const result = validateProfileName('Profile 2024');
      expect(result.valid).toBe(true);
    });

    it('accepts names with special characters', () => {
      const result = validateProfileName("John's Finance");
      expect(result.valid).toBe(true);
    });

    it('accepts names up to 100 characters', () => {
      const result = validateProfileName('A'.repeat(100));
      expect(result.valid).toBe(true);
    });

    it('accepts Dutch names', () => {
      const result = validateProfileName('Persoonlijk Budget');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('rejects empty string', () => {
      const result = validateProfileName('');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'NAME_REQUIRED')).toBe(true);
    });

    it('rejects whitespace only', () => {
      const result = validateProfileName('   ');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'NAME_REQUIRED')).toBe(true);
    });

    it('rejects names over 100 characters', () => {
      const result = validateProfileName('A'.repeat(101));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'NAME_TOO_LONG')).toBe(true);
    });
  });
});

describe('validateCategoryName', () => {
  describe('valid names', () => {
    it('accepts normal category names', () => {
      const result = validateCategoryName('Groceries');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts names with emoji', () => {
      const result = validateCategoryName('🛒 Groceries');
      expect(result.valid).toBe(true);
    });

    it('accepts Dutch category names', () => {
      const result = validateCategoryName('Boodschappen');
      expect(result.valid).toBe(true);
    });

    it('accepts names up to 50 characters', () => {
      const result = validateCategoryName('A'.repeat(50));
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('rejects empty string', () => {
      const result = validateCategoryName('');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'NAME_REQUIRED')).toBe(true);
    });

    it('rejects whitespace only', () => {
      const result = validateCategoryName('   ');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'NAME_REQUIRED')).toBe(true);
    });

    it('rejects names over 50 characters', () => {
      const result = validateCategoryName('A'.repeat(51));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'NAME_TOO_LONG')).toBe(true);
    });
  });
});

describe('validateBudgetAmount', () => {
  describe('valid amounts', () => {
    it('accepts positive amounts', () => {
      const result = validateBudgetAmount(500);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts small positive amounts', () => {
      const result = validateBudgetAmount(0.01);
      expect(result.valid).toBe(true);
    });

    it('accepts large positive amounts', () => {
      const result = validateBudgetAmount(100_000);
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid amounts', () => {
    it('rejects zero', () => {
      const result = validateBudgetAmount(0);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'BUDGET_POSITIVE')).toBe(
        true
      );
    });

    it('rejects negative amounts', () => {
      const result = validateBudgetAmount(-100);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'BUDGET_POSITIVE')).toBe(
        true
      );
    });

    it('rejects NaN', () => {
      const result = validateBudgetAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'AMOUNT_NAN')).toBe(true);
    });

    it('rejects Infinity', () => {
      const result = validateBudgetAmount(Infinity);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'AMOUNT_INFINITE')).toBe(
        true
      );
    });
  });
});

describe('combineValidations', () => {
  it('combines valid results', () => {
    const result1 = { valid: true, errors: [] };
    const result2 = { valid: true, errors: [] };
    const combined = combineValidations(result1, result2);
    expect(combined.valid).toBe(true);
    expect(combined.errors).toHaveLength(0);
  });

  it('combines invalid results', () => {
    const result1 = {
      valid: false,
      errors: [{ field: 'a', message: 'Error A', code: 'ERR_A' }],
    };
    const result2 = {
      valid: false,
      errors: [{ field: 'b', message: 'Error B', code: 'ERR_B' }],
    };
    const combined = combineValidations(result1, result2);
    expect(combined.valid).toBe(false);
    expect(combined.errors).toHaveLength(2);
  });

  it('combines mixed results', () => {
    const result1 = { valid: true, errors: [] };
    const result2 = {
      valid: false,
      errors: [{ field: 'b', message: 'Error B', code: 'ERR_B' }],
    };
    const combined = combineValidations(result1, result2);
    expect(combined.valid).toBe(false);
    expect(combined.errors).toHaveLength(1);
  });

  it('handles empty input', () => {
    const combined = combineValidations();
    expect(combined.valid).toBe(true);
    expect(combined.errors).toHaveLength(0);
  });

  it('handles single input', () => {
    const result = {
      valid: false,
      errors: [{ field: 'x', message: 'Error X', code: 'ERR_X' }],
    };
    const combined = combineValidations(result);
    expect(combined.valid).toBe(false);
    expect(combined.errors).toHaveLength(1);
  });
});
