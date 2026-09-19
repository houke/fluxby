/* eslint-disable react-refresh/only-export-components */
/**
 * Password Protection & Encryption Context
 *
 * Uses Wrapped Master Key architecture for secure password changes:
 * 1. A random 256-bit master key encrypts the database
 * 2. The master key is "wrapped" (encrypted) with a password-derived key
 * 3. Password change re-wraps the SAME master key with new password
 *
 * This allows password changes without re-encrypting the entire database.
 *
 * Key hierarchy:
 * - Master Key (random, encrypts DB) → wrapped by →
 * - Wrapping Key (derived from password via PBKDF2)
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  readFromOPFSSync,
  writeToOPFSWithCache,
  deleteFromOPFSWithCache,
  isSettingsCacheInitialized,
  readFromOPFS,
  generateMasterKey,
  wrapMasterKey,
  unwrapMasterKey,
  serializeWrappedKey,
  deserializeWrappedKey,
  secureClear,
} from '@fluxby/database';

// Storage keys (used as OPFS filenames)
const PASSWORD_HASH_KEY = 'fluxby.passwordHash';
const PASSWORD_SALT_KEY = 'fluxby.passwordSalt';
const WRAPPED_KEY_KEY = 'fluxby.wrappedMasterKey'; // The encrypted master key
// Legacy key - kept for migration detection only
const ENCRYPTION_SALT_KEY = 'fluxby.encryptionSalt';

// Simple password hashing using Web Crypto API
async function hashPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Generate or use existing salt
  const saltBuffer = salt || crypto.getRandomValues(new Uint8Array(16));

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2
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

  // Convert to hex string for storage
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(saltBuffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt: saltHex };
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Helper to get initial value from OPFS cache
function getInitialHash(): string | null {
  if (typeof window === 'undefined') return null;
  if (isSettingsCacheInitialized()) {
    return readFromOPFSSync<string>(PASSWORD_HASH_KEY);
  }
  return null;
}

function getInitialSalt(): string | null {
  if (typeof window === 'undefined') return null;
  if (isSettingsCacheInitialized()) {
    return readFromOPFSSync<string>(PASSWORD_SALT_KEY);
  }
  return null;
}

function getInitialWrappedKey(): string | null {
  if (typeof window === 'undefined') return null;
  if (isSettingsCacheInitialized()) {
    return readFromOPFSSync<string>(WRAPPED_KEY_KEY);
  }
  return null;
}

// Legacy migration: check if user has old encryption salt (password-derived key)
function getInitialLegacyEncryptionSalt(): string | null {
  if (typeof window === 'undefined') return null;
  if (isSettingsCacheInitialized()) {
    return readFromOPFSSync<string>(ENCRYPTION_SALT_KEY);
  }
  return null;
}

interface EncryptionContextType {
  /** Whether OPFS settings have finished hydrating from storage */
  isHydrated: boolean;
  /** Whether password protection is set up (kept as isEncryptionEnabled for compatibility) */
  isEncryptionEnabled: boolean;
  /** Whether the app is currently unlocked */
  isUnlocked: boolean;
  /** Database encryption key (32 bytes) - derived from password, cleared on lock */
  encryptionKey: Uint8Array | null;
  /** @deprecated Use encryptionKey instead */
  masterKey: Uint8Array | null;
  /** Set up password protection */
  setupEncryption: (password: string) => Promise<void>;
  /** Unlock the app with the password */
  unlock: (password: string) => Promise<boolean>;
  /** Lock the app */
  lock: () => void;
  /** Change the password */
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  /** Check if a password is correct */
  verifyPassword: (password: string) => Promise<boolean>;
  /** Disable password protection */
  disableEncryption: (password: string) => Promise<boolean>;
}

const EncryptionContext = createContext<EncryptionContextType | null>(null);

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}

interface EncryptionProviderProps {
  children: ReactNode;
}

