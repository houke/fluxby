import { describe, expect, it, vi } from 'vitest';
import { PeerSync, type PeerDevice } from '@fluxby/core';

vi.mock('peerjs', async () => {
  const { EventEmitter } = await import('node:events');
  const peers = new Map<string, MockPeer>();
  class Connection extends EventEmitter {
    open = false;
    other?: Connection;
    constructor(readonly peer: string) {
      super();
    }
    send(data: unknown) {
      queueMicrotask(() => this.other?.emit('data', data));
    }
    close() {
      if (!this.open) return;
      this.open = false;
      this.emit('close');
      if (this.other?.open) {
        this.other.open = false;
        this.other.emit('close');
      }
    }
  }
  class MockPeer extends EventEmitter {
    destroyed = false;
    constructor(readonly id: string) {
      super();
      peers.set(id, this);
      queueMicrotask(() => this.emit('open', id));
    }
    connect(id: string) {
      const target = peers.get(id);
      const outgoing = new Connection(id);
      const incoming = new Connection(this.id);
      outgoing.other = incoming;
      incoming.other = outgoing;
      target?.emit('connection', incoming);
      queueMicrotask(() => {
        outgoing.open = incoming.open = true;
        incoming.emit('open');
        outgoing.emit('open');
      });
      return outgoing;
    }
    reconnect() {
      return this;
    }
    destroy() {
      this.destroyed = true;
      peers.delete(this.id);
      this.removeAllListeners();
    }
  }
  return { default: MockPeer, Peer: MockPeer };
});

describe('complete encrypted peer connection lifecycle', () => {
  it('pairs approved profiles and processes bidirectional push/request messages after connect resolves', async () => {
    const receivedA = vi.fn(async () => 1);
    const receivedB = vi.fn(async () => 2);
    const paired = vi.fn<(device: PeerDevice) => void>();
    const errors = vi.fn();
    const a = new PeerSync({
      deviceId: 'a',
      deviceName: 'A',
      profileId: 'profile-a',
      schemaVersion: 16,
      onSyncReceived: receivedA,
      onSyncRequested: async () => [],
      onError: errors,
    });
    const b = new PeerSync({
      deviceId: 'b',
      deviceName: 'B',
      profileId: 'profile-b',
      schemaVersion: 16,
      onSyncReceived: receivedB,
      onSyncRequested: async () => [],
      onError: errors,
      onPairingRequest: (_name, accept) => {
        accept();
      },
      onPaired: paired,
    });
    try {
      const [, peerB] = await Promise.all([a.initialize(), b.initialize()]);
      const device = await a.connectWithCode(peerB, b.startPairing());
      expect(device).toMatchObject({
        id: 'b',
        localProfileId: 'profile-a',
        remoteProfileId: 'profile-b',
      });
      expect(paired).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          id: 'a',
          localProfileId: 'profile-b',
          remoteProfileId: 'profile-a',
        })
      );
      expect(await a.sendChanges('b', [])).toBe(2);
      expect(await b.sendChanges('a', [])).toBe(1);
      expect(await a.requestSync('b')).toBe(1);
      expect(await b.requestSync('a')).toBe(2);
      expect(receivedA).toHaveBeenCalledTimes(2);
      expect(receivedB).toHaveBeenCalledTimes(2);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      a.destroy();
      b.destroy();
    }
  });
});
