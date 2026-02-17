# Authentication Patterns

## Password Handling

### Secure Password Hashing

```typescript
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12; // Adjust based on security requirements

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Password Strength Validation

```typescript
import zxcvbn from 'zxcvbn';

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTime: string;
}

export function checkPasswordStrength(
  password: string,
  userInputs: string[] = [],
): PasswordStrength {
  const result = zxcvbn(password, userInputs);

  return {
    score: result.score,
    feedback: result.feedback,
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
  };
}

// Enforce minimum strength
export function isPasswordStrong(password: string): boolean {
  const { score } = checkPasswordStrength(password);
  return score >= 3; // Require at least "good" strength
}
```

---

## JWT Authentication

### Token Generation

```typescript
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

interface TokenPayload {
  sub: string; // Subject (user ID)
  email: string;
  role: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
  jti?: string; // JWT ID (for revocation)
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateTokens(user: {
  id: string;
  email: string;
  role: string;
}): TokenPair {
  const payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(
    { ...payload, jti: randomUUID() },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  const refreshToken = jwt.sign(
    { sub: user.id, jti: randomUUID() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}
```

### Token Verification

```typescript
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(
  token: string,
): { sub: string; jti: string } | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      sub: string;
      jti: string;
    };
    return payload;
  } catch {
    return null;
  }
}
```

### Token Revocation

```typescript
// Use Redis for token blacklist
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function revokeToken(
  jti: string,
  expiresAt: number,
): Promise<void> {
  const ttl = expiresAt - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.setex(`revoked:${jti}`, ttl, '1');
  }
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  const result = await redis.get(`revoked:${jti}`);
  return result === '1';
}

// In middleware
async function authMiddleware(req, res, next) {
  const token = extractToken(req);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (await isTokenRevoked(payload.jti!)) {
    return res.status(401).json({ error: 'Token revoked' });
  }

  req.user = payload;
  next();
}
```

---

## Session-Based Authentication

### Secure Session Configuration

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: process.env.SESSION_SECRET!,
    name: 'sessionId', // Custom cookie name
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.COOKIE_DOMAIN,
    },
  }),
);
```

### Session Regeneration

```typescript
// Regenerate session on privilege change
async function loginUser(req: Request, user: User): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);

      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.loginTime = Date.now();

      resolve();
    });
  });
}

async function logoutUser(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
```

---

## Multi-Factor Authentication

### TOTP (Time-based One-Time Password)

```typescript
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Generate secret for user
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

// Generate QR code for authenticator app
export async function generateTOTPQRCode(
  email: string,
  secret: string,
): Promise<string> {
  const otpauth = authenticator.keyuri(email, 'MyApp', secret);
  return QRCode.toDataURL(otpauth);
}

// Verify TOTP code
export function verifyTOTP(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

// Verification with time window (allows for clock drift)
authenticator.options = {
  window: 1, // Allow 1 step before/after current time
};
```

### Backup Codes

```typescript
import { randomBytes } from 'crypto';

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

// Store hashed backup codes
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

// Verify and consume backup code
export async function useBackupCode(
  userId: string,
  code: string,
): Promise<boolean> {
  const user = await db.users.findById(userId);

  for (let i = 0; i < user.backupCodes.length; i++) {
    if (await bcrypt.compare(code.replace('-', ''), user.backupCodes[i])) {
      // Remove used code
      user.backupCodes.splice(i, 1);
      await db.users.update(userId, { backupCodes: user.backupCodes });
      return true;
    }
  }

  return false;
}
```

---

## OAuth 2.0 Integration

### Authorization Code Flow

```typescript
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL,
);

// Generate authorization URL
export function getGoogleAuthUrl(): string {
  return googleClient.generateAuthUrl({
    scope: ['email', 'profile'],
    access_type: 'offline',
    prompt: 'consent',
  });
}

// Exchange code for tokens
export async function handleGoogleCallback(code: string) {
  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  // Verify ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload()!;

  return {
    email: payload.email!,
    name: payload.name!,
    picture: payload.picture,
    googleId: payload.sub,
  };
}
```

---

## Rate Limiting Authentication

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination
    return `${req.ip}:${req.body.email || 'unknown'}`;
  },
});

app.post('/api/login', authLimiter, loginHandler);
app.post('/api/register', authLimiter, registerHandler);
app.post('/api/forgot-password', authLimiter, forgotPasswordHandler);
```
