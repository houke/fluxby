import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

describe('Payment Processor Rules API', () => {
  let app: any;

  beforeAll(async () => {
    const mod = await import('../../apps/api/src/app.js');
    app = mod.default;
  });

  it('should allow creating and updating a rule patterns', async () => {
    // 1. Create a new rule
    const createRes = await request(app)
      .post('/api/addressbook/payment-provider-rules')
      .send({ name: 'TestProcessor', patterns: 'foo,bar' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const id = createRes.body.data.id;

    // 2. Update only patterns
    const patchRes = await request(app)
      .patch(`/api/addressbook/payment-provider-rules/${id}`)
      .send({ patterns: 'baz,qux' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);

    // 3. Fetch rules and verify update
    const listRes = await request(app).get(
      '/api/addressbook/payment-provider-rules'
    );

    expect(listRes.status).toBe(200);
    const updated = listRes.body.data.find((r: any) => r.id === id);
    expect(updated).toBeDefined();
    expect(updated.patterns).toBe('baz,qux');

    // 4. Cleanup
    await request(app).delete(`/api/addressbook/payment-provider-rules/${id}`);
  });
});
