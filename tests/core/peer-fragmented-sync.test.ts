import { afterEach, describe, expect, it, vi } from 'vitest';
import { PeerSync, type SyncChange } from '@fluxby/core';
import {
  completeKeyExchange,
  createEncryptionSession,
  decryptMessage,
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
  incomingSnapshots: Map<string, unknown>;
  processingSnapshots: Map<string, unknown>;
  bufferedSnapshotChars: number;
  handleIncomingData(conn: Connection, message: unknown): Promise<void>;
  handleMessage(conn: Connection, message: unknown): Promise<void>;
  handlePairingAccept(conn: Connection, message: unknown): void;
  closeConnection(conn: Connection): void;
};
const peers: PeerSync[] = [];
afterEach(() => {
  peers.splice(0).forEach((peer) => peer.destroy());
  vi.useRealTimers();
});

function changes(count: number): SyncChange[] {
  return Array.from({ length: count }, (_, index) => ({
    table: index === 0 ? 'accounts' : 'transactions',
    row: {
      id: `row-${index}`,
      updated_at: index,
      is_deleted: false,
      device_id: 'a',
    },
  }));
}

async function pair(
  options: {
    supported?: boolean;
    receive?: (changes: SyncChange[]) => Promise<number>;
    respond?: () => Promise<SyncChange[]>;
  } = {}
) {
  const receive =
    options.receive ?? vi.fn(async (rows: SyncChange[]) => rows.length);
  const receivedA = vi.fn(async (rows: SyncChange[]) => rows.length);
  const errors = vi.fn();
  const a = new PeerSync({
    deviceId: 'a',
    deviceName: 'A',
    profileId: 'profile-a',
    schemaVersion: 23,
    onSyncReceived: receivedA,
    onSyncRequested: async () => [],
    onError: errors,
  });
  const b = new PeerSync({
    deviceId: 'b',
    deviceName: 'B',
    profileId: 'profile-b',
    schemaVersion: 23,
    onSyncReceived: receive,
    onSyncRequested: options.respond ?? (async () => []),
    onError: errors,
  });
  peers.push(a, b);
  const ah = a as unknown as Harness,
    bh = b as unknown as Harness;
  const ab: Connection = {
    peer: 'peer-b',
    open: true,
    close: vi.fn(),
    send: vi.fn((data) =>
      queueMicrotask(() => {
        void bh.handleIncomingData(ba, data).catch(errors);
      })
    ),
  };
  const ba: Connection = {
    peer: 'peer-a',
    open: true,
    close: vi.fn(),
    send: vi.fn((data) =>
      queueMicrotask(() => {
        void ah.handleIncomingData(ab, data).catch(errors);
      })
    ),
  };
  const first = await createEncryptionSession(ab.peer),
    second = await createEncryptionSession(ba.peer);
  ah.encryptionSessions.set(
    ab.peer,
    await completeKeyExchange(first, second.localKeyPair.publicKeyJwk)
  );
  bh.encryptionSessions.set(
    ba.peer,
    await completeKeyExchange(second, first.localKeyPair.publicKeyJwk)
  );
  ah.connections.set(ab.peer, ab);
  bh.connections.set(ba.peer, ba);
  for (const [harness, conn, id, profileId] of [
    [ah, ab, 'b', 'profile-b'],
    [bh, ba, 'a', 'profile-a'],
  ] as const)
    harness.handlePairingAccept(conn, {
      type: 'pairing-accept',
      deviceId: id,
      deviceName: id,
      profileId,
      protocolVersion: 3,
      schemaVersion: 23,
      supportsFragmentation: options.supported !== false,
    });
  return { a, b, ah, bh, ab, ba, errors, receive, receivedA };
}

const partial = (requestId = 'snapshot') => ({
  type: 'sync-fragment',
  requestId,
  messageType: 'sync-push',
  index: 0,
  count: 2,
  payload: ' '.repeat(32768),
});

