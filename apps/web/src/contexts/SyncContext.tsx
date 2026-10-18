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
  hasPairedDeviceForProfile,
  type PeerSync,
  type PeerDevice,
  type ReconnectIssue,
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
import { openReconnectSecret, sealReconnectSecret } from '@/lib/sync-secrets';
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

/** A paired device as stored and shown; it never holds the plain secret. */
export interface SyncDevice extends PeerDevice {
  /** Reconnect secret sealed with the database key (see sync-secrets). */
  sealedReconnectSecret?: string;
  /** Set this session when the device cannot reconnect by itself. */
  reconnectIssue?: ReconnectIssue;
}

/** Whether a stored pairing reconnects by itself after a restart. */
export function canReconnect(device: SyncDevice): boolean {
  return (
    !!device.sealedReconnectSecret && device.reconnectIssue !== 'pair-again'
  );
}

interface SyncContextType {
  /** This device's unique ID */
  deviceId: string;
  /** This device's display name */
  deviceName: string;
  /** Update device name */
  setDeviceName: (name: string) => void;
  /** Whether the signalling connection is open */
  isInitialized: boolean;
  /**
   * Whether the signalling connection is being opened. It opens only when the
   * active profile has a paired device or the user starts pairing.
   */
  isConnecting: boolean;
  /** Current pairing code (for others to connect) */
  pairingCode: string | null;
  /** Connect on demand and generate a new pairing code; null on failure */
  generateNewPairingCode: () => Promise<string | null>;
  /** Connect to another device using their pairing code */
  connectWithPairingCode: (code: string) => Promise<boolean>;
  /** List of paired devices */
  pairedDevices: SyncDevice[];
  /** Retry reconnecting paired devices now (also those that needed the user) */
  reconnectDevices: () => void;
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
function getStoredPairedDevices(): SyncDevice[] {
  if (typeof window === 'undefined') return [];

  if (isSettingsCacheInitialized()) {
    const stored = readFromOPFSSync<SyncDevice[]>(PAIRED_DEVICES_KEY);
    if (stored && Array.isArray(stored))
      return stored.map((device) => ({ ...device, isConnected: false }));
  }

  return [];
}

// Save paired devices to OPFS (only sealed secrets, no session state)
function savePairedDevices(devices: SyncDevice[]): void {
  if (typeof window === 'undefined') return;
  const stored = devices.map(
    ({ reconnectIssue: _issue, ...device }) =>
      ({ ...device, reconnectSecret: undefined }) as SyncDevice
  );
  writeToOPFSWithCache(PAIRED_DEVICES_KEY, stored).catch((err) =>
    console.warn('Failed to save paired devices to OPFS:', err)
  );
}

/** Copy the public pairing fields; never the secret a peer object may hold. */
function toSyncDevice(device: PeerDevice): SyncDevice {
  return {
    id: device.id,
    name: device.name,
    peerId: device.peerId,
    lastSyncAt: device.lastSyncAt,
    isConnected: device.isConnected,
    localProfileId: device.localProfileId,
    remoteProfileId: device.remoteProfileId,
    protocolVersion: device.protocolVersion,
    supportsFragmentation: device.supportsFragmentation,
  };
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
  const { isUnlocked, encryptionKey } = useEncryption();
  const encryptionKeyRef = useRef(encryptionKey);
  encryptionKeyRef.current = encryptionKey;
  const queryClient = useQueryClient();
  const [deviceId] = useState(getOrCreateDeviceId);
  const [deviceName, setDeviceNameState] = useState(() =>
    getDeviceName(t.common.unknownDevice)
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairedDevices, setPairedDevices] = useState<SyncDevice[]>(
    getStoredPairedDevices
  );
  const pairedDevicesRef = useRef(pairedDevices);
  pairedDevicesRef.current = pairedDevices;
  const [pendingPairingRequest, setPendingPairingRequest] =
    useState<SyncContextType['pendingPairingRequest']>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [autoSyncEnabled, setAutoSyncEnabledState] =
    useState(getAutoSyncEnabled);
  const [initVersion, setInitVersion] = useState(0);
  const syncRef = useRef<PeerSync | null>(null);
  // Opens (or joins) the signalling connection of the current peer.
  const connectRef = useRef<(() => Promise<string>) | null>(null);
  // Closes the signalling connection while keeping the current peer reusable.
  const releaseRef = useRef<(() => void) | null>(null);
  // Retries reconnecting paired devices of the current peer.
  const reconnectRef = useRef<((retryBlocked: boolean) => void) | null>(null);
  const adapterRef = useRef<ProfileDataSync | null>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = isUnlocked && isReady ? activeProfileId : null;
  const operationRef = useRef<Promise<ForceSyncResult> | null>(null);
  const rerunSyncRef = useRef(false);
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
          const merged = previous.map((device) => {
            const current = updated.find((item) => item.id === device.id);
            // Keep stored fields such as the sealed reconnect secret.
            return current ? { ...device, ...toSyncDevice(current) } : device;
          });
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
      if (operationRef.current === operation) {
        operationRef.current = null;
        const rerun = rerunSyncRef.current;
        rerunSyncRef.current = false;
        if (rerun && autoSyncRef.current && syncRef.current === peer)
          void requestRef.current();
      }
    }
  }, [reportError, t.settings.sync.notConnected]);
  requestRef.current = forceSync;
  const requestAutoSync = useCallback(() => {
    if (!autoSyncRef.current) return;
    if (operationRef.current) rerunSyncRef.current = true;
    else void requestRef.current();
  }, []);

  useEffect(() => {
    if (!db || !isReady || !isUnlocked || !activeProfileId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let syncTimer: ReturnType<typeof setTimeout> | undefined;
    let pendingReset = false;
    const updateDevice = (
      id: string,
      update: (device: SyncDevice) => SyncDevice | null
    ) =>
      setPairedDevices((previous) => {
        const updated = previous.flatMap((device) => {
          if (device.id !== id) return [device];
          const next = update(device);
          return next ? [next] : [];
        });
        savePairedDevices(updated);
        return updated;
      });
    const countConnected = () =>
      setSyncStatus((status) => ({
        ...status,
        connectedPeers: peer
          .getPairedDevices()
          .filter((item) => item.isConnected).length,
      }));
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
      onPaired: (device, reconnectSecret) => {
        if (!active) return;
        setPairedDevices((previous) => {
          const updated = [
            ...previous.filter((item) => item.id !== device.id),
            toSyncDevice(device),
          ];
          savePairedDevices(updated);
          return updated;
        });
        // Store the secret sealed, so this pairing reconnects after restarts.
        if (reconnectSecret)
          void sealReconnectSecret(
            encryptionKeyRef.current,
            device.id,
            reconnectSecret
          )
            .then((sealedReconnectSecret) => {
              if (active)
                updateDevice(device.id, (stored) => ({
                  ...stored,
                  sealedReconnectSecret,
                }));
            })
            .catch(reportError);
        setPendingPairingRequest(null);
        countConnected();
        // Both users approved merging these two active profiles.
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          void requestRef.current();
        }, 100);
      },
      onReconnected: (device) => {
        if (!active) return;
        updateDevice(device.id, (stored) => ({
          ...stored,
          ...toSyncDevice(device),
          isConnected: true,
          reconnectIssue: undefined,
        }));
        countConnected();
        // Catch up on changes made while the devices were apart.
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(requestAutoSync, 100);
      },
      onUnpaired: (device) => {
        if (active) updateDevice(device.id, () => null);
      },
      onReconnectIssue: (device, reconnectIssue) => {
        if (active)
          updateDevice(device.id, (stored) => ({ ...stored, reconnectIssue }));
      },
      isKnownDevice: (id) =>
        pairedDevicesRef.current.some(
          (device) =>
            device.id === id && device.localProfileId !== activeProfileId
        ),
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
              requestAutoSync();
          })
          .catch(reportError);
      }, 500);
    });
    const adapterReady = adapter.initialize();
    // Pairings of this profile that can reconnect without a new pairing code.
    const restorable = pairedDevicesRef.current.filter(
      (device) =>
        device.localProfileId === activeProfileId &&
        device.sealedReconnectSecret
    );
    let restoredCount = 0;
    const restored = Promise.all(
      restorable.map(async (device) => {
        const secret = await openReconnectSecret(
          encryptionKeyRef.current,
          device.id,
          device.sealedReconnectSecret ?? ''
        );
        if (!active) return;
        if (secret && peer.restorePairedDevice(device, secret))
          restoredCount += 1;
        else
          updateDevice(device.id, (stored) => ({
            ...stored,
            reconnectIssue: 'pair-again',
          }));
      })
    );
    // The signalling server learns this device's IP address, so it is only
    // contacted once sync is actually used (see connect callers below).
    let connection: Promise<string> | null = null;
    let isConnectingNow = false;
    const connect = (): Promise<string> => {
      if (connection) return connection;
      isConnectingNow = true;
      setIsConnecting(true);
      const attempt = Promise.all([adapterReady, restored])
        .then(() => {
          if (!active || connection !== attempt)
            throw new Error('Peer destroyed');
          return peer.initialize();
        })
        .then((peerId) => {
          if (!active || connection !== attempt)
            throw new Error('Peer destroyed');
          setIsInitialized(true);
          return peerId;
        });
      connection = attempt;
      attempt
        .catch(() => {
          // A failed attempt can be retried by the next pairing action.
          if (connection === attempt) connection = null;
        })
        .finally(() => {
          if (connection !== attempt && connection) return;
          isConnectingNow = false;
          if (active) setIsConnecting(false);
        });
      return attempt;
    };
    const release = () => {
      if (!connection) return;
      connection = null;
      peer.destroy();
      setIsInitialized(false);
      setIsConnecting(false);
      setPairingCode(null);
      setSyncStatus((status) => ({
        ...status,
        connectedPeers: 0,
        state: 'offline',
      }));
    };
    // Retry now (e.g. back online): dial waiting pairings, or reopen a
    // signalling connection that was lost while offline.
    const reconnect = (retryBlocked: boolean) => {
      const reconnectable = peer
        .getPairedDevices()
        .some((device) => peer.canReconnect(device.id));
      if (!active || !reconnectable || isConnectingNow) return;
      if (connection && peer.reconnectPairedDevices({ retryBlocked })) return;
      connection = null;
      void connect().catch((error) => {
        if (active) reportError(error);
      });
    };
    const onOnline = () => reconnect(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible') reconnect(false);
    };
    connectRef.current = connect;
    releaseRef.current = release;
    reconnectRef.current = reconnect;
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    void Promise.all([adapterReady, restored])
      .then(() => {
        // Paired devices reconnect by themselves; others connect on demand.
        if (active && restoredCount) return connect();
      })
      .catch((error) => {
        if (active) reportError(error);
      });
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      if (timer) clearTimeout(timer);
      if (syncTimer) clearTimeout(syncTimer);
      if (reconnectRef.current === reconnect) reconnectRef.current = null;
      peer.destroy();
      if (syncRef.current === peer) syncRef.current = null;
      if (connectRef.current === connect) connectRef.current = null;
      if (releaseRef.current === release) releaseRef.current = null;
      if (adapterRef.current === adapter) adapterRef.current = null;
      operationRef.current = null;
      rerunSyncRef.current = false;
      setIsInitialized(false);
      setIsConnecting(false);
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
    requestAutoSync,
  ]);

  const setDeviceName = useCallback((name: string) => {
    setDeviceNameState(name.trim().slice(0, 100));
    void writeToOPFSWithCache(DEVICE_NAME_KEY, name.trim().slice(0, 100));
  }, []);
  const generateNewPairingCode = useCallback(async (): Promise<
    string | null
  > => {
    const peer = syncRef.current;
    const connect = connectRef.current;
    if (!peer || !connect) return null;
    setLastError(null);
    try {
      const peerId = await connect();
      // A profile switch or lock while connecting replaces the peer.
      if (syncRef.current !== peer) return null;
      const code = `${peer.getPeerId() ?? peerId}:${peer.startPairing()}`;
      setPairingCode(code);
      return code;
    } catch (error) {
      if (syncRef.current === peer) reportError(error);
      return null;
    }
  }, [reportError]);
  const connectWithPairingCode = useCallback(
    async (code: string): Promise<boolean> => {
      const peer = syncRef.current;
      const connect = connectRef.current;
      if (!peer || !connect) return false;
      const [peerId, pairing, extra] = code.trim().split(':');
      if (!peerId || !pairing || extra) throw new Error('Invalid pairing code');
      setLastError(null);
      try {
        await connect();
        if (syncRef.current !== peer) return false;
        await peer.connectWithCode(peerId, pairing);
        return true;
      } catch (error) {
        if (syncRef.current === peer) reportError(error);
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
    const updated = pairedDevicesRef.current.filter(
      (device) => device.id !== id
    );
    pairedDevicesRef.current = updated;
    setPairedDevices(updated);
    savePairedDevices(updated);
    // Without paired devices left, stop announcing this device to the server.
    if (!hasPairedDeviceForProfile(updated, activeRef.current))
      releaseRef.current?.();
  }, []);
  const reconnectDevices = useCallback(() => {
    setLastError(null);
    reconnectRef.current?.(true);
  }, []);
  const queueChange = useCallback(
    (_change: SyncChange<SyncableRow>) => {
      requestAutoSync();
    },
    [requestAutoSync]
  );
  const queueChanges = useCallback(
    (_changes: SyncChange<SyncableRow>[]) => {
      requestAutoSync();
    },
    [requestAutoSync]
  );
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
      isConnecting,
      pairingCode,
      generateNewPairingCode,
      connectWithPairingCode,
      pairedDevices,
      reconnectDevices,
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
      isConnecting,
      pairingCode,
      generateNewPairingCode,
      connectWithPairingCode,
      pairedDevices,
      reconnectDevices,
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