export function EncryptionProvider({ children }: EncryptionProviderProps) {
  // Store hash and salt in state (loaded from OPFS cache)
  const [passwordHash, setPasswordHash] = useState<string | null>(
    getInitialHash
  );
  const [passwordSalt, setPasswordSalt] = useState<string | null>(
    getInitialSalt
  );
  // Serialized wrapped master key (JSON string)
  const [wrappedKeyData, setWrappedKeyData] = useState<string | null>(
    getInitialWrappedKey
  );
  // Legacy encryption salt - only used for migration detection
  const [legacyEncryptionSalt, setLegacyEncryptionSalt] = useState<
    string | null
  >(getInitialLegacyEncryptionSalt);
  // The actual 32-byte master key - only in memory, cleared on lock
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(
    isSettingsCacheInitialized()
  );
  const mountedRef = useRef(true);

  // Load from OPFS if cache wasn't initialized
  useEffect(() => {
    mountedRef.current = true;

    const hydrate = async () => {
      if (isSettingsCacheInitialized()) {
        setIsHydrated(true);
        return;
      }

      try {
        const [hash, salt, wrapped, legacySalt] = await Promise.all([
          readFromOPFS<string>(PASSWORD_HASH_KEY),
          readFromOPFS<string>(PASSWORD_SALT_KEY),
          readFromOPFS<string>(WRAPPED_KEY_KEY),
          readFromOPFS<string>(ENCRYPTION_SALT_KEY), // Legacy check
        ]);

        if (mountedRef.current) {
          if (hash) setPasswordHash(hash);
          if (salt) setPasswordSalt(salt);
          if (wrapped) setWrappedKeyData(wrapped);
          if (legacySalt) setLegacyEncryptionSalt(legacySalt);
        }
      } finally {
        if (mountedRef.current) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check if password protection is set up
  const isEncryptionEnabled = passwordHash !== null;

  // Auto-unlock in development mode for easier debugging
  // Only auto-unlock if no encryption is configured (no password hash)
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return import.meta.env.DEV && !getInitialHash();
  });

  // Set up password protection
  const setupEncryption = useCallback(async (password: string) => {
    // 1. Hash password for verification
    const { hash, salt } = await hashPassword(password);

    // 2. Generate random master key (this encrypts the database)
    const masterKeyBytes = generateMasterKey();

    // 3. Wrap master key with password (internally derives wrapping key)
    const wrapped = await wrapMasterKey(masterKeyBytes, password);
    const wrappedSerialized = serializeWrappedKey(wrapped);

    // 4. Store in OPFS
    await writeToOPFSWithCache(PASSWORD_HASH_KEY, hash);
    await writeToOPFSWithCache(PASSWORD_SALT_KEY, salt);
    await writeToOPFSWithCache(WRAPPED_KEY_KEY, wrappedSerialized);

    // 5. Update state
    setPasswordHash(hash);
    setPasswordSalt(salt);
    setWrappedKeyData(wrappedSerialized);
    setEncryptionKey(masterKeyBytes);
    setIsUnlocked(true);
  }, []);

  // Unlock the app with password
  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      if (!passwordHash || !passwordSalt) {
        return false;
      }

      try {
        // Verify password hash
        const salt = hexToUint8Array(passwordSalt);
        const { hash } = await hashPassword(password, salt);

        if (hash !== passwordHash) {
          return false;
        }

        // Unwrap the master key
        if (wrappedKeyData) {
          // Normal flow: unwrap the master key with password
          const wrapped = deserializeWrappedKey(wrappedKeyData);
          const masterKeyBytes = await unwrapMasterKey(wrapped, password);
          setEncryptionKey(masterKeyBytes);
        } else if (legacyEncryptionSalt) {
          // Legacy migration: user has old password-derived key architecture
          // Generate new master key and wrap it with current password
          console.warn(
            'Migrating from legacy password-derived key to wrapped master key'
          );
          const masterKeyBytes = generateMasterKey();
          const wrapped = await wrapMasterKey(masterKeyBytes, password);
          const wrappedSerialized = serializeWrappedKey(wrapped);

          // Store wrapped key and remove legacy salt
          await writeToOPFSWithCache(WRAPPED_KEY_KEY, wrappedSerialized);
          await deleteFromOPFSWithCache(ENCRYPTION_SALT_KEY);

          setWrappedKeyData(wrappedSerialized);
          setLegacyEncryptionSalt(null);
          setEncryptionKey(masterKeyBytes);
        } else {
          // No wrapped key and no legacy salt - first time user, generate new key
          const masterKeyBytes = generateMasterKey();
          const wrapped = await wrapMasterKey(masterKeyBytes, password);
          const wrappedSerialized = serializeWrappedKey(wrapped);

          await writeToOPFSWithCache(WRAPPED_KEY_KEY, wrappedSerialized);
          setWrappedKeyData(wrappedSerialized);
          setEncryptionKey(masterKeyBytes);
        }

        setIsUnlocked(true);
        return true;
      } catch {
        return false;
      }
    },
    [passwordHash, passwordSalt, wrappedKeyData, legacyEncryptionSalt]
  );

  // Lock the app
  const lock = useCallback(() => {
    // Securely zero the key bytes before releasing reference
    if (encryptionKey) {
      secureClear(encryptionKey);
    }
    setEncryptionKey(null);
    setIsUnlocked(false);
  }, [encryptionKey]);

  // Change password - re-wraps the SAME master key with new password
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      if (!passwordHash || !passwordSalt || !encryptionKey) {
        return false;
      }

      try {
        // 1. Verify current password
        const salt = hexToUint8Array(passwordSalt);
        const { hash: currentHash } = await hashPassword(currentPassword, salt);

        if (currentHash !== passwordHash) {
          return false;
        }

        // 2. Generate new password hash for authentication
        const { hash: newHash, salt: newSalt } =
          await hashPassword(newPassword);

        // 3. Re-wrap the SAME master key with new password
        // This is the key insight: the master key never changes,
        // only the "wrapper" (password-derived key) changes
        const newWrapped = await wrapMasterKey(encryptionKey, newPassword);
        const newWrappedSerialized = serializeWrappedKey(newWrapped);

        // 4. Store updated password hash and wrapped key
        await writeToOPFSWithCache(PASSWORD_HASH_KEY, newHash);
        await writeToOPFSWithCache(PASSWORD_SALT_KEY, newSalt);
        await writeToOPFSWithCache(WRAPPED_KEY_KEY, newWrappedSerialized);

        // 5. Update state (master key stays the same!)
        setPasswordHash(newHash);
        setPasswordSalt(newSalt);
        setWrappedKeyData(newWrappedSerialized);
        // Note: encryptionKey is NOT changed - that's the whole point!

        return true;
      } catch {
        return false;
      }
    },
    [passwordHash, passwordSalt, encryptionKey]
  );

  // Verify password
  const verifyPasswordFn = useCallback(
    async (password: string): Promise<boolean> => {
      if (!passwordHash || !passwordSalt) {
        return false;
      }

      try {
        const salt = hexToUint8Array(passwordSalt);
        const { hash } = await hashPassword(password, salt);
        return hash === passwordHash;
      } catch {
        return false;
      }
    },
    [passwordHash, passwordSalt]
  );

  // Disable password protection
  const disableEncryption = useCallback(
    async (password: string): Promise<boolean> => {
      // Verify password first
      const isValid = await verifyPasswordFn(password);
      if (!isValid) {
        return false;
      }

      // Delete from OPFS
      await deleteFromOPFSWithCache(PASSWORD_HASH_KEY);
      await deleteFromOPFSWithCache(PASSWORD_SALT_KEY);
      await deleteFromOPFSWithCache(WRAPPED_KEY_KEY);
      // Also clean up any legacy salt
      await deleteFromOPFSWithCache(ENCRYPTION_SALT_KEY);

      // Securely clear the master key
      if (encryptionKey) {
        secureClear(encryptionKey);
      }

      setPasswordHash(null);
      setPasswordSalt(null);
      setWrappedKeyData(null);
      setLegacyEncryptionSalt(null);
      setEncryptionKey(null);
      setIsUnlocked(false);
      return true;
    },
    [verifyPasswordFn, encryptionKey]
  );

  const value = useMemo(
    () => ({
      isHydrated,
      isEncryptionEnabled,
      isUnlocked,
      encryptionKey,
      masterKey: encryptionKey, // Alias for backwards compatibility
      setupEncryption,
      unlock,
      lock,
      changePassword,
      verifyPassword: verifyPasswordFn,
      disableEncryption,
    }),
    [
      isHydrated,
      isEncryptionEnabled,
      isUnlocked,
      encryptionKey,
      setupEncryption,
      unlock,
      lock,
      changePassword,
      verifyPasswordFn,
      disableEncryption,
    ]
  );

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}
