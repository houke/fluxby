/**
 * Trusted pairing and reconnection for paired devices.
 *
 * The first pairing proves knowledge of the short pairing code with an HMAC
 * bound to the ECDH keys of the encrypted connection, so a signalling server
 * that runs a separate key exchange with each device cannot relay the code.
 *
 * Pairing hands both devices a random 256-bit reconnect secret. After a
 * restart, a device proves it still holds that secret with an HMAC that is
 * bound to the fresh ECDH keys of the new encrypted connection, so a peer that
 * merely claims a known peer ID (or relays the key exchange) cannot pass.
 */
import type { SyncJsonWebKey } from './sync-encryption.js';

const SECRET_BYTES = 32;
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const DEVICE_ID_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,98}[A-Za-z0-9])?$/;
const PROOF_LABEL = 'fluxby-reconnect-v1';
const PAIRING_LABEL = 'fluxby-pairing-v1';
/**
 * The pairing code has about 30 bits, so the key derived from it is slow to
 * compute: whoever sees a proof needs far longer to guess the code than the
 * code (2 minutes) or the pairing attempt (20 seconds) stays valid.
 */
export const PAIRING_KDF_ITERATIONS = 600_000;

/**
 * Version of the peer sync protocol. Version 3 replaced the plaintext pairing
 * code with a proof bound to the session keys; older devices must update.
 */
export const PEER_PROTOCOL_VERSION = 3;

/** Backoff between reconnect attempts while a paired device is unreachable. */
export const RECONNECT_DELAYS_MS = [
  2_000, 5_000, 15_000, 30_000, 60_000, 120_000, 300_000,
] as const;

export type ReconnectRole = 'request' | 'accept';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Create a new reconnect secret for a fresh pairing. */
export function generateReconnectSecret(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(SECRET_BYTES)));
}

export function isValidReconnectSecret(value: unknown): value is string {
  return typeof value === 'string' && SECRET_PATTERN.test(value);
}

/** Device IDs become part of a PeerJS ID, which only allows these characters. */
export function isValidDeviceId(value: unknown): value is string {
  return typeof value === 'string' && DEVICE_ID_PATTERN.test(value);
}

/**
 * The stable signalling ID a device registers while sync is in use, so its
 * paired devices can find it again after a restart.
 */
export function homePeerId(deviceId: string): string {
  if (!isValidDeviceId(deviceId)) throw new Error('Invalid device ID');
  return `fluxby-${deviceId}`;
}

/** Delay before the given (zero-based) reconnect attempt. */
export function reconnectDelay(attempt: number): number {
  return RECONNECT_DELAYS_MS[
    Math.min(Math.max(attempt, 0), RECONNECT_DELAYS_MS.length - 1)
  ];
}

function keyThumbprint(key: SyncJsonWebKey): string {
  if (!key.x || !key.y) throw new Error('Invalid session public key');
  return `${key.x}.${key.y}`;
}

async function importSecret(secret: string): Promise<CryptoKey> {
  if (!isValidReconnectSecret(secret))
    throw new Error('Invalid reconnect secret');
  return crypto.subtle.importKey(
    'raw',
    fromBase64Url(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export interface ReconnectProofInput {
  role: ReconnectRole;
  /** Device that dialled and sent the reconnect request. */
  initiatorDeviceId: string;
  /** Device that answered with the reconnect acceptance. */
  responderDeviceId: string;
  initiatorPublicKey: SyncJsonWebKey;
  responderPublicKey: SyncJsonWebKey;
}

function proofData(input: ReconnectProofInput): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    [
      PROOF_LABEL,
      input.role,
      input.initiatorDeviceId,
      input.responderDeviceId,
      keyThumbprint(input.initiatorPublicKey),
      keyThumbprint(input.responderPublicKey),
    ].join('|')
  );
}

export async function computeReconnectProof(
  secret: string,
  input: ReconnectProofInput
): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await importSecret(secret),
    proofData(input)
  );
  return toBase64Url(new Uint8Array(signature));
}

/** Constant-time verification of a reconnect proof. */
export async function verifyReconnectProof(
  secret: string,
  proof: unknown,
  input: ReconnectProofInput
): Promise<boolean> {
  if (typeof proof !== 'string' || !SECRET_PATTERN.test(proof)) return false;
  return crypto.subtle.verify(
    'HMAC',
    await importSecret(secret),
    fromBase64Url(proof),
    proofData(input)
  );
}

export interface PairingSessionKeys {
  /** Device that entered the code and sent the pairing request. */
  requesterPublicKey: SyncJsonWebKey;
  /** Device that showed the code and answers the request. */
  responderPublicKey: SyncJsonWebKey;
}

export type PairingProofInput = PairingSessionKeys &
  (
    | { role: 'request'; requesterDeviceId: string }
    | {
        role: 'accept';
        requesterDeviceId: string;
        responderDeviceId: string;
      }
  );

/**
 * Derive the key that proves knowledge of a pairing code for one encrypted
 * connection. Both session keys salt it, so no guesses can be precomputed.
 */
export async function derivePairingKey(
  pairingCode: string,
  keys: PairingSessionKeys
): Promise<CryptoKey> {
  if (!pairingCode) throw new Error('Invalid pairing code');
  const encoder = new TextEncoder();
  const salt = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(
      [
        PAIRING_LABEL,
        keyThumbprint(keys.requesterPublicKey),
        keyThumbprint(keys.responderPublicKey),
      ].join('|')
    )
  );
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pairingCode),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PAIRING_KDF_ITERATIONS,
    },
    material,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign', 'verify']
  );
}

function pairingProofData(input: PairingProofInput): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    [
      PAIRING_LABEL,
      input.role,
      input.requesterDeviceId,
      input.role === 'accept' ? input.responderDeviceId : '',
      keyThumbprint(input.requesterPublicKey),
      keyThumbprint(input.responderPublicKey),
    ].join('|')
  );
}

export async function computePairingProof(
  pairingKey: CryptoKey,
  input: PairingProofInput
): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    pairingKey,
    pairingProofData(input)
  );
  return toBase64Url(new Uint8Array(signature));
}

/** Constant-time verification of a pairing proof. */
export async function verifyPairingProof(
  pairingKey: CryptoKey,
  proof: unknown,
  input: PairingProofInput
): Promise<boolean> {
  if (typeof proof !== 'string' || !SECRET_PATTERN.test(proof)) return false;
  return crypto.subtle.verify(
    'HMAC',
    pairingKey,
    fromBase64Url(proof),
    pairingProofData(input)
  );
}
