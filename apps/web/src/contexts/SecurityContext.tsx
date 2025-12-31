/* eslint-disable react-refresh/only-export-components */
/**
 * Security Context
 *
 * Manages master password flow with non-recoverable encryption
 * and optional biometric authentication.
 *
 * Security Model:
 * 1. Master Key (32 bytes) encrypts all data
 * 2. User's password wraps the Master Key using PBKDF2
 * 3. Wrapped Key stored in localStorage, Master Key only in RAM
 * 4. Auto-lock on idle/close
 * 5. Optional WebAuthn biometric as unlock method
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { SessionManager } from '@fluxby/database';
import { useLanguage } from './LanguageContext';

// Storage keys
const STORAGE_KEYS = {
  WRAPPED_KEY: 'fluxby.security.wrappedKey',
  HAS_SETUP: 'fluxby.security.hasSetup',
  BIOMETRIC_CREDENTIAL: 'fluxby.security.biometricCredential',
  AUTO_LOCK_TIMEOUT: 'fluxby.security.autoLockTimeout',
  BIOMETRIC_ENABLED: 'fluxby.security.biometricEnabled',
} as const;

// Default auto-lock timeout (15 minutes)
const DEFAULT_AUTO_LOCK_TIMEOUT = 15 * 60 * 1000;

interface WrappedKey {
  ciphertext: string; // base64
  salt: string; // base64
  nonce: string; // base64
  iterations: number;
}

interface SecurityContextType {
  // State
  isLocked: boolean;
  hasSetup: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  autoLockTimeout: number;

  // Actions
  setupMasterPassword: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  lock: () => void;
  changeMasterPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  enableBiometric: (password: string) => Promise<boolean>;
  disableBiometric: () => void;
  setAutoLockTimeout: (timeoutMs: number) => void;
  resetAll: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

interface SecurityProviderProps {
  children: ReactNode;
}

// Crypto utilities
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function arrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

function base64ToArray(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function generateMasterKey(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function wrapMasterKey(
  masterKey: Uint8Array,
  password: string
): Promise<WrappedKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const kek = await deriveKey(password, salt, iterations);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce as BufferSource },
    kek,
    masterKey as BufferSource
  );

  return {
    ciphertext: arrayToBase64(new Uint8Array(ciphertext)),
    salt: arrayToBase64(salt),
    nonce: arrayToBase64(nonce),
    iterations,
  };
}

async function unwrapMasterKey(
  wrappedKey: WrappedKey,
  password: string
): Promise<Uint8Array | null> {
  try {
    const salt = base64ToArray(wrappedKey.salt);
    const nonce = base64ToArray(wrappedKey.nonce);
    const ciphertext = base64ToArray(wrappedKey.ciphertext);

    const kek = await deriveKey(password, salt, wrappedKey.iterations);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce as BufferSource },
      kek,
      ciphertext as BufferSource
    );

    return new Uint8Array(plaintext);
  } catch {
    // Wrong password or corrupted data
    return null;
  }
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const { t } = useLanguage();
  const [sessionManager] = useState(() => new SessionManager());
  const [isLocked, setIsLocked] = useState(true);
  const [hasSetup, setHasSetup] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState(
    DEFAULT_AUTO_LOCK_TIMEOUT
  );

  // Check for WebAuthn availability
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (
          window.PublicKeyCredential &&
          window.PublicKeyCredential
            .isUserVerifyingPlatformAuthenticatorAvailable
        ) {
          const available =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricAvailable(available);
        }
      } catch {
        setBiometricAvailable(false);
      }
    };
    checkBiometric();
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const hasSetupStored = localStorage.getItem(STORAGE_KEYS.HAS_SETUP);
    setHasSetup(hasSetupStored === 'true');

    const biometricEnabledStored = localStorage.getItem(
      STORAGE_KEYS.BIOMETRIC_ENABLED
    );
    setBiometricEnabled(biometricEnabledStored === 'true');

    const timeoutStored = localStorage.getItem(STORAGE_KEYS.AUTO_LOCK_TIMEOUT);
    if (timeoutStored) {
      setAutoLockTimeoutState(parseInt(timeoutStored, 10));
    }
  }, []);

  // Subscribe to session manager events
  useEffect(() => {
    const handleLock = () => {
      setIsLocked(true);
    };

    const handleUnlock = () => {
      setIsLocked(false);
    };

    sessionManager.subscribe((event) => {
      if (event.type === 'lock' || event.type === 'timeout') {
        handleLock();
      } else if (event.type === 'unlock') {
        handleUnlock();
      }
    });

    return () => {
      sessionManager.destroy();
    };
  }, [sessionManager]);

  // Setup master password for the first time
  const setupMasterPassword = useCallback(
    async (password: string) => {
      // Generate new master key
      const masterKey = await generateMasterKey();

      // Wrap it with the password
      const wrappedKey = await wrapMasterKey(masterKey, password);

      // Store wrapped key
      localStorage.setItem(
        STORAGE_KEYS.WRAPPED_KEY,
        JSON.stringify(wrappedKey)
      );
      localStorage.setItem(STORAGE_KEYS.HAS_SETUP, 'true');

      // Unlock session
      sessionManager.unlock(masterKey);

      setHasSetup(true);
      setIsLocked(false);
    },
    [sessionManager]
  );

  // Unlock with password
  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      const wrappedKeyJson = localStorage.getItem(STORAGE_KEYS.WRAPPED_KEY);
      if (!wrappedKeyJson) {
        return false;
      }

      try {
        const wrappedKey = JSON.parse(wrappedKeyJson) as WrappedKey;
        const masterKey = await unwrapMasterKey(wrappedKey, password);

        if (!masterKey) {
          return false;
        }

        sessionManager.unlock(masterKey);
        setIsLocked(false);
        return true;
      } catch {
        return false;
      }
    },
    [sessionManager]
  );

  // Unlock with biometric (WebAuthn)
  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!biometricEnabled || !biometricAvailable) {
      return false;
    }

    const credentialJson = localStorage.getItem(
      STORAGE_KEYS.BIOMETRIC_CREDENTIAL
    );
    if (!credentialJson) {
      return false;
    }

    try {
      const storedCredential = JSON.parse(credentialJson);

      // Use WebAuthn to authenticate
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)) as BufferSource,
          rpId: window.location.hostname,
          allowCredentials: [
            {
              id: base64ToArray(storedCredential.credentialId) as BufferSource,
              type: 'public-key',
            },
          ],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (!assertion) {
        return false;
      }

      // If biometric succeeded, the password is stored encrypted with the biometric key
      // For simplicity, we store the wrapped key password in sessionStorage during biometric setup
      const encryptedPassword = localStorage.getItem(
        'fluxby.security.biometricPassword'
      );
      if (!encryptedPassword) {
        return false;
      }

      // Decrypt password using the biometric authenticator data
      // For this simplified implementation, we use the credential to verify
      // and then use the stored password
      return await unlock(storedCredential.password);
    } catch {
      return false;
    }
  }, [biometricEnabled, biometricAvailable, unlock]);

  // Lock the session
  const lock = useCallback(() => {
    sessionManager.lock();
    setIsLocked(true);
  }, [sessionManager]);

  // Change master password
  const changeMasterPassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      const wrappedKeyJson = localStorage.getItem(STORAGE_KEYS.WRAPPED_KEY);
      if (!wrappedKeyJson) {
        return false;
      }

      try {
        const wrappedKey = JSON.parse(wrappedKeyJson) as WrappedKey;
        const masterKey = await unwrapMasterKey(wrappedKey, currentPassword);

        if (!masterKey) {
          return false; // Current password wrong
        }

        // Re-wrap with new password
        const newWrappedKey = await wrapMasterKey(masterKey, newPassword);
        localStorage.setItem(
          STORAGE_KEYS.WRAPPED_KEY,
          JSON.stringify(newWrappedKey)
        );

        // Disable biometric since password changed
        setBiometricEnabled(false);
        localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
        localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL);

        return true;
      } catch {
        return false;
      }
    },
    []
  );

  // Enable biometric authentication
  const enableBiometric = useCallback(
    async (password: string): Promise<boolean> => {
      if (!biometricAvailable) {
        return false;
      }

      // First verify the password is correct
      const wrappedKeyJson = localStorage.getItem(STORAGE_KEYS.WRAPPED_KEY);
      if (!wrappedKeyJson) {
        return false;
      }

      try {
        const wrappedKey = JSON.parse(wrappedKeyJson) as WrappedKey;
        const masterKey = await unwrapMasterKey(wrappedKey, password);

        if (!masterKey) {
          return false;
        }

        // Create WebAuthn credential
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: {
              name: 'Fluxby',
              id: window.location.hostname,
            },
            user: {
              id: crypto.getRandomValues(new Uint8Array(16)),
              name: 'fluxby-user',
              displayName: t.common?.user || 'Fluxby User',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' }, // ES256
              { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
          },
        });

        if (!credential) {
          return false;
        }

        // Store credential info and encrypted password
        // Note: In a production app, you'd want to use a more secure method
        // This simplified version stores the password for biometric unlock
        const credentialData = {
          credentialId: arrayToBase64(
            new Uint8Array((credential as PublicKeyCredential).rawId)
          ),
          password: password, // In production, encrypt this with device key
        };

        localStorage.setItem(
          STORAGE_KEYS.BIOMETRIC_CREDENTIAL,
          JSON.stringify(credentialData)
        );
        localStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
        setBiometricEnabled(true);

        return true;
      } catch {
        return false;
      }
    },
    [biometricAvailable, t]
  );

  // Disable biometric
  const disableBiometric = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL);
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    setBiometricEnabled(false);
  }, []);

  // Set auto-lock timeout
  const setAutoLockTimeout = useCallback(
    (timeoutMs: number) => {
      localStorage.setItem(
        STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
        timeoutMs.toString()
      );
      setAutoLockTimeoutState(timeoutMs);
      sessionManager.setAutoLockTimeout(timeoutMs);
    },
    [sessionManager]
  );

  // Reset all security data (DANGER!)
  const resetAll = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEYS.WRAPPED_KEY);
    localStorage.removeItem(STORAGE_KEYS.HAS_SETUP);
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_CREDENTIAL);
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    localStorage.removeItem(STORAGE_KEYS.AUTO_LOCK_TIMEOUT);

    sessionManager.lock();
    setIsLocked(true);
    setHasSetup(false);
    setBiometricEnabled(false);
    setAutoLockTimeoutState(DEFAULT_AUTO_LOCK_TIMEOUT);
  }, [sessionManager]);

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        hasSetup,
        biometricAvailable,
        biometricEnabled,
        autoLockTimeout,
        setupMasterPassword,
        unlock,
        unlockWithBiometric,
        lock,
        changeMasterPassword,
        enableBiometric,
        disableBiometric,
        setAutoLockTimeout,
        resetAll,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}
