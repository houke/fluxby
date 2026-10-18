/** @vitest-environment jsdom */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PeerDevice, PeerOptions } from '@fluxby/core';
import { SyncProvider, canReconnect, useSync } from '@/contexts/SyncContext';
import { en } from '@/lib/i18n/en';
import { sealReconnectSecret } from '@/lib/sync-secrets';

const SECRET = 'A'.repeat(43);

const mocks = vi.hoisted(() => ({
  activeProfileId: 'profile-one',
  db: {},
  encryptionKey: new Uint8Array(32).fill(7),
  createPeerSync: vi.fn(),
  writes: [] as Array<[string, unknown]>,
  resolvers: [] as Array<() => void>,
  storedPairedDevices: [] as Array<Record<string, unknown>>,
  peers: [] as Array<MockPeer>,
}));

type MockPeer = {
  options: PeerOptions;
  initialize: ReturnType<typeof vi.fn<() => Promise<string>>>;
  destroy: ReturnType<typeof vi.fn<() => void>>;
  getPairedDevices: () => PeerDevice[];
  getPeerId: () => string | null;
  startPairing: () => string;
  connectWithCode: ReturnType<
    typeof vi.fn<(peerId: string, code: string) => Promise<void>>
  >;
  disconnect: ReturnType<typeof vi.fn<(deviceId: string) => void>>;
  restorePairedDevice: ReturnType<
    typeof vi.fn<(device: PeerDevice, secret: string) => boolean>
  >;
  canReconnect: (deviceId: string) => boolean;
  isSignallingOpen: () => boolean;
  reconnectPairedDevices: ReturnType<typeof vi.fn>;
  /** Settle the latest signalling connection attempt. */
  open: () => void;
};

const pairedDevice = (
  localProfileId: string,
  extra: Record<string, unknown> = {}
) => ({
  id: `device-${localProfileId}`,
  name: 'Other device',
  peerId: 'fluxby-other',
  lastSyncAt: null,
  isConnected: false,
  localProfileId,
  remoteProfileId: 'remote-profile',
  protocolVersion: 3,
  ...extra,
});
/** A pairing made with reconnect support, its secret sealed at rest. */
const reconnectableDevice = async (localProfileId: string) =>
  pairedDevice(localProfileId, {
    sealedReconnectSecret: await sealReconnectSecret(
      mocks.encryptionKey,
      `device-${localProfileId}`,
      SECRET
    ),
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
  writeToOPFSWithCache: vi.fn(async (key: string, value: unknown) => {
    mocks.writes.push([key, value]);
  }),
  LATEST_MIGRATION_VERSION: 17,
}));
vi.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({ db: mocks.db, isReady: true }),
}));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfileId: mocks.activeProfileId }),
}));
vi.mock('@/contexts/EncryptionContext', () => ({
  useEncryption: () => ({
    isUnlocked: true,
    encryptionKey: mocks.encryptionKey,
  }),
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
    captureLocalChanges = async () => [];
    getChanges = async () => [];
  },
  subscribeLocalDataChanges: () => vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.activeProfileId = 'profile-one';
  mocks.resolvers = [];
  mocks.peers = [];
  mocks.writes = [];
  mocks.storedPairedDevices = [];
  mocks.createPeerSync.mockImplementation((options: PeerOptions) => {
    let peerId: string | null = null;
    let pending: { resolve: () => void; reject: (e: Error) => void }[] = [];
    const restored = new Map<string, PeerDevice>();
    const peer: MockPeer = {
      options,
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
        restored.clear();
        for (const item of pending) item.reject(new Error('Peer destroyed'));
        pending = [];
      }),
      getPairedDevices: () => [...restored.values()],
      getPeerId: () => peerId,
      startPairing: () => 'ABC234',
      connectWithCode: vi.fn(async () => undefined),
      disconnect: vi.fn(),
      restorePairedDevice: vi.fn((device: PeerDevice) => {
        restored.set(device.id, { ...device, isConnected: false });
        return true;
      }),
      canReconnect: (deviceId) => restored.has(deviceId),
      isSignallingOpen: () => peerId !== null,
      reconnectPairedDevices: vi.fn(() => true),
      open: () => {
        for (const item of pending) item.resolve();
        pending = [];
      },
    };
    mocks.peers.push(peer);
    return peer;
  });
});

