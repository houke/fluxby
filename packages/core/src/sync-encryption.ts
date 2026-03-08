/**
 * End-to-End Encryption for Sync Protocol
 *
 * This module provides E2E encryption for peer-to-peer sync messages.
 * Uses ECDH for key exchange and AES-GCM for message encryption.
 *
 * Key Exchange Flow:
 * 1. Each device generates an ephemeral ECDH key pair on connection
 * 2. Devices exchange public keys during handshake
 * 3. Both devices derive a shared secret using ECDH
 * 4. Shared secret is used to derive AES-GCM encryption key
 * 5. All subsequent messages are encrypted with this key
 *
 * Security Properties:
 * - Forward secrecy: New keys for each connection
 * - Message confidentiality: AES-256-GCM encryption
 * - Message integrity: GCM authentication tag
 * - Replay protection: Unique nonce per message
 */

const NONCE_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 256; // 256 bits for AES

/**
 * JSON Web Key representation for key exchange
 * This mirrors the standard JsonWebKey interface from the Web Crypto API
 */
export interface SyncJsonWebKey {
  kty?: string;
  crv?: string;
  x?: string;
  y?: string;
  d?: string;
  n?: string;
  e?: string;
  k?: string;
  ext?: boolean;
  key_ops?: string[];
  alg?: string;
  use?: string;
}

/**
 * Result of ECDH key generation
 */
export interface ECDHKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyJwk: SyncJsonWebKey;
}

/**
 * Session encryption context
 */
export interface SyncEncryptionSession {
  sessionId: string;
  localKeyPair: ECDHKeyPair;
  remotePublicKey?: CryptoKey;
  sharedKey?: CryptoKey;
  isReady: boolean;
  messageCounter: number;
}

/**
 * Encrypted message envelope
 */
export interface EncryptedEnvelope {
  version: 1;
  nonce: string; // Base64 encoded
  ciphertext: string; // Base64 encoded
  tag?: string; // GCM tag is included in ciphertext
}

/**
 * Generate an ECDH key pair for key exchange
 */
export async function generateECDHKeyPair(): Promise<ECDHKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // Extractable for public key export
    ['deriveBits']
  );

  // Export public key for transmission
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyJwk,
  };
}

/**
 * Import a remote public key from JWK format
 */
export async function importPublicKey(jwk: SyncJsonWebKey): Promise<CryptoKey> {
  // Web Crypto API accepts objects compatible with JsonWebKey
  // Use type assertion through unknown for compatibility
  return crypto.subtle.importKey(
    'jwk',
    jwk as unknown as Record<string, unknown>,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Derive shared secret using ECDH
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  // Derive shared bits using ECDH
  const sharedBits = await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    256 // 256 bits
  );

  // Import as AES-GCM key
  return crypto.subtle.importKey(
    'raw',
    sharedBits,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Create a new encryption session
 */
export async function createEncryptionSession(
  sessionId: string
): Promise<SyncEncryptionSession> {
  const localKeyPair = await generateECDHKeyPair();

  return {
    sessionId,
    localKeyPair,
    isReady: false,
    messageCounter: 0,
  };
}

/**
 * Complete key exchange with remote public key
 */
export async function completeKeyExchange(
  session: SyncEncryptionSession,
  remotePublicKeyJwk: SyncJsonWebKey
): Promise<SyncEncryptionSession> {
  const remotePublicKey = await importPublicKey(remotePublicKeyJwk);
  const sharedKey = await deriveSharedSecret(
    session.localKeyPair.privateKey,
    remotePublicKey
  );

  return {
    ...session,
    remotePublicKey,
    sharedKey,
    isReady: true,
  };
}

/**
 * Generate a unique nonce for message encryption
 * Uses counter + random to prevent reuse
 */
function generateNonce(counter: number): Uint8Array<ArrayBuffer> {
  const nonce = new Uint8Array(NONCE_LENGTH);

  // First 4 bytes: counter (big-endian)
  const view = new DataView(nonce.buffer);
  view.setUint32(0, counter, false);

  // Remaining 8 bytes: random
  crypto.getRandomValues(nonce.subarray(4));

  return nonce as Uint8Array<ArrayBuffer>;
}

/**
 * Encrypt a message for transmission
 */
export async function encryptMessage(
  session: SyncEncryptionSession,
  message: unknown
): Promise<{ envelope: EncryptedEnvelope; session: SyncEncryptionSession }> {
  if (!session.isReady || !session.sharedKey) {
    throw new Error('Encryption session not ready - key exchange not complete');
  }

  // Serialize message to JSON bytes
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(message));

  // Generate unique nonce
  const nonce = generateNonce(session.messageCounter);

  // Encrypt with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128, // 16 bytes auth tag
    },
    session.sharedKey,
    plaintext
  );

  // Create envelope
  const envelope: EncryptedEnvelope = {
    version: 1,
    nonce: uint8ArrayToBase64(nonce),
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertext)),
  };

  // Increment counter
  const updatedSession: SyncEncryptionSession = {
    ...session,
    messageCounter: session.messageCounter + 1,
  };

  return { envelope, session: updatedSession };
}

