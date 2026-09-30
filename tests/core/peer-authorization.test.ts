import { afterEach, describe, expect, it, vi } from 'vitest';
import { PeerSync, type PeerDevice, type SyncChange } from '@fluxby/core';
import {
  completeKeyExchange,
  createEncryptionSession,
  type SyncEncryptionSession,
} from '../../packages/core/src/sync-encryption';

type Connection = {
  peer: string;
  open: boolean;
  send: (data: unknown) => void;
  close: () => void;
};
type Harness = {
  connections: Map<string, Connection>;
  encryptionSessions: Map<string, SyncEncryptionSession>;
  handleIncomingData(conn: Connection, message: unknown): Promise<void>;
  handleMessage(conn: Connection, message: unknown): Promise<void>;
  handlePairingRequest(conn: Connection, message: unknown): Promise<void>;
  handlePairingAccept(conn: Connection, message: unknown): void;
};
const activePeers: PeerSync[] = [];
afterEach(() => {
  activePeers.forEach((peer) => peer.destroy());
  activePeers.length = 0;
  vi.useRealTimers();
});
async function pair(
  receive = async (_changes: SyncChange[], _device: PeerDevice) => 1
) {
  let activeProfile = 'profile-a';
  const errors = vi.fn();
  const a = new PeerSync({
    deviceId: 'device-a',
    deviceName: 'A',
    profileId: 'profile-a',
    schemaVersion: 15,
    getActiveProfileId: () => activeProfile,
    onSyncReceived: receive,
    onError: errors,
  });
  const b = new PeerSync({
    deviceId: 'device-b',
    deviceName: 'B',
    profileId: 'profile-b',
    schemaVersion: 15,
    onSyncReceived: receive,
    onSyncRequested: async () => [],
    onError: errors,
  });
  activePeers.push(a, b);
  const ah = a as unknown as Harness;
  const bh = b as unknown as Harness;
  const ab: Connection = {
    peer: 'peer-b',
    open: true,
    send: (data) => {
      queueMicrotask(() => {
        void bh.handleIncomingData(ba, data).catch(errors);
      });
    },
    close: vi.fn(),
  };
  const ba: Connection = {
    peer: 'peer-a',
    open: true,
    send: (data) => {
      queueMicrotask(() => {
        void ah.handleIncomingData(ab, data).catch(errors);
      });
    },
    close: vi.fn(),
  };
  const first = await createEncryptionSession('peer-b');
  const second = await createEncryptionSession('peer-a');
  ah.encryptionSessions.set(
    'peer-b',
    await completeKeyExchange(first, second.localKeyPair.publicKeyJwk)
  );
  bh.encryptionSessions.set(
    'peer-a',
    await completeKeyExchange(second, first.localKeyPair.publicKeyJwk)
  );
  ah.connections.set('peer-b', ab);
  bh.connections.set('peer-a', ba);
  ah.handlePairingAccept(ab, {
    type: 'pairing-accept',
    deviceId: 'device-b',
    deviceName: 'B',
    profileId: 'profile-b',
    schemaVersion: 15,
    protocolVersion: 2,
  });
  bh.handlePairingAccept(ba, {
    type: 'pairing-accept',
    deviceId: 'device-a',
    deviceName: 'A',
    profileId: 'profile-a',
    schemaVersion: 15,
    protocolVersion: 2,
  });
  return {
    a,
    b,
    ah,
    bh,
    ab,
    ba,
    errors,
    switchProfile: () => {
      activeProfile = 'other-profile';
    },
  };
}

