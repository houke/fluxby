import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PeerSync,
  computeReconnectProof,
  generateReconnectSecret,
  homePeerId,
  isValidDeviceId,
  reconnectDelay,
  verifyReconnectProof,
  type PeerDevice,
  type PeerOptions,
} from '@fluxby/core';

const mocks = vi.hoisted(() => ({
  peers: new Map<string, { emit: (event: string, data?: unknown) => void }>(),
  dials: [] as string[],
}));

vi.mock('peerjs', async () => {
  const { EventEmitter } = await import('node:events');
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
      mocks.dials.push(`${this.id}->${id}`);
      const target = mocks.peers.get(id);
      const outgoing = new Connection(id);
      if (!target) {
        // Like the PeerJS server's EXPIRE message for an offline peer.
        queueMicrotask(() =>
          this.emit('error', {
            type: 'peer-unavailable',
            message: `Could not connect to peer ${id}`,
          })
        );
        return outgoing;
      }
      const incoming = new Connection(this.id);
      outgoing.other = incoming;
      incoming.other = outgoing;
      target.emit('connection', incoming);
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

type Side = {
  sync: PeerSync;
  received: ReturnType<typeof vi.fn>;
  paired: ReturnType<typeof vi.fn<(d: PeerDevice, s?: string) => void>>;
  reconnected: ReturnType<typeof vi.fn<(d: PeerDevice) => void>>;
  unpaired: ReturnType<typeof vi.fn<(d: PeerDevice) => void>>;
  issues: ReturnType<typeof vi.fn<(d: PeerDevice, issue: string) => void>>;
  errors: ReturnType<typeof vi.fn>;
};
const live: PeerSync[] = [];
afterEach(() => {
  live.forEach((sync) => sync.destroy());
  live.length = 0;
  mocks.peers.clear();
  mocks.dials = [];
});

function side(
  deviceId: string,
  profileId: string,
  extra: Partial<PeerOptions> = {}
): Side {
  const received = vi.fn(async () => 1);
  const paired = vi.fn<(d: PeerDevice, s?: string) => void>();
  const reconnected = vi.fn<(d: PeerDevice) => void>();
  const unpaired = vi.fn<(d: PeerDevice) => void>();
  const issues = vi.fn<(d: PeerDevice, issue: string) => void>();
  const errors = vi.fn();
  const sync = new PeerSync({
    deviceId,
    deviceName: deviceId.toUpperCase(),
    profileId,
    schemaVersion: 23,
    getActiveProfileId: () => profileId,
    onSyncReceived: received,
    onSyncRequested: async () => [],
    onPairingRequest: (_name, accept) => accept(),
    onPaired: paired,
    onReconnected: reconnected,
    onUnpaired: unpaired,
    onReconnectIssue: issues,
    onError: errors,
    ...extra,
  });
  live.push(sync);
  return { sync, received, paired, reconnected, unpaired, issues, errors };
}

/** Pair two fresh devices and return what each stored about the other. */
async function pairDevices() {
  const a = side('device-a', 'profile-a');
  const b = side('device-b', 'profile-b');
  await Promise.all([a.sync.initialize(), b.sync.initialize()]);
  const target = b.sync.getPeerId();
  if (!target) throw new Error('No peer ID');
  await a.sync.connectWithCode(target, b.sync.startPairing());
  await vi.waitFor(() => expect(b.paired).toHaveBeenCalledTimes(1));
  const [deviceOnA, secretOnA = ''] = a.paired.mock.calls[0];
  const [deviceOnB, secretOnB = ''] = b.paired.mock.calls[0];
  a.sync.destroy();
  b.sync.destroy();
  return { deviceOnA, secretOnA, deviceOnB, secretOnB };
}

describe('reconnect helpers', () => {
  const keys = {
    initiatorPublicKey: { x: 'ax', y: 'ay' },
    responderPublicKey: { x: 'bx', y: 'by' },
  };
  const input = {
    role: 'request' as const,
    initiatorDeviceId: 'device-a',
    responderDeviceId: 'device-b',
    ...keys,
  };

  it('verifies a proof only for the same secret, role, devices and session keys', async () => {
    const secret = generateReconnectSecret();
    const proof = await computeReconnectProof(secret, input);
    expect(await verifyReconnectProof(secret, proof, input)).toBe(true);
    expect(
      await verifyReconnectProof(generateReconnectSecret(), proof, input)
    ).toBe(false);
    expect(
      await verifyReconnectProof(secret, proof, { ...input, role: 'accept' })
    ).toBe(false);
    expect(
      await verifyReconnectProof(secret, proof, {
        ...input,
        responderPublicKey: { x: 'relay', y: 'key' },
      })
    ).toBe(false);
    expect(await verifyReconnectProof(secret, 'not-a-proof', input)).toBe(
      false
    );
  });

  it('derives stable peer IDs only from safe device IDs', () => {
    expect(homePeerId('3f2c-11aa')).toBe('fluxby-3f2c-11aa');
    expect(isValidDeviceId('bad id')).toBe(false);
    expect(isValidDeviceId('-leading')).toBe(false);
    expect(() => homePeerId('../evil')).toThrow('Invalid device ID');
  });

  it('backs off up to five minutes between attempts', () => {
    expect(reconnectDelay(0)).toBe(2000);
    expect(reconnectDelay(3)).toBe(30000);
    expect(reconnectDelay(99)).toBe(300000);
  });
});

describe('paired devices reconnecting after a restart', () => {
  it('hands both devices the same reconnect secret when pairing', async () => {
    const { secretOnA, secretOnB, deviceOnA, deviceOnB } = await pairDevices();
    expect(secretOnA).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secretOnA).toBe(secretOnB);
    expect(deviceOnA).not.toHaveProperty('reconnectSecret');
    expect(deviceOnB).not.toHaveProperty('reconnectSecret');
  });

  it('registers under the stable peer ID so paired devices can find it', async () => {
    const a = side('device-a', 'profile-a');
    expect(await a.sync.initialize()).toBe(homePeerId('device-a'));
  });

  it('reconnects and syncs without pairing again', async () => {
    const pairing = await pairDevices();
    const a = side('device-a', 'profile-a');
    const b = side('device-b', 'profile-b');
    expect(
      a.sync.restorePairedDevice(pairing.deviceOnA, pairing.secretOnA)
    ).toBe(true);
    expect(
      b.sync.restorePairedDevice(pairing.deviceOnB, pairing.secretOnB)
    ).toBe(true);

    await b.sync.initialize();
    await a.sync.initialize();

    await vi.waitFor(() => {
      expect(a.reconnected).toHaveBeenCalledTimes(1);
      expect(b.reconnected).toHaveBeenCalledTimes(1);
    });
    expect(a.sync.getPairedDevices()[0]).toMatchObject({
      id: 'device-b',
      isConnected: true,
    });
    expect(await a.sync.sendChanges('device-b', [])).toBe(1);
    expect(await b.sync.sendChanges('device-a', [])).toBe(1);
    expect(a.errors).not.toHaveBeenCalled();
    expect(b.errors).not.toHaveBeenCalled();
  });

  it('waits quietly for an offline device and reconnects when it comes online', async () => {
    const pairing = await pairDevices();
    const a = side('device-a', 'profile-a');
    a.sync.restorePairedDevice(pairing.deviceOnA, pairing.secretOnA);
    await a.sync.initialize();
    await vi.waitFor(() =>
      expect(mocks.dials).toContain(
        `${homePeerId('device-a')}->${homePeerId('device-b')}`
      )
    );
    // The unreachable device is not an error the user has to see.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(a.errors).not.toHaveBeenCalled();

    const b = side('device-b', 'profile-b');
    b.sync.restorePairedDevice(pairing.deviceOnB, pairing.secretOnB);
    await b.sync.initialize();

    await vi.waitFor(() => expect(a.reconnected).toHaveBeenCalledTimes(1));
    expect(await b.sync.sendChanges('device-a', [])).toBe(1);
  });

  it('keeps exactly one working connection when both devices dial at once', async () => {
    const pairing = await pairDevices();
    const a = side('device-a', 'profile-a');
    const b = side('device-b', 'profile-b');
    a.sync.restorePairedDevice(pairing.deviceOnA, pairing.secretOnA);
    b.sync.restorePairedDevice(pairing.deviceOnB, pairing.secretOnB);

    await Promise.all([a.sync.initialize(), b.sync.initialize()]);

    await vi.waitFor(() => {
      expect(a.sync.getPairedDevices()[0]?.isConnected).toBe(true);
      expect(b.sync.getPairedDevices()[0]?.isConnected).toBe(true);
    });
    expect(await a.sync.sendChanges('device-b', [])).toBe(1);
    expect(await b.sync.requestSync('device-a')).toBe(1);
    expect(a.errors).not.toHaveBeenCalled();
    expect(b.errors).not.toHaveBeenCalled();
  });

  it('refuses a device that cannot prove the pairing secret', async () => {
    const pairing = await pairDevices();
    const a = side('device-a', 'profile-a');
    const impostor = side('device-b', 'profile-b');
    a.sync.restorePairedDevice(pairing.deviceOnA, pairing.secretOnA);
    impostor.sync.restorePairedDevice(
      pairing.deviceOnB,
      generateReconnectSecret()
    );

    await impostor.sync.initialize();
    await a.sync.initialize();
    await vi.waitFor(() => expect(mocks.dials.length).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(a.reconnected).not.toHaveBeenCalled();
    expect(impostor.reconnected).not.toHaveBeenCalled();
    // Refused either way: the unverified connection may still be open.
    await expect(a.sync.sendChanges('device-b', [])).rejects.toThrow(
      /not connected|not authorized/
    );
    expect(impostor.received).not.toHaveBeenCalled();
  });

  it('asks to pair again when the other device no longer knows the pairing', async () => {
    const pairing = await pairDevices();
    const a = side('device-a', 'profile-a');
    const b = side('device-b', 'profile-b');
    a.sync.restorePairedDevice(pairing.deviceOnA, pairing.secretOnA);

    await b.sync.initialize();
    await a.sync.initialize();

    await vi.waitFor(() =>
      expect(a.issues).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'device-b' }),
        'pair-again'
      )
    );
    expect(a.reconnected).not.toHaveBeenCalled();
  });

  it('postpones a reconnect while the other device has another profile open', async () => {
    const pairing = await pairDevices();
    const a = side('device-a', 'profile-a');
    const b = side('device-b', 'profile-other', {
      isKnownDevice: (id) => id === 'device-a',
    });
    a.sync.restorePairedDevice(pairing.deviceOnA, pairing.secretOnA);

    await b.sync.initialize();
    await a.sync.initialize();
    await vi.waitFor(() => expect(mocks.dials.length).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(a.issues).not.toHaveBeenCalled();
    expect(a.reconnected).not.toHaveBeenCalled();
  });

  it('tells the other device when a pairing is removed', async () => {
    const pairing = await pairDevices();
    const a = side('device-a', 'profile-a');
    const b = side('device-b', 'profile-b');
    a.sync.restorePairedDevice(pairing.deviceOnA, pairing.secretOnA);
    b.sync.restorePairedDevice(pairing.deviceOnB, pairing.secretOnB);
    await b.sync.initialize();
    await a.sync.initialize();
    await vi.waitFor(() => expect(b.reconnected).toHaveBeenCalledTimes(1));

    a.sync.disconnect('device-b');

    await vi.waitFor(() =>
      expect(b.unpaired).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'device-a' })
      )
    );
    expect(b.sync.getPairedDevices()).toEqual([]);
    expect(b.sync.canReconnect('device-a')).toBe(false);
    expect(a.sync.canReconnect('device-b')).toBe(false);
  });

  it('resumes a dropped signalling connection and reports when the peer is gone', async () => {
    const a = side('device-a', 'profile-a');
    await a.sync.initialize();
    const signalling = mocks.peers.get(homePeerId('device-a')) as unknown as {
      disconnected: boolean;
      reconnect: () => void;
    };
    signalling.disconnected = true;
    const reconnect = vi.spyOn(signalling, 'reconnect');

    expect(a.sync.reconnectPairedDevices()).toBe(true);
    expect(reconnect).toHaveBeenCalledTimes(1);

    a.sync.destroy();
    expect(a.sync.reconnectPairedDevices()).toBe(false);
  });

  it('only restores valid pairings of its own profile', async () => {
    const pairing = await pairDevices();
    const a = side('device-a', 'profile-a');
    expect(
      a.sync.restorePairedDevice(
        { ...pairing.deviceOnA, localProfileId: 'profile-other' },
        pairing.secretOnA
      )
    ).toBe(false);
    expect(a.sync.restorePairedDevice(pairing.deviceOnA, 'short')).toBe(false);
    expect(a.sync.getPairedDevices()).toEqual([]);
  });
});
