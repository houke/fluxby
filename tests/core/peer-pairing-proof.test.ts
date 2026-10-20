import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PeerSync,
  computePairingProof,
  createEncryptionSession,
  completeKeyExchange,
  decryptMessage,
  derivePairingKey,
  encryptMessage,
  isEncryptedEnvelope,
  verifyPairingProof,
  type PairingMessage,
  type PeerDevice,
  type SyncEncryptionSession,
} from '@fluxby/core';

type Endpoint = { emit: (event: string, data?: unknown) => boolean };
/** Decides what reaches `to` when `from` sends; the default delivers as is. */
type Relay = (from: Endpoint, to: Endpoint, data: unknown) => Promise<void>;

const mocks = vi.hoisted(() => ({
  peers: new Map<string, { emit: (event: string, data?: unknown) => void }>(),
  relay: null as Relay | null,
}));

vi.mock('peerjs', async () => {
  const { EventEmitter } = await import('node:events');
  // Messages pass the relay one at a time, in order, like a real channel.
  let queue = Promise.resolve();
  class Connection extends EventEmitter {
    open = false;
    other?: Connection;
    constructor(readonly peer: string) {
      super();
    }
    send(data: unknown) {
      const to = this.other;
      if (!to) return;
      queue = queue.then(async () => {
        await Promise.resolve();
        if (mocks.relay) await mocks.relay(this, to, data);
        else to.emit('data', data);
      });
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
    open = false;
    constructor(readonly id: string) {
      super();
      mocks.peers.set(id, this);
      queueMicrotask(() => {
        this.open = true;
        this.emit('open', id);
      });
    }
    connect(id: string) {
      const target = mocks.peers.get(id);
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
      this.open = false;
      mocks.peers.delete(this.id);
      this.removeAllListeners();
    }
  }
  return { default: MockPeer, Peer: MockPeer };
});

const live: PeerSync[] = [];
afterEach(() => {
  live.forEach((sync) => sync.destroy());
  live.length = 0;
  mocks.peers.clear();
  mocks.relay = null;
});

function device(deviceId: string, profileId: string) {
  const paired = vi.fn<(d: PeerDevice, secret?: string) => void>();
  const pairingRequests = vi.fn();
  const codeUsed = vi.fn();
  const errors = vi.fn();
  const sync = new PeerSync({
    deviceId,
    deviceName: deviceId.toUpperCase(),
    profileId,
    schemaVersion: 23,
    getActiveProfileId: () => profileId,
    onSyncReceived: async () => 0,
    onSyncRequested: async () => [],
    onPairingRequest: (name, accept) => {
      pairingRequests(name);
      accept();
    },
    onPaired: paired,
    onPairingCodeUsed: codeUsed,
    onError: errors,
  });
  live.push(sync);
  return { sync, paired, pairingRequests, codeUsed, errors };
}

/**
 * A signalling server in the middle: it runs its own ECDH session with each
 * device, so it can read and rewrite every message between them.
 */
function interceptor(
  rewrite: (
    message: PairingMessage,
    reply: (message: PairingMessage) => Promise<void>
  ) => PairingMessage | null = (message) => message
) {
  const sessions = new Map<Endpoint, Promise<SyncEncryptionSession>>();
  const seen: PairingMessage[] = [];
  const session = (endpoint: Endpoint) => {
    let pending = sessions.get(endpoint);
    if (!pending) {
      pending = createEncryptionSession('attacker');
      sessions.set(endpoint, pending);
    }
    return pending;
  };
  const sendTo = async (endpoint: Endpoint, message: PairingMessage) => {
    const { envelope, session: next } = await encryptMessage(
      await session(endpoint),
      message
    );
    sessions.set(endpoint, Promise.resolve(next));
    endpoint.emit('data', envelope);
  };
  const relay: Relay = async (from, to, data) => {
    const record = data as { type?: string; publicKey?: never };
    if (record.type === 'key-exchange') {
      const own = await session(from);
      sessions.set(
        from,
        Promise.resolve(await completeKeyExchange(own, record.publicKey))
      );
      // The receiving device gets the attacker's key instead.
      to.emit('data', {
        type: 'key-exchange',
        publicKey: (await session(to)).localKeyPair.publicKeyJwk,
      });
      return;
    }
    if (!isEncryptedEnvelope(data)) return;
    const message = await decryptMessage<PairingMessage>(
      await session(from),
      data
    );
    seen.push(message);
    const forwarded = rewrite(message, (reply) => sendTo(from, reply));
    if (forwarded) await sendTo(to, forwarded);
  };
  mocks.relay = relay;
  return { seen };
}

async function start() {
  const requester = device('device-a', 'profile-a');
  const responder = device('device-b', 'profile-b');
  await Promise.all([requester.sync.initialize(), responder.sync.initialize()]);
  const target = responder.sync.getPeerId();
  if (!target) throw new Error('No peer ID');
  return { requester, responder, target };
}

describe('pairing proof helpers', () => {
  const keys = {
    requesterPublicKey: { x: 'ax', y: 'ay' },
    responderPublicKey: { x: 'bx', y: 'by' },
  };
  const request = {
    role: 'request' as const,
    requesterDeviceId: 'device-a',
    ...keys,
  };

  it('only verifies for the same code, session keys, role and devices', async () => {
    const key = await derivePairingKey('ABC234', keys);
    const proof = await computePairingProof(key, request);
    expect(proof).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await verifyPairingProof(key, proof, request)).toBe(true);

    const otherCode = await derivePairingKey('ABC235', keys);
    expect(await verifyPairingProof(otherCode, proof, request)).toBe(false);
    const relayedKeys = {
      requesterPublicKey: keys.requesterPublicKey,
      responderPublicKey: { x: 'mx', y: 'my' },
    };
    const relayed = await derivePairingKey('ABC234', relayedKeys);
    expect(
      await verifyPairingProof(relayed, proof, { ...request, ...relayedKeys })
    ).toBe(false);
    expect(
      await verifyPairingProof(key, proof, {
        ...request,
        requesterDeviceId: 'device-c',
      })
    ).toBe(false);
    expect(
      await verifyPairingProof(key, proof, {
        ...request,
        role: 'accept',
        responderDeviceId: 'device-b',
      })
    ).toBe(false);
    expect(await verifyPairingProof(key, 'ABC234', request)).toBe(false);
    expect(await verifyPairingProof(key, undefined, request)).toBe(false);
  });
});