describe('Sync snapshot initialization lifecycle', () => {
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
      await reconnectableDevice('profile-one'),
      await reconnectableDevice('profile-two'),
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

    await vi.waitFor(() =>
      expect(currentPeer.initialize).toHaveBeenCalledTimes(1)
    );
    expect(oldPeer.destroy).toHaveBeenCalledTimes(1);
    expect(oldPeer.initialize).not.toHaveBeenCalled();
    await act(async () => currentPeer.open());
    expect(result.current.isInitialized).toBe(true);
  });
});

describe('Sync signalling on demand', () => {
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
    mocks.storedPairedDevices = [await reconnectableDevice('profile-two')];
    await renderUnlocked();

    expect(mocks.peers[0].initialize).not.toHaveBeenCalled();
  });

  it('connects after unlock when the active profile has a paired device', async () => {
    mocks.storedPairedDevices = [await reconnectableDevice('profile-one')];
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];

    await vi.waitFor(() => expect(peer.initialize).toHaveBeenCalledTimes(1));
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

  it('replaces a pairing code that was used up or is about to expire', async () => {
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];
    let generated!: Promise<string | null>;
    act(() => {
      generated = result.current.generateNewPairingCode();
    });
    await act(async () => undefined);
    await act(async () => peer.open());
    await generated;
    expect(result.current.pairingCode).toBe('fluxby-peer-0:ABC234');

    // A failed attempt used the code: the dialog generates a new one.
    act(() => peer.options.onPairingCodeUsed?.());
    expect(result.current.pairingCode).toBeNull();

    vi.useFakeTimers();
    try {
      await act(async () => {
        await result.current.generateNewPairingCode();
      });
      expect(result.current.pairingCode).toBe('fluxby-peer-0:ABC234');
      act(() => {
        vi.advanceTimersByTime(115_000);
      });
      expect(result.current.pairingCode).toBeNull();
    } finally {
      vi.useRealTimers();
    }
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
    mocks.storedPairedDevices = [await reconnectableDevice('profile-one')];
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];
    await vi.waitFor(() => expect(peer.initialize).toHaveBeenCalled());
    await act(async () => peer.open());
    expect(result.current.isInitialized).toBe(true);

    act(() => result.current.disconnectDevice('device-profile-one'));

    expect(peer.disconnect).toHaveBeenCalledWith('device-profile-one');
    expect(peer.destroy).toHaveBeenCalledTimes(1);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.pairedDevices).toEqual([]);
  });
});

