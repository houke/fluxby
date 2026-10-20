/** @vitest-environment jsdom */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext';

vi.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({ db: null, isReady: false }),
}));
vi.mock('@/lib/data-service', () => ({ createDataService: vi.fn() }));
vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: () => 'profile-one',
  writeToOPFSWithCache: vi.fn(async () => undefined),
  deleteFromOPFSWithCache: vi.fn(async () => undefined),
  readFromOPFS: vi.fn(async () => null),
}));

describe('Profile switching cache lifecycle', () => {
  afterEach(() => vi.restoreAllMocks());

  it('clears every reviewed profile surface and invalidates the selected profile in a single pass', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const roots = [
      'accounts',
      'transactions',
      'categories',
      'budgets',
      'recentTransactions',
      'proposedBudgets',
      'categoryStatsByPeriod',
      'monthly-expenses-by-category',
      'planning',
      'household-planning',
      'import-history',
      'import-profiles',
      'import-recovery',
      'import-batches',
      'import-freshness',
      'spotlight-transactions',
      'contact-transactions',
      'pattern-transactions',
    ];
    for (const root of roots) {
      queryClient.setQueryData([root, 'profile-one'], { oldProfile: true });
      queryClient.setQueryData([root, 'profile-two'], {
        selectedProfile: true,
      });
    }
    queryClient.setQueryData(['user'], { name: 'Global user' });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>{children}</ProfileProvider>
      </QueryClientProvider>
    );
    const { result, unmount } = renderHook(useProfile, { wrapper });

    act(() => result.current.switchProfile('profile-two'));

    expect(result.current.activeProfileId).toBe('profile-two');
    for (const root of roots) {
      expect(queryClient.getQueryData([root, 'profile-one'])).toBeUndefined();
      expect(queryClient.getQueryData([root, 'profile-two'])).toEqual({
        selectedProfile: true,
      });
      expect(
        queryClient.getQueryState([root, 'profile-two'])?.isInvalidated
      ).toBe(true);
    }
    expect(queryClient.getQueryData(['user'])).toEqual({ name: 'Global user' });
    expect(queryClient.getQueryState(['user'])?.isInvalidated).toBe(false);
    expect(invalidate).toHaveBeenCalledTimes(1);

    unmount();
    queryClient.clear();
  });
});
