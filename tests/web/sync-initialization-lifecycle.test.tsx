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
  storedPairedDevices: [] as Array<Record<string, unknown>>,
  peers: [] as Array<MockPeer>,
}));

type MockPeer = {
  initialize: ReturnType<typeof vi.fn<() => Promise<string>>>;
  destroy: ReturnType<typeof vi.fn<() => void>>;
  getPairedDevices: () => [];
  getPeerId: () => string | null;
  startPairing: () => string;
  connectWithCode: ReturnType<
    typeof vi.fn<(peerId: string, code: string) => Promise<void>>
  >;
  disconnect: ReturnType<typeof vi.fn<(deviceId: string) => void>>;
  /** Settle the latest signalling connection attempt. */
  open: () => void;
};

const pairedDevice = (localProfileId: string) => ({
  id: `device-${localProfileId}`,
  name: 'Other device',
  peerId: 'fluxby-other',
  lastSyncAt: null,
  isConnected: false,
  localProfileId,
  remoteProfileId: 'remote-profile',
  protocolVersion: 2,
});

vi.mock('@fluxby/core', async (importOriginal) => ({
  createPeerSync: mocks.createPeerSync,
  formatRelativeTime: () => '',
  hasPairedDeviceForProfile: (
    await importOriginal<typeof import('@fluxby/core')>()
  ).hasPairedDeviceForProfile,
}));
vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: (key: string) => {
    if (key === 'fluxby.deviceId') return 'device-one';
    if (key === 'fluxby.deviceName') return 'Test device';
    if (key === 'fluxby.pairedDevices') return mocks.storedPairedDevices;
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
    mocks.storedPairedDevices = [];
    mocks.createPeerSync.mockImplementation(() => {
      let peerId: string | null = null;
      let pending: { resolve: () => void; reject: (e: Error) => void }[] = [];
      const peer: MockPeer = {
        initialize: vi.fn(
          () =>
            new Promise<string>((resolve, reject) => {
              pending.push({
                resolve: () => {
                  peerId = `fluxby-peer-${mocks.peers.indexOf(peer)}`;
                  resolve(peerId);
                },
                reject,
              });
            })
        ),
        destroy: vi.fn(() => {
          peerId = null;
          for (const item of pending) item.reject(new Error('Peer destroyed'));
          pending = [];
        }),
        getPairedDevices: (): [] => [],
        getPeerId: () => peerId,
        startPairing: () => 'ABC234',
        connectWithCode: vi.fn(async () => undefined),
        disconnect: vi.fn(),
        open: () => {
          for (const item of pending) item.resolve();
          pending = [];
        },
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
    mocks.storedPairedDevices = [
      pairedDevice('profile-one'),
      pairedDevice('profile-two'),
    ];
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
    await act(async () => currentPeer.open());
    expect(result.current.isInitialized).toBe(true);
  });
});

describe('Sync signalling on demand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activeProfileId = 'profile-one';
    mocks.resolvers = [];
    mocks.peers = [];
    mocks.storedPairedDevices = [];
  });

  const createWrapper = () => {
    const client = new QueryClient();
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <SyncProvider>{children}</SyncProvider>
      </QueryClientProvider>
    );
  };
  const renderUnlocked = async () => {
    const rendered = renderHook(useSync, { wrapper: createWrapper() });
    await act(async () => mocks.resolvers[0]());
    return rendered;
  };

  it('does not contact the signalling server after unlock without paired devices', async () => {
    const { result } = await renderUnlocked();

    expect(mocks.peers[0].initialize).not.toHaveBeenCalled();
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isConnecting).toBe(false);
  });

  it('ignores devices paired with another profile', async () => {
    mocks.storedPairedDevices = [pairedDevice('profile-two')];
    await renderUnlocked();

    expect(mocks.peers[0].initialize).not.toHaveBeenCalled();
  });

  it('connects after unlock when the active profile has a paired device', async () => {
    mocks.storedPairedDevices = [pairedDevice('profile-one')];
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];

    expect(peer.initialize).toHaveBeenCalledTimes(1);
    expect(result.current.isConnecting).toBe(true);
    await act(async () => peer.open());
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isConnecting).toBe(false);
  });

  it('connects on demand when a pairing code is generated', async () => {
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];

    let generated!: Promise<string | null>;
    act(() => {
      generated = result.current.generateNewPairingCode();
    });
    await act(async () => undefined);
    expect(peer.initialize).toHaveBeenCalledTimes(1);
    expect(result.current.isConnecting).toBe(true);
    expect(result.current.pairingCode).toBeNull();

    await act(async () => peer.open());
    expect(await generated).toBe('fluxby-peer-0:ABC234');
    expect(result.current.pairingCode).toBe('fluxby-peer-0:ABC234');
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isConnecting).toBe(false);
  });

  it('shares one signalling connection between concurrent pairing actions', async () => {
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];

    let generated!: Promise<string | null>;
    let connected!: Promise<boolean>;
    act(() => {
      generated = result.current.generateNewPairingCode();
      connected = result.current.connectWithPairingCode('fluxby-other:XYZ789');
    });
    await act(async () => undefined);
    await act(async () => peer.open());

    expect(await generated).toBe('fluxby-peer-0:ABC234');
    expect(await connected).toBe(true);
    expect(peer.initialize).toHaveBeenCalledTimes(1);
    expect(peer.connectWithCode).toHaveBeenCalledWith('fluxby-other', 'XYZ789');
  });

  it('rejects a malformed pairing code without contacting the server', async () => {
    const { result } = await renderUnlocked();

    await expect(
      result.current.connectWithPairingCode('not-a-code')
    ).rejects.toThrow('Invalid pairing code');
    expect(mocks.peers[0].initialize).not.toHaveBeenCalled();
  });

  it('leaves no live peer when unmounted while connecting on demand', async () => {
    const { result, unmount } = await renderUnlocked();
    const peer = mocks.peers[0];

    let generated!: Promise<string | null>;
    act(() => {
      generated = result.current.generateNewPairingCode();
    });
    await act(async () => undefined);
    unmount();

    expect(await generated).toBeNull();
    expect(peer.destroy).toHaveBeenCalledTimes(1);
    expect(peer.getPeerId()).toBeNull();
  });

  it('allows retrying after a failed on-demand connection', async () => {
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];
    peer.initialize.mockRejectedValueOnce(new Error('offline'));

    await act(async () => {
      expect(await result.current.generateNewPairingCode()).toBeNull();
    });
    expect(result.current.lastError?.message).toBe('offline');
    expect(result.current.isConnecting).toBe(false);

    let generated!: Promise<string | null>;
    act(() => {
      generated = result.current.generateNewPairingCode();
    });
    await act(async () => undefined);
    await act(async () => peer.open());
    expect(await generated).toBe('fluxby-peer-0:ABC234');
    expect(result.current.lastError).toBeNull();
    expect(peer.initialize).toHaveBeenCalledTimes(2);
  });

  it('closes the signalling connection when the last paired device is removed', async () => {
    mocks.storedPairedDevices = [pairedDevice('profile-one')];
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];
    await act(async () => peer.open());
    expect(result.current.isInitialized).toBe(true);

    act(() => result.current.disconnectDevice('device-profile-one'));

    expect(peer.disconnect).toHaveBeenCalledWith('device-profile-one');
    expect(peer.destroy).toHaveBeenCalledTimes(1);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.pairedDevices).toEqual([]);
  });
});
