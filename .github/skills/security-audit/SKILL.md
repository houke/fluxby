---
name: security-audit
description: Perform comprehensive security audits against OWASP standards. Use when auditing security, checking for vulnerabilities, or reviewing code for security issues.
---

# Security Audit Skill

Verify application security against OWASP standards and modern security best practices.

## Quick Start

```bash
# Run security audit
npm audit

# Check for secrets in code
npx secretlint "**/*"

# Scan dependencies
npx snyk test
```

## Skill Contents

### Documentation

- `docs/owasp-top-10.md` - OWASP Top 10 vulnerabilities
- `docs/input-validation.md` - Input validation patterns
- `docs/auth-patterns.md` - Authentication best practices

### Examples

- `examples/csp-config.ts` - CSP configuration
- `examples/validation-schemas.ts` - Zod validation schemas

### Templates

- `templates/security-report.md` - Security audit report template

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## OWASP Top 10 (2021)

### A01: Broken Access Control

```typescript
// ❌ BAD: Direct object reference without authorization
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json(user);
});

// ✅ GOOD: Verify authorization
app.get('/api/users/:id', authenticate, async (req, res) => {
  const user = await db.users.findById(req.params.id);

  // Check if requesting user can access this resource
  if (req.user.id !== user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(user);
});
```

### A02: Cryptographic Failures

```typescript
// ❌ BAD: Storing sensitive data in localStorage
localStorage.setItem('authToken', token);

// ✅ GOOD: Use httpOnly cookies for tokens
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000, // 1 hour
});

// ❌ BAD: Weak hashing
const hash = crypto.createHash('md5').update(password).digest('hex');

// ✅ GOOD: Use bcrypt or Argon2
import { hash, verify } from '@node-rs/argon2';
const passwordHash = await hash(password);
const isValid = await verify(passwordHash, password);
```

### A03: Injection

```typescript
// ❌ BAD: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD: Parameterized queries (Drizzle ORM)
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.email, email));

// ❌ BAD: Command injection
exec(`convert ${userInput}.png output.jpg`);

// ✅ GOOD: Use arrays for arguments
execFile('convert', [`${sanitizedInput}.png`, 'output.jpg']);
```

### A04: Insecure Design

```typescript
// ❌ BAD: No rate limiting on authentication
app.post('/api/login', async (req, res) => {
  const user = await authenticate(req.body);
  res.json(user);
});

// ✅ GOOD: Rate limiting and account lockout
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts',
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const attempts = await getLoginAttempts(req.body.email);
  if (attempts >= 5) {
    return res.status(423).json({ error: 'Account locked' });
  }
  // ... authentication logic
});
```

### A05: Security Misconfiguration

```typescript
// ✅ Security headers configuration (Helmet.js)
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.example.com'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
```

### A06: Vulnerable Components

```bash
# Check for vulnerabilities
npm audit
npm audit fix

# Use Snyk for deeper analysis
npx snyk test
npx snyk monitor

# Check for outdated packages
npm outdated
```

### A07: Authentication Failures

```typescript
// ✅ Secure session configuration
import session from 'express-session';

app.use(
  session({
    secret: process.env.SESSION_SECRET!, // Strong, randomly generated
    name: 'sessionId', // Don't use default name
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 3600000,
    },
  }),
);

// ✅ Password requirements
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');
```

### A08: Data Integrity Failures

```typescript
// ✅ Verify data integrity with checksums
import { createHash } from 'crypto';

function verifyChecksum(data: Buffer, expectedHash: string): boolean {
  const hash = createHash('sha256').update(data).digest('hex');
  return hash === expectedHash;
}

// ✅ Sign JWTs with strong secrets
import jwt from 'jsonwebtoken';

const token = jwt.sign(payload, process.env.JWT_SECRET!, {
  algorithm: 'HS256',
  expiresIn: '1h',
  issuer: 'your-app',
  audience: 'your-users',
});
```

### A09: Security Logging Failures

```typescript
// ✅ Security event logging
interface SecurityEvent {
  timestamp: Date;
  eventType:
    | 'login_success'
    | 'login_failure'
    | 'access_denied'
    | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, unknown>;
}

async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  // Don't log sensitive data
  const sanitized = {
    ...event,
    details: redactSensitiveFields(event.details),
  };

  await securityLogger.info(sanitized);

  // Alert on suspicious activity
  if (event.eventType === 'suspicious_activity') {
    await alertSecurityTeam(event);
  }
}
```

