/** @vitest-environment jsdom */
import { act, cleanup, renderHook, screen } from '@testing-library/react';
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
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    t: {
      common: { cancel: 'Cancel' },
      onboarding: {
        settings: {
          title: 'Onboarding',
          progress: 'Progress',
          completed: 'Completed',
          notStarted: 'Not started',
          continue: 'Continue',
          startTour: 'Start tour',
          restart: 'Restart',
          active: 'Tour active',
          chapters: 'Chapters',
        },
      },
    },
  }),
}));

import { OnboardingProvider } from '@/components/onboarding/OnboardingContext';
import { useOnboarding } from '@/components/onboarding/useOnboarding';
import { OnboardingSettings } from '@/components/settings/OnboardingSettings';
import { onboardingChapters } from '@/components/onboarding/onboarding-data';

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <OnboardingProvider>{children}</OnboardingProvider>
  </MemoryRouter>
);

const settingsWrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <OnboardingProvider>
      {children}
      <OnboardingSettings />
    </OnboardingProvider>
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

  it('preserves acknowledged, paused progress and user preferences across remounts', async () => {
    const first = renderHook(useOnboarding, { wrapper: settingsWrapper });
    await act(async () => first.result.current.refreshAfterSecuritySetup());
    await act(async () => first.result.current.nextStep());
    act(() => {
      first.result.current.goToChapter(4);
      first.result.current.setLanguage('en');
      first.result.current.setUserName('Returning user');
    });
    await act(async () => first.result.current.nextStep());
    act(() => first.result.current.dismissOnboarding());

    const savedState = { ...first.result.current.state };
    const savedProgress = screen.getByText(/^\d+%$/).textContent;
    expect(savedState.currentStepIndex).toBe(1);
    expect(savedProgress).not.toBe('0%');
    expect(screen.queryByText('Completed')).toBeNull();
    first.unmount();

    for (let i = 0; i < 2; i++) {
      const restored = renderHook(useOnboarding, {
        wrapper: settingsWrapper,
      });
      expect(restored.result.current.state).toEqual(savedState);
      expect(restored.result.current.needsOnboarding).toBe(false);
      expect(mocks.storage.get('fluxby_onboarding')).toEqual(savedState);
      expect(screen.getByText(/^\d+%$/).textContent).toBe(savedProgress);
      expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
      restored.unmount();
    }
  });

  it('persists full completion separately from welcome acknowledgement and clears both on restart', async () => {
    const first = renderHook(useOnboarding, { wrapper: settingsWrapper });
    await act(async () => first.result.current.refreshAfterSecuritySetup());
    await act(async () => first.result.current.nextStep());
    expect(mocks.storage.get('fluxby_onboarding_complete')).toBe(true);
    expect(mocks.storage.has('fluxby-onboarding-completed')).toBe(false);
    expect(screen.queryByText('Completed')).toBeNull();

    act(() => first.result.current.goToChapter(onboardingChapters.length - 1));
    await act(async () => first.result.current.completeOnboarding());
    expect(mocks.storage.get('fluxby-onboarding-completed')).toBe(true);
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    const savedState = { ...first.result.current.state };
    first.unmount();

    const restored = renderHook(useOnboarding, { wrapper: settingsWrapper });
    expect(restored.result.current.state).toEqual(savedState);
    expect(restored.result.current.needsOnboarding).toBe(false);
    expect(screen.getByText('Completed')).toBeTruthy();
    await act(async () => restored.result.current.startOnboarding(true));
    expect(mocks.storage.has('fluxby_onboarding_complete')).toBe(false);
    expect(mocks.storage.has('fluxby-onboarding-completed')).toBe(false);
    expect(restored.result.current.currentChapter?.id).toBe('welcome');
    expect(screen.queryByText('Completed')).toBeNull();
  });

  it('still suppresses the first tour when only the acknowledgement flag was saved', () => {
    mocks.storage.set('fluxby_onboarding_complete', true);
    const hook = renderHook(useOnboarding, { wrapper });
    expect(hook.result.current.state.hasCompletedOnboarding).toBe(true);
    expect(hook.result.current.state.isActive).toBe(false);
    expect(hook.result.current.needsOnboarding).toBe(false);
  });

  it('accepts legacy restart markers and resets completion when explicitly requested', () => {
    mocks.storage.set('fluxby-onboarding-restart', 'true');
    mocks.storage.set('fluxby_onboarding_complete', true);
    mocks.storage.set('fluxby-onboarding-completed', 'true');
    const hook = renderHook(useOnboarding, { wrapper: settingsWrapper });
    expect(hook.result.current.state.isActive).toBe(true);
    expect(hook.result.current.currentChapter?.id).toBe('welcome');
    expect(mocks.storage.has('fluxby-onboarding-restart')).toBe(false);
    expect(mocks.storage.has('fluxby_onboarding_complete')).toBe(false);
    expect(mocks.storage.has('fluxby-onboarding-completed')).toBe(false);
  });
});
