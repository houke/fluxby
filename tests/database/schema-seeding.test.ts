/**
 * Tests for schema seeding and onboarding flow
 * Verifies database initialization creates a default user for profiles
 */

import { describe, it, expect } from 'vitest';

// Import from dist (compiled) version
const { getSeedSQL, DEFAULT_CATEGORIES, SCHEMA_SQL } =
  await import('@fluxby/database');

describe('Database Schema Seeding', () => {
  describe('getSeedSQL', () => {
    it('should create a default user to prevent NOT NULL constraint errors', () => {
      const sql = getSeedSQL('test-device-id');

      // IMPORTANT: Must create default user so profiles can be created
      // This prevents "NOT NULL constraint failed: profiles.user_id" errors
      expect(sql).toContain('INSERT OR IGNORE INTO users');
      expect(sql).toContain("'Gebruiker'"); // Default user name
    });

    it('should NOT create a default profile', () => {
      const sql = getSeedSQL('test-device-id');

      // Should not contain INSERT INTO profiles
      expect(sql).not.toContain('INSERT INTO profiles');
      expect(sql).not.toContain('INSERT OR IGNORE INTO profiles');
    });

    it('should seed default categories with NULL profile_id', () => {
      const sql = getSeedSQL('test-device-id');

      // Should contain INSERT INTO categories
      expect(sql).toContain('INSERT OR IGNORE INTO categories');

      // Each category should have NULL as profile_id
      // The pattern is: VALUES ('id', 'name', 'icon', 'color', NULL, timestamp, 'device_id')
      for (const category of DEFAULT_CATEGORIES) {
        // Check that the category is being inserted with NULL profile_id
        const expectedPattern = `VALUES ('${category.id}'`;
        expect(sql).toContain(expectedPattern);
      }

      // Verify profile_id is NULL (appears before timestamp)
      const categoryInserts = sql.match(
        /INSERT OR IGNORE INTO categories.*?VALUES.*?NULL/gs
      );
      expect(categoryInserts).not.toBeNull();
      expect(categoryInserts?.length).toBeGreaterThan(0);
    });

    it('should properly escape apostrophes in category names', () => {
      const sql = getSeedSQL('test-device-id');

      // The "Kado's" category should be escaped to "Kado''s"
      expect(sql).toContain("Kado''s");
      expect(sql).not.toMatch(/(?<!')'Kado's'(?!')/);
    });

    it('should include all default categories', () => {
      const sql = getSeedSQL('test-device-id');

      // Should have an insert for each category
      for (const category of DEFAULT_CATEGORIES) {
        expect(sql).toContain(category.id);
        // Name might be escaped, so check for icon instead
        expect(sql).toContain(category.icon);
      }
    });
  });

  describe('SCHEMA_SQL', () => {
    it('should define users table', () => {
      expect(SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS users');
    });

    it('should define profiles table with user_id reference', () => {
      expect(SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS profiles');
      expect(SCHEMA_SQL).toContain(
        'user_id TEXT NOT NULL REFERENCES users(id)'
      );
    });

    it('should define categories table with optional profile_id', () => {
      expect(SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS categories');
      expect(SCHEMA_SQL).toContain('profile_id TEXT REFERENCES profiles(id)');
    });
  });
});

describe('Onboarding Requirements', () => {
  it('should not have any fixed user IDs in seed SQL', () => {
    const sql = getSeedSQL('test-device-id');

    // The old code had a fixed user ID
    expect(sql).not.toContain('00000000-0000-0000-0000-000000000000');
  });

  it('categories should be seeded globally (NULL profile_id) for onboarding', () => {
    const sql = getSeedSQL('test-device-id');

    // Count NULL occurrences in category inserts - should match number of categories
    const nullMatches = sql.match(/categories.*?NULL,/gs);
    expect(nullMatches).not.toBeNull();
    // Each category insert should have NULL as profile_id
    expect(nullMatches?.length).toBe(DEFAULT_CATEGORIES.length);
  });
});