/**
 * Decrypt a received message
 */
export async function decryptMessage<T = unknown>(
  session: SyncEncryptionSession,
  envelope: EncryptedEnvelope
): Promise<T> {
  if (!session.isReady || !session.sharedKey) {
    throw new Error('Encryption session not ready - key exchange not complete');
  }

  if (envelope.version !== 1) {
    throw new Error(`Unsupported encryption version: ${envelope.version}`);
  }

  // Decode from base64
  const nonce = base64ToUint8Array(envelope.nonce);
  const ciphertext = base64ToUint8Array(envelope.ciphertext);

  // Decrypt with AES-GCM
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128,
    },
    session.sharedKey,
    ciphertext
  );

  // Parse JSON
  const decoder = new TextDecoder();
  const json = decoder.decode(plaintext);

  return JSON.parse(json) as T;
}

/**
 * Check if a message is an encrypted envelope
 */
export function isEncryptedEnvelope(data: unknown): data is EncryptedEnvelope {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return (
    obj.version === 1 &&
    typeof obj.nonce === 'string' &&
    typeof obj.ciphertext === 'string'
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert Uint8Array to Base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes as Uint8Array<ArrayBuffer>;
}

// =============================================================================
// High-Level API
// =============================================================================

/**
 * Sync encryption manager for a peer connection
 */
export class SyncEncryption {
  private session: SyncEncryptionSession | null = null;
  private enabled: boolean = true;

  constructor(options?: { enabled?: boolean }) {
    this.enabled = options?.enabled ?? true;
  }

  /**
   * Check if encryption is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if encryption session is ready
   */
  isReady(): boolean {
    return this.session?.isReady ?? false;
  }

  /**
   * Get public key for key exchange (to send to peer)
   */
  getPublicKey(): SyncJsonWebKey | null {
    return this.session?.localKeyPair.publicKeyJwk ?? null;
  }

  /**
   * Initialize encryption session
   */
  async initialize(sessionId: string): Promise<SyncJsonWebKey> {
    this.session = await createEncryptionSession(sessionId);
    return this.session.localKeyPair.publicKeyJwk;
  }

  /**
   * Complete key exchange with remote peer's public key
   */
  async completeKeyExchange(remotePublicKey: SyncJsonWebKey): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }
    this.session = await completeKeyExchange(this.session, remotePublicKey);
  }

  /**
   * Encrypt a message for transmission
   * If encryption is disabled, returns the message as-is
   */
  async encrypt(message: unknown): Promise<unknown> {
    if (!this.enabled) {
      return message;
    }

    if (!this.session?.isReady) {
      throw new Error('Encryption not ready');
    }

    const { envelope, session } = await encryptMessage(this.session, message);
    this.session = session;
    return envelope;
  }

  /**
   * Decrypt a received message
   * If encryption is disabled or message is not encrypted, returns as-is
   */
  async decrypt<T = unknown>(data: unknown): Promise<T> {
    if (!this.enabled) {
      return data as T;
    }

    if (!isEncryptedEnvelope(data)) {
      // Not encrypted - return as-is (for backward compatibility)
      return data as T;
    }

    if (!this.session?.isReady) {
      throw new Error('Encryption not ready');
    }

    return decryptMessage<T>(this.session, data);
  }

  /**
   * Reset the encryption session
   */
  reset(): void {
    this.session = null;
  }
}
