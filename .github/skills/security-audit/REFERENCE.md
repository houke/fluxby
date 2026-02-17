# Security Audit Quick Reference

## OWASP Top 10 (2021)

| #   | Risk                      | Prevention                                |
| --- | ------------------------- | ----------------------------------------- |
| A01 | Broken Access Control     | Deny by default, validate server-side     |
| A02 | Cryptographic Failures    | TLS, hashed passwords, no secrets in code |
| A03 | Injection                 | Parameterized queries, input validation   |
| A04 | Insecure Design           | Threat modeling, secure patterns          |
| A05 | Security Misconfiguration | Minimal permissions, patched deps         |
| A06 | Vulnerable Components     | Audit deps, update regularly              |
| A07 | Auth Failures             | MFA, strong passwords, rate limiting      |
| A08 | Data Integrity Failures   | Signed updates, verify sources            |
| A09 | Logging Failures          | Log security events, monitor              |
| A10 | SSRF                      | Whitelist URLs, validate input            |

## Input Validation (Zod)

```typescript
import { z } from 'zod';

// User schema
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().positive().max(150).optional(),
});

// Validate
const result = userSchema.safeParse(input);
if (!result.success) {
  console.error(result.error.issues);
}

// Common patterns
z.string().trim();
z.string().regex(/^[a-zA-Z0-9]+$/);
z.string().url();
z.string().uuid();
z.enum(['admin', 'user']);
z.array(z.string()).max(10);
```

## XSS Prevention

```typescript
// ❌ Dangerous
element.innerHTML = userInput;
dangerouslySetInnerHTML={{ __html: userInput }}

// ✅ Safe
element.textContent = userInput;
<div>{userInput}</div>  // React auto-escapes

// Sanitize HTML if needed
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirty);
```

## CSP Header

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  upgrade-insecure-requests;
```

## Security Headers

```typescript
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
```

## Password Hashing

```typescript
// bcrypt (recommended)
import bcrypt from 'bcrypt';
const SALT_ROUNDS = 12;

const hash = await bcrypt.hash(password, SALT_ROUNDS);
const isValid = await bcrypt.compare(password, hash);

// Argon2 (even better)
import argon2 from 'argon2';

const hash = await argon2.hash(password);
const isValid = await argon2.verify(hash, password);
```

## JWT Best Practices

```typescript
// Sign
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
  expiresIn: '15m',
  issuer: 'app-name',
  audience: 'app-users',
});

// Verify
const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
  issuer: 'app-name',
  audience: 'app-users',
});

// Refresh token rotation
// - Short-lived access tokens (15min)
// - Long-lived refresh tokens (7 days)
// - Rotate refresh token on use
// - Revoke on logout
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter for auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
});
```

## SQL Injection Prevention

```typescript
// ❌ Dangerous
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ Parameterized
db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ✅ ORM
await db.select().from(users).where(eq(users.id, userId));
```

## CORS Configuration

```typescript
const corsOptions = {
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
};
```

## Secure Storage (Frontend)

```typescript
// ❌ Never store sensitive data
localStorage.setItem('token', jwt); // Vulnerable to XSS

// ✅ Use httpOnly cookies
// Set by server:
// Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict

// ✅ Memory only for sensitive data
const authState = { token: null }; // Cleared on page refresh
```

## Environment Variables

```typescript
// ✅ Validate required vars
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
}

// ❌ Never commit
// .env, .env.local, .env.production

// ✅ Commit template only
// .env.example with placeholder values
```

## Audit Checklist

```
Authentication
□ Strong password policy
□ Rate limiting on login
□ Account lockout
□ Secure password reset
□ MFA available

Authorization
□ Deny by default
□ Server-side validation
□ No client-side only auth
□ Proper role checks

Data
□ Input validation (Zod)
□ Output encoding
□ Parameterized queries
□ Encrypted at rest
□ TLS in transit

Headers
□ CSP configured
□ X-Frame-Options
□ X-Content-Type-Options
□ HSTS enabled

Dependencies
□ npm audit clean
□ No known vulnerabilities
□ Regular updates
□ Lock file committed
```

## Quick Commands

```bash
# Audit dependencies
npm audit
npm audit fix

# Check for secrets in git
git secrets --scan

# Test headers
curl -I https://example.com

# Check TLS
openssl s_client -connect example.com:443
```

## Common Vulnerabilities

| Issue           | Fix                      |
| --------------- | ------------------------ |
| XSS             | Escape output, CSP       |
| CSRF            | SameSite cookies, tokens |
| SQLi            | Parameterized queries    |
| IDOR            | Authorization checks     |
| Open redirect   | Whitelist URLs           |
| Clickjacking    | X-Frame-Options          |
| Secrets in code | Environment variables    |
