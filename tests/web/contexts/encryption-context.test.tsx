/**
 * EncryptionContext Tests
 *
 * Tests the EncryptionProvider component for:
 * - setupEncryption: generates and stores wrapped master key
 * - unlock: correctly unwraps master key using password
 * - changePassword: keeps the same master key
 * - lock: clears encryptionKey from memory
 * - Legacy migration: generates wrapped key on unlock
 * - Wrong password: fails to unlock
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/** @vitest-environment jsdom */
import React, { useEffect } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Store for mock OPFS data
let opfsStore: Record<string, unknown> = {};

// Store the original master key for verification in future tests
let _capturedMasterKey: Uint8Array | null = null;

// Mock @fluxby/database
vi.mock('@fluxby/database', async () => {
  const actual = await import('../../../packages/database/src/encryption.js');

  return {
    // Use actual crypto operations
    ...actual,

    // Override to capture generated master key for tests
    generateMasterKey: () => {
      const key = crypto.getRandomValues(new Uint8Array(32));
      _capturedMasterKey = key;
      return key;
    },

    // Mock OPFS functions
    readFromOPFSSync: <T,>(key: string): T | null => {
      return (opfsStore[key] as T) ?? null;
    },

    writeToOPFSWithCache: async (
      key: string,
      value: unknown
    ): Promise<void> => {
      opfsStore[key] = value;
    },

    deleteFromOPFSWithCache: async (key: string): Promise<void> => {
      delete opfsStore[key];
    },

    isSettingsCacheInitialized: () => true,

    readFromOPFS: async <T,>(key: string): Promise<T | null> => {
      return (opfsStore[key] as T) ?? null;
    },

    secureClear: (bytes: Uint8Array): void => {
      if (bytes) {
        bytes.fill(0);
      }
    },
  };
});

// For meta.env.DEV
vi.stubGlobal('import', { meta: { env: { DEV: false } } });

// Import after mocking
import {
  EncryptionProvider,
  useEncryption,
} from '../../../apps/web/src/contexts/EncryptionContext';

// Test helper component to expose encryption context
interface TestResult {
  isEncryptionEnabled: boolean;
  isUnlocked: boolean;
  encryptionKey: Uint8Array | null;
  setupEncryption: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  changePassword: (current: string, newPwd: string) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  disableEncryption: (password: string) => Promise<boolean>;
}

function TestComponent({
  onContext,
}: {
  onContext: (ctx: TestResult) => void;
}) {
  const ctx = useEncryption();
  useEffect(() => {
    onContext(ctx as TestResult);
  }, [ctx, onContext]);
  return null;
}

