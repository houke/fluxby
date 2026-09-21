import express from 'express';
import cors from 'cors';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

import {
  globalRateLimiter,
  sensitiveRateLimiter,
} from './middleware/rate-limit.js';

import { initializeDatabase } from './db/index.js';
import { swaggerSpec } from './swagger.js';
import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import accountsRouter from './routes/accounts.js';
import budgetsRouter from './routes/budgets.js';
import importRouter from './routes/import.js';
import analyticsRouter from './routes/analytics.js';
import userRouter from './routes/user.js';
import dataRouter from './routes/data.js';
import addressbookRouter from './routes/addressbook.js';
import profilesRouter from './routes/profiles.js';
import recurringRouter from './routes/recurring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '..', '..', '..', 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize database
initializeDatabase();

// Create Express app
const app = express();
app.set('trust proxy', 1); // Trust first proxy
const _PORT = process.env.PORT || 3001; // Prefixed with _ as it's only used in index.ts

// Middleware
const corsOriginEnv = process.env.CORS_ORIGIN;
const corsOptions = (() => {
  if (!corsOriginEnv) {
    return {
      origin: ['http://localhost:5177', 'http://localhost:3000'],
      credentials: true,
    };
  }

  const trimmed = corsOriginEnv.trim();
  if (trimmed === '*') {
    return { origin: true, credentials: false };
  }

  const origins = trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return { origin: origins, credentials: true };
})();

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting - global limiter for all API routes
// See middleware/rate-limit.ts for configuration via environment variables
app.use('/api', globalRateLimiter);

// Performance logging for API requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      // Sanitize log output to prevent log injection (CodeQL js/log-injection)
      const safeUrl = req.originalUrl.replace(/[\r\n]/g, '');
      console.warn(
        `[PERF] Slow API Request: ${req.method} ${safeUrl} (${duration}ms)`
      );
    }
  });
  next();
});

// Serve the built web app at /app/ when running from root dist/.
try {
  const webDistDir = join(__dirname, '..', '..', 'web', 'dist');
  const webIndexFile = join(webDistDir, 'index.html');
  const shouldServeWeb =
    process.env.SERVE_WEB_DIST === '1' || process.env.NODE_ENV === 'production';

  if (shouldServeWeb && existsSync(webDistDir) && existsSync(webIndexFile)) {
    app.get('/', (_req, res) => res.redirect('/app/'));
    app.use('/app', express.static(webDistDir));
    app.get(/^\/app(?:\/.*)?$/, globalRateLimiter, (_req, res) => {
      res.sendFile(webIndexFile);
    });
  }
} catch {
  // Ignore static serving setup issues
}

// Routes
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply stricter rate limits to sensitive endpoints
app.use('/api/profiles', sensitiveRateLimiter, profilesRouter);
app.use('/api/import', sensitiveRateLimiter, importRouter);
app.use('/api/data', sensitiveRateLimiter, dataRouter);

// Standard routes (global rate limit only)
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/user', userRouter);
app.use('/api/addressbook', addressbookRouter);
app.use('/api/recurring', recurringRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    // Log technical details only in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', err);
    }

    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
);

// Export app for testing
export default app;
