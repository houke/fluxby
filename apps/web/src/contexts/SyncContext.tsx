/* eslint-disable react-refresh/only-export-components */
/**
 * Sync Context
 * Manages peer-to-peer device syncing via WebRTC with auto-sync and status tracking
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
  type SyncStatus,
  type ForceSyncResult,
  formatRelativeTime,
} from '@fluxby/core';
import {
  readFromOPFSSync,
  writeToOPFSWithCache,
  isSettingsCacheInitialized,
  LATEST_MIGRATION_VERSION,
} from '@fluxby/database';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileDataSync, subscribeLocalDataChanges } from '@/lib/data-sync';
import { useDatabase } from './DatabaseContext';
import { useProfile } from './ProfileContext';
import { useEncryption } from './EncryptionContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Storage keys (used as OPFS filenames)
const DEVICE_ID_KEY = 'fluxby.deviceId';
const DEVICE_NAME_KEY = 'fluxby.deviceName';
const PAIRED_DEVICES_KEY = 'fluxby.pairedDevices';
const AUTO_SYNC_KEY = 'fluxby.autoSyncEnabled';

// Default sync status
const defaultSyncStatus: SyncStatus = {
  state: 'idle',
  lastSyncedAt: null,
  lastError: null,
  pendingChanges: 0,
  connectedPeers: 0,
  isSyncing: false,
};

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
  /** Sync status (state, lastSyncedAt, pendingChanges, etc.) */
  syncStatus: SyncStatus;
  /** Force a full sync with all connected peers, returns sync result */
  forceSync: () => Promise<ForceSyncResult>;
  /** Queue a change for auto-sync */
  queueChange: (change: SyncChange<SyncableRow>) => void;
  /** Queue multiple changes for auto-sync */
  queueChanges: (changes: SyncChange<SyncableRow>[]) => void;
  /** Format last synced time as relative string */
  formatLastSynced: (locale?: 'en' | 'nl') => string;
  /** Whether auto-sync is enabled */
  autoSyncEnabled: boolean;
  /** Toggle auto-sync */
  setAutoSyncEnabled: (enabled: boolean) => void;
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
function getDeviceName(unknownDevice: string): string {
  if (typeof window === 'undefined') return unknownDevice;

  if (isSettingsCacheInitialized()) {
    const stored = readFromOPFSSync<string>(DEVICE_NAME_KEY);
    if (stored) return stored;
  }

  // Generate a default name based on browser/platform
  const platform = navigator.platform || unknownDevice;
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
    if (stored && Array.isArray(stored))
      return stored.map((device) => ({ ...device, isConnected: false }));
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

// Get auto-sync setting from OPFS
function getAutoSyncEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  if (isSettingsCacheInitialized()) {
    const stored = readFromOPFSSync<boolean>(AUTO_SYNC_KEY);
    if (stored !== null && stored !== undefined) return stored;
  }
  return true; // Default to enabled
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { t } = useLanguage();
  const { db, isReady } = useDatabase();
  const { activeProfileId } = useProfile();
  const { isUnlocked } = useEncryption();
  const queryClient = useQueryClient();
  const [deviceId] = useState(getOrCreateDeviceId);
  const [deviceName, setDeviceNameState] = useState(() =>
    getDeviceName(t.common.unknownDevice)
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairedDevices, setPairedDevices] = useState<PeerDevice[]>(
    getStoredPairedDevices
  );
  const [pendingPairingRequest, setPendingPairingRequest] =
    useState<SyncContextType['pendingPairingRequest']>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [autoSyncEnabled, setAutoSyncEnabledState] =
    useState(getAutoSyncEnabled);
  const [initVersion, setInitVersion] = useState(0);
  const syncRef = useRef<PeerSync | null>(null);
  const adapterRef = useRef<ProfileDataSync | null>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = isUnlocked && isReady ? activeProfileId : null;
  const operationRef = useRef<Promise<ForceSyncResult> | null>(null);
  const requestRef = useRef<() => Promise<ForceSyncResult>>(async () => ({
    success: false,
    changesPushed: 0,
    changesReceived: 0,
  }));
  const autoSyncRef = useRef(autoSyncEnabled);
  autoSyncRef.current = autoSyncEnabled;

  const reportError = useCallback((error: unknown) => {
    const failure = error instanceof Error ? error : new Error(String(error));
    setLastError(failure);
    setSyncStatus((status) => ({
      ...status,
      state: 'error',
      isSyncing: false,
      lastError: failure.message,
    }));
  }, []);

  const forceSync = useCallback(async (): Promise<ForceSyncResult> => {
    if (operationRef.current) return operationRef.current;
    const peer = syncRef.current;
    const adapter = adapterRef.current;
    const devices =
      peer
        ?.getPairedDevices()
        .filter(
          (device) =>
            device.isConnected && device.localProfileId === activeRef.current
        ) || [];
    if (
      !peer ||
      !adapter ||
      adapter.profileId !== activeRef.current ||
      !devices.length
    ) {
      return {
        success: false,
        changesPushed: 0,
        changesReceived: 0,
        error: t.settings.sync.notConnected,
      };
    }
    const operation = (async (): Promise<ForceSyncResult> => {
      setSyncStatus((status) => ({
        ...status,
        state: 'syncing',
        isSyncing: true,
        lastError: null,
      }));
      try {
        await adapter.captureLocalChanges();
        const changes = await adapter.getChanges();
        if (adapter.profileId !== activeRef.current || syncRef.current !== peer)
          throw new Error('Active profile changed during sync');
        // Full profile snapshots include every dependency and tombstone. Status waits for commits and peer acknowledgements.
        await Promise.all(
          devices.map((device) => peer.sendChanges(device.id, changes))
        );
        const received = await Promise.all(
          devices.map((device) => peer.requestSync(device.id, 0))
        );
        if (adapter.profileId !== activeRef.current || syncRef.current !== peer)
          throw new Error('Active profile changed during sync');
        const lastSyncedAt = Date.now();
        setLastError(null);
        setSyncStatus((status) => ({
          ...status,
          state: 'idle',
          isSyncing: false,
          pendingChanges: 0,
          lastSyncedAt,
          lastError: null,
        }));
        const updated = peer.getPairedDevices();
        setPairedDevices((previous) => {
          const merged = previous.map(
            (device) => updated.find((item) => item.id === device.id) || device
          );
          savePairedDevices(merged);
          return merged;
        });
        return {
          success: true,
          changesPushed: changes.length,
          changesReceived: received.reduce((sum, count) => sum + count, 0),
        };
      } catch (error) {
        if (syncRef.current === peer) reportError(error);
        return {
          success: false,
          changesPushed: 0,
          changesReceived: 0,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })();
    operationRef.current = operation;
    try {
      return await operation;
    } finally {
      if (operationRef.current === operation) operationRef.current = null;
    }
  }, [reportError, t.settings.sync.notConnected]);
  requestRef.current = forceSync;

  useEffect(() => {
    if (!db || !isReady || !isUnlocked || !activeProfileId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pendingReset = false;
    const adapter = new ProfileDataSync(
      db,
      activeProfileId,
      deviceId,
      () => active && activeRef.current === activeProfileId
    );
    adapterRef.current = adapter;
    setPairedDevices((previous) =>
      previous.map((device) => ({ ...device, isConnected: false }))
    );
    setSyncStatus({ ...defaultSyncStatus, state: 'offline' });
    setPendingPairingRequest(null);
    setPairingCode(null);
    const peer = createPeerSync({
      deviceId,
      deviceName,
      profileId: activeProfileId,
      schemaVersion: LATEST_MIGRATION_VERSION,
      getActiveProfileId: () => activeRef.current,
      onPairingRequest: (name, accept, reject) => {
        if (active)
          setPendingPairingRequest({
            deviceName: name,
            accept: () => {
              accept();
              setPendingPairingRequest(null);
            },
            reject: () => {
              reject();
              setPendingPairingRequest(null);
            },
          });
      },
      onPaired: (device) => {
        if (!active) return;
        setPairedDevices((previous) => {
          const updated = [
            ...previous.filter((item) => item.id !== device.id),
            device,
          ];
          savePairedDevices(updated);
          return updated;
        });
        setPendingPairingRequest(null);
        setSyncStatus((status) => ({
          ...status,
          connectedPeers: peer
            .getPairedDevices()
            .filter((item) => item.isConnected).length,
        }));
        // Both users approved merging these two active profiles.
        timer = setTimeout(() => {
          void requestRef.current();
        }, 100);
      },
      onSyncReceived: async (changes, device) => {
        if (
          !active ||
          activeRef.current !== adapter.profileId ||
          device.localProfileId !== adapter.profileId ||
          !device.remoteProfileId
        )
          throw new Error('Sync profile is no longer active');
        const applied = await adapter.applyChanges(
          changes,
          device.remoteProfileId,
          device.id
        );
        if (!active || activeRef.current !== adapter.profileId)
          throw new Error('Active profile changed during sync');
        await queryClient.invalidateQueries();
        return applied;
      },
      onSyncRequested: async () => {
        if (!active || activeRef.current !== adapter.profileId)
          throw new Error('Sync profile is no longer active');
        await adapter.captureLocalChanges();
        return adapter.getChanges();
      },
      onConnectionChange: (peerId, connected) => {
        if (!active) return;
        setPairedDevices((previous) => {
          const updated = previous.map((device) =>
            device.peerId === peerId
              ? {
                  ...device,
                  isConnected:
                    connected && device.localProfileId === activeRef.current,
                }
              : device
          );
          savePairedDevices(updated);
          const count = updated.filter(
            (device) =>
              device.isConnected && device.localProfileId === activeRef.current
          ).length;
          setSyncStatus((status) => ({
            ...status,
            connectedPeers: count,
            state: count ? status.state : 'offline',
          }));
          return updated;
        });
      },
      onError: (error) => {
        if (active) reportError(error);
      },
    });
    syncRef.current = peer;
    const unsubscribe = subscribeLocalDataChanges((change) => {
      if (!active || (change.profileId && change.profileId !== activeProfileId))
        return;
      pendingReset ||=
        !!change.method && /^(restore|reset)/.test(change.method);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const reset = pendingReset;
        pendingReset = false;
        void adapter
          .captureLocalChanges(reset)
          .then((changes) => {
            if (!active) return;
            setSyncStatus((status) => ({
              ...status,
              pendingChanges: status.pendingChanges + changes.length,
            }));
            if (
              autoSyncRef.current &&
              peer.getPairedDevices().some((device) => device.isConnected)
            )
              void requestRef.current();
          })
          .catch(reportError);
      }, 500);
    });
    void adapter
      .initialize()
      .then(() => peer.initialize())
      .then(() => {
        if (active) setIsInitialized(true);
      })
      .catch((error) => {
        if (active) reportError(error);
      });
    return () => {
      active = false;
      unsubscribe();
      if (timer) clearTimeout(timer);
      peer.destroy();
      if (syncRef.current === peer) syncRef.current = null;
      if (adapterRef.current === adapter) adapterRef.current = null;
      operationRef.current = null;
      setIsInitialized(false);
    };
  }, [
    db,
    isReady,
    isUnlocked,
    activeProfileId,
    deviceId,
    deviceName,
    initVersion,
    queryClient,
    reportError,
  ]);

  const setDeviceName = useCallback((name: string) => {
    setDeviceNameState(name.trim().slice(0, 100));
    void writeToOPFSWithCache(DEVICE_NAME_KEY, name.trim().slice(0, 100));
  }, []);
  const generateNewPairingCode = useCallback(() => {
    const peer = syncRef.current;
    if (!peer?.getPeerId()) return;
    try {
      setPairingCode(`${peer.getPeerId()}:${peer.startPairing()}`);
    } catch (error) {
      reportError(error);
    }
  }, [reportError]);
  const connectWithPairingCode = useCallback(
    async (code: string): Promise<boolean> => {
      const peer = syncRef.current;
      if (!peer) return false;
      const [peerId, pairing, extra] = code.trim().split(':');
      if (!peerId || !pairing || extra) throw new Error('Invalid pairing code');
      try {
        await peer.connectWithCode(peerId, pairing);
        return true;
      } catch (error) {
        reportError(error);
        throw error;
      }
    },
    [reportError]
  );
  const sendSyncChanges = useCallback(
    (peerId: string, changes: SyncChange[]) => {
      void syncRef.current?.sendChanges(peerId, changes).catch(reportError);
    },
    [reportError]
  );
  const requestSync = useCallback(
    (peerId: string, sinceTimestamp: number) => {
      void syncRef.current
        ?.requestSync(peerId, sinceTimestamp)
        .catch(reportError);
    },
    [reportError]
  );
  const disconnectDevice = useCallback((id: string) => {
    syncRef.current?.disconnect(id);
    setPairedDevices((previous) => {
      const updated = previous.filter((device) => device.id !== id);
      savePairedDevices(updated);
      return updated;
    });
  }, []);
  const queueChange = useCallback((_change: SyncChange<SyncableRow>) => {
    if (autoSyncRef.current) void requestRef.current();
  }, []);
  const queueChanges = useCallback((_changes: SyncChange<SyncableRow>[]) => {
    if (autoSyncRef.current) void requestRef.current();
  }, []);
  const formatLastSynced = useCallback(
    (locale: 'en' | 'nl' = 'en') =>
      formatRelativeTime(syncStatus.lastSyncedAt, locale),
    [syncStatus.lastSyncedAt]
  );
  const setAutoSyncEnabled = useCallback((enabled: boolean) => {
    setAutoSyncEnabledState(enabled);
    void writeToOPFSWithCache(AUTO_SYNC_KEY, enabled);
    if (enabled) void requestRef.current();
  }, []);
  const retryInitialization = useCallback(() => {
    setLastError(null);
    setInitVersion((version) => version + 1);
  }, []);
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
      retryInitialization,
      syncStatus,
      forceSync,
      queueChange,
      queueChanges,
      formatLastSynced,
      autoSyncEnabled,
      setAutoSyncEnabled,
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
      retryInitialization,
      syncStatus,
      forceSync,
      queueChange,
      queueChanges,
      formatLastSynced,
      autoSyncEnabled,
      setAutoSyncEnabled,
    ]
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
