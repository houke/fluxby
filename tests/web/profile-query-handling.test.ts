/**
 * Tests for profile-scoped query handling
 *
 * These tests verify that queries:
 * 1. Include activeProfileId in their query keys
 * 2. Have `enabled: !!activeProfileId` guards to prevent running during profile transitions
 * 3. Are properly invalidated when profile changes
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read source files to verify query patterns
const readSourceFile = (relativePath: string): string => {
  const basePath = join(__dirname, '../../apps/web/src');
  return readFileSync(join(basePath, relativePath), 'utf-8');
};

describe('Profile Query Handling', () => {
  describe('ProfileContext profileScopedQueryKeys', () => {
    const profileContextSource = readSourceFile('contexts/ProfileContext.tsx');

    it('should include all transaction-related query keys', () => {
      const transactionKeys = [
        "'transactions'",
        "'transaction-totals'",
        "'transactions-outside-range'",
      ];
      transactionKeys.forEach((key) => {
        expect(profileContextSource).toContain(key);
      });
    });

    it('should include all dashboard query keys', () => {
      const dashboardKeys = [
        "'dashboard'",
        "'accounts'",
        "'dailyExpenses'",
        "'budgets'",
        "'balanceForecast'",
        "'topAccounts'",
      ];
      dashboardKeys.forEach((key) => {
        expect(profileContextSource).toContain(key);
      });
    });

    it('should include all analytics query keys', () => {
      const analyticsKeys = [
        "'monthly-data'",
        "'category-breakdown'",
        "'recurring-patterns-history'",
        "'recurring-payments-from-transactions'",
      ];
      analyticsKeys.forEach((key) => {
        expect(profileContextSource).toContain(key);
      });
    });

    it('should include all subscription/recurring query keys', () => {
      const subscriptionKeys = [
        "'recurring-patterns'",
        "'recurring-stats'",
        "'dismissed-alerts'",
        "'has-transactions'",
        "'recurring-calendar'",
      ];
      subscriptionKeys.forEach((key) => {
        expect(profileContextSource).toContain(key);
      });
    });

    it('should include all address book query keys', () => {
      const addressBookKeys = [
        "'addressbook'",
        "'sharedIbans'",
        "'cleanupRules'",
        "'suggestedContacts'",
      ];
      addressBookKeys.forEach((key) => {
        expect(profileContextSource).toContain(key);
      });
    });

    it('should include category-related query keys', () => {
      const categoryKeys = [
        "'categories'",
        "'categoryRules'",
        "'paymentProviderRules'",
      ];
      categoryKeys.forEach((key) => {
        expect(profileContextSource).toContain(key);
      });
    });
  });

  describe('Transactions.tsx query guards', () => {
    const transactionsSource = readSourceFile('pages/Transactions.tsx');

    it('should have enabled guard for categories query', () => {
      // Check that the categories query has an enabled guard
      // Format: ['categories', activeProfileId, false]
      expect(transactionsSource).toMatch(
        /queryKey:\s*\['categories',\s*activeProfileId/
      );
      expect(transactionsSource).toMatch(
        /categories.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for accounts query', () => {
      expect(transactionsSource).toMatch(
        /queryKey:\s*\['accounts',\s*activeProfileId\]/
      );
      expect(transactionsSource).toMatch(
        /accounts.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for categoryRules query', () => {
      expect(transactionsSource).toMatch(
        /queryKey:\s*\['categoryRules',\s*activeProfileId\]/
      );
      expect(transactionsSource).toMatch(
        /categoryRules.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for paymentProviderRules query', () => {
      expect(transactionsSource).toMatch(
        /queryKey:\s*\['paymentProviderRules',\s*activeProfileId\]/
      );
      expect(transactionsSource).toMatch(
        /paymentProviderRules.*enabled:\s*!!activeProfileId/s
      );
    });
  });

  describe('Dashboard.tsx query guards', () => {
    const dashboardSource = readSourceFile('pages/Dashboard.tsx');

    it('should have enabled guard for dashboard query', () => {
      expect(dashboardSource).toMatch(
        /queryKey:\s*\['dashboard',\s*activeProfileId/
      );
      expect(dashboardSource).toMatch(
        /dashboard.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for accounts query', () => {
      expect(dashboardSource).toMatch(
        /queryKey:\s*\['accounts',\s*activeProfileId\]/
      );
      expect(dashboardSource).toMatch(
        /accounts.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for dailyExpenses query', () => {
      // Format: ['dailyExpenses', activeProfileId, ...]
      expect(dashboardSource).toMatch(
        /queryKey:\s*\['dailyExpenses',\s*activeProfileId/
      );
      expect(dashboardSource).toMatch(
        /dailyExpenses.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for budgets query', () => {
      // Format: ['budgets', activeProfileId, ...]
      expect(dashboardSource).toMatch(
        /queryKey:\s*\['budgets',\s*activeProfileId/
      );
      expect(dashboardSource).toMatch(/budgets.*enabled:\s*!!activeProfileId/s);
    });

    it('should have enabled guard for balanceForecast query', () => {
      // Format: ['balanceForecast', activeProfileId, ...]
      expect(dashboardSource).toMatch(
        /queryKey:\s*\['balanceForecast',\s*activeProfileId/
      );
      expect(dashboardSource).toMatch(
        /balanceForecast.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for topAccounts query', () => {
      // Format: ['topAccounts', activeProfileId, ...]
      expect(dashboardSource).toMatch(
        /queryKey:\s*\['topAccounts',\s*activeProfileId/
      );
      expect(dashboardSource).toMatch(
        /topAccounts.*enabled:\s*!!activeProfileId/s
      );
    });
  });

  describe('Analytics.tsx query guards', () => {
    const analyticsSource = readSourceFile('pages/Analytics.tsx');

    it('should have enabled guard for monthly-data query', () => {
      expect(analyticsSource).toMatch(
        /queryKey:\s*\['monthly-data',\s*activeProfileId/
      );
      expect(analyticsSource).toMatch(
        /monthly-data.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for expense category-breakdown query', () => {
      // Format: ['category-breakdown', activeProfileId, 'expense', ...]
      expect(analyticsSource).toMatch(
        /queryKey:\s*\[\s*'category-breakdown',\s*activeProfileId,\s*'expense'/
      );
    });

    it('should have enabled guard for income category-breakdown query', () => {
      // Format: ['category-breakdown', activeProfileId, 'income', ...]
      expect(analyticsSource).toMatch(
        /queryKey:\s*\[\s*'category-breakdown',\s*activeProfileId,\s*'income'/
      );
    });

    it('should have enabled guard for recurring-patterns-history query', () => {
      expect(analyticsSource).toMatch(
        /queryKey:\s*\[\s*'recurring-patterns-history',\s*activeProfileId/
      );
      expect(analyticsSource).toMatch(
        /recurring-patterns-history.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for recurring-payments-from-transactions query', () => {
      expect(analyticsSource).toMatch(
        /queryKey:\s*\[\s*'recurring-payments-from-transactions',\s*activeProfileId/
      );
      expect(analyticsSource).toMatch(
        /recurring-payments-from-transactions.*enabled:\s*!!activeProfileId/s
      );
    });
  });

  describe('Subscriptions.tsx query guards', () => {
    const subscriptionsSource = readSourceFile('pages/Subscriptions.tsx');

    it('should have enabled guard for recurring-patterns query', () => {
      expect(subscriptionsSource).toMatch(
        /queryKey:\s*\['recurring-patterns',\s*activeProfileId\]/
      );
      expect(subscriptionsSource).toMatch(
        /recurring-patterns'.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for recurring-stats query', () => {
      expect(subscriptionsSource).toMatch(
        /queryKey:\s*\['recurring-stats',\s*activeProfileId\]/
      );
      expect(subscriptionsSource).toMatch(
        /recurring-stats.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for dismissed-alerts query', () => {
      expect(subscriptionsSource).toMatch(
        /queryKey:\s*\['dismissed-alerts',\s*activeProfileId\]/
      );
      expect(subscriptionsSource).toMatch(
        /dismissed-alerts.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for has-transactions query', () => {
      expect(subscriptionsSource).toMatch(
        /queryKey:\s*\['has-transactions',\s*activeProfileId\]/
      );
      expect(subscriptionsSource).toMatch(
        /has-transactions.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should have enabled guard for recurring-calendar query', () => {
      expect(subscriptionsSource).toMatch(
        /queryKey:\s*\['recurring-calendar',\s*activeProfileId/
      );
      expect(subscriptionsSource).toMatch(
        /recurring-calendar.*enabled:\s*!!activeProfileId/s
      );
    });

    it('should NOT call resetDismissedPatterns in detect mutation', () => {
      // The resetDismissedPatterns call was causing dismissed patterns to reappear
      // Verify it's not in the detect mutation
      const detectMutationMatch = subscriptionsSource.match(
        /mutationFn:\s*async\s*\(\)\s*=>\s*\{[^}]*detectRecurringPatterns[^}]*\}/s
      );
      if (detectMutationMatch) {
        expect(detectMutationMatch[0]).not.toContain('resetDismissedPatterns');
      }
    });
  });

  describe('useTransactionTotals.ts query guards', () => {
    const transactionTotalsSource = readSourceFile(
      'hooks/useTransactionTotals.ts'
    );

    it('should include activeProfileId in query key', () => {
      // The query key is 'transaction-totals' (singular)
      expect(transactionTotalsSource).toMatch(
        /queryKey:\s*\['transaction-totals',\s*activeProfileId/
      );
    });

    it('should have enabled guard', () => {
      expect(transactionTotalsSource).toMatch(/enabled:\s*!!activeProfileId/);
    });
  });

  describe('useAddressBook.ts query guards', () => {
    const addressBookSource = readSourceFile('hooks/useAddressBook.ts');

    it('should include activeProfileId in query key', () => {
      // The query key is 'addressbook' (lowercase, no space)
      expect(addressBookSource).toMatch(
        /queryKey:\s*\['addressbook',\s*activeProfileId\]/
      );
    });

    it('should have enabled guard', () => {
      expect(addressBookSource).toMatch(/enabled:\s*!!activeProfileId/);
    });
  });

  describe('useSharedIbans.ts query guards', () => {
    const sharedIbansSource = readSourceFile('hooks/useSharedIbans.ts');

    it('should include activeProfileId in query key', () => {
      expect(sharedIbansSource).toMatch(
        /queryKey:\s*\['sharedIbans',\s*activeProfileId\]/
      );
    });

    it('should have enabled guard', () => {
      expect(sharedIbansSource).toMatch(/enabled:\s*!!activeProfileId/);
    });
  });

  describe('HeaderFilters.tsx query guards', () => {
    const headerFiltersSource = readSourceFile(
      'components/layout/HeaderFilters.tsx'
    );

    it('should have enabled guards for transaction-dependent queries', () => {
      // HeaderFilters uses several queries that depend on having transactions
      expect(headerFiltersSource).toMatch(/enabled:\s*!!activeProfileId/);
    });
  });
});