describe('EncryptionContext', () => {
  let contextRef: TestResult | null = null;

  beforeEach(() => {
    // Reset stores
    opfsStore = {};
    _capturedMasterKey = null;
    contextRef = null;

    // Reset module state by clearing
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = async (): Promise<TestResult> => {
    let resolveContext: (ctx: TestResult) => void;
    const contextPromise = new Promise<TestResult>((resolve) => {
      resolveContext = resolve;
    });

    render(
      <EncryptionProvider>
        <TestComponent
          onContext={(ctx) => {
            contextRef = ctx;
            resolveContext(ctx);
          }}
        />
      </EncryptionProvider>
    );

    return contextPromise;
  };

  describe('hydration', () => {
    it('should mark the provider as hydrated once OPFS settings are loaded', async () => {
      opfsStore['fluxby.passwordHash'] = 'hash-value';
      opfsStore['fluxby.passwordSalt'] = 'salt-value';
      opfsStore['fluxby.wrappedMasterKey'] = 'wrapped-key';

      const ctx = await renderWithProvider();

      await waitFor(() => {
        expect(contextRef).not.toBeNull();
        expect(ctx.isHydrated).toBe(true);
        expect(ctx.isEncryptionEnabled).toBe(true);
      });
    });
  });

  describe('setupEncryption', () => {
    it('should generate and store wrapped master key', async () => {
      const ctx = await renderWithProvider();

      // Initially not enabled (no password hash)
      expect(ctx.isEncryptionEnabled).toBe(false);
      // In dev mode, auto-unlocks when no password is set, so we check for that
      // The important test is that after setup, encryption is properly configured

      // Setup encryption
      await act(async () => {
        await ctx.setupEncryption('testPassword123');
      });

      // Wait for state update
      await waitFor(() => {
        expect(contextRef!.isEncryptionEnabled).toBe(true);
        expect(contextRef!.isUnlocked).toBe(true);
        expect(contextRef!.encryptionKey).not.toBeNull();
      });

      // Verify OPFS contains the data
      expect(opfsStore['fluxby.passwordHash']).toBeDefined();
      expect(opfsStore['fluxby.passwordSalt']).toBeDefined();
      expect(opfsStore['fluxby.wrappedMasterKey']).toBeDefined();
    });

    it('should make encryption key available after setup', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('myPassword');
      });

      await waitFor(() => {
        expect(contextRef!.encryptionKey).not.toBeNull();
        expect(contextRef!.encryptionKey!.length).toBe(32);
      });
    });
  });

  describe('unlock', () => {
    it('should correctly unwrap master key using password', async () => {
      const ctx = await renderWithProvider();

      // First setup
      await act(async () => {
        await ctx.setupEncryption('correctPassword');
      });

      // Store the key that was generated
      let originalKey: Uint8Array | null = null;
      await waitFor(() => {
        originalKey = contextRef!.encryptionKey
          ? new Uint8Array(contextRef!.encryptionKey)
          : null;
        expect(originalKey).not.toBeNull();
      });

      // Lock
      await act(async () => {
        ctx.lock();
      });

      await waitFor(() => {
        expect(contextRef!.isUnlocked).toBe(false);
        expect(contextRef!.encryptionKey).toBeNull();
      });

      // Unlock with correct password
      let unlockResult = false;
      await act(async () => {
        unlockResult = await contextRef!.unlock('correctPassword');
      });

      expect(unlockResult).toBe(true);

      await waitFor(() => {
        expect(contextRef!.isUnlocked).toBe(true);
        expect(contextRef!.encryptionKey).not.toBeNull();
      });

      // The unwrapped key should match the original
      const unwrappedKey = contextRef!.encryptionKey!;
      expect(unwrappedKey.length).toBe(32);
      // Key bytes should match original
      for (let i = 0; i < 32; i++) {
        expect(unwrappedKey[i]).toBe(originalKey![i]);
      }
    });

    it('should fail to unlock with wrong password', async () => {
      const ctx = await renderWithProvider();

      // Setup with correct password
      await act(async () => {
        await ctx.setupEncryption('correctPassword');
      });

      await waitFor(() => {
        expect(contextRef!.isUnlocked).toBe(true);
      });

      // Lock
      await act(async () => {
        ctx.lock();
      });

      await waitFor(() => {
        expect(contextRef!.isUnlocked).toBe(false);
      });

      // Try to unlock with wrong password
      let unlockResult = true;
      await act(async () => {
        unlockResult = await contextRef!.unlock('wrongPassword');
      });

      expect(unlockResult).toBe(false);
      expect(contextRef!.isUnlocked).toBe(false);
      expect(contextRef!.encryptionKey).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should keep the same master key after password change', async () => {
      const ctx = await renderWithProvider();

      // Setup
      await act(async () => {
        await ctx.setupEncryption('oldPassword');
      });

      // Capture original master key
      let originalKey: Uint8Array | null = null;
      await waitFor(() => {
        originalKey = contextRef!.encryptionKey
          ? new Uint8Array(contextRef!.encryptionKey)
          : null;
        expect(originalKey).not.toBeNull();
      });

      // Change password
      let changeResult = false;
      await act(async () => {
        changeResult = await contextRef!.changePassword(
          'oldPassword',
          'newPassword'
        );
      });

      expect(changeResult).toBe(true);

      // Encryption key should still be the same (not re-generated)
      const afterChangeKey = contextRef!.encryptionKey!;
      expect(afterChangeKey.length).toBe(32);

      // Key bytes should be IDENTICAL - this is the critical assertion
      // The wrapped key architecture means password changes don't affect the master key
      for (let i = 0; i < 32; i++) {
        expect(afterChangeKey[i]).toBe(originalKey![i]);
      }

      // Verify we can lock and unlock with new password
      await act(async () => {
        contextRef!.lock();
      });

      await waitFor(() => {
        expect(contextRef!.isUnlocked).toBe(false);
      });

      let unlockWithNewResult = false;
      await act(async () => {
        unlockWithNewResult = await contextRef!.unlock('newPassword');
      });

      expect(unlockWithNewResult).toBe(true);

      // And the unwrapped key should still match
      const unwrappedKey = contextRef!.encryptionKey!;
      for (let i = 0; i < 32; i++) {
        expect(unwrappedKey[i]).toBe(originalKey![i]);
      }
    });

    it('should fail to change password with wrong current password', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('correctPassword');
      });

      await waitFor(() => {
        expect(contextRef!.isUnlocked).toBe(true);
      });

      let changeResult = true;
      await act(async () => {
        changeResult = await contextRef!.changePassword(
          'wrongPassword',
          'newPassword'
        );
      });

      expect(changeResult).toBe(false);
    });
  });

  describe('lock', () => {
    it('should clear encryptionKey from memory', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('password');
      });

      await waitFor(() => {
        expect(contextRef!.encryptionKey).not.toBeNull();
      });

      // Lock
      await act(async () => {
        ctx.lock();
      });

      await waitFor(() => {
        expect(contextRef!.isUnlocked).toBe(false);
        expect(contextRef!.encryptionKey).toBeNull();
      });
    });

    it('should keep password protection enabled after lock', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('password');
      });

      await waitFor(() => {
        expect(contextRef!.isEncryptionEnabled).toBe(true);
      });

      await act(async () => {
        ctx.lock();
      });

      // Still enabled, just locked
      expect(contextRef!.isEncryptionEnabled).toBe(true);
      expect(contextRef!.isUnlocked).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('testPassword');
      });

      let isValid = false;
      await act(async () => {
        isValid = await contextRef!.verifyPassword('testPassword');
      });

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('testPassword');
      });

      let isValid = true;
      await act(async () => {
        isValid = await contextRef!.verifyPassword('wrongPassword');
      });

      expect(isValid).toBe(false);
    });
  });

  describe('disableEncryption', () => {
    it('should remove all encryption data with correct password', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('password');
      });

      await waitFor(() => {
        expect(contextRef!.isEncryptionEnabled).toBe(true);
      });

      let disableResult = false;
      await act(async () => {
        disableResult = await contextRef!.disableEncryption('password');
      });

      expect(disableResult).toBe(true);

      await waitFor(() => {
        expect(contextRef!.isEncryptionEnabled).toBe(false);
        expect(contextRef!.isUnlocked).toBe(false);
        expect(contextRef!.encryptionKey).toBeNull();
      });

      // OPFS should be cleared
      expect(opfsStore['fluxby.passwordHash']).toBeUndefined();
      expect(opfsStore['fluxby.passwordSalt']).toBeUndefined();
      expect(opfsStore['fluxby.wrappedMasterKey']).toBeUndefined();
    });

    it('should fail to disable with wrong password', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('correctPassword');
      });

      let disableResult = true;
      await act(async () => {
        disableResult = await contextRef!.disableEncryption('wrongPassword');
      });

      expect(disableResult).toBe(false);
      expect(contextRef!.isEncryptionEnabled).toBe(true);
    });
  });

  describe('Legacy migration', () => {
    it('should generate wrapped key when legacy encryption salt exists', async () => {
      // Simulate legacy user: has password hash but no wrapped key,
      // and has the old encryption salt
      const { hash, salt } = await hashPasswordForTest('legacyPassword');
      opfsStore['fluxby.passwordHash'] = hash;
      opfsStore['fluxby.passwordSalt'] = salt;
      opfsStore['fluxby.encryptionSalt'] = 'legacy-salt-hex';
      // No wrapped key

      const ctx = await renderWithProvider();

      // Initially has password but no wrapped key (legacy state)
      expect(ctx.isEncryptionEnabled).toBe(true);
      expect(ctx.isUnlocked).toBe(false);

      // Unlock should trigger migration
      let unlockResult = false;
      await act(async () => {
        unlockResult = await ctx.unlock('legacyPassword');
      });

      expect(unlockResult).toBe(true);

      await waitFor(() => {
        expect(contextRef!.isUnlocked).toBe(true);
        expect(contextRef!.encryptionKey).not.toBeNull();
      });

      // Should have generated and stored wrapped key
      expect(opfsStore['fluxby.wrappedMasterKey']).toBeDefined();
      // Legacy salt should be removed
      expect(opfsStore['fluxby.encryptionSalt']).toBeUndefined();
    });
  });

  describe('masterKey alias', () => {
    it('should provide masterKey as alias for encryptionKey', async () => {
      const ctx = await renderWithProvider();

      await act(async () => {
        await ctx.setupEncryption('password');
      });

      await waitFor(() => {
        expect(contextRef!.encryptionKey).not.toBeNull();
      });

      // masterKey should be same reference as encryptionKey
      // Note: We're testing the context interface here
      interface ExtendedContext extends TestResult {
        masterKey: Uint8Array | null;
      }
      const extCtx = contextRef as unknown as ExtendedContext;
      expect(extCtx.masterKey).toBe(contextRef!.encryptionKey);
    });
  });
});

// Helper function to hash password for test setup
async function hashPasswordForTest(
  password: string
): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(saltBuffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt: saltHex };
}
