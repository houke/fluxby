import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ constructed: 0 }));
vi.mock('peerjs', async () => {
  const { EventEmitter } = await import('node:events');
  class MockPeer extends EventEmitter {
    destroyed = false;
    constructor(readonly id: string) {
      super();
      mocks.constructed += 1;
    }
    destroy() {
      this.destroyed = true;
    }
  }
  return { Peer: MockPeer };
});

describe('on-demand PeerJS loading', () => {
  it('does not contact the signalling server when destroyed while PeerJS loads', async () => {
    vi.resetModules();
    const { PeerSync } = await import('../../packages/core/src/peer');
    const { getLoadedPeerJs } =
      await import('../../packages/core/src/peerjs-loader');
    expect(getLoadedPeerJs()).toBeNull();
    const peer = new PeerSync({ deviceId: 'device', deviceName: 'Device' });
    const failed = expect(peer.initialize()).rejects.toThrow('destroyed');
    peer.destroy();
    await failed;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.constructed).toBe(0);
  });

  it('constructs the peer once PeerJS has loaded', async () => {
    vi.resetModules();
    const { PeerSync } = await import('../../packages/core/src/peer');
    const peer = new PeerSync({ deviceId: 'device', deviceName: 'Device' });
    const pending = peer.initialize().catch(() => undefined);
    await vi.waitFor(() => expect(mocks.constructed).toBe(1));
    peer.destroy();
    await pending;
  });
});
