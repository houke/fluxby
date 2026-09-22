/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React, { type ReactNode } from 'react';

const mocks = vi.hoisted(() => ({
  storage: new Map<string, unknown>(),
  invalidate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: (key: string) => mocks.storage.get(key) ?? null,
  writeToOPFSWithCache: async (key: string, value: unknown) => {
    mocks.storage.set(key, value);
  },
  deleteFromOPFSWithCache: async (key: string) => {
    mocks.storage.delete(key);
  },
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
  useQuery: () => ({
    data: { id: 'user', name: 'Test' },
    isLoading: false,
    isFetched: true,
  }),
}));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({
    profiles: [],
    activeProfileId: null,
    switchProfile: vi.fn(),
    setProfileHidden: vi.fn(),
  }),
}));
vi.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({ isReady: true }),
}));
vi.mock('@/contexts/EncryptionContext', () => ({
  useEncryption: () => ({ isEncryptionEnabled: true }),
}));
vi.mock('@/lib/db-singleton', () => ({ isDatabaseReady: () => true }));
vi.mock('@/lib/api', () => ({
  api: { getUser: vi.fn(), updateUser: vi.fn() },
}));
vi.mock('@fluxby/shared', () => ({ DEMO_PROFILE_ID: 'demo' }));

import { OnboardingProvider } from '@/components/onboarding/OnboardingContext';
import { useOnboarding } from '@/components/onboarding/useOnboarding';

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <OnboardingProvider>{children}</OnboardingProvider>
  </MemoryRouter>
);

describe('first-run tour lifecycle', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React);
    mocks.storage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('opens a pending first tour after an encryption-triggered reload', () => {
    mocks.storage.set('fluxby-onboarding-restart', true);
    const hook = renderHook(useOnboarding, { wrapper });
    expect(hook.result.current.state.isActive).toBe(true);
    expect(hook.result.current.currentChapter?.id).toBe('welcome');
    expect(mocks.storage.has('fluxby-onboarding-restart')).toBe(false);
    expect(mocks.storage.has('fluxby_onboarding_complete')).toBe(false);
  });

  it('opens after setup, persists acknowledgement at welcome, continues now and stays closed after remount', async () => {
    const first = renderHook(useOnboarding, { wrapper });
    expect(mocks.storage.has('fluxby_onboarding_complete')).toBe(false);
    await act(async () => first.result.current.refreshAfterSecuritySetup());
    expect(first.result.current.state.isActive).toBe(true);
    expect(first.result.current.currentChapter?.id).toBe('welcome');
    expect(mocks.storage.has('fluxby_onboarding_complete')).toBe(false);

    await act(async () => {
      await first.result.current.nextStep();
    });
    expect(mocks.storage.get('fluxby_onboarding_complete')).toBe(true);
    expect(first.result.current.state.isActive).toBe(true);
    expect(first.result.current.state.currentChapterIndex).toBe(1);
    first.unmount();

    const second = renderHook(useOnboarding, { wrapper });
    expect(second.result.current.state.isActive).toBe(false);
    // Even if the demo profile has been removed, acknowledgement wins.
    expect(second.result.current.needsOnboarding).toBe(false);
    await act(async () => second.result.current.startOnboarding(true));
    expect(second.result.current.state.isActive).toBe(true);
    expect(second.result.current.currentChapter?.id).toBe('welcome');
  });
});
