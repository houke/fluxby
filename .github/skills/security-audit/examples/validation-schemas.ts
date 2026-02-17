/**
 * Input Validation Schemas
 *
 * Comprehensive validation using Zod for all input types.
 */

import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

// IDs
export const uuidSchema = z.string().uuid('Invalid ID format');
export const cuidSchema = z.string().cuid('Invalid ID format');

// Strings
export const nonEmptyString = z.string().min(1, 'Required');

export const trimmedString = z.string().transform((s) => s.trim());

export const sanitizedString = z
  .string()
  .transform((s) => s.trim())
  .transform((s) => s.replace(/[<>]/g, '')); // Basic XSS prevention

// Email
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((email) => email.toLowerCase().trim());

// Phone (E.164 format)
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format');

// URL
export const urlSchema = z
  .string()
  .url('Invalid URL')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Only HTTP/HTTPS URLs allowed');

export const httpsUrlSchema = urlSchema.refine((url) => {
  return new URL(url).protocol === 'https:';
}, 'Only HTTPS URLs allowed');

// ============================================================================
// PASSWORD SCHEMA
// ============================================================================

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter',
  )
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter',
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Password must contain at least one number',
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    'Password must contain at least one special character',
  );

// Less strict password for cases where external auth is primary
export const simplePasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters');

// ============================================================================
// NAME SCHEMAS
// ============================================================================

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Name contains invalid characters')
  .transform((name) => name.trim());

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens',
  )
  .refine(
    (username) => !/^[-_]|[-_]$/.test(username),
    'Username cannot start or end with special characters',
  )
  .transform((username) => username.toLowerCase());

// ============================================================================
// DATE SCHEMAS
// ============================================================================

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => !isNaN(Date.parse(date)), 'Invalid date');

export const dateTimeStringSchema = z
  .string()
  .datetime({ message: 'Invalid ISO date-time format' });

export const birthDateSchema = z.coerce
  .date()
  .max(new Date(), 'Birth date cannot be in the future')
  .refine((date) => date >= new Date('1900-01-01'), 'Invalid birth date');

export const futureDateSchema = z.coerce
  .date()
  .min(new Date(), 'Date must be in the future');

// ============================================================================
// NUMBER SCHEMAS
// ============================================================================

export const positiveIntSchema = z
  .number()
  .int('Must be a whole number')
  .positive('Must be positive');

export const nonNegativeIntSchema = z
  .number()
  .int('Must be a whole number')
  .nonnegative('Cannot be negative');

export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be less than 0')
  .max(100, 'Percentage cannot be more than 100');

export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .multipleOf(0.01, 'Price can have at most 2 decimal places');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================================================
// CONTENT SCHEMAS
// ============================================================================

// Rich text (HTML) - sanitize on use
export const htmlContentSchema = z.string().max(50000, 'Content too long');

// Plain text
export const textContentSchema = z
  .string()
  .max(10000, 'Content too long')
  .transform((text) => text.trim());

// Markdown
export const markdownSchema = z.string().max(50000, 'Content too long');

// Short text (titles, labels)
export const shortTextSchema = z
  .string()
  .min(1, 'Required')
  .max(200, 'Text too long')
  .transform((text) => text.trim());

// Slug
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug too long')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase with hyphens only',
  );

// ============================================================================
// FILE SCHEMAS
// ============================================================================

export const imageFileSchema = z.object({
  filename: z.string(),
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ]),
  size: z.number().max(10 * 1024 * 1024, 'Image must be less than 10MB'),
});

export const documentFileSchema = z.object({
  filename: z.string(),
  mimetype: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  size: z.number().max(25 * 1024 * 1024, 'Document must be less than 25MB'),
});

// ============================================================================
// ARRAY SCHEMAS
// ============================================================================

export const tagsSchema = z
  .array(z.string().min(1).max(50))
  .max(20, 'Maximum 20 tags allowed')
  .transform((tags) => [...new Set(tags.map((t) => t.trim().toLowerCase()))]);

export const idsArraySchema = z
  .array(uuidSchema)
  .min(1, 'At least one ID required')
  .max(100, 'Too many IDs');

// ============================================================================
// COMPOSITE SCHEMAS
// ============================================================================

// User registration
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: nameSchema,
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// Password reset request
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Password reset
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Address
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha-2 code'),
});

// ============================================================================
// HELPER: REQUEST VALIDATION
// ============================================================================

/**
 * Create Express-compatible validation schema
 */
export function createRequestSchema<
  B extends z.ZodTypeAny = z.ZodUndefined,
  Q extends z.ZodTypeAny = z.ZodUndefined,
  P extends z.ZodTypeAny = z.ZodUndefined,
>(schemas: { body?: B; query?: Q; params?: P }) {
  return z.object({
    body: schemas.body ?? z.undefined(),
    query: schemas.query ?? z.undefined(),
    params: schemas.params ?? z.undefined(),
  });
}

// Example usage:
// const createUserRequest = createRequestSchema({
//   body: registerSchema,
//   params: z.object({ orgId: uuidSchema }),
// });
