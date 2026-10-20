/**
 * At-rest protection for peer reconnect secrets.
 *
 * A reconnect secret lets a paired device sync without a new pairing, so it
 * is stored sealed with a key derived from the database encryption key and
 * bound to the paired device's ID. Without password protection (development
 * only) there is no key and the database itself is unencrypted, so the
 * secret is stored as is.
 */
const SEALED_PREFIX = 'v1:';
const PLAIN_PREFIX = 'plain:';
const KEY_INFO = new TextEncoder().encode('fluxby-sync-reconnect-secret-v1');

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sealingKey(encryptionKey: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(encryptionKey),
    'HKDF',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: KEY_INFO,
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function sealReconnectSecret(
  encryptionKey: Uint8Array | null,
  deviceId: string,
  secret: string
): Promise<string> {
  if (!encryptionKey) return PLAIN_PREFIX + secret;
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      additionalData: new TextEncoder().encode(deviceId),
    },
    await sealingKey(encryptionKey),
    new TextEncoder().encode(secret)
  );
  return `${SEALED_PREFIX}${toBase64(nonce)}.${toBase64(new Uint8Array(ciphertext))}`;
}

/** The stored secret, or null when it cannot be opened with this key. */
export async function openReconnectSecret(
  encryptionKey: Uint8Array | null,
  deviceId: string,
  sealed: string
): Promise<string | null> {
  if (sealed.startsWith(PLAIN_PREFIX)) return sealed.slice(PLAIN_PREFIX.length);
  if (!encryptionKey || !sealed.startsWith(SEALED_PREFIX)) return null;
  const [nonce, ciphertext, extra] = sealed
    .slice(SEALED_PREFIX.length)
    .split('.');
  if (!nonce || !ciphertext || extra !== undefined) return null;
  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromBase64(nonce),
        additionalData: new TextEncoder().encode(deviceId),
      },
      await sealingKey(encryptionKey),
      fromBase64(ciphertext)
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
