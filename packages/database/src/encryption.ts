/**
 * Encryption utilities for Zero-Knowledge architecture
 *
 * Key hierarchy:
 * 1. Master Key (32 bytes) - generated on signup, encrypts all data
 * 2. Key Encryption Key (KEK) - derived from user password using PBKDF2
 * 3. Wrapped Key - Master Key encrypted with KEK, stored persistently
 */

import type { WrappedKey, KeyDerivationParams } from './types.js';

const SALT_LENGTH = 16;
const NONCE_LENGTH = 12;
const KEY_LENGTH = 32; // 256 bits
const DEFAULT_ITERATIONS = 100000;

/**
 * Generate a new random master key
 */
export function generateMasterKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(KEY_LENGTH));
}

/**
 * Generate random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Derive a key from password using PBKDF2
 */
export async function deriveKey(
  params: KeyDerivationParams
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(params.password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: params.salt as BufferSource,
      iterations: params.iterations ?? DEFAULT_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Wrap (encrypt) the master key with a password
 */
export async function wrapMasterKey(
  masterKey: Uint8Array,
  password: string
): Promise<WrappedKey> {
  const salt = randomBytes(SALT_LENGTH);
  const nonce = randomBytes(NONCE_LENGTH);
  const iterations = DEFAULT_ITERATIONS;

  // Derive key encryption key from password
  const kek = await deriveKey({ password, salt, iterations });

  // Encrypt master key
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce as BufferSource },
    kek,
    masterKey as BufferSource
  );

  return {
    ciphertext: new Uint8Array(ciphertext),
    salt,
    nonce,
    iterations,
  };
}

/**
 * Unwrap (decrypt) the master key with a password
 * Returns the master key to be held in memory only
 */
export async function unwrapMasterKey(
  wrappedKey: WrappedKey,
  password: string
): Promise<Uint8Array> {
  // Derive key encryption key from password
  const kek = await deriveKey({
    password,
    salt: wrappedKey.salt,
    iterations: wrappedKey.iterations,
  });

  // Decrypt master key
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: wrappedKey.nonce as BufferSource },
    kek,
    wrappedKey.ciphertext as BufferSource
  );

  return new Uint8Array(plaintext);
}

/**
 * Encrypt data with the master key
 */
export async function encryptData(
  data: Uint8Array,
  masterKey: Uint8Array
): Promise<Uint8Array> {
  const nonce = randomBytes(NONCE_LENGTH);

  // Import master key
  const key = await crypto.subtle.importKey(
    'raw',
    masterKey as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce as BufferSource },
    key,
    data as BufferSource
  );

  // Prepend nonce to ciphertext
  const result = new Uint8Array(nonce.length + ciphertext.byteLength);
  result.set(nonce);
  result.set(new Uint8Array(ciphertext), nonce.length);

  return result;
}

/**
 * Decrypt data with the master key
 */
export async function decryptData(
  encryptedData: Uint8Array,
  masterKey: Uint8Array
): Promise<Uint8Array> {
  // Extract nonce from beginning
  const nonce = encryptedData.slice(0, NONCE_LENGTH);
  const ciphertext = encryptedData.slice(NONCE_LENGTH);

  // Import master key
  const key = await crypto.subtle.importKey(
    'raw',
    masterKey as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce as BufferSource },
    key,
    ciphertext
  );

  return new Uint8Array(plaintext);
}

/**
 * Serialize wrapped key for storage
 */
export function serializeWrappedKey(wrapped: WrappedKey): string {
  return JSON.stringify({
    ciphertext: Array.from(wrapped.ciphertext),
    salt: Array.from(wrapped.salt),
    nonce: Array.from(wrapped.nonce),
    iterations: wrapped.iterations,
  });
}

/**
 * Deserialize wrapped key from storage
 */
export function deserializeWrappedKey(serialized: string): WrappedKey {
  const parsed = JSON.parse(serialized);
  return {
    ciphertext: new Uint8Array(parsed.ciphertext),
    salt: new Uint8Array(parsed.salt),
    nonce: new Uint8Array(parsed.nonce),
    iterations: parsed.iterations,
  };
}

/**
 * Verify password by attempting to unwrap key
 */
export async function verifyPassword(
  wrappedKey: WrappedKey,
  password: string
): Promise<boolean> {
  try {
    await unwrapMasterKey(wrappedKey, password);
    return true;
  } catch {
    return false;
  }
}

/**
 * Securely clear a Uint8Array from memory
 * Note: This provides defense in depth but JS doesn't guarantee memory clearing
 */
export function secureClear(data: Uint8Array): void {
  crypto.getRandomValues(data);
  data.fill(0);
}
