import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PeerDevice } from '@fluxby/core';

const mocks = vi.hoisted(() => ({
  peers: [] as Array<{
    id: string;
    destroyed: boolean;
    emit: (event: string, data?: unknown) => boolean;
  }>,
}));
vi.mock('peerjs', async () => {
  const { EventEmitter } = await import('node:events');
  class MockPeer extends EventEmitter {
    destroyed = false;
    constructor(readonly id: string) {
      super();
      mocks.peers.push(this);
    }
    destroy() {
      this.destroyed = true;
      this.removeAllListeners();
    }
  }
  return { Peer: MockPeer };
});

const device = (localProfileId?: string): PeerDevice => ({
  id: 'device-two',
  name: 'Other device',
  peerId: 'fluxby-other',
  lastSyncAt: null,
  isConnected: false,
  localProfileId,
});

describe('hasPairedDeviceForProfile', () => {
  it('only matches devices paired with the given profile', async () => {
    const { hasPairedDeviceForProfile } = await import('@fluxby/core');
    expect(hasPairedDeviceForProfile([device('one')], 'one')).toBe(true);
    expect(hasPairedDeviceForProfile([device('two')], 'one')).toBe(false);
    expect(hasPairedDeviceForProfile([], 'one')).toBe(false);
  });

  it('never matches without an active profile or for legacy pairings', async () => {
    const { hasPairedDeviceForProfile } = await import('@fluxby/core');
    expect(hasPairedDeviceForProfile([device('one')], null)).toBe(false);
    expect(hasPairedDeviceForProfile([device()], undefined)).toBe(false);
    expect(hasPairedDeviceForProfile([device()], 'one')).toBe(false);
  });
});

describe('PeerSync before signalling is needed', () => {
  afterEach(() => {
    mocks.peers = [];
  });

  it('does not load PeerJS or contact the server until initialized', async () => {
    vi.resetModules();
    const { PeerSync } = await import('../../packages/core/src/peer');
    const { getLoadedPeerJs } =
      await import('../../packages/core/src/peerjs-loader');
    const peer = new PeerSync({
      deviceId: 'device',
      deviceName: 'Device',
      profileId: 'profile',
    });

    expect(peer.startPairing()).toMatch(/^[A-Z2-9]{6}$/);
    expect(peer.getPeerId()).toBeNull();
    expect(peer.isConnected()).toBe(false);
    peer.destroy();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getLoadedPeerJs()).toBeNull();
    expect(mocks.peers).toHaveLength(0);
  });

  it('opens a fresh signalling connection after an earlier one was closed', async () => {
    const { PeerSync } = await import('@fluxby/core');
    const peer = new PeerSync({ deviceId: 'device', deviceName: 'Device' });

    const first = peer.initialize();
    await vi.waitFor(() => expect(mocks.peers).toHaveLength(1));
    mocks.peers[0].emit('open', mocks.peers[0].id);
    expect(await first).toBe(mocks.peers[0].id);

    // Closing after the last paired device is removed.
    peer.destroy();
    expect(mocks.peers[0].destroyed).toBe(true);
    expect(peer.getPeerId()).toBeNull();

    const second = peer.initialize();
    await vi.waitFor(() => expect(mocks.peers).toHaveLength(2));
    mocks.peers[1].emit('open', mocks.peers[1].id);
    expect(await second).toBe(mocks.peers[1].id);
    expect(peer.isConnected()).toBe(true);
    peer.destroy();
  });
});