describe('Paired devices reconnecting', () => {
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
  const lastStoredDevices = () =>
    mocks.writes.filter(([key]) => key === 'fluxby.pairedDevices').at(-1)?.[1];

  it('restores the pairing with its opened secret before connecting', async () => {
    mocks.storedPairedDevices = [await reconnectableDevice('profile-one')];
    await renderUnlocked();
    const peer = mocks.peers[0];

    await vi.waitFor(() => expect(peer.initialize).toHaveBeenCalled());
    expect(peer.restorePairedDevice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'device-profile-one' }),
      SECRET
    );
    expect(peer.restorePairedDevice.mock.invocationCallOrder[0]).toBeLessThan(
      peer.initialize.mock.invocationCallOrder[0]
    );
  });

  it('does not connect for pairings made without reconnect support', async () => {
    mocks.storedPairedDevices = [pairedDevice('profile-one')];
    const { result } = await renderUnlocked();

    expect(mocks.peers[0].initialize).not.toHaveBeenCalled();
    expect(canReconnect(result.current.pairedDevices[0])).toBe(false);
  });

  it('asks to pair again when a stored secret cannot be opened', async () => {
    mocks.storedPairedDevices = [
      pairedDevice('profile-one', {
        sealedReconnectSecret: await sealReconnectSecret(
          new Uint8Array(32).fill(1),
          'device-profile-one',
          SECRET
        ),
      }),
    ];
    const { result } = await renderUnlocked();

    await vi.waitFor(() =>
      expect(result.current.pairedDevices[0].reconnectIssue).toBe('pair-again')
    );
    expect(mocks.peers[0].restorePairedDevice).not.toHaveBeenCalled();
    expect(mocks.peers[0].initialize).not.toHaveBeenCalled();
  });

  it('stores the secret of a new pairing only in sealed form', async () => {
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];

    await act(async () => {
      peer.options.onPaired?.(
        pairedDevice('profile-one', { isConnected: true }) as PeerDevice,
        SECRET
      );
    });
    await vi.waitFor(() =>
      expect(result.current.pairedDevices[0].sealedReconnectSecret).toMatch(
        /^v1:/
      )
    );
    expect(JSON.stringify(result.current.pairedDevices)).not.toContain(SECRET);
    expect(JSON.stringify(lastStoredDevices())).not.toContain(SECRET);
    expect(canReconnect(result.current.pairedDevices[0])).toBe(true);
  });

  it('shows a reconnected device as connected and clears earlier issues', async () => {
    mocks.storedPairedDevices = [await reconnectableDevice('profile-one')];
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];
    await vi.waitFor(() => expect(peer.initialize).toHaveBeenCalled());
    await act(async () => peer.open());

    act(() =>
      peer.options.onReconnectIssue?.(
        pairedDevice('profile-one') as PeerDevice,
        'update-required'
      )
    );
    expect(result.current.pairedDevices[0].reconnectIssue).toBe(
      'update-required'
    );
    expect(JSON.stringify(lastStoredDevices())).not.toContain(
      'update-required'
    );

    act(() =>
      peer.options.onReconnected?.(
        pairedDevice('profile-one', {
          isConnected: true,
          peerId: 'fluxby-device-profile-one',
        }) as PeerDevice
      )
    );
    expect(result.current.pairedDevices[0]).toMatchObject({
      isConnected: true,
      peerId: 'fluxby-device-profile-one',
      reconnectIssue: undefined,
    });
    expect(result.current.pairedDevices[0].sealedReconnectSecret).toBeTruthy();
  });

  it('drops a pairing that the other device removed', async () => {
    mocks.storedPairedDevices = [await reconnectableDevice('profile-one')];
    const { result } = await renderUnlocked();

    act(() =>
      mocks.peers[0].options.onUnpaired?.(
        pairedDevice('profile-one') as PeerDevice
      )
    );
    expect(result.current.pairedDevices).toEqual([]);
    expect(lastStoredDevices()).toEqual([]);
  });

  it('retries waiting devices when the browser comes back online', async () => {
    mocks.storedPairedDevices = [await reconnectableDevice('profile-one')];
    const { result } = await renderUnlocked();
    const peer = mocks.peers[0];
    await vi.waitFor(() => expect(peer.initialize).toHaveBeenCalled());
    await act(async () => peer.open());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(peer.reconnectPairedDevices).toHaveBeenCalledWith({
      retryBlocked: false,
    });

    act(() => result.current.reconnectDevices());
    expect(peer.reconnectPairedDevices).toHaveBeenLastCalledWith({
      retryBlocked: true,
    });
  });

  it('postpones reconnects for devices paired with another local profile', async () => {
    mocks.storedPairedDevices = [await reconnectableDevice('profile-two')];
    await renderUnlocked();
    const isKnown = mocks.peers[0].options.isKnownDevice;

    expect(isKnown?.('device-profile-two')).toBe(true);
    expect(isKnown?.('device-unknown')).toBe(false);
  });
});
