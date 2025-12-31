/**
 * Data Validation
 * Validates user input and imported data
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate IBAN format
 */
export function validateIBAN(iban: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!iban) {
    return { valid: true, errors: [] }; // IBAN is optional
  }

  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Check length (varies by country, but typically 15-34 characters)
  if (cleaned.length < 15 || cleaned.length > 34) {
    errors.push({
      field: 'iban',
      message: 'IBAN must be between 15 and 34 characters',
      code: 'IBAN_LENGTH',
    });
  }

  // Check format: 2 letters + 2 digits + rest alphanumeric
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    errors.push({
      field: 'iban',
      message: 'Invalid IBAN format',
      code: 'IBAN_FORMAT',
    });
  }

  // Validate checksum (MOD 97-10)
  if (errors.length === 0) {
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    const numeric = rearranged.replace(/[A-Z]/g, (char) =>
      String(char.charCodeAt(0) - 55)
    );

    let remainder = 0;
    for (const digit of numeric) {
      remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
    }

    if (remainder !== 1) {
      errors.push({
        field: 'iban',
        message: 'Invalid IBAN checksum',
        code: 'IBAN_CHECKSUM',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate amount
 */
export function validateAmount(amount: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (isNaN(amount)) {
    errors.push({
      field: 'amount',
      message: 'Amount must be a number',
      code: 'AMOUNT_NAN',
    });
  }

  if (!isFinite(amount)) {
    errors.push({
      field: 'amount',
      message: 'Amount must be finite',
      code: 'AMOUNT_INFINITE',
    });
  }

  // Check reasonable bounds
  if (Math.abs(amount) > 1_000_000_000) {
    errors.push({
      field: 'amount',
      message: 'Amount exceeds reasonable bounds',
      code: 'AMOUNT_BOUNDS',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date string (ISO format YYYY-MM-DD)
 */
export function validateDate(dateStr: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!dateStr) {
    errors.push({
      field: 'date',
      message: 'Date is required',
      code: 'DATE_REQUIRED',
    });
    return { valid: false, errors };
  }

  // Check ISO format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    errors.push({
      field: 'date',
      message: 'Date must be in YYYY-MM-DD format',
      code: 'DATE_FORMAT',
    });
    return { valid: false, errors };
  }

  // Check valid date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    errors.push({
      field: 'date',
      message: 'Invalid date',
      code: 'DATE_INVALID',
    });
    return { valid: false, errors };
  }

  // Check reasonable bounds (not too far in past or future)
  const now = new Date();
  const yearDiff = Math.abs(now.getFullYear() - date.getFullYear());
  if (yearDiff > 100) {
    errors.push({
      field: 'date',
      message: 'Date is too far in the past or future',
      code: 'DATE_BOUNDS',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate profile name
 */
export function validateProfileName(name: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Profile name is required',
      code: 'NAME_REQUIRED',
    });
    return { valid: false, errors };
  }

  if (name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Profile name must be 100 characters or less',
      code: 'NAME_TOO_LONG',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Category name is required',
      code: 'NAME_REQUIRED',
    });
    return { valid: false, errors };
  }

  if (name.length > 50) {
    errors.push({
      field: 'name',
      message: 'Category name must be 50 characters or less',
      code: 'NAME_TOO_LONG',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate budget amount
 */
export function validateBudgetAmount(amount: number): ValidationResult {
  const result = validateAmount(amount);

  if (result.valid && amount <= 0) {
    result.valid = false;
    result.errors.push({
      field: 'amount',
      message: 'Budget amount must be positive',
      code: 'BUDGET_POSITIVE',
    });
  }

  return result;
}

/**
 * Combine multiple validation results
 */
export function combineValidations(
  ...results: ValidationResult[]
): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
