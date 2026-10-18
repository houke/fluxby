import { describe, expect, it } from 'vitest';
import { openReconnectSecret, sealReconnectSecret } from '@/lib/sync-secrets';

const secret = 'c2VjcmV0LXRoYXQtaXMtbG9uZy1lbm91Z2gtdG8tdXNl';
const key = () => crypto.getRandomValues(new Uint8Array(32));

describe('reconnect secret sealing', () => {
  it('seals with the database key and opens only for the same device', async () => {
    const databaseKey = key();
    const sealed = await sealReconnectSecret(databaseKey, 'device-b', secret);

    expect(sealed).toMatch(/^v1:/);
    expect(sealed).not.toContain(secret);
    expect(await openReconnectSecret(databaseKey, 'device-b', sealed)).toBe(
      secret
    );
    expect(
      await openReconnectSecret(databaseKey, 'device-c', sealed)
    ).toBeNull();
  });

  it('cannot open a sealed secret with another or a missing key', async () => {
    const sealed = await sealReconnectSecret(key(), 'device-b', secret);

    expect(await openReconnectSecret(key(), 'device-b', sealed)).toBeNull();
    expect(await openReconnectSecret(null, 'device-b', sealed)).toBeNull();
    expect(
      await openReconnectSecret(key(), 'device-b', 'v1:broken')
    ).toBeNull();
  });

  it('keeps the secret readable without password protection', async () => {
    const stored = await sealReconnectSecret(null, 'device-b', secret);
    expect(await openReconnectSecret(null, 'device-b', stored)).toBe(secret);
  });
});