describe('bounded whole-snapshot peer transport', () => {
  it('delivers more than 50k rows once and waits for the atomic apply acknowledgement', async () => {
    let commit: (count: number) => void = () => undefined;
    const receive = vi.fn(
      (_rows: SyncChange[]) =>
        new Promise<number>((resolve) => {
          commit = resolve;
        })
    );
    const { a, ab, bh, errors } = await pair({ receive });
    const snapshot = changes(50001);
    let resolved = false;
    const delivery = a.sendChanges('b', snapshot).then((result) => {
      resolved = true;
      return result;
    });
    await vi.waitFor(() => expect(receive).toHaveBeenCalledTimes(1), {
      timeout: 10000,
    });
    expect(receive.mock.calls[0][0]).toEqual(snapshot);
    expect(vi.mocked(ab.send).mock.calls.length).toBeGreaterThan(1);
    expect(bh.incomingSnapshots.size).toBe(0);
    expect(bh.processingSnapshots.size).toBe(1);
    expect(bh.bufferedSnapshotChars).toBe(JSON.stringify(snapshot).length);
    expect(resolved).toBe(false);
    expect(a.getPairedDevices()[0].lastSyncAt).toBeNull();
    commit(snapshot.length);
    expect(await delivery).toBe(snapshot.length);
    await vi.waitFor(() => expect(bh.processingSnapshots.size).toBe(0));
    expect(bh.bufferedSnapshotChars).toBe(0);
    expect(errors).not.toHaveBeenCalled();
  }, 15000);

  it('reassembles a requested snapshot above 50k rows before completing the request', async () => {
    const snapshot = changes(50001);
    const { a, b, receivedA, errors } = await pair({
      respond: async () => snapshot,
    });
    expect(await a.requestSync('b')).toBe(snapshot.length);
    expect(receivedA).toHaveBeenCalledExactlyOnceWith(
      snapshot,
      expect.objectContaining({ id: 'b' })
    );
    await vi.waitFor(() =>
      expect(b.getPairedDevices()[0].lastSyncAt).toBeTypeOf('number')
    );
    expect(errors).not.toHaveBeenCalled();
  }, 15000);

  it('preserves legacy single-packet delivery below 50k rows and reports missing large-transfer capability', async () => {
    const { a, ab, bh } = await pair({ supported: false });
    const snapshot = changes(1000);
    expect(await a.sendChanges('b', snapshot)).toBe(snapshot.length);
    expect(ab.send).toHaveBeenCalledTimes(1);
    const session = bh.encryptionSessions.get('peer-a');
    if (!session) throw new Error('Test session missing');
    const envelope = vi.mocked(ab.send).mock.calls[0][0];
    expect(
      await decryptMessage(
        session,
        envelope as Parameters<typeof decryptMessage>[1]
      )
    ).toMatchObject({ type: 'sync-push' });
    await expect(a.sendChanges('b', changes(50001))).rejects.toThrow(
      'update both devices'
    );
    expect(ab.send).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicate and stale frames without applying or acknowledging a partial snapshot', async () => {
    const { bh, ba, receive, errors } = await pair();
    await bh.handleMessage(ba, partial());
    expect(bh.incomingSnapshots.size).toBe(1);
    await bh.handleMessage(ba, partial());
    expect(errors).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Invalid or duplicate sync frame' })
    );
    expect(bh.incomingSnapshots.size).toBe(0);
    expect(bh.bufferedSnapshotChars).toBe(0);
    await bh.handleMessage(ba, { ...partial(), index: 1, payload: '[]' });
    expect(errors).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Invalid or stale sync frame' })
    );
    expect(receive).not.toHaveBeenCalled();
  });

  it.each([
    { count: 2049 },
    { index: -1 },
    { index: 2 },
    { payload: 'x'.repeat(32769) },
    { payload: 'short' },
    { messageType: 'sync-request' },
  ])(
    'rejects malformed frame metadata %j without database apply',
    async (invalid) => {
      const { bh, ba, receive, errors } = await pair();
      await bh.handleMessage(ba, { ...partial(), ...invalid });
      expect(errors).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid or stale sync frame' })
      );
      expect(bh.incomingSnapshots.size).toBe(0);
      expect(receive).not.toHaveBeenCalled();
    }
  );

  it.each(['close', 'destroy'])(
    'clears buffered snapshots and their timers on %s',
    async (action) => {
      const { b, bh, ba, receive } = await pair();
      vi.useFakeTimers();
      await bh.handleMessage(ba, partial('first'));
      expect(vi.getTimerCount()).toBe(1);
      if (action === 'close') bh.closeConnection(ba);
      else b.destroy();
      expect(bh.incomingSnapshots.size).toBe(0);
      expect(bh.bufferedSnapshotChars).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      expect(receive).not.toHaveBeenCalled();
      b.destroy();
    }
  );

  it('reserves snapshot slots and character budgets until blocked atomic applies finish', async () => {
    const commits: Array<() => void> = [];
    const receive = vi.fn(
      (_rows: SyncChange[]) =>
        new Promise<number>((resolve) => {
          commits.push(() => resolve(1000));
        })
    );
    const { b, bh, ba, errors } = await pair({ receive });
    ba.send = vi.fn();
    const payload = JSON.stringify(changes(1000));
    const count = Math.ceil(payload.length / 32768);
    const applying: Promise<void>[] = [];
    try {
      for (let request = 0; request < 4; request++) {
        for (let index = 0; index < count; index++) {
          const frame = {
            ...partial(`request-${request}`),
            index,
            count,
            payload: payload.slice(index * 32768, (index + 1) * 32768),
          };
          if (index === count - 1) applying.push(bh.handleMessage(ba, frame));
          else await bh.handleMessage(ba, frame);
        }
      }
      expect(receive).toHaveBeenCalledTimes(4);
      expect(bh.processingSnapshots.size).toBe(4);
      expect(bh.bufferedSnapshotChars).toBe(payload.length * 4);
      await bh.handleMessage(ba, partial('fifth'));
      expect(errors).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: 'Too many concurrent sync snapshots',
        })
      );
      expect(receive).toHaveBeenCalledTimes(4);
      commits[0]();
      await applying[0];
      expect(bh.processingSnapshots.size).toBe(3);
      expect(bh.bufferedSnapshotChars).toBe(payload.length * 3);
      await bh.handleMessage(ba, partial('sixth'));
      expect(bh.incomingSnapshots.size).toBe(1);
      expect(bh.bufferedSnapshotChars).toBe(payload.length * 3 + 32768);
    } finally {
      commits.forEach((commit) => commit());
      await Promise.all(applying);
      b.destroy();
    }
    expect(bh.processingSnapshots.size).toBe(0);
    expect(bh.bufferedSnapshotChars).toBe(0);
  });

  it('validates the entire assembled JSON before calling the receiver', async () => {
    const { bh, ba, receive, errors } = await pair();
    ba.send = vi.fn();
    await bh.handleMessage(ba, partial());
    await bh.handleMessage(ba, { ...partial(), index: 1, payload: '{}' });
    expect(errors).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Invalid sync snapshot' })
    );
    expect(receive).not.toHaveBeenCalled();
    expect(bh.incomingSnapshots.size).toBe(0);
    expect(bh.processingSnapshots.size).toBe(0);
    expect(bh.bufferedSnapshotChars).toBe(0);
  });

  it('reports a failed atomic apply and releases its reservation without a success acknowledgement', async () => {
    const { a, ah, bh, ba } = await pair({
      receive: async () => {
        throw new Error('Commit failed');
      },
    });
    await expect(a.sendChanges('b', changes(1000))).rejects.toThrow(
      'Commit failed'
    );
    expect(bh.processingSnapshots.size).toBe(0);
    expect(bh.bufferedSnapshotChars).toBe(0);
    const session = ah.encryptionSessions.get('peer-b');
    if (!session) throw new Error('Test session missing');
    expect(ba.send).toHaveBeenCalledTimes(1);
    expect(
      await decryptMessage(
        session,
        vi.mocked(ba.send).mock.calls[0][0] as Parameters<
          typeof decryptMessage
        >[1]
      )
    ).toMatchObject({ type: 'sync-error', reason: 'Commit failed' });
  });

  it('immediately frees a partial snapshot after the sender reports an error', async () => {
    const { bh, ba, receive } = await pair();
    vi.useFakeTimers();
    await bh.handleMessage(ba, partial());
    await bh.handleMessage(ba, {
      type: 'sync-error',
      requestId: 'snapshot',
      reason: 'Transfer canceled',
    });
    expect(bh.incomingSnapshots.size).toBe(0);
    expect(bh.bufferedSnapshotChars).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(receive).not.toHaveBeenCalled();
  });

  it('rejects a single packet that attempts to replace an incomplete framed snapshot', async () => {
    const { bh, ba, receive, errors } = await pair();
    await bh.handleMessage(ba, partial());
    await bh.handleMessage(ba, {
      type: 'sync-push',
      requestId: 'snapshot',
      changes: [],
    });
    expect(errors).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Invalid or duplicate sync snapshot' })
    );
    expect(bh.incomingSnapshots.size).toBe(0);
    expect(bh.bufferedSnapshotChars).toBe(0);
    expect(receive).not.toHaveBeenCalled();
  });

  it('rejects unsolicited response frames before allocating snapshot buffers', async () => {
    const { bh, ba, receive, errors } = await pair();
    await bh.handleMessage(ba, { ...partial(), messageType: 'sync-response' });
    expect(errors).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Unsolicited sync response' })
    );
    expect(bh.incomingSnapshots.size).toBe(0);
    expect(bh.bufferedSnapshotChars).toBe(0);
    expect(receive).not.toHaveBeenCalled();
  });

  it('expires incomplete snapshots without applying them and rejects their late frames', async () => {
    const { bh, ba, receive, errors } = await pair();
    vi.useFakeTimers();
    await bh.handleMessage(ba, partial());
    await vi.advanceTimersByTimeAsync(300000);
    expect(bh.incomingSnapshots.size).toBe(0);
    expect(bh.bufferedSnapshotChars).toBe(0);
    expect(errors).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Large sync transfer timed out' })
    );
    await bh.handleMessage(ba, { ...partial(), index: 1, payload: '[]' });
    expect(errors).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Invalid or stale sync frame' })
    );
    expect(receive).not.toHaveBeenCalled();
  });
});