describe('peer data authorization and real acknowledgements', () => {
  it('rejects sync on an encrypted connection until the user has paired it to a profile', async () => {
    const receive = vi.fn();
    const peer = new PeerSync({
      deviceId: 'a',
      deviceName: 'A',
      profileId: 'profile-a',
      schemaVersion: 15,
      onSyncReceived: receive,
    });
    activePeers.push(peer);
    const harness = peer as unknown as Harness;
    await expect(
      harness.handleMessage(
        { peer: 'stranger', open: true, send: vi.fn(), close: vi.fn() },
        { type: 'sync-push', changes: [], requestId: 'request' }
      )
    ).rejects.toThrow('not authorized');
    expect(receive).not.toHaveBeenCalled();
  });
  it('rejects plaintext both before and after encryption, including forged pairing accepts', async () => {
    const { ah, ab } = await pair();
    await expect(
      ah.handleIncomingData(ab, { type: 'pairing-accept', deviceId: 'evil' })
    ).rejects.toThrow('encrypted');
    ah.encryptionSessions.clear();
    await expect(
      ah.handleIncomingData(ab, { type: 'sync-push', changes: [] })
    ).rejects.toThrow('encrypted');
  });
  it('waits for the receiver database commit and acknowledgement before marking a push successful', async () => {
    let complete: (count: number) => void = () => undefined;
    const receive = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          complete = resolve;
        })
    );
    const { a, errors } = await pair(receive);
    let resolved = false;
    const pushed = a.sendChanges('device-b', []).then((result) => {
      resolved = true;
      return result;
    });
    await vi.waitFor(() => expect(receive).toHaveBeenCalledTimes(1));
    expect(resolved).toBe(false);
    expect(a.getPairedDevices()[0].lastSyncAt).toBeNull();
    complete(4);
    expect(await pushed).toBe(4);
    expect(a.getPairedDevices()[0].lastSyncAt).toBeTypeOf('number');
    expect(errors).not.toHaveBeenCalled();
  });
  it('reports failed database writes as failure and never updates lastSyncAt', async () => {
    const { a } = await pair(async () => {
      throw new Error('Commit failed');
    });
    await expect(a.sendChanges('device-b', [])).rejects.toThrow(
      'Commit failed'
    );
    expect(a.getPairedDevices()[0].lastSyncAt).toBeNull();
  });
  it('continues processing encrypted requests after pairing and awaits applied response data', async () => {
    const received = vi.fn(async () => 0);
    const { a, errors } = await pair(received);
    expect(await a.requestSync('device-b')).toBe(0);
    expect(received).toHaveBeenCalledTimes(1);
    expect(await a.requestSync('device-b')).toBe(0);
    expect(received).toHaveBeenCalledTimes(2);
    expect(errors).not.toHaveBeenCalled();
  });
  it('rejects data immediately after the active profile changes', async () => {
    const received = vi.fn(async () => 1);
    const { a, ah, ab, switchProfile } = await pair(received);
    switchProfile();
    await expect(a.sendChanges('device-b', [])).rejects.toThrow(
      'active profile'
    );
    await expect(
      ah.handleMessage(ab, {
        type: 'sync-push',
        changes: [],
        requestId: 'request',
      })
    ).rejects.toThrow('active profile');
    expect(received).not.toHaveBeenCalled();
  });
  it('never treats a timed-out delivery as successful', async () => {
    const { a, ab } = await pair();
    vi.useFakeTimers();
    ab.send = vi.fn();
    const failed = expect(a.sendChanges('device-b', [])).rejects.toThrow(
      'timed out'
    );
    await vi.advanceTimersByTimeAsync(15000);
    await failed;
    expect(a.getPairedDevices()[0].lastSyncAt).toBeNull();
  });
  it('requires explicit merge approval even with a correct code, and rejects old protocol pairings', async () => {
    let approve: (() => void) | undefined;
    const paired = vi.fn();
    const { a, ah, ab } = await pair();
    // A fresh receiving peer uses the existing encrypted session in this harness.
    const receiver = new PeerSync({
      deviceId: 'receiver',
      deviceName: 'Receiver',
      profileId: 'destination',
      schemaVersion: 15,
      onPairingRequest: (_name, accept) => {
        approve = accept;
      },
      onPaired: paired,
    });
    activePeers.push(receiver);
    const rh = receiver as unknown as Harness;
    const session = ah.encryptionSessions.get(ab.peer);
    if (!session) throw new Error('Test session missing');
    rh.encryptionSessions.set(ab.peer, session);
    const code = receiver.startPairing();
    const request = {
      type: 'pairing-request',
      pairingCode: code,
      deviceId: 'sender',
      deviceName: 'Sender',
      profileId: 'source',
      schemaVersion: 15,
      protocolVersion: 2,
    };
    const conn = { ...ab, send: vi.fn() };
    await rh.handlePairingRequest(conn, request);
    expect(paired).not.toHaveBeenCalled();
    approve?.();
    await vi.waitFor(() => expect(paired).toHaveBeenCalledTimes(1));
    expect(receiver.getPairedDevices()[0]).toMatchObject({
      localProfileId: 'destination',
      remoteProfileId: 'source',
      protocolVersion: 2,
    });
    expect(() =>
      ah.handlePairingAccept(ab, {
        type: 'pairing-accept',
        deviceId: 'old',
        deviceName: 'Old',
      })
    ).toThrow('protocol');
    expect(a.getPairedDevices()).toHaveLength(1);
  });
});
