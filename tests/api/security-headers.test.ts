import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../apps/api/src/app';

describe('API response hardening', () => {
  it('sends defensive headers and keeps financial responses out of caches', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('reports malformed JSON as a client error instead of a server error', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
