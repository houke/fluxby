import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateECDHKeyPair,
  importPublicKey,
  deriveSharedSecret,
  createEncryptionSession,
  completeKeyExchange,
  encryptMessage,
  decryptMessage,
  isEncryptedEnvelope,
  SyncEncryption,
} from '@fluxby/core';

describe('Sync Encryption', () => {
  describe('ECDH Key Generation', () => {
    it('generates a valid key pair', async () => {
      const keyPair = await generateECDHKeyPair();

      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKeyJwk).toBeDefined();
    });

    it('generates different key pairs each time', async () => {
      const keyPair1 = await generateECDHKeyPair();
      const keyPair2 = await generateECDHKeyPair();

      expect(keyPair1.publicKeyJwk.x).not.toBe(keyPair2.publicKeyJwk.x);
      expect(keyPair1.publicKeyJwk.y).not.toBe(keyPair2.publicKeyJwk.y);
    });

    it('exports public key in JWK format', async () => {
      const keyPair = await generateECDHKeyPair();

      expect(keyPair.publicKeyJwk.kty).toBe('EC');
      expect(keyPair.publicKeyJwk.crv).toBe('P-256');
      expect(keyPair.publicKeyJwk.x).toBeDefined();
      expect(keyPair.publicKeyJwk.y).toBeDefined();
    });
  });

  describe('Key Exchange', () => {
    it('imports a public key from JWK', async () => {
      const keyPair = await generateECDHKeyPair();
      const importedKey = await importPublicKey(keyPair.publicKeyJwk);

      expect(importedKey).toBeDefined();
      expect(importedKey.type).toBe('public');
    });

    it('derives the same shared secret on both sides', async () => {
      const aliceKeyPair = await generateECDHKeyPair();
      const bobKeyPair = await generateECDHKeyPair();

      // Import each other's public keys
      const aliceImportedBobKey = await importPublicKey(
        bobKeyPair.publicKeyJwk
      );
      const bobImportedAliceKey = await importPublicKey(
        aliceKeyPair.publicKeyJwk
      );

      // Derive shared secrets
      const aliceSharedKey = await deriveSharedSecret(
        aliceKeyPair.privateKey,
        aliceImportedBobKey
      );
      const bobSharedKey = await deriveSharedSecret(
        bobKeyPair.privateKey,
        bobImportedAliceKey
      );

      // Verify both keys work by encrypting with Alice's key and decrypting with Bob's
      const testData = new TextEncoder().encode('test message');
      const nonce = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce },
        aliceSharedKey,
        testData
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        bobSharedKey,
        encrypted
      );

      expect(new Uint8Array(decrypted)).toEqual(testData);
    });
  });

  describe('Encryption Session', () => {
    it('creates a new session with local key pair', async () => {
      const session = await createEncryptionSession('test-session');

      expect(session.sessionId).toBe('test-session');
      expect(session.localKeyPair).toBeDefined();
      expect(session.isReady).toBe(false);
      expect(session.messageCounter).toBe(0);
    });

    it('completes key exchange', async () => {
      const aliceSession = await createEncryptionSession('alice');
      const bobSession = await createEncryptionSession('bob');

      // Exchange public keys
      const aliceReady = await completeKeyExchange(
        aliceSession,
        bobSession.localKeyPair.publicKeyJwk
      );
      const bobReady = await completeKeyExchange(
        bobSession,
        aliceSession.localKeyPair.publicKeyJwk
      );

      expect(aliceReady.isReady).toBe(true);
      expect(bobReady.isReady).toBe(true);
      expect(aliceReady.sharedKey).toBeDefined();
      expect(bobReady.sharedKey).toBeDefined();
    });
  });

  describe('Message Encryption/Decryption', () => {
    let aliceSession: Awaited<ReturnType<typeof createEncryptionSession>>;
    let bobSession: Awaited<ReturnType<typeof createEncryptionSession>>;

    beforeEach(async () => {
      aliceSession = await createEncryptionSession('alice');
      bobSession = await createEncryptionSession('bob');

      // Complete key exchange
      aliceSession = await completeKeyExchange(
        aliceSession,
        bobSession.localKeyPair.publicKeyJwk
      );
      bobSession = await completeKeyExchange(
        bobSession,
        aliceSession.localKeyPair.publicKeyJwk
      );
    });

    it('encrypts and decrypts a simple message', async () => {
      const originalMessage = { type: 'test', data: 'hello world' };

      const { envelope } = await encryptMessage(aliceSession, originalMessage);
      const decrypted = await decryptMessage(bobSession, envelope);

      expect(decrypted).toEqual(originalMessage);
    });

    it('encrypts and decrypts complex objects', async () => {
      const originalMessage = {
        type: 'sync:data',
        changes: [
          { id: '123', table: 'transactions', amount: 100.5 },
          { id: '456', table: 'categories', name: 'Food' },
        ],
        timestamp: Date.now(),
        nested: { deep: { value: true } },
      };

      const { envelope } = await encryptMessage(aliceSession, originalMessage);
      const decrypted = await decryptMessage(bobSession, envelope);

      expect(decrypted).toEqual(originalMessage);
    });

    it('increments message counter after encryption', async () => {
      const message1 = { seq: 1 };
      const message2 = { seq: 2 };

      const result1 = await encryptMessage(aliceSession, message1);
      expect(result1.session.messageCounter).toBe(1);

      const result2 = await encryptMessage(result1.session, message2);
      expect(result2.session.messageCounter).toBe(2);
    });

    it('produces different ciphertext for same message', async () => {
      const message = { data: 'same content' };

      const result1 = await encryptMessage(aliceSession, message);
      const result2 = await encryptMessage(result1.session, message);

      expect(result1.envelope.ciphertext).not.toBe(result2.envelope.ciphertext);
      expect(result1.envelope.nonce).not.toBe(result2.envelope.nonce);
    });

    it('fails to decrypt with wrong key', async () => {
      const wrongSession = await createEncryptionSession('wrong');
      const thirdParty = await createEncryptionSession('third');
      const wrongReady = await completeKeyExchange(
        wrongSession,
        thirdParty.localKeyPair.publicKeyJwk
      );

      const { envelope } = await encryptMessage(aliceSession, { secret: true });

      await expect(decryptMessage(wrongReady, envelope)).rejects.toThrow();
    });

    it('throws when session not ready', async () => {
      const notReadySession = await createEncryptionSession('not-ready');

      await expect(
        encryptMessage(notReadySession, { data: 'test' })
      ).rejects.toThrow('Encryption session not ready');
    });
  });

  describe('isEncryptedEnvelope', () => {
    it('returns true for valid envelope', () => {
      const envelope = {
        version: 1,
        nonce: 'base64nonce',
        ciphertext: 'base64ciphertext',
      };

      expect(isEncryptedEnvelope(envelope)).toBe(true);
    });

    it('returns false for invalid data', () => {
      expect(isEncryptedEnvelope(null)).toBe(false);
      expect(isEncryptedEnvelope(undefined)).toBe(false);
      expect(isEncryptedEnvelope('string')).toBe(false);
      expect(isEncryptedEnvelope({ type: 'sync:data' })).toBe(false);
      expect(
        isEncryptedEnvelope({ version: 2, nonce: 'a', ciphertext: 'b' })
      ).toBe(false);
    });
  });

  describe('SyncEncryption class', () => {
    it('initializes and completes key exchange', async () => {
      const alice = new SyncEncryption();
      const bob = new SyncEncryption();

      const alicePubKey = await alice.initialize('alice-session');
      const bobPubKey = await bob.initialize('bob-session');

      await alice.completeKeyExchange(bobPubKey);
      await bob.completeKeyExchange(alicePubKey);

      expect(alice.isReady()).toBe(true);
      expect(bob.isReady()).toBe(true);
    });

    it('encrypts and decrypts using high-level API', async () => {
      const alice = new SyncEncryption();
      const bob = new SyncEncryption();

      const alicePubKey = await alice.initialize('alice');
      const bobPubKey = await bob.initialize('bob');

      await alice.completeKeyExchange(bobPubKey);
      await bob.completeKeyExchange(alicePubKey);

      const original = { message: 'secret data' };
      const encrypted = await alice.encrypt(original);
      const decrypted = await bob.decrypt(encrypted);

      expect(decrypted).toEqual(original);
    });

    it('passes through unencrypted messages when disabled', async () => {
      const encryption = new SyncEncryption({ enabled: false });

      const message = { type: 'test' };
      const result = await encryption.encrypt(message);

      expect(result).toBe(message);
      expect(encryption.isEnabled()).toBe(false);
    });

    it('decrypts unencrypted messages for backward compatibility', async () => {
      const alice = new SyncEncryption();
      const bob = new SyncEncryption();

      const alicePubKey = await alice.initialize('alice');
      const bobPubKey = await bob.initialize('bob');

      await alice.completeKeyExchange(bobPubKey);
      await bob.completeKeyExchange(alicePubKey);

      // Receive unencrypted message (from older client)
      const plainMessage = { type: 'sync:heartbeat' };
      const decrypted = await bob.decrypt(plainMessage);

      expect(decrypted).toEqual(plainMessage);
    });

    it('resets session state', async () => {
      const encryption = new SyncEncryption();
      await encryption.initialize('session');

      expect(encryption.getPublicKey()).not.toBeNull();

      encryption.reset();

      expect(encryption.getPublicKey()).toBeNull();
      expect(encryption.isReady()).toBe(false);
    });
  });
});
