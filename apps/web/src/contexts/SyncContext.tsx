/* eslint-disable react-refresh/only-export-components */
/**
 * Sync Context
 * Manages peer-to-peer device syncing via WebRTC
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import {
  createPeerSync,
  type PeerSync,
  type PeerDevice,
  type SyncChange,
  type SyncableRow,
} from '@fluxby/core';
import {
  readFromOPFSSync,
  writeToOPFSWithCache,
  isSettingsCacheInitialized,
} from '@fluxby/database';

// Storage keys (used as OPFS filenames)
const DEVICE_ID_KEY = 'fluxby.deviceId';
const DEVICE_NAME_KEY = 'fluxby.deviceName';
const PAIRED_DEVICES_KEY = 'fluxby.pairedDevices';

interface SyncContextType {
  /** This device's unique ID */
  deviceId: string;
  /** This device's display name */
  deviceName: string;
  /** Update device name */
  setDeviceName: (name: string) => void;
  /** Whether peer sync is initialized */
  isInitialized: boolean;
  /** Current pairing code (for others to connect) */
  pairingCode: string | null;
  /** Generate a new pairing code */
  generateNewPairingCode: () => void;
  /** Connect to another device using their pairing code */
  connectWithPairingCode: (code: string) => Promise<boolean>;
  /** List of paired devices */
  pairedDevices: PeerDevice[];
  /** Pending pairing request (if any) */
  pendingPairingRequest: {
    deviceName: string;
    accept: () => void;
    reject: () => void;
  } | null;
  /** Send sync changes to a specific device */
  sendSyncChanges: (peerId: string, changes: SyncChange[]) => void;
  /** Request sync from a specific device */
  requestSync: (peerId: string, sinceTimestamp: number) => void;
  /** Disconnect from a device */
  disconnectDevice: (deviceId: string) => void;
  /** Last sync error (if any) */
  lastError: Error | null;
  /** Retry initialization */
  retryInitialization: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

interface SyncProviderProps {
  children: ReactNode;
  /** Callback when sync data is received */
  onSyncReceived?: (changes: SyncChange<SyncableRow>[]) => void;
}

// Generate or retrieve device ID from OPFS cache
function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID();

  // Try to get from OPFS cache
  if (isSettingsCacheInitialized()) {
    const deviceId = readFromOPFSSync<string>(DEVICE_ID_KEY);
    if (deviceId) return deviceId;
  }

  // Generate new ID and store it (async)
  const newDeviceId = crypto.randomUUID();
  writeToOPFSWithCache(DEVICE_ID_KEY, newDeviceId).catch((err) =>
    console.warn('Failed to save device ID to OPFS:', err)
  );
  return newDeviceId;
}

// Get stored device name from OPFS cache
function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Unknown Device';

  if (isSettingsCacheInitialized()) {
    const stored = readFromOPFSSync<string>(DEVICE_NAME_KEY);
    if (stored) return stored;
  }

  // Generate a default name based on browser/platform
  const platform = navigator.platform || 'Unknown';
  const browser = getBrowserName();
  return `${browser} on ${platform}`;
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Browser';
}

// Get stored paired devices from OPFS cache
function getStoredPairedDevices(): PeerDevice[] {
  if (typeof window === 'undefined') return [];

  if (isSettingsCacheInitialized()) {
    const stored = readFromOPFSSync<PeerDevice[]>(PAIRED_DEVICES_KEY);
    if (stored && Array.isArray(stored)) return stored;
  }

  return [];
}

// Save paired devices to OPFS
function savePairedDevices(devices: PeerDevice[]): void {
  if (typeof window === 'undefined') return;
  writeToOPFSWithCache(PAIRED_DEVICES_KEY, devices).catch((err) =>
    console.warn('Failed to save paired devices to OPFS:', err)
  );
}