### A10: Server-Side Request Forgery (SSRF)

```typescript
// ❌ BAD: Unrestricted URL fetching
app.get('/fetch', async (req, res) => {
  const response = await fetch(req.query.url as string);
  res.send(await response.text());
});

// ✅ GOOD: URL allowlist and validation
const ALLOWED_HOSTS = ['api.trusted.com', 'cdn.trusted.com'];

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return (
      ALLOWED_HOSTS.includes(url.hostname) && ['https:'].includes(url.protocol)
    );
  } catch {
    return false;
  }
}

app.get('/fetch', async (req, res) => {
  const url = req.query.url as string;

  if (!isAllowedUrl(url)) {
    return res.status(400).json({ error: 'URL not allowed' });
  }

  const response = await fetch(url);
  res.send(await response.text());
});
```

## Input Validation

```typescript
import { z } from 'zod';

// User registration schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long'),
  name: z
    .string()
    .min(1, 'Name required')
    .max(100, 'Name too long')
    .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Invalid characters in name'),
});

// Sanitize HTML to prevent XSS
import DOMPurify from 'dompurify';

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title'],
  });
}
```

## Content Security Policy

```typescript
// CSP for modern web apps
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'strict-dynamic'"],
  'style-src': ["'self'", "'unsafe-inline'"], // Consider using nonces
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", 'https://api.example.com'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

// Generate CSP header
function generateCSP(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
```

## Frontend Security

### XSS Prevention

```typescript
// ❌ BAD: Directly inserting user content
element.innerHTML = userInput;

// ✅ GOOD: Use textContent or sanitize
element.textContent = userInput;

// React already escapes by default
// But watch out for:
// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ If needed, sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Secure Storage

```typescript
// ❌ BAD: Storing tokens in localStorage (XSS vulnerable)
localStorage.setItem('token', token);

// ✅ GOOD: Use httpOnly cookies (server-side)
// Or for client-side only, use sessionStorage with caution
sessionStorage.setItem('tempData', nonSensitiveData);

// ✅ For sensitive client data, consider encryption
import { encrypt, decrypt } from './crypto';

const encrypted = encrypt(sensitiveData, userKey);
sessionStorage.setItem('protected', encrypted);
```

## Security Audit Checklist

```markdown
## Security Audit Report

**Application**: [Name]
**Date**: [YYYY-MM-DD]
**Auditor**: [Name]

### Dependency Security

- [ ] `npm audit` passes without critical issues
- [ ] No known vulnerable dependencies
- [ ] Dependencies are up to date

### Authentication & Authorization

- [ ] Strong password policy enforced
- [ ] Rate limiting on auth endpoints
- [ ] Session management is secure
- [ ] JWT tokens expire appropriately
- [ ] Authorization checks on all endpoints

### Input Validation

- [ ] All user inputs validated (Zod schemas)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] File upload restrictions

### Data Security

- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced everywhere
- [ ] No secrets in source code
- [ ] PII handling compliant

### Security Headers

- [ ] CSP configured
- [ ] HSTS enabled
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set

### Logging & Monitoring

- [ ] Security events logged
- [ ] No sensitive data in logs
- [ ] Alerting configured

### Findings

| ID  | Severity | Description   | Status |
| --- | -------- | ------------- | ------ |
| 1   | Critical | [Description] | Open   |
| 2   | High     | [Description] | Fixed  |
```

## Commands

```bash
# Dependency audit
npm audit
npm audit --audit-level=critical

# Secret scanning
npx secretlint "**/*"
npx gitleaks detect

# Security scanning
npx snyk test
npx retire

# Check for known vulnerabilities
npx is-website-vulnerable https://example.com
```

## After Audit

> [!IMPORTANT]
> If vulnerabilities are found:
>
> 1. Assess severity (Critical → Low)
> 2. Update packages if patches exist
> 3. Implement mitigations for unfixable issues
> 4. Document any accepted risks
> 5. Schedule follow-up audit
