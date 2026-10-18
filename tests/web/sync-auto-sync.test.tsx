/** @vitest-environment jsdom */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncProvider, useSync } from '@/contexts/SyncContext';
import { en } from '@/lib/i18n/en';

const mocks = vi.hoisted(() => ({
  notify: (_change: { profileId: string }) => undefined,
  changes: [] as Array<{ table: string; row: { id: string } }>,
  sendChanges: vi.fn(),
  requestSync: vi.fn(async () => 0),
  capture: vi.fn(async () => []),
  release: () => undefined,
}));
vi.mock('@fluxby/core', async (importOriginal) => ({
  hasPairedDeviceForProfile: (
    await importOriginal<typeof import('@fluxby/core')>()
  ).hasPairedDeviceForProfile,
  createPeerSync: () => ({
    initialize: async () => undefined,
    destroy: vi.fn(),
    getPairedDevices: () => [
      { id: 'remote', localProfileId: 'profile', isConnected: true },
    ],
    sendChanges: mocks.sendChanges,
    requestSync: mocks.requestSync,
  }),
  formatRelativeTime: () => '',
}));
vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: (key: string) => {
    if (key === 'fluxby.deviceId') return 'device';
    if (key === 'fluxby.deviceName') return 'Device';
    if (key === 'fluxby.pairedDevices')
      return [{ id: 'remote', localProfileId: 'profile', isConnected: false }];
    return true;
  },
  writeToOPFSWithCache: vi.fn(async () => undefined),
  LATEST_MIGRATION_VERSION: 23,
}));
const db = {};
vi.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({ db, isReady: true }),
}));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfileId: 'profile' }),
}));
vi.mock('@/contexts/EncryptionContext', () => ({
  useEncryption: () => ({ isUnlocked: true }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en, language: 'en' }),
}));
vi.mock('@/lib/data-sync', () => ({
  ProfileDataSync: class {
    readonly profileId = 'profile';
    initialize = async () => undefined;
    captureLocalChanges = mocks.capture;
    getChanges = async () => [...mocks.changes];
  },
  subscribeLocalDataChanges: (listener: typeof mocks.notify) => {
    mocks.notify = listener;
    return vi.fn();
  },
}));

describe('automatic sync during an acknowledged delivery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.changes = [];
    mocks.sendChanges.mockResolvedValue(0);
    mocks.sendChanges.mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          mocks.release = () => resolve(0);
        })
    );
  });
  afterEach(() => vi.useRealTimers());

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      <SyncProvider>{children}</SyncProvider>
    </QueryClientProvider>
  );

  it('delivers a local mutation made while the previous snapshot awaits an acknowledgement', async () => {
    const { result, unmount } = renderHook(useSync, { wrapper });
    let initial: ReturnType<typeof result.current.forceSync> | undefined;
    await act(async () => {
      initial = result.current.forceSync();
    });
    expect(mocks.sendChanges).toHaveBeenCalledTimes(1);
    const firstSync = initial;
    if (!firstSync) throw new Error('Initial sync did not start');
    expect(mocks.sendChanges).toHaveBeenLastCalledWith('remote', []);

    mocks.changes = [{ table: 'accounts', row: { id: 'new-account' } }];
    await act(async () => {
      mocks.notify({ profileId: 'profile' });
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(mocks.sendChanges).toHaveBeenCalledTimes(1);
    await act(async () => {
      mocks.release();
      await firstSync;
    });
    expect(mocks.sendChanges).toHaveBeenCalledTimes(2);
    expect(mocks.sendChanges).toHaveBeenLastCalledWith('remote', mocks.changes);
    unmount();
  });
});
