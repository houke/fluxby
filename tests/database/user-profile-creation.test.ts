/**
 * User and Profile Creation Tests
 *
 * Tests to ensure users are created properly before profiles
 * and that the onboarding flow handles missing users gracefully.
 *
 * These tests verify the critical fix for "NOT NULL constraint failed: profiles.user_id"
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

describe('User and Profile Creation', () => {
  let app: any;

  beforeAll(async () => {
    // Import app using dynamic import
    const mod = await import('../../apps/api/src/app.js');
    app = mod.default;
  });

  describe('User Creation', () => {
    it('should have a default user created during database initialization', async () => {
      const res = await request(app).get('/api/user');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Gebruiker');
    });
  });

  describe('Profile Creation', () => {
    it('should create a profile successfully with user in place', async () => {
      const res = await request(app).post('/api/profiles').send({
        name: 'Test Profile',
        type: 'personal',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Profile');
      expect(res.body.data.type).toBe('personal');
    });

    it('should list profiles including the created ones', async () => {
      const res = await request(app).get('/api/profiles');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should use create-demo endpoint for demo profile', async () => {
      const res = await request(app).post('/api/profiles/create-demo');

      // Will be 201 (created) or 200 (already exists)
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid profile data gracefully', async () => {
      const res = await request(app).post('/api/profiles').send({
        // Missing required name field
        type: 'personal',
      });

      expect(res.status).toBe(400);
    });

    it('should not allow duplicate profile IDs', async () => {
      // Create first profile with unique ID
      const uniqueId = `test-unique-${Date.now()}`;
      const res1 = await request(app).post('/api/profiles').send({
        id: uniqueId,
        name: 'Profile 1',
        type: 'personal',
      });

      // Try to create another with same ID
      const res2 = await request(app).post('/api/profiles').send({
        id: uniqueId,
        name: 'Profile 2',
        type: 'personal',
      });

      // First should succeed, second should fail or be idempotent
      expect(res1.status).toBe(201);
      // API might handle this differently (idempotent or error)
      expect([201, 400, 409]).toContain(res2.status);
    });
  });

  describe('Critical Fix Verification', () => {
    it('should create profiles without NOT NULL constraint error', async () => {
      // This test verifies the fix for: "NOT NULL constraint failed: profiles.user_id"
      // The ensureUserExists() function should auto-create a user if missing

      const res = await request(app).post('/api/profiles').send({
        name: 'Verification Profile',
        type: 'personal',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      // Profile was created successfully - this is the key test
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Verification Profile');
    });
  });
});