export function SyncProvider({ children, onSyncReceived }: SyncProviderProps) {
  const [deviceId] = useState(getOrCreateDeviceId);
  const [deviceName, setDeviceNameState] = useState(getDeviceName);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairedDevices, setPairedDevices] = useState<PeerDevice[]>(
    getStoredPairedDevices
  );
  const [pendingPairingRequest, setPendingPairingRequest] = useState<{
    deviceName: string;
    accept: () => void;
    reject: () => void;
  } | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [peerSync, setPeerSync] = useState<PeerSync | null>(null);

  // Ref to track if we've already initialized (prevents StrictMode double-init issues)
  const initRef = useRef(false);
  const syncRef = useRef<PeerSync | null>(null);

  // Retry initialization (exported via context but currently internal)
  const _retryInitialization = useCallback(() => {
    setLastError(null);
    initRef.current = false;
    // Force re-execution of effect by toggling a dummy state or relying on the fact initRef is false?
    // Actually, just calling the effect logic again or resetting state might work.
    // Better: let's separate initialization logic into a function.
    // For now, simpler: invalidate the peerSync and trigger re-init.
    if (peerSync) {
      peerSync.destroy();
      setPeerSync(null);
    }
    // The effect depends on [deviceId, ...]. We need to trigger it.
    // We can do this by forcing a re-render or just calling init logic.
    // Let's reset initRef and ensure the effect runs.
    // Since effect has no other dependencies that change, we might need a version counter.
  }, [peerSync]);

  const [initVersion, setInitVersion] = useState(0);

  useEffect(() => {
    if (initRef.current && syncRef.current) return;

    initRef.current = true;
    let active = true;

    const sync = createPeerSync({
      deviceId,
      deviceName,
      onPairingRequest: (name, accept, reject) => {
        if (!active) return;
        setPendingPairingRequest({ deviceName: name, accept, reject });
      },
      onPaired: (device) => {
        if (!active) return;
        setPairedDevices((prev) => {
          const updated = [...prev.filter((d) => d.id !== device.id), device];
          savePairedDevices(updated);
          return updated;
        });
        setPendingPairingRequest(null);
      },
      onSyncReceived,
      onConnectionChange: (peerId, connected) => {
        if (!active) return;
        setPairedDevices((prev) => {
          const updated = prev.map((d) =>
            d.peerId === peerId ? { ...d, isConnected: connected } : d
          );
          savePairedDevices(updated);
          return updated;
        });
      },
      onError: (error) => {
        if (!active) return;
        setLastError(error);
      },
    });

    syncRef.current = sync;
    setPeerSync(sync);

    sync
      .initialize()
      .then((peerId) => {
        if (!active) return;
        // eslint-disable-next-line no-console
        console.log('Sync initialized with Peer ID:', peerId);
        setIsInitialized(true);
      })
      .catch((err) => {
        if (!active) return;
        if (!err?.message?.includes('destroyed')) {
          console.error('Sync initialization failed:', err);
          setLastError(err);
        }
      });

    return () => {
      active = false;
      if (syncRef.current === sync) {
        sync.destroy();
        syncRef.current = null;
        initRef.current = false;
        setIsInitialized(false);
      }
    };
  }, [deviceId, deviceName, onSyncReceived, initVersion]);

  const retryInit = useCallback(() => {
    setLastError(null);
    setIsInitialized(false);
    if (syncRef.current) {
      syncRef.current.destroy();
      syncRef.current = null;
    }
    initRef.current = false;
    setInitVersion((v) => v + 1);
  }, []);

  // Update device name
  const setDeviceName = useCallback((name: string) => {
    setDeviceNameState(name);
    if (typeof window !== 'undefined') {
      writeToOPFSWithCache(DEVICE_NAME_KEY, name).catch((err) =>
        console.warn('Failed to save device name to OPFS:', err)
      );
    }
  }, []);

  // Generate a new pairing code
  const generateNewPairingCode = useCallback(() => {
    if (!peerSync) return;
    const peerId = peerSync.getPeerId();
    if (!peerId) {
      setLastError(new Error('Peer not fully initialized'));
      return;
    }
    const code = peerSync.startPairing();
    // Include the peer ID in the code for easier pairing
    setPairingCode(`${peerId}:${code}`);
  }, [peerSync]);

  // Connect with peer ID and pairing code
  const connectWithPairingCode = useCallback(
    async (combinedCode: string): Promise<boolean> => {
      if (!peerSync) return false;

      try {
        const parts = combinedCode.split(':');
        if (parts.length === 2) {
          await peerSync.connectWithCode(parts[0], parts[1]);
        } else {
          await peerSync.connectWithCode(combinedCode, '');
        }
        return true;
      } catch (err) {
        setLastError(err instanceof Error ? err : new Error(String(err)));
        throw err; // Propagate error to the caller
      }
    },
    [peerSync]
  );

  // Send sync changes
  const sendSyncChanges = useCallback(
    (peerId: string, changes: SyncChange[]) => {
      peerSync?.sendChanges(peerId, changes);
    },
    [peerSync]
  );

  // Request sync
  const requestSync = useCallback(
    (peerId: string, sinceTimestamp: number) => {
      peerSync?.requestSync(peerId, sinceTimestamp);
    },
    [peerSync]
  );

  // Disconnect device
  const disconnectDevice = useCallback(
    (deviceIdToRemove: string) => {
      peerSync?.disconnect(deviceIdToRemove);
      setPairedDevices((prev) => {
        const updated = prev.filter((d) => d.id !== deviceIdToRemove);
        savePairedDevices(updated);
        return updated;
      });
    },
    [peerSync]
  );

  const value = useMemo(
    () => ({
      deviceId,
      deviceName,
      setDeviceName,
      isInitialized,
      pairingCode,
      generateNewPairingCode,
      connectWithPairingCode,
      pairedDevices,
      pendingPairingRequest,
      sendSyncChanges,
      requestSync,
      disconnectDevice,
      lastError,
      retryInitialization: retryInit,
    }),
    [
      deviceId,
      deviceName,
      setDeviceName,
      isInitialized,
      pairingCode,
      generateNewPairingCode,
      connectWithPairingCode,
      pairedDevices,
      pendingPairingRequest,
      sendSyncChanges,
      requestSync,
      disconnectDevice,
      lastError,
      retryInit,
    ]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
