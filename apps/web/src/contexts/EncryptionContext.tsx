/* eslint-disable react-refresh/only-export-components */
/**
 * Password Protection Context
 *
 * This context manages password-based UI lock/unlock for the app.
 * NOTE: Database encryption has been removed for simplicity.
 * The password only protects the UI - data is stored unencrypted in OPFS.
 *
 * The password is verified using PBKDF2 key derivation - we store a wrapped
 * "dummy" key that can only be unwrapped with the correct password.
 *
 * Settings are stored in OPFS for persistence (survives localStorage clearing).
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
} from '@fluxby/database';

// Storage keys (used as OPFS filenames)
const PASSWORD_HASH_KEY = 'fluxby.passwordHash';
const PASSWORD_SALT_KEY = 'fluxby.passwordSalt';

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

interface EncryptionContextType {
  /** Whether password protection is set up (kept as isEncryptionEnabled for compatibility) */
  isEncryptionEnabled: boolean;
  /** Whether the app is currently unlocked */
  isUnlocked: boolean;
  /** Master key - always null now (no database encryption) */
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
  const mountedRef = useRef(true);

  // Load from OPFS if cache wasn't initialized
  useEffect(() => {
    mountedRef.current = true;

    if (!isSettingsCacheInitialized()) {
      Promise.all([
        readFromOPFS<string>(PASSWORD_HASH_KEY),
        readFromOPFS<string>(PASSWORD_SALT_KEY),
      ]).then(([hash, salt]) => {
        if (mountedRef.current) {
          if (hash) setPasswordHash(hash);
          if (salt) setPasswordSalt(salt);
        }
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check if password protection is set up
  const isEncryptionEnabled = passwordHash !== null;

  // Auto-unlock in development mode for easier debugging
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return import.meta.env.DEV;
  });

  // Set up password protection
  const setupEncryption = useCallback(async (password: string) => {
    const { hash, salt } = await hashPassword(password);

    // Store in OPFS
    await writeToOPFSWithCache(PASSWORD_HASH_KEY, hash);
    await writeToOPFSWithCache(PASSWORD_SALT_KEY, salt);

    setPasswordHash(hash);
    setPasswordSalt(salt);
    setIsUnlocked(true);
  }, []);

  // Unlock the app with password
  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      if (!passwordHash || !passwordSalt) {
        return false;
      }

      try {
        const salt = hexToUint8Array(passwordSalt);
        const { hash } = await hashPassword(password, salt);

        if (hash === passwordHash) {
          setIsUnlocked(true);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [passwordHash, passwordSalt]
  );

  // Lock the app
  const lock = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  // Change password
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      if (!passwordHash || !passwordSalt) {
        return false;
      }

      try {
        // Verify current password
        const salt = hexToUint8Array(passwordSalt);
        const { hash: currentHash } = await hashPassword(currentPassword, salt);

        if (currentHash !== passwordHash) {
          return false;
        }

        // Set new password
        const { hash: newHash, salt: newSalt } =
          await hashPassword(newPassword);

        // Store in OPFS
        await writeToOPFSWithCache(PASSWORD_HASH_KEY, newHash);
        await writeToOPFSWithCache(PASSWORD_SALT_KEY, newSalt);

        setPasswordHash(newHash);
        setPasswordSalt(newSalt);

        return true;
      } catch {
        return false;
      }
    },
    [passwordHash, passwordSalt]
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

      setPasswordHash(null);
      setPasswordSalt(null);
      setIsUnlocked(false);
      return true;
    },
    [verifyPasswordFn]
  );

  const value = useMemo(
    () => ({
      isEncryptionEnabled,
      isUnlocked,
      masterKey: null, // No database encryption
      setupEncryption,
      unlock,
      lock,
      changePassword,
      verifyPassword: verifyPasswordFn,
      disableEncryption,
    }),
    [
      isEncryptionEnabled,
      isUnlocked,
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
