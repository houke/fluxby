/** @vitest-environment jsdom */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncProvider, useSync } from '@/contexts/SyncContext';
import { en } from '@/lib/i18n/en';

const mocks = vi.hoisted(() => ({
  activeProfileId: 'profile-one',
  db: {},
  createPeerSync: vi.fn(),
  resolvers: [] as Array<() => void>,
  peers: [] as Array<{
    initialize: () => Promise<void>;
    destroy: () => void;
    getPairedDevices: () => [];
  }>,
}));

vi.mock('@fluxby/core', () => ({
  createPeerSync: mocks.createPeerSync,
  formatRelativeTime: () => '',
}));
vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: (key: string) => {
    if (key === 'fluxby.deviceId') return 'device-one';
    if (key === 'fluxby.deviceName') return 'Test device';
    if (key === 'fluxby.pairedDevices') return [];
    return true;
  },
  writeToOPFSWithCache: vi.fn(async () => undefined),
  LATEST_MIGRATION_VERSION: 17,
}));
vi.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({ db: mocks.db, isReady: true }),
}));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfileId: mocks.activeProfileId }),
}));
vi.mock('@/contexts/EncryptionContext', () => ({
  useEncryption: () => ({ isUnlocked: true }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en, language: 'en' }),
}));
vi.mock('@/lib/data-sync', () => ({
  ProfileDataSync: class {
    constructor(
      _db: unknown,
      readonly profileId: string
    ) {}
    initialize(): Promise<void> {
      return new Promise((resolve) => mocks.resolvers.push(() => resolve()));
    }
  },
  subscribeLocalDataChanges: () => vi.fn(),
}));

describe('Sync snapshot initialization lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activeProfileId = 'profile-one';
    mocks.resolvers = [];
    mocks.peers = [];
    mocks.createPeerSync.mockImplementation(() => {
      const peer = {
        initialize: vi.fn(async () => undefined),
        destroy: vi.fn(),
        getPairedDevices: (): [] => [],
      };
      mocks.peers.push(peer);
      return peer;
    });
  });

  const createWrapper = () => {
    const client = new QueryClient();
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <SyncProvider>{children}</SyncProvider>
      </QueryClientProvider>
    );
  };

  it('does not start signalling after unmount while the profile snapshot is still loading', async () => {
    const { unmount } = renderHook(useSync, { wrapper: createWrapper() });
    const peer = mocks.peers[0];
    expect(peer.initialize).not.toHaveBeenCalled();

    unmount();
    await act(async () => mocks.resolvers[0]());

    expect(peer.destroy).toHaveBeenCalledTimes(1);
    expect(peer.initialize).not.toHaveBeenCalled();
  });

  it('only initializes signalling for the current profile after overlapping snapshot loads', async () => {
    const { result, rerender } = renderHook(useSync, {
      wrapper: createWrapper(),
    });
    const oldPeer = mocks.peers[0];
    mocks.activeProfileId = 'profile-two';
    rerender();
    const currentPeer = mocks.peers[1];

    await act(async () => {
      mocks.resolvers[0]();
      mocks.resolvers[1]();
    });

    expect(oldPeer.destroy).toHaveBeenCalledTimes(1);
    expect(oldPeer.initialize).not.toHaveBeenCalled();
    expect(currentPeer.initialize).toHaveBeenCalledTimes(1);
    expect(result.current.isInitialized).toBe(true);
  });
});
