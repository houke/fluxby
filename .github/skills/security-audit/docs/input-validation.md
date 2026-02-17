# Input Validation Patterns

## Validation Strategy

**Defense in Depth**: Validate at multiple layers:

1. Client-side (UX, not security)
2. API boundary (schema validation)
3. Business logic layer
4. Database constraints

---

## Schema Validation with Zod

### Basic Schemas

```typescript
import { z } from 'zod';

// String validation
const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((val) => val.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');

// Number validation
const ageSchema = z
  .number()
  .int('Age must be a whole number')
  .min(0, 'Age cannot be negative')
  .max(150, 'Invalid age');

const priceSchema = z
  .number()
  .positive('Price must be positive')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

// Date validation
const birthDateSchema = z.coerce
  .date()
  .max(new Date(), 'Birth date cannot be in the future')
  .min(new Date('1900-01-01'), 'Invalid birth date');
```

### Object Schemas

```typescript
// User registration
const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Partial updates
const updateUserSchema = registerSchema.partial().omit({
  password: true,
  confirmPassword: true,
  acceptTerms: true,
});
```

### Array Validation

```typescript
const tagsSchema = z
  .array(z.string().min(1).max(50))
  .min(1, 'At least one tag required')
  .max(10, 'Maximum 10 tags allowed')
  .transform((tags) => [...new Set(tags)]); // Remove duplicates

const idsSchema = z.array(z.string().uuid()).min(1).max(100);
```

### Discriminated Unions

```typescript
const paymentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('credit_card'),
    cardNumber: z.string().regex(/^\d{16}$/),
    expiry: z.string().regex(/^\d{2}\/\d{2}$/),
    cvv: z.string().regex(/^\d{3,4}$/),
  }),
  z.object({
    type: z.literal('bank_transfer'),
    accountNumber: z.string().min(10).max(20),
    routingNumber: z.string().length(9),
  }),
  z.object({
    type: z.literal('paypal'),
    email: emailSchema,
  }),
]);
```

---

## Sanitization

### HTML Sanitization

```typescript
import DOMPurify from 'dompurify';

// Allow only safe HTML
function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

// Strip all HTML
function stripHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
```

### SQL/NoSQL Sanitization

```typescript
// Escape special characters for LIKE queries
function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}

// MongoDB operator injection prevention
function sanitizeMongoQuery(input: unknown): unknown {
  if (typeof input === 'string') {
    return input;
  }
  if (typeof input === 'object' && input !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      // Block MongoDB operators
      if (key.startsWith('$')) {
        continue;
      }
      result[key] = sanitizeMongoQuery(value);
    }
    return result;
  }
  return input;
}
```

### Path Traversal Prevention

```typescript
import path from 'path';

function sanitizePath(userPath: string, baseDir: string): string | null {
  const resolved = path.resolve(baseDir, userPath);

  // Ensure path stays within base directory
  if (!resolved.startsWith(baseDir)) {
    return null; // Path traversal attempt
  }

  return resolved;
}

// Usage
const safePath = sanitizePath(req.params.filename, '/uploads');
if (!safePath) {
  return res.status(400).json({ error: 'Invalid path' });
}
```

---

## File Upload Validation

```typescript
interface FileValidationOptions {
  maxSize: number; // bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

async function validateUpload(
  file: Express.Multer.File,
  options: FileValidationOptions,
): Promise<{ valid: boolean; error?: string }> {
  // Size check
  if (file.size > options.maxSize) {
    return { valid: false, error: 'File too large' };
  }

  // Extension check
  const ext = path.extname(file.originalname).toLowerCase();
  if (!options.allowedExtensions.includes(ext)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // MIME type check (can be spoofed, so also check magic bytes)
  if (!options.allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Magic bytes verification
  const fileType = await import('file-type');
  const type = await fileType.fileTypeFromBuffer(file.buffer);

  if (!type || !options.allowedMimeTypes.includes(type.mime)) {
    return { valid: false, error: 'File content does not match type' };
  }

  return { valid: true };
}

// Usage
const result = await validateUpload(req.file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
});
```

---

## URL Validation

```typescript
const urlSchema = z
  .string()
  .url('Invalid URL')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      // Only allow HTTPS
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Only HTTPS URLs allowed')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      // Block localhost/internal IPs (SSRF prevention)
      const hostname = parsed.hostname;
      return !isPrivateIP(hostname);
    } catch {
      return false;
    }
  }, 'URL not allowed');

function isPrivateIP(hostname: string): boolean {
  const patterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];
  return patterns.some((p) => p.test(hostname));
}
```

---

## Express Middleware

```typescript
import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
    }

    // Replace with validated data
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;

    next();
  };
}

// Usage
const createUserValidation = z.object({
  body: registerSchema,
  query: z.object({}),
  params: z.object({}),
});

app.post('/users', validate(createUserValidation), createUserHandler);
```
