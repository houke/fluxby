# OWASP Top 10 Reference Guide

## Overview

The OWASP Top 10 is the standard awareness document for web application security. This guide covers each vulnerability with detection strategies and mitigations.

---

## A01:2021 - Broken Access Control

### Description

Users can act outside their intended permissions.

### Common Vulnerabilities

- IDOR (Insecure Direct Object References)
- Missing function-level access control
- CORS misconfiguration
- Privilege escalation

### Detection

```typescript
// Look for patterns like:
// ❌ Direct ID usage without authorization check
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  return res.json(user);
});

// ❌ Frontend-only access control
if (user.role === 'admin') {
  showAdminPanel();
}
```

### Mitigation

```typescript
// ✅ Always verify ownership/authorization server-side
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);

  // Check ownership or admin role
  if (user.id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.json(user);
});

// ✅ Use UUIDs instead of sequential IDs
const id = crypto.randomUUID(); // Not auto-increment

// ✅ Implement proper CORS
const corsOptions = {
  origin: ['https://myapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
```

---

## A02:2021 - Cryptographic Failures

### Description

Failures related to cryptography that lead to exposure of sensitive data.

### Common Vulnerabilities

- Weak algorithms (MD5, SHA1 for passwords)
- Hardcoded secrets
- HTTP for sensitive data
- Inadequate key management

### Detection

```typescript
// ❌ Weak hashing
const hash = crypto.createHash('md5').update(password).digest('hex');

// ❌ Hardcoded secrets
const JWT_SECRET = 'my-secret-key';

// ❌ Sensitive data in logs
console.log('User login:', { email, password });
```

### Mitigation

```typescript
// ✅ Use bcrypt for passwords
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);

// ✅ Environment variables for secrets
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Use HTTPS everywhere
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

---

## A03:2021 - Injection

### Description

User-supplied data is not validated, filtered, or sanitized.

### Common Vulnerabilities

- SQL injection
- NoSQL injection
- Command injection
- LDAP injection

### Detection

```typescript
// ❌ SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ❌ NoSQL injection
const user = await db.users.findOne({ email: req.body.email });

// ❌ Command injection
exec(`convert ${filename} output.pdf`);
```

### Mitigation

```typescript
// ✅ Parameterized queries
const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

// ✅ ORM with proper escaping
const user = await prisma.user.findUnique({
  where: { email: sanitize(req.body.email) },
});

// ✅ Validate and sanitize input
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});
```

---

## A04:2021 - Insecure Design

### Description

Flaws in design patterns and architectures.

### Common Vulnerabilities

- Missing rate limiting
- Insufficient security controls
- No defense in depth

### Mitigation

```typescript
// ✅ Rate limiting
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts',
});

app.post('/login', loginLimiter, loginHandler);

// ✅ Account lockout
async function handleFailedLogin(userId: string) {
  const attempts = await incrementFailedAttempts(userId);
  if (attempts >= 5) {
    await lockAccount(userId, 30 * 60); // 30 minutes
  }
}
```

---

## A05:2021 - Security Misconfiguration

### Description

Missing security hardening, default configurations, unnecessary features enabled.

### Common Vulnerabilities

- Default credentials
- Verbose error messages
- Unnecessary features enabled
- Missing security headers

### Mitigation

```typescript
// ✅ Security headers with Helmet
import helmet from 'helmet';
app.use(helmet());

// ✅ Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'strict-dynamic'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  }),
);

// ✅ Hide implementation details
app.disable('x-powered-by');

// ✅ Production error handling
if (process.env.NODE_ENV === 'production') {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });
}
```

---

## A06:2021 - Vulnerable and Outdated Components

### Detection

```bash
# Check for vulnerabilities
npm audit
pnpm audit
yarn audit

# Use tools like Snyk
npx snyk test
```

### Mitigation

```json
// package.json - Use exact versions in production
{
  "dependencies": {
    "express": "4.18.2"
  }
}
```

---

## A07:2021 - Identification and Authentication Failures

### Common Vulnerabilities

- Weak passwords allowed
- Missing MFA
- Session fixation
- Credential stuffing

### Mitigation

```typescript
// ✅ Password strength validation
import zxcvbn from 'zxcvbn';

function validatePassword(password: string): boolean {
  const result = zxcvbn(password);
  return result.score >= 3;
}

// ✅ Secure session management
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// ✅ Regenerate session on login
req.session.regenerate((err) => {
  req.session.userId = user.id;
});
```

---

## A08:2021 - Software and Data Integrity Failures

### Mitigation

```typescript
// ✅ Subresource Integrity
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>

// ✅ Verify package signatures
// Use lock files and verify checksums
```

---

## A09:2021 - Security Logging and Monitoring Failures

### Mitigation

```typescript
// ✅ Audit logging
interface AuditLog {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  ip: string;
  userAgent: string;
}

async function auditLog(log: AuditLog) {
  await db.auditLogs.create({ data: log });
}

// Log security-relevant events
app.post('/login', async (req, res) => {
  const result = await authenticate(req.body);

  await auditLog({
    timestamp: new Date(),
    userId: result.user?.id || 'unknown',
    action: 'LOGIN_ATTEMPT',
    resource: '/login',
    result: result.success ? 'success' : 'failure',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
});
```

---

## A10:2021 - Server-Side Request Forgery (SSRF)

### Detection

```typescript
// ❌ Unvalidated URL fetch
app.get('/fetch', async (req, res) => {
  const response = await fetch(req.query.url);
  res.send(await response.text());
});
```

### Mitigation

```typescript
// ✅ URL allowlist
const ALLOWED_HOSTS = ['api.example.com', 'cdn.example.com'];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

app.get('/fetch', async (req, res) => {
  if (!isAllowedUrl(req.query.url)) {
    return res.status(400).json({ error: 'URL not allowed' });
  }
  // Proceed with fetch
});
```
