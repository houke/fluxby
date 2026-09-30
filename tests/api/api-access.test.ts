import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import {
  createApiAccessMiddleware,
  getApiAccessConfig,
} from '../../apps/api/src/middleware/api-access';

const token = 'a'.repeat(32);
function app(env: NodeJS.ProcessEnv = {}) {
  const server = express();
  server.use(createApiAccessMiddleware(getApiAccessConfig(env)));
  server.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  return server;
}
describe('developer API access boundary', () => {
  it('defaults to loopback and requires explicit remote opt-in and a strong token', () => {
    expect(getApiAccessConfig({}).host).toBe('127.0.0.1');
    for (const env of [
      { HOST: '0.0.0.0' },
      { HOST: '0.0.0.0', API_ALLOW_REMOTE: '1' },
      { HOST: '0.0.0.0', API_AUTH_TOKEN: token },
    ])
      expect(() => getApiAccessConfig(env)).toThrow('Remote');
    expect(
      getApiAccessConfig({
        HOST: '0.0.0.0',
        API_ALLOW_REMOTE: '1',
        API_AUTH_TOKEN: token,
      }).host
    ).toBe('0.0.0.0');
    expect(() => getApiAccessConfig({ API_AUTH_TOKEN: 'short' })).toThrow('32');
    expect(() => getApiAccessConfig({ CORS_ORIGIN: '*' })).toThrow('explicit');
  });
  it('allows token-free loopback and refuses untrusted browser origins', async () => {
    expect((await request(app()).get('/api/health')).status).toBe(200);
    expect(
      (
        await request(app())
          .get('/api/health')
          .set('Origin', 'https://evil.example')
      ).status
    ).toBe(403);
    expect(
      (
        await request(app())
          .get('/api/health')
          .set('Origin', 'http://localhost:5177')
      ).status
    ).toBe(200);
  });
  it('authenticates every configured-token request and does not accept spoofed forwarded addresses', async () => {
    const server = app({ API_AUTH_TOKEN: token });
    expect((await request(server).get('/api/health')).status).toBe(401);
    expect(
      (
        await request(server)
          .get('/api/health')
          .set('Authorization', 'Bearer wrong')
      ).status
    ).toBe(401);
    expect(
      (
        await request(server)
          .get('/api/health')
          .set('Authorization', `Bearer ${token}`)
      ).status
    ).toBe(200);
    const middleware = createApiAccessMiddleware(getApiAccessConfig({}));
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const next = vi.fn();
    middleware(
      {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '192.168.1.2' },
      } as never,
      { status, json } as never,
      next
    );
    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
