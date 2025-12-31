/**
 * Tests for encryption utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMasterKey,
  randomBytes,
  wrapMasterKey,
  unwrapMasterKey,
  encryptData,
  decryptData,
} from '../../packages/database/src/encryption.js';

describe('encryption', () => {
  describe('generateMasterKey', () => {
    it('should generate a 32-byte key', () => {
      const key = generateMasterKey();
      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32);
    });

    it('should generate unique keys', () => {
      const key1 = generateMasterKey();
      const key2 = generateMasterKey();
      expect(key1).not.toEqual(key2);
    });
  });

  describe('randomBytes', () => {
    it('should generate bytes of requested length', () => {
      const bytes16 = randomBytes(16);
      const bytes32 = randomBytes(32);
      expect(bytes16.length).toBe(16);
      expect(bytes32.length).toBe(32);
    });

    it('should generate unique values', () => {
      const bytes1 = randomBytes(16);
      const bytes2 = randomBytes(16);
      expect(bytes1).not.toEqual(bytes2);
    });
  });

  describe('wrapMasterKey / unwrapMasterKey', () => {
    let masterKey: Uint8Array;
    const testPin = '123456';

    beforeEach(() => {
      masterKey = generateMasterKey();
    });

    it('should wrap and unwrap master key correctly', async () => {
      const wrapped = await wrapMasterKey(masterKey, testPin);

      expect(wrapped).toHaveProperty('ciphertext');
      expect(wrapped).toHaveProperty('salt');
      expect(wrapped).toHaveProperty('nonce');
      expect(wrapped).toHaveProperty('iterations');

      const unwrapped = await unwrapMasterKey(wrapped, testPin);
      expect(unwrapped).toEqual(masterKey);
    });

    it('should fail to unwrap with wrong password', async () => {
      const wrapped = await wrapMasterKey(masterKey, testPin);

      await expect(
        unwrapMasterKey(wrapped, 'wrong-password')
      ).rejects.toThrow();
    });

    it('should produce different ciphertext for same key', async () => {
      const wrapped1 = await wrapMasterKey(masterKey, testPin);
      const wrapped2 = await wrapMasterKey(masterKey, testPin);

      // Salt and nonce should be different each time
      expect(wrapped1.salt).not.toEqual(wrapped2.salt);
      expect(wrapped1.nonce).not.toEqual(wrapped2.nonce);
      expect(wrapped1.ciphertext).not.toEqual(wrapped2.ciphertext);
    });
  });

  describe('encryptData / decryptData', () => {
    let masterKey: Uint8Array;

    beforeEach(() => {
      masterKey = generateMasterKey();
    });

    it('should encrypt and decrypt data correctly', async () => {
      const plaintext = new TextEncoder().encode('Hello, World!');

      const encrypted = await encryptData(plaintext, masterKey);
      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      const decrypted = await decryptData(encrypted, masterKey);
      expect(new TextDecoder().decode(decrypted)).toBe('Hello, World!');
    });

    it('should fail to decrypt with wrong key', async () => {
      const plaintext = new TextEncoder().encode('Secret data');
      const encrypted = await encryptData(plaintext, masterKey);

      const wrongKey = generateMasterKey();
      await expect(decryptData(encrypted, wrongKey)).rejects.toThrow();
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const plaintext = new TextEncoder().encode('Same data');

      const encrypted1 = await encryptData(plaintext, masterKey);
      const encrypted2 = await encryptData(plaintext, masterKey);

      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('should handle empty data', async () => {
      const plaintext = new Uint8Array(0);

      const encrypted = await encryptData(plaintext, masterKey);
      const decrypted = await decryptData(encrypted, masterKey);

      expect(decrypted.length).toBe(0);
    });

    it('should handle large data', async () => {
      // 64KB of data (max for getRandomValues)
      const plaintext = new Uint8Array(64 * 1024);
      for (let i = 0; i < plaintext.length; i++) {
        plaintext[i] = i % 256;
      }

      const encrypted = await encryptData(plaintext, masterKey);
      const decrypted = await decryptData(encrypted, masterKey);

      expect(decrypted).toEqual(plaintext);
    });
  });
});
