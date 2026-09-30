import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

export interface ApiAccessConfig {
  host: string;
  token: string;
  allowedOrigins: string[];
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** Remote access is an explicit opt-in and always requires authentication. */
export function getApiAccessConfig(
  env: NodeJS.ProcessEnv = process.env
): ApiAccessConfig {
  const host = env.HOST?.trim() || '127.0.0.1';
  const token = env.API_AUTH_TOKEN?.trim() || '';
  if (!LOOPBACK_HOSTS.has(host)) {
    if (env.API_ALLOW_REMOTE !== '1' || token.length < 32) {
      throw new Error(
        'Remote API binding requires API_ALLOW_REMOTE=1 and an API_AUTH_TOKEN of at least 32 characters.'
      );
    }
  }
  if (token && token.length < 32) {
    throw new Error('API_AUTH_TOKEN must contain at least 32 characters.');
  }
  const allowedOrigins = (
    env.CORS_ORIGIN ||
    'http://localhost:5177,http://localhost:3000,https://fluxby.local:5177'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (allowedOrigins.includes('*')) {
    throw new Error(
      'CORS_ORIGIN must list explicit origins; wildcard access is not supported.'
    );
  }
  return { host, token, allowedOrigins };
}

function isLoopback(address: string | undefined): boolean {
  return (
    !!address &&
    (address === '::1' ||
      address === '127.0.0.1' ||
      address === '::ffff:127.0.0.1')
  );
}

/** Authenticate the server, then let profile scoping select its local dataset. */
export function createApiAccessMiddleware(
  config: ApiAccessConfig
): RequestHandler {
  const expected = createHash('sha256').update(config.token).digest();
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) {
      res.status(403).json({ success: false, error: 'Origin is not allowed' });
      return;
    }
    if (!config.token) {
      // Use the actual socket, never a client-provided X-Forwarded-For header.
      if (!isLoopback(req.socket.remoteAddress)) {
        res
          .status(403)
          .json({ success: false, error: 'Remote API access is disabled' });
        return;
      }
      next();
      return;
    }
    const authorization = req.headers.authorization || '';
    const supplied = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
    const actual = createHash('sha256').update(supplied).digest();
    if (!supplied || !timingSafeEqual(actual, expected)) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      res
        .status(401)
        .json({ success: false, error: 'Valid bearer token required' });
      return;
    }
    next();
  };
}
