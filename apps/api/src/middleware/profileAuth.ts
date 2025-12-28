import type { Request } from 'express';
import { queryOne } from '../db/index.js';

/**
 * Profile authorization helpers for multi-tenant data isolation.
 *
 * SECURITY: These functions ensure data from one profile cannot be
 * accessed from another profile, preventing data leakage.
 */

/**
 * Get profileId from request (header or query param)
 * Returns null if not provided - caller should use default profile
 */
export function getProfileIdFromRequest(req: Request): number | null {
  const headerVal = req.headers['x-profile-id'];
  const queryVal = req.query.profileId;

  const raw = headerVal || queryVal;
  if (!raw) return null;

  const parsed = parseInt(String(raw), 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get default profile ID for the current user
 * Falls back to profile 1 if no profiles exist
 */
export function getDefaultProfileId(): number {
  const result = queryOne<{ id: number }>(
    'SELECT id FROM profiles WHERE user_id = 1 ORDER BY created_at ASC LIMIT 1'
  );
  return result?.id ?? 1;
}

/**
 * Get effective profileId - from request or default
 * This is the primary function to use in route handlers
 */
export function getEffectiveProfileId(req: Request): number {
  return getProfileIdFromRequest(req) ?? getDefaultProfileId();
}

/**
 * Verify an entity belongs to the given profile
 * Used for authorization checks before mutations
 */
export function verifyEntityBelongsToProfile(
  table:
    | 'accounts'
    | 'transactions'
    | 'categories'
    | 'budgets'
    | 'category_rules',
  entityId: number,
  profileId: number
): boolean {
  const result = queryOne<{ id: number }>(
    `SELECT id FROM ${table} WHERE id = ? AND profile_id = ?`,
    [entityId, profileId]
  );
  return !!result;
}

/**
 * Verify account belongs to profile (convenience wrapper)
 */
export function verifyAccountProfile(
  accountId: number,
  profileId: number
): boolean {
  return verifyEntityBelongsToProfile('accounts', accountId, profileId);
}

/**
 * Verify transaction belongs to profile
 * Special case: transactions don't have profile_id directly,
 * so we check via the account they belong to
 */
export function verifyTransactionProfile(
  transactionId: number,
  profileId: number
): boolean {
  const result = queryOne<{ id: number }>(
    `SELECT t.id FROM transactions t 
     JOIN accounts a ON t.account_id = a.id 
     WHERE t.id = ? AND a.profile_id = ?`,
    [transactionId, profileId]
  );
  return !!result;
}

/**
 * Verify category belongs to profile
 */
export function verifyCategoryProfile(
  categoryId: number,
  profileId: number
): boolean {
  return verifyEntityBelongsToProfile('categories', categoryId, profileId);
}

/**
 * Verify budget belongs to profile
 */
export function verifyBudgetProfile(
  budgetId: number,
  profileId: number
): boolean {
  return verifyEntityBelongsToProfile('budgets', budgetId, profileId);
}

/**
 * Get all account IDs belonging to a profile
 * Useful for filtering transactions by profile
 */
export function getProfileAccountIds(profileId: number): number[] {
  const rows = queryOne<{ ids: string }>(
    `SELECT GROUP_CONCAT(id) as ids FROM accounts WHERE profile_id = ?`,
    [profileId]
  );
  if (!rows?.ids) return [];
  return rows.ids.split(',').map((id) => parseInt(id, 10));
}
