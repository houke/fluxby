import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// DB_PATH is set to :memory: in tests/setup.ts

describe('Category Seeding API', () => {
  let app: any;

  beforeAll(async () => {
    // Import app using dynamic import to ensure ENV is preserved
    const mod = await import('../../apps/api/src/app.js');
    app = mod.default;
  });

  it('should automatically seed categories for a new profile', async () => {
    // 1. Create a new profile
    const profileRes = await request(app).post('/api/profiles').send({
      name: 'Auto Seed Profile',
      type: 'personal',
    });
    const profileId = profileRes.body.data.id;

    // 2. Verify it has categories automatically
    const catsRes = await request(app)
      .get('/api/categories')
      .set('X-Profile-Id', String(profileId));

    expect(catsRes.body.data.length).toBeGreaterThan(0);

    // Check if we have parent categories (no parentId)
    const parents = catsRes.body.data.filter((c: any) => c.parentId === null);
    expect(parents.length).toBeGreaterThan(0);
  });

  it('should return seed categories from /api/categories/seed-data', async () => {
    const res = await request(app).get('/api/categories/seed-data');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Check structure of first category
    const firstCat = res.body.data[0];
    expect(firstCat).toHaveProperty('name');
    expect(firstCat).toHaveProperty('subcategories');
    expect(Array.isArray(firstCat.subcategories)).toBe(true);
    expect(firstCat.subcategories.length).toBeGreaterThan(0);
  });

  it('should seed categories for a new profile', async () => {
    // 1. Create a new profile
    const profileRes = await request(app).post('/api/profiles').send({
      name: 'Test Profile',
      type: 'personal',
    });
    const profileId = profileRes.body.data.id;

    // 2. Verify it has categories initially (now it should have them automatically)
    const initialCatsRes = await request(app)
      .get('/api/categories')
      .set('X-Profile-Id', String(profileId));
    expect(initialCatsRes.body.data.length).toBeGreaterThan(0);

    // 3. Get seed data
    const seedDataRes = await request(app).get('/api/categories/seed-data');
    const seedData = seedDataRes.body.data;

    // 4. Seed categories (should fail because they already exist)
    const seedRes = await request(app)
      .post('/api/categories/seed')
      .set('X-Profile-Id', String(profileId))
      .send({ categories: seedData });

    expect(seedRes.status).toBe(400);
    expect(seedRes.body.success).toBe(false);
    expect(seedRes.body.error).toBe('Profile already has categories');
  });
});