describe('pairing through a relaying signalling server', () => {
  it('rejects a man-in-the-middle with two ECDH sessions even when it relays the correct code', async () => {
    const { requester, responder, target } = await start();
    const code = responder.sync.startPairing();
    const { seen } = interceptor();

    await expect(requester.sync.connectWithCode(target, code)).rejects.toThrow(
      'Invalid or expired pairing code'
    );

    // The attacker did sit in the middle and read the pairing request…
    const request = seen.find((message) => message.type === 'pairing-request');
    expect(request).toMatchObject({ deviceId: 'device-a', protocolVersion: 3 });
    // …but it never saw the code, and nothing paired or handed over a secret.
    expect(JSON.stringify(seen)).not.toContain(code);
    expect(seen.map((message) => message.type)).toEqual([
      'pairing-request',
      'pairing-reject',
    ]);
    expect(responder.pairingRequests).not.toHaveBeenCalled();
    expect(responder.paired).not.toHaveBeenCalled();
    expect(requester.paired).not.toHaveBeenCalled();
    expect(requester.sync.getPairedDevices()).toHaveLength(0);
    expect(responder.sync.getPairedDevices()).toHaveLength(0);
  });

  it('rejects an attacker that answers the pairing request itself', async () => {
    const { requester, responder, target } = await start();
    const code = responder.sync.startPairing();
    interceptor((message, reply) => {
      if (message.type !== 'pairing-request') return message;
      void reply({
        type: 'pairing-accept',
        deviceId: 'device-b',
        deviceName: 'B',
        profileId: 'profile-b',
        schemaVersion: 23,
        protocolVersion: 3,
        supportsFragmentation: true,
        // Copying the requester's proof does not prove the code here.
        proof: message.proof,
        reconnectSecret: 'A'.repeat(43),
      });
      return null;
    });

    await expect(requester.sync.connectWithCode(target, code)).rejects.toThrow(
      'Pairing could not be verified'
    );
    expect(requester.paired).not.toHaveBeenCalled();
    expect(requester.sync.getPairedDevices()).toHaveLength(0);
    expect(responder.paired).not.toHaveBeenCalled();
  });

  it('rejects a request downgraded to the old plaintext code format', async () => {
    const { requester, responder, target } = await start();
    const code = responder.sync.startPairing();
    interceptor((message) =>
      message.type === 'pairing-request'
        ? ({
            ...message,
            proof: undefined,
            pairingCode: code,
            protocolVersion: 2,
          } as unknown as PairingMessage)
        : message
    );

    await expect(requester.sync.connectWithCode(target, code)).rejects.toThrow(
      'protocol version mismatch'
    );
    expect(responder.paired).not.toHaveBeenCalled();
  });

  it('allows one attempt per code', async () => {
    const { requester, responder, target } = await start();
    const code = responder.sync.startPairing();
    const wrong = code === 'AAAAAA' ? 'BBBBBB' : 'AAAAAA';

    await expect(requester.sync.connectWithCode(target, wrong)).rejects.toThrow(
      'Invalid or expired pairing code'
    );
    // The showing device learns its code is gone, to display a new one.
    expect(responder.codeUsed).toHaveBeenCalledTimes(1);
    const second = device('device-c', 'profile-c');
    await second.sync.initialize();
    await expect(second.sync.connectWithCode(target, code)).rejects.toThrow(
      'Invalid or expired pairing code'
    );
    expect(responder.paired).not.toHaveBeenCalled();
    // Without a pending code nothing more is used up.
    expect(responder.codeUsed).toHaveBeenCalledTimes(1);

    // A new code works again.
    await expect(
      second.sync.connectWithCode(target, responder.sync.startPairing())
    ).resolves.toMatchObject({ id: 'device-b' });
    expect(responder.codeUsed).toHaveBeenCalledTimes(1);
  });
});
