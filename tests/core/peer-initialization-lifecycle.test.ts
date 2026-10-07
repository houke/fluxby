import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PeerSync } from '@fluxby/core';

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

describe('peer signalling initialization cancellation', () => {
  let peer: PeerSync;
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.peers = [];
    peer = new PeerSync({ deviceId: 'device', deviceName: 'Device' });
  });
  afterEach(() => {
    peer.destroy();
    vi.useRealTimers();
  });

  it('cancels the initialization timeout on destruction', async () => {
    const failed = expect(peer.initialize()).rejects.toThrow('destroyed');
    peer.destroy();
    await failed;
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(30000);
    expect(mocks.peers).toHaveLength(1);
    expect(mocks.peers[0].destroyed).toBe(true);
    expect(peer.getPeerId()).toBeNull();
  });

  it('does not resurrect a peer when destroyed during an unavailable-ID retry', async () => {
    const failed = expect(peer.initialize()).rejects.toThrow('destroyed');
    mocks.peers[0].emit('error', { type: 'unavailable-id' });
    peer.destroy();
    await failed;
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(30000);
    expect(mocks.peers).toHaveLength(1);
    expect(peer.getPeerId()).toBeNull();
  });

  it('cancels delayed retries when initialization times out', async () => {
    const failed = expect(peer.initialize()).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(13000);
    mocks.peers[0].emit('error', { type: 'unavailable-id' });
    await vi.advanceTimersByTimeAsync(2000);
    await failed;
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(30000);
    expect(mocks.peers).toHaveLength(1);
    expect(peer.getPeerId()).toBeNull();
  });

  it('allows fresh initialization after an earlier operation was canceled', async () => {
    const canceled = expect(peer.initialize()).rejects.toThrow('destroyed');
    const initialized = peer.initialize();
    await canceled;
    const current = mocks.peers[1];
    current.emit('open', current.id);
    expect(await initialized).toBe(current.id);
    expect(peer.getPeerId()).toBe(current.id);
    expect(vi.getTimerCount()).toBe(0);
  });
});
