/**
 * Peer-to-Peer Device Pairing
 * Uses PeerJS for WebRTC connections and a simple pairing code for authentication
 *
 * Note: This file uses `any` types and console statements intentionally for PeerJS
 * library interop where type information is not available.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import type { Peer, DataConnection } from 'peerjs';
import {
  getLoadedPeerJs,
  loadPeerJs,
  type PeerJsModule,
} from './peerjs-loader.js';
import type { SyncChange, SyncableRow } from './sync.js';
import {
  createEncryptionSession,
  completeKeyExchange,
  encryptMessage,
  decryptMessage,
  isEncryptedEnvelope,
  type SyncEncryptionSession,
  type SyncJsonWebKey,
} from './sync-encryption.js';
import {
  computeReconnectProof,
  generateReconnectSecret,
  homePeerId,
  isValidDeviceId,
  isValidReconnectSecret,
  reconnectDelay,
  verifyReconnectProof,
  type ReconnectProofInput,
} from './peer-reconnect.js';

function peerDebugLog(...args: unknown[]): void {
  const env = (import.meta as any).env;
  const runtimeGlobal = globalThis as typeof globalThis & {
    __TAURI__?: unknown;
  };
  const isTauri = '__TAURI__' in runtimeGlobal;
  if (!env?.DEV && !isTauri) return;
  console.log(...args);
}

/**
 * ICE Server Configuration
 *
 * STUN servers help peers discover their public IP addresses.
 * TURN servers relay traffic when direct peer-to-peer connections fail (symmetric NAT).
 *
 * For production deployments, consider:
 * 1. Self-hosted TURN server using coturn (https://github.com/coturn/coturn)
 * 2. Paid TURN services like Twilio, Xirsys, or Metered
 *
 * Set environment variable VITE_TURN_SERVER_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL
 * to override the default TURN server.
 */
export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Get default STUN servers (Google's free STUN servers)
 */
export function getDefaultStunServers(): IceServerConfig[] {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];
}

/**
 * Get default TURN servers
 * Uses Metered free TURN servers as fallback, but these have rate limits.
 * For production, use environment variables to configure your own TURN server.
 */
export function getDefaultTurnServers(): IceServerConfig[] {
  // Check for custom TURN server configuration via environment
  const customTurnUrl =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_TURN_SERVER_URL;
  const customTurnUsername =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_TURN_USERNAME;
  const customTurnCredential =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_TURN_CREDENTIAL;

  if (customTurnUrl && customTurnUsername && customTurnCredential) {
    peerDebugLog('Using custom TURN server configuration');
    return [
      {
        urls: customTurnUrl,
        username: customTurnUsername,
        credential: customTurnCredential,
      },
    ];
  }

  // Default: Metered free TURN servers
  // Note: These are rate-limited. For production use, configure your own TURN server.
  // See: https://www.metered.ca/tools/openrelay/
  return [
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ];
}

/**
 * Get combined ICE servers configuration
 */
export function getIceServers(): IceServerConfig[] {
  return [...getDefaultStunServers(), ...getDefaultTurnServers()];
}

/**
 * Get PeerJS server configuration from environment variables
 * Set VITE_PEERJS_HOST to use a custom PeerJS server
 *
 * Environment variables:
 * - VITE_PEERJS_HOST: Server hostname (required for custom server)
 * - VITE_PEERJS_PORT: Server port (default: 443)
 * - VITE_PEERJS_PATH: Server path (default: '/')
 * - VITE_PEERJS_SECURE: Use HTTPS (default: 'true')
 * - VITE_PEERJS_KEY: API key (optional)
 */
export function getPeerServerConfig(): PeerServerConfig | undefined {
  const host =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_PEERJS_HOST;

  if (!host) {
    return undefined; // Use default PeerJS cloud server
  }

  const port =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_PEERJS_PORT;
  const path =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_PEERJS_PATH;
  const secure =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_PEERJS_SECURE;
  const key =
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_PEERJS_KEY;

  peerDebugLog('Using custom PeerJS server:', host);

  return {
    host,
    port: port ? parseInt(port, 10) : 443,
    path: path || '/',
    secure: secure !== 'false', // Default to true
    key: key || undefined,
  };
}

// Pairing message types
export type PairingMessage =
  | { type: 'key-exchange'; publicKey: SyncJsonWebKey }
  | {
      type: 'pairing-request';
      pairingCode: string;
      deviceName: string;
      deviceId: string;
      profileId: string;
      schemaVersion: number;
      protocolVersion: 2;
      supportsFragmentation?: true;
      /** The requester can store a secret to reconnect after restarts. */
      supportsReconnect?: true;
    }
  | {
      type: 'pairing-accept';
      deviceId: string;
      deviceName: string;
      profileId: string;
      schemaVersion: number;
      protocolVersion: 2;
      supportsFragmentation?: true;
      /** Shared secret that authorizes later reconnections of this pairing. */
      reconnectSecret?: string;
    }
  | { type: 'pairing-reject'; reason: string }
  | {
      type: 'reconnect-request';
      deviceId: string;
      deviceName: string;
      profileId: string;
      schemaVersion: number;
      protocolVersion: 2;
      supportsFragmentation?: true;
      proof: string;
    }
  | {
      type: 'reconnect-accept';
      deviceId: string;
      deviceName: string;
      profileId: string;
      schemaVersion: number;
      protocolVersion: 2;
      supportsFragmentation?: true;
      proof: string;
    }
  | { type: 'reconnect-reject'; reason: ReconnectRejectReason }
  /** The sender removed this pairing; sent over an authorized connection. */
  | { type: 'unpair' }
  | { type: 'sync-request'; sinceTimestamp: number; requestId: string }
  | { type: 'sync-response'; changes: SyncChange[]; requestId: string }
  | { type: 'sync-push'; changes: SyncChange[]; requestId: string }
  | {
      type: 'sync-fragment';
      requestId: string;
      messageType: 'sync-push' | 'sync-response';
      index: number;
      count: number;
      payload: string;
    }
  | { type: 'sync-ack'; applied: number; requestId: string }
  | { type: 'sync-error'; reason: string; requestId: string };

/**
 * Why a paired device refused to reconnect: it no longer knows the pairing,
 * its app version differs, or the proof or profile did not match.
 */
export type ReconnectRejectReason =
  'unknown-device' | 'version-mismatch' | 'profile-mismatch' | 'invalid-proof';

/** Reconnection problems that need the user: pair again or update. */
export type ReconnectIssue = 'pair-again' | 'update-required';

export interface PeerDevice {
  id: string;
  name: string;
  peerId: string;
  lastSyncAt: number | null;
  isConnected: boolean;
  /** Only fresh, explicitly approved pairings authorize financial data. */
  localProfileId?: string;
  remoteProfileId?: string;
  protocolVersion?: 2;
  supportsFragmentation?: boolean;
}

/**
 * Whether a profile has a paired device, which is when the PeerJS signalling
 * server should be contacted without the user starting a pairing flow.
 */
export function hasPairedDeviceForProfile(
  devices: readonly PeerDevice[],
  profileId: string | null | undefined
): boolean {
  return (
    !!profileId && devices.some((device) => device.localProfileId === profileId)
  );
}

const SYNC_FRAME_CHARS = 32768;
const MAX_SYNC_BUFFER_CHARS = 32_000_000;
const MAX_SYNC_FRAMES = Math.ceil(MAX_SYNC_BUFFER_CHARS / SYNC_FRAME_CHARS);
const LARGE_SYNC_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_INCOMING_SNAPSHOTS = 4;
type IncomingSnapshot = {
  peerId: string;
  connection: DataConnection;
  messageType: 'sync-push' | 'sync-response';
  count: number;
  chunks: Map<number, string>;
  chars: number;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * PeerJS server configuration for self-hosted servers
 */
export interface PeerServerConfig {
  /** Server host (e.g., 'my-peerjs-server.com') */
  host: string;
  /** Server port (default: 443 for secure, 9000 for local) */
  port?: number;
  /** Server path (default: '/') */
  path?: string;
  /** Use secure WebSocket (wss://) - should be true for production */
  secure?: boolean;
  /** API key for the PeerJS server (if required) */
  key?: string;
}

export interface PeerOptions {
  /** Device ID for this device */
  deviceId: string;
  /** Human-readable device name */
  deviceName: string;
  profileId?: string;
  schemaVersion?: number;
  getActiveProfileId?: () => string | null;
  /** Custom ICE servers configuration (optional) */
  iceServers?: IceServerConfig[];
  /** Custom PeerJS server configuration for self-hosted servers (optional) */
  peerServer?: PeerServerConfig;
  /** Callback when a new device wants to pair */
  onPairingRequest?: (
    deviceName: string,
    accept: () => void,
    reject: () => void
  ) => void;
  /**
   * Callback when pairing is complete. The reconnect secret (when both devices
   * support reconnection) must be stored securely to restore the pairing.
   */
  onPaired?: (device: PeerDevice, reconnectSecret?: string) => void;
  /** Callback when a restored pairing has reconnected and is authorized. */
  onReconnected?: (device: PeerDevice) => void;
  /** Callback when the other device removed this pairing. */
  onUnpaired?: (device: PeerDevice) => void;
  /** Callback when a restored pairing cannot reconnect without the user. */
  onReconnectIssue?: (device: PeerDevice, issue: ReconnectIssue) => void;
  /**
   * Whether a device is paired with any local profile, so a reconnect for an
   * inactive profile is postponed instead of reported as removed.
   */
  isKnownDevice?: (deviceId: string) => boolean;
  /** Callback when sync data is received */
  onSyncReceived?: (
    changes: SyncChange<SyncableRow>[],
    device: PeerDevice
  ) => Promise<number>;
  /** Callback when a peer requests sync - should return local changes to send back */
  onSyncRequested?: (
    peerId: string,
    sinceTimestamp: number
  ) => Promise<SyncChange<SyncableRow>[]>;
  /** Callback when connection status changes */
  onConnectionChange?: (peerId: string, connected: boolean) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

/**
 * Generate a 6-digit pairing code
 */
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars (0,O,1,I,L removed)
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex =
      crypto.getRandomValues(new Uint32Array(1))[0] % chars.length;
    code += chars[randomIndex];
  }
  return code;
}

/**
 * PeerSync manages peer-to-peer connections for device syncing
 */
export class PeerSync {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private pairedDevices: Map<string, PeerDevice> = new Map();
  private encryptionSessions: Map<string, SyncEncryptionSession> = new Map();
  private encryptionInitializers = new Map<
    string,
    Promise<SyncEncryptionSession>
  >();
  private sentKeyExchanges = new Set<string>();
  /** Connections (by remote peer ID) that completed pairing or reconnection. */
  private authorizedPeers = new Map<string, string>();
  /** Reconnect secrets by device ID; never exposed through PeerDevice. */
  private reconnectSecrets = new Map<string, string>();
  private outgoingConnections = new WeakSet<DataConnection>();
  /** Outgoing reconnect attempts by device ID. */
  private reconnectDials = new Map<string, DataConnection>();
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private reconnectAttempts = new Map<string, number>();
  /** Devices that need the user (pair again or update) before retrying. */
  private blockedReconnects = new Set<string>();
  /** Handlers for "peer unavailable" signalling errors by target peer ID. */
  private dialFailures = new Map<string, (error: Error) => void>();
  private afterKeyExchange = new Map<DataConnection, () => Promise<void>>();
  private reconnectTimeouts = new WeakMap<
    DataConnection,
    ReturnType<typeof setTimeout>
  >();
  private options: PeerOptions;
  private pendingPairingCode: string | null = null;
  private isInitialized = false;
  private pairingExpiresAt = 0;
  private cancelInitialization: (() => void) | null = null;
  private incomingSnapshots = new Map<string, IncomingSnapshot>();
  private processingSnapshots = new Map<
    string,
    { peerId: string; chars: number }
  >();
  private completedSnapshots = new Map<string, string>();
  private bufferedSnapshotChars = 0;
  private pendingSync = new Map<
    string,
    {
      peerId: string;
      kind: 'push' | 'request';
      resolve: (applied: number) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  // Track session ID to ensure unique peer IDs across page refreshes
  private sessionId: string = crypto.randomUUID().slice(0, 8);

  constructor(options: PeerOptions) {
    this.options = options;
  }

  /**
   * Initialize PeerJS connection
   */
  async initialize(): Promise<string> {
    if (this.isInitialized && this.peer && !this.peer.destroyed) {
      return this.peer.id;
    }

    this.cancelInitialization?.();
    this.isInitialized = false;
    if (this.peer) {
      try {
        (this.peer as any)._ignoreEvents = true;
        this.peer.removeAllListeners();
        this.peer.destroy();
      } catch (e) {
        console.warn('Error destroying PeerJS instance:', e);
      }
      this.peer = null;
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      let peerJs: PeerJsModule | null = getLoadedPeerJs();
      let retryTimer: ReturnType<typeof setTimeout> | undefined;
      const finish = (error?: Error, peerId?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (retryTimer) clearTimeout(retryTimer);
        if (this.cancelInitialization === cancel)
          this.cancelInitialization = null;
        if (error) reject(error);
        else if (peerId !== undefined) resolve(peerId);
        else reject(new Error('Peer initialization failed'));
      };
      const cancel = () => finish(new Error('Peer destroyed'));
      this.cancelInitialization = cancel;
      const timeoutMs = 15000; // 15s timeout
      const timeout = setTimeout(() => {
        if (this.peer) {
          this.peer.destroy();
          this.peer = null;
        }
        finish(
          new Error(
            'Connection to peer server timed out. Check your internet connection.'
          )
        );
      }, timeoutMs);

      const setupPeer = (id: string, _isRetry = false) => {
        if (settled) return;
        try {
          if (this.peer && !this.peer.destroyed) {
            this.peer.destroy();
          }

          // Use custom ICE servers if provided, otherwise use defaults
          const iceServers = this.options.iceServers || getIceServers();

          // Build PeerJS options - support custom server configuration

          const peerOptions: any = {
            debug: 1, // Increased debug level for better troubleshooting
            config: {
              iceServers,
              // ICE transport policy - prefer relay for more reliable connections
              // when direct connection fails
              iceCandidatePoolSize: 10,
            },
          };

          // Add custom PeerJS server configuration if provided
          if (this.options.peerServer) {
            peerOptions.host = this.options.peerServer.host;
            peerOptions.port = this.options.peerServer.port ?? 443;
            peerOptions.path = this.options.peerServer.path ?? '/';
            peerOptions.secure = this.options.peerServer.secure ?? true;
            if (this.options.peerServer.key) {
              peerOptions.key = this.options.peerServer.key;
            }
          }

          if (!peerJs) throw new Error('PeerJS is not loaded');
          const peer = new peerJs.Peer(id, peerOptions);
          this.peer = peer;

          peer.on('open', (peerId) => {
            if (this.peer !== peer || (peer as any)._ignoreEvents) return;
            peerDebugLog('PeerJS connection opened with ID:', peerId);
            this.isInitialized = true;
            finish(undefined, peerId);
            // Also after reconnecting to the signalling server.
            this.reconnectPairedDevices({ resetBackoff: false });
          });

          peer.on('error', (err) => {
            if (this.peer !== peer || (peer as any)._ignoreEvents) return;

            // The signalling server reports unreachable dial targets on the
            // peer, not the connection; route them to the pending dial.
            if (err.type === 'peer-unavailable' && this.failDial(err.message))
              return;

            // Suppress network-related WebSocket errors (expected when offline)
            const isNetworkError =
              err.type === 'network' ||
              err.type === 'socket-error' ||
              err.type === 'socket-closed' ||
              (err.message &&
                (err.message.includes('WebSocket') ||
                  err.message.toLowerCase().includes('time') ||
                  err.message.toLowerCase().includes('connect')));

            if (isNetworkError) {
              console.warn(
                'PeerJS network error (expected when offline):',
                err.type || err.message
              );
              // Don't reject - allow offline operation
              this.isInitialized = true; // Mark as initialized anyway so app doesn't hang
              finish(undefined, id); // Return the ID even if connection failed
              return;
            }

            console.error('PeerJS error:', err.type, err.message);
            if (err.type === 'unavailable-id') {
              // Peer ID already taken - this usually happens after a page refresh
              // when the old connection hasn't been cleaned up yet.
              // The PeerJS server TTL is typically 10 seconds.
              (peer as any)._ignoreEvents = true;
              this.peer = null;
              try {
                peer.removeAllListeners();
                peer.destroy();
              } catch (e) {
                console.warn('Error destroying peer after unavailable-id:', e);
              }

              // The stable ID is reachable by paired devices, so wait for the
              // server to release it (3s, 5s, 8s) before using a session ID
              // that only allows outgoing reconnects and pairing.
              if (id === stableId && stableRetries < 3) {
                const waitTime = [3000, 5000, 8000][stableRetries];
                stableRetries += 1;
                peerDebugLog(
                  `Peer ID unavailable, retry ${stableRetries}/3 in ${waitTime / 1000}s...`
                );
                retryTimer = setTimeout(() => {
                  setupPeer(stableId, true);
                }, waitTime);
              } else {
                console.warn(
                  'Peer ID unavailable after 3 retries. Using a session ID.'
                );
                retryTimer = setTimeout(() => {
                  setupPeer(
                    `${stableId ?? `fluxby-${this.options.deviceId}`}-${this.sessionId}-${Date.now()}`,
                    true
                  );
                }, 500);
              }
            } else {
              this.options.onError?.(err);
              // Don't reject for non-critical errors
              if (
                err.type !== 'peer-unavailable' &&
                err.type !== 'server-error'
              ) {
                finish(err);
              } else {
                this.isInitialized = true;
                finish(undefined, id);
              }
            }
          });

          peer.on('connection', (conn) => {
            if (this.peer !== peer || (peer as any)._ignoreEvents) return;
            peerDebugLog('Incoming peer connection from:', conn.peer);
            this.handleIncomingConnection(conn);
          });

          peer.on('disconnected', () => {
            if (
              this.peer !== peer ||
              peer.destroyed ||
              (peer as any)._ignoreEvents
            )
              return;
            peerDebugLog(
              'PeerJS disconnected from server. Attempting reconnect...'
            );
            // Try to reconnect only if peer is not destroyed
            // and we're still the active peer instance
            // Use try-catch because peer.destroyed can change between check and call
            try {
              if (!peer.destroyed && this.peer === peer) {
                peer.reconnect();
              }
            } catch (e) {
              // Silently ignore "already destroyed" errors - this is expected
              // when multiple disconnect events fire during cleanup or when
              // the peer is destroyed between our check and the reconnect() call
              if (e instanceof Error && !e.message.includes('destroyed')) {
                console.warn('PeerJS reconnect failed:', e);
              }
            }
          });
        } catch (error) {
          console.error('PeerJS setup catch error:', error);
          finish(error instanceof Error ? error : new Error(String(error)));
        }
      };

      // Paired devices find this device again through its stable ID. While a
      // previous page still holds it, the retries above fall back to a session ID.
      const stableId = isValidDeviceId(this.options.deviceId)
        ? homePeerId(this.options.deviceId)
        : null;
      let stableRetries = 0;
      const peerId =
        stableId ?? `fluxby-${this.options.deviceId}-${this.sessionId}`;
      if (peerJs) {
        setupPeer(peerId);
        return;
      }
      loadPeerJs().then(
        (module) => {
          peerJs = module;
          setupPeer(peerId);
        },
        (error: unknown) =>
          finish(error instanceof Error ? error : new Error(String(error)))
      );
    });
  }

  private async ensureEncryptionSession(
    peerId: string
  ): Promise<SyncEncryptionSession> {
    const existing = this.encryptionSessions.get(peerId);
    if (existing) return existing;
    let pending = this.encryptionInitializers.get(peerId);
    if (!pending) {
      pending = createEncryptionSession(peerId).then((session) => {
        if (this.encryptionInitializers.get(peerId) !== pending)
          throw new Error('Sync disconnected during key exchange');
        this.encryptionSessions.set(peerId, session);
        return session;
      });
      this.encryptionInitializers.set(peerId, pending);
    }
    try {
      return await pending;
    } finally {
      if (this.encryptionInitializers.get(peerId) === pending)
        this.encryptionInitializers.delete(peerId);
    }
  }
  private sendPublicKeyOnce(
    conn: DataConnection,
    session: SyncEncryptionSession
  ): void {
    if (!conn.open || this.connections.get(conn.peer) !== conn)
      throw new Error('Sync connection closed');
    if (this.sentKeyExchanges.has(conn.peer)) return;
    this.sentKeyExchanges.add(conn.peer);
    conn.send({
      type: 'key-exchange',
      publicKey: session.localKeyPair.publicKeyJwk,
    });
  }

  /** Device whose stable ID or authorized connection matches a peer ID. */
  private deviceForPeer(peerId: string): PeerDevice | undefined {
    const authorized = this.authorizedPeers.get(peerId);
    if (authorized) return this.pairedDevices.get(authorized);
    for (const device of this.pairedDevices.values())
      if (
        isValidDeviceId(device.id) &&
        homePeerId(device.id) === peerId &&
        this.reconnectSecrets.has(device.id)
      )
        return device;
    return undefined;
  }

  /**
   * When both devices dial each other at the same time, keep the connection
   * that the device with the lower ID started; both sides decide the same.
   */
  private preferConnection(
    existing: DataConnection,
    candidate: DataConnection,
    remoteDeviceId: string | undefined
  ): DataConnection {
    if (!existing.open || !remoteDeviceId) return candidate;
    const starter = (conn: DataConnection) =>
      this.outgoingConnections.has(conn)
        ? this.options.deviceId
        : remoteDeviceId;
    if (starter(existing) === starter(candidate)) return candidate;
    const preferred =
      this.options.deviceId < remoteDeviceId
        ? this.options.deviceId
        : remoteDeviceId;
    return starter(existing) === preferred ? existing : candidate;
  }

  /** Register an opened connection; false when a duplicate is kept instead. */
  private adoptConnection(conn: DataConnection): boolean {
    const existing = this.connections.get(conn.peer);
    if (existing && existing !== conn) {
      const keep = this.preferConnection(
        existing,
        conn,
        this.deviceForPeer(conn.peer)?.id
      );
      if (keep === existing) {
        conn.close();
        return false;
      }
      this.replaceConnection(existing);
    }
    this.connections.set(conn.peer, conn);
    return true;
  }

  /** Close a connection that a newer one replaces, without retrying it. */
  private replaceConnection(conn: DataConnection): void {
    const deviceId = this.authorizedPeers.get(conn.peer);
    this.closeConnection(conn, false);
    if (deviceId) this.clearReconnectTimer(deviceId);
    try {
      conn.close();
    } catch {
      // Already closed
    }
  }

  private closeConnection(conn: DataConnection, retry = true): void {
    for (const [deviceId, dial] of this.reconnectDials)
      if (dial === conn) {
        this.reconnectDials.delete(deviceId);
        if (retry) this.scheduleReconnect(deviceId);
      }
    this.afterKeyExchange.delete(conn);
    if (this.connections.get(conn.peer) !== conn) return;
    const authorizedDevice = this.authorizedPeers.get(conn.peer);
    this.authorizedPeers.delete(conn.peer);
    this.connections.delete(conn.peer);
    this.encryptionSessions.delete(conn.peer);
    this.sentKeyExchanges.delete(conn.peer);
    this.encryptionInitializers.delete(conn.peer);
    for (const [key, snapshot] of this.incomingSnapshots)
      if (snapshot.peerId === conn.peer) this.discardSnapshot(key);
    for (const [key, peerId] of this.completedSnapshots)
      if (peerId === conn.peer) this.completedSnapshots.delete(key);
    for (const [requestId, pending] of this.pendingSync) {
      if (pending.peerId === conn.peer)
        this.completeSync(conn, requestId, 0, 'Sync disconnected');
    }
    for (const device of this.pairedDevices.values()) {
      if (device.peerId === conn.peer) device.isConnected = false;
    }
    this.options.onConnectionChange?.(conn.peer, false);
    if (retry && authorizedDevice) this.scheduleReconnect(authorizedDevice);
  }

  /**
   * Handle incoming peer connection
   */
  private handleIncomingConnection(conn: DataConnection): void {
    conn.on('open', async () => {
      if (!this.adoptConnection(conn)) return;

      // Start encryption key exchange
      try {
        const session = await this.ensureEncryptionSession(conn.peer);
        this.sendPublicKeyOnce(conn, session);
      } catch (err) {
        console.error('Failed to create encryption session:', err);
        this.options.onError?.(
          err instanceof Error ? err : new Error(String(err))
        );
      }
    });

    conn.on('data', async (data) => {
      try {
        await this.handleIncomingData(conn, data);
      } catch (err) {
        console.error('Failed to handle incoming data:', err);
        this.options.onError?.(
          err instanceof Error ? err : new Error(String(err))
        );
      }
    });

    conn.on('close', () => {
      this.closeConnection(conn);
    });

    conn.on('error', (err) => {
      this.options.onError?.(err);
    });
  }

  /**
   * Handle incoming data - decrypt if needed and process
   */
  private async handleIncomingData(
    conn: DataConnection,
    data: unknown
  ): Promise<void> {
    // Check if this is a key-exchange message (sent unencrypted)
    if (
      typeof data === 'object' &&
      data !== null &&
      (data as { type?: string }).type === 'key-exchange'
    ) {
      const keyExchangeMsg = data as {
        type: 'key-exchange';
        publicKey: SyncJsonWebKey;
      };
      try {
        const session = await this.ensureEncryptionSession(conn.peer);
        if (session.isReady)
          throw new Error('Repeated key exchange is not allowed');
        const updatedSession = await completeKeyExchange(
          session,
          keyExchangeMsg.publicKey
        );
        if (
          this.connections.get(conn.peer) !== conn ||
          this.encryptionSessions.get(conn.peer) !== session
        )
          throw new Error('Sync disconnected during key exchange');
        this.encryptionSessions.set(conn.peer, updatedSession);
        this.sendPublicKeyOnce(conn, session);
        const next = this.afterKeyExchange.get(conn);
        this.afterKeyExchange.delete(conn);
        await next?.();
      } catch (error) {
        conn.close();
        throw error;
      }
      return;
    }

    // Try to decrypt if it's an encrypted envelope
    let message: PairingMessage;
    if (isEncryptedEnvelope(data)) {
      const session = this.encryptionSessions.get(conn.peer);
      if (!session?.isReady) {
        console.error('Received encrypted message but session not ready');
        return;
      }
      try {
        message = await decryptMessage<PairingMessage>(session, data);
      } catch (err) {
        console.error('Failed to decrypt message:', err);
        this.options.onError?.(
          err instanceof Error ? err : new Error(String(err))
        );
        return;
      }
    } else {
      throw new Error('Only encrypted pairing and sync messages are accepted');
    }

    await this.handleMessage(conn, message);
  }

  /**
   * Send an encrypted message to a peer
   */
  private async sendEncrypted(
    conn: DataConnection,
    message: PairingMessage
  ): Promise<void> {
    const session = this.encryptionSessions.get(conn.peer);
    if (session?.isReady) {
      const { envelope, session: updatedSession } = await encryptMessage(
        session,
        message
      );
      const currentSession = this.encryptionSessions.get(conn.peer);
      if (
        !conn.open ||
        this.connections.get(conn.peer) !== conn ||
        currentSession?.localKeyPair !== session.localKeyPair
      )
        throw new Error('Sync connection closed');
      this.encryptionSessions.set(conn.peer, {
        ...currentSession,
        messageCounter: Math.max(
          currentSession.messageCounter,
          updatedSession.messageCounter
        ),
      });
      conn.send(envelope);
    } else {
      // Session not ready - this shouldn't happen in normal flow
      // Key exchange should complete before other messages are sent
      console.error(
        'Cannot send encrypted message - session not ready for:',
        conn.peer
      );
      throw new Error('Encryption session not ready');
    }
  }

  /**
   * Handle incoming messages
   */
  private authorizedDevice(conn: DataConnection): PeerDevice {
    const deviceId = this.authorizedPeers.get(conn.peer);
    const device = deviceId ? this.pairedDevices.get(deviceId) : undefined;
    if (
      !device ||
      device.peerId !== conn.peer ||
      !conn.open ||
      this.connections.get(conn.peer) !== conn ||
      device.protocolVersion !== 2 ||
      !device.localProfileId ||
      !device.remoteProfileId ||
      device.localProfileId !== this.options.profileId ||
      (this.options.getActiveProfileId &&
        this.options.getActiveProfileId() !== device.localProfileId) ||
      !this.encryptionSessions.get(conn.peer)?.isReady
    ) {
      throw new Error('Sync is not authorized for the active profile');
    }
    return device;
  }

  private waitForSync(
    conn: DataConnection,
    requestId: string,
    kind: 'push' | 'request',
    timeoutMs = 15000
  ): Promise<number> {
    if (this.pendingSync.has(requestId))
      throw new Error('Duplicate sync request');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingSync.delete(requestId);
        reject(new Error('Sync acknowledgement timed out'));
      }, timeoutMs);
      this.pendingSync.set(requestId, {
        peerId: conn.peer,
        kind,
        resolve,
        reject,
        timer,
      });
    });
  }
  private extendSyncTimeout(conn: DataConnection, requestId: string): void {
    const pending = this.pendingSync.get(requestId);
    if (!pending || pending.peerId !== conn.peer) return;
    clearTimeout(pending.timer);
    pending.timer = setTimeout(() => {
      this.pendingSync.delete(requestId);
      pending.reject(new Error('Sync acknowledgement timed out'));
    }, LARGE_SYNC_TIMEOUT_MS);
  }

  private fragmentedPayload(
    conn: DataConnection,
    changes: SyncChange[]
  ): string | null {
    if (!this.authorizedDevice(conn).supportsFragmentation) {
      if (changes.length > 50000)
        throw new Error(
          'Peer does not support large sync snapshots; update both devices and pair again'
        );
      return null;
    }
    const payload = JSON.stringify(changes);
    if (payload.length > MAX_SYNC_BUFFER_CHARS)
      throw new Error('Sync snapshot exceeds the supported transfer size');
    return payload.length > SYNC_FRAME_CHARS || changes.length > 50000
      ? payload
      : null;
  }

  private async sendSyncPayload(
    conn: DataConnection,
    message: Extract<PairingMessage, { type: 'sync-push' | 'sync-response' }>,
    payload: string | null
  ): Promise<void> {
    if (payload === null) {
      await this.sendEncrypted(conn, message);
      return;
    }
    const count = Math.ceil(payload.length / SYNC_FRAME_CHARS);
    for (let index = 0; index < count; index++) {
      if (!this.pendingSync.has(message.requestId)) return;
      this.authorizedDevice(conn);
      await this.sendEncrypted(conn, {
        type: 'sync-fragment',
        requestId: message.requestId,
        messageType: message.type,
        index,
        count,
        payload: payload.slice(
          index * SYNC_FRAME_CHARS,
          (index + 1) * SYNC_FRAME_CHARS
        ),
      });
    }
    this.extendSyncTimeout(conn, message.requestId);
  }

  private discardSnapshot(key: string, completed = false): void {
    const snapshot = this.incomingSnapshots.get(key);
    if (!snapshot) return;
    clearTimeout(snapshot.timer);
    this.bufferedSnapshotChars -= snapshot.chars;
    this.incomingSnapshots.delete(key);
    if (completed) this.markSnapshotCompleted(key, snapshot.peerId);
  }

  private markSnapshotCompleted(key: string, peerId: string): void {
    this.completedSnapshots.set(key, peerId);
    if (this.completedSnapshots.size > 128) {
      const oldest = this.completedSnapshots.keys().next().value;
      if (oldest !== undefined) this.completedSnapshots.delete(oldest);
    }
  }

  private async handleSyncFragment(
    conn: DataConnection,
    message: Extract<PairingMessage, { type: 'sync-fragment' }>
  ): Promise<void> {
    const key = JSON.stringify([conn.peer, message.requestId]);
    try {
      if (
        !this.authorizedDevice(conn).supportsFragmentation ||
        !['sync-push', 'sync-response'].includes(message.messageType) ||
        !Number.isSafeInteger(message.count) ||
        message.count < 2 ||
        message.count > MAX_SYNC_FRAMES ||
        !Number.isSafeInteger(message.index) ||
        message.index < 0 ||
        message.index >= message.count ||
        typeof message.payload !== 'string' ||
        !message.payload.length ||
        message.payload.length > SYNC_FRAME_CHARS ||
        (message.index < message.count - 1 &&
          message.payload.length !== SYNC_FRAME_CHARS) ||
        this.completedSnapshots.has(key) ||
        this.processingSnapshots.has(key)
      )
        throw new Error('Invalid or stale sync frame');
      const pending = this.pendingSync.get(message.requestId);
      if (
        message.messageType === 'sync-response' &&
        (pending?.kind !== 'request' || pending.peerId !== conn.peer)
      )
        throw new Error('Unsolicited sync response');
      let snapshot = this.incomingSnapshots.get(key);
      if (!snapshot) {
        if (
          this.incomingSnapshots.size + this.processingSnapshots.size >=
          MAX_INCOMING_SNAPSHOTS
        )
          throw new Error('Too many concurrent sync snapshots');
        snapshot = {
          peerId: conn.peer,
          connection: conn,
          messageType: message.messageType,
          count: message.count,
          chunks: new Map(),
          chars: 0,
          timer: setTimeout(() => {
            this.discardSnapshot(key, true);
            const reason = 'Large sync transfer timed out';
            this.completeSync(conn, message.requestId, 0, reason);
            this.options.onError?.(new Error(reason));
            void this.sendEncrypted(conn, {
              type: 'sync-error',
              requestId: message.requestId,
              reason,
            }).catch(() => undefined);
          }, LARGE_SYNC_TIMEOUT_MS),
        };
        this.incomingSnapshots.set(key, snapshot);
      }
      if (
        snapshot.count !== message.count ||
        snapshot.connection !== conn ||
        snapshot.messageType !== message.messageType ||
        snapshot.chunks.has(message.index) ||
        this.bufferedSnapshotChars + message.payload.length >
          MAX_SYNC_BUFFER_CHARS
      )
        throw new Error('Invalid or duplicate sync frame');
      snapshot.chunks.set(message.index, message.payload);
      snapshot.chars += message.payload.length;
      this.bufferedSnapshotChars += message.payload.length;
      if (message.messageType === 'sync-response')
        this.extendSyncTimeout(conn, message.requestId);
      if (snapshot.chunks.size !== snapshot.count) return;
      const changes: unknown = JSON.parse(
        Array.from({ length: snapshot.count }, (_, index) =>
          snapshot.chunks.get(index)
        ).join('')
      );
      if (!Array.isArray(changes)) throw new Error('Invalid sync snapshot');
      // Reserve the same slot and character budget until the atomic apply settles.
      clearTimeout(snapshot.timer);
      this.incomingSnapshots.delete(key);
      this.processingSnapshots.set(key, {
        peerId: conn.peer,
        chars: snapshot.chars,
      });
      snapshot.chunks.clear();
      this.markSnapshotCompleted(key, conn.peer);
      try {
        await this.handleMessage(
          conn,
          { type: message.messageType, requestId: message.requestId, changes },
          true
        );
      } finally {
        this.processingSnapshots.delete(key);
        this.bufferedSnapshotChars -= snapshot.chars;
      }
    } catch (error) {
      this.discardSnapshot(key);
      this.markSnapshotCompleted(key, conn.peer);
      throw error;
    }
  }
  private completeSync(
    conn: DataConnection,
    requestId: string,
    applied: number,
    error?: string
  ): void {
    const pending = this.pendingSync.get(requestId);
    if (!pending || pending.peerId !== conn.peer) return;
    clearTimeout(pending.timer);
    this.pendingSync.delete(requestId);
    if (error) pending.reject(new Error(error));
    else pending.resolve(applied);
  }

  private async handleMessage(
    conn: DataConnection,
    message: PairingMessage,
    reassembled = false
  ): Promise<void> {
    if (
      !message ||
      typeof message !== 'object' ||
      typeof message.type !== 'string'
    )
      throw new Error('Invalid peer message');
    if (message.type === 'pairing-request') {
      await this.handlePairingRequest(conn, message);
      return;
    }
    if (message.type === 'pairing-accept') {
      throw new Error('Unsolicited pairing acceptance');
    }
    if (message.type === 'pairing-reject') {
      this.options.onError?.(new Error(`Pairing rejected: ${message.reason}`));
      return;
    }
    if (message.type === 'reconnect-request') {
      await this.handleReconnectRequest(conn, message);
      return;
    }
    if (message.type === 'reconnect-accept') {
      await this.handleReconnectAccept(conn, message);
      return;
    }
    if (message.type === 'reconnect-reject') {
      this.handleReconnectReject(conn, message.reason);
      return;
    }
    if (message.type === 'unpair') {
      const removed = this.authorizedDevice(conn);
      this.forgetDevice(removed.id);
      this.closeConnection(conn, false);
      conn.close();
      this.options.onUnpaired?.(removed);
      return;
    }
    const device = this.authorizedDevice(conn);
    if (
      !('requestId' in message) ||
      typeof message.requestId !== 'string' ||
      !message.requestId ||
      message.requestId.length > 100
    )
      throw new Error('Invalid sync request');
    if (message.type === 'sync-ack') {
      if (
        !Number.isSafeInteger(message.applied) ||
        message.applied < 0 ||
        this.pendingSync.get(message.requestId)?.kind !== 'push'
      )
        throw new Error('Invalid sync acknowledgement');
      this.completeSync(conn, message.requestId, message.applied);
      device.lastSyncAt = Date.now();
      return;
    }
    if (message.type === 'sync-error') {
      const key = JSON.stringify([conn.peer, message.requestId]);
      this.discardSnapshot(key);
      this.markSnapshotCompleted(key, conn.peer);
      this.completeSync(conn, message.requestId, 0, message.reason);
      return;
    }
    try {
      if (message.type === 'sync-fragment') {
        await this.handleSyncFragment(conn, message);
        return;
      }
      if (message.type === 'sync-request') {
        if (
          !Number.isSafeInteger(message.sinceTimestamp) ||
          message.sinceTimestamp < 0 ||
          !this.options.onSyncRequested
        )
          throw new Error('Invalid sync request');
        const changes = await this.options.onSyncRequested(
          conn.peer,
          message.sinceTimestamp
        );
        this.authorizedDevice(conn);
        const payload = this.fragmentedPayload(conn, changes);
        const acknowledgement = this.waitForSync(
          conn,
          message.requestId,
          'push',
          payload === null ? 15000 : LARGE_SYNC_TIMEOUT_MS
        );
        void acknowledgement.catch(() => undefined);
        await this.sendSyncPayload(
          conn,
          {
            type: 'sync-response',
            changes,
            requestId: message.requestId,
          },
          payload
        );
        await acknowledgement;
        device.lastSyncAt = Date.now();
      } else if (
        message.type === 'sync-push' ||
        message.type === 'sync-response'
      ) {
        const snapshotKey = JSON.stringify([conn.peer, message.requestId]);
        if (
          !reassembled &&
          (this.incomingSnapshots.has(snapshotKey) ||
            this.processingSnapshots.has(snapshotKey) ||
            this.completedSnapshots.has(snapshotKey))
        ) {
          this.discardSnapshot(snapshotKey);
          this.markSnapshotCompleted(snapshotKey, conn.peer);
          throw new Error('Invalid or duplicate sync snapshot');
        }
        if (
          !Array.isArray(message.changes) ||
          (!reassembled && message.changes.length > 50000) ||
          !this.options.onSyncReceived
        )
          throw new Error('Invalid sync data');
        if (
          message.type === 'sync-response' &&
          (this.pendingSync.get(message.requestId)?.kind !== 'request' ||
            this.pendingSync.get(message.requestId)?.peerId !== conn.peer)
        )
          throw new Error('Unsolicited sync response');
        const applied = await this.options.onSyncReceived(
          message.changes,
          device
        );
        this.authorizedDevice(conn);
        await this.sendEncrypted(conn, {
          type: 'sync-ack',
          requestId: message.requestId,
          applied,
        });
        if (message.type === 'sync-response')
          this.completeSync(conn, message.requestId, applied);
        device.lastSyncAt = Date.now();
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.completeSync(conn, message.requestId, 0, reason);
      await this.sendEncrypted(conn, {
        type: 'sync-error',
        requestId: message.requestId,
        reason,
      });
      this.options.onError?.(
        error instanceof Error ? error : new Error(reason)
      );
    }
  }

  private validatePairing(message: {
    profileId: string;
    schemaVersion: number;
    protocolVersion: number;
    deviceId: string;
    deviceName: string;
  }): void {
    if (
      message.protocolVersion !== 2 ||
      message.schemaVersion !== this.options.schemaVersion
    )
      throw new Error(
        'Sync protocol or schema version mismatch; update both devices and pair again'
      );
    if (
      !this.options.profileId ||
      !message.profileId ||
      message.profileId.length > 200 ||
      typeof message.deviceId !== 'string' ||
      !message.deviceId ||
      message.deviceId.length > 200 ||
      typeof message.deviceName !== 'string' ||
      message.deviceName.length > 100 ||
      (this.options.getActiveProfileId &&
        this.options.getActiveProfileId() !== this.options.profileId)
    )
      throw new Error('Pairing requires an active profile on both devices');
  }
  private async handlePairingRequest(
    conn: DataConnection,
    message: Extract<PairingMessage, { type: 'pairing-request' }>
  ): Promise<void> {
    try {
      this.validatePairing(message);
    } catch (error) {
      await this.sendEncrypted(conn, {
        type: 'pairing-reject',
        reason: (error as Error).message,
      });
      return;
    }
    if (
      !this.pendingPairingCode ||
      message.pairingCode !== this.pendingPairingCode ||
      Date.now() > this.pairingExpiresAt ||
      !this.options.onPairingRequest
    ) {
      await this.sendEncrypted(conn, {
        type: 'pairing-reject',
        reason: 'Invalid or expired pairing code',
      });
      return;
    }
    // A matching code proves possession, but profile merging still needs approval.
    let handled = false;
    this.options.onPairingRequest(
      message.deviceName,
      async () => {
        if (handled) return;
        handled = true;
        try {
          this.validatePairing(message);
          if (!conn.open || this.connections.get(conn.peer) !== conn)
            throw new Error('Pairing connection closed');
          if (
            message.pairingCode !== this.pendingPairingCode ||
            Date.now() > this.pairingExpiresAt
          )
            throw new Error('Pairing code expired');
          this.pendingPairingCode = null;
          const device: PeerDevice = {
            id: message.deviceId,
            name: message.deviceName,
            peerId: conn.peer,
            lastSyncAt: null,
            isConnected: true,
            localProfileId: this.options.profileId,
            remoteProfileId: message.profileId,
            protocolVersion: 2,
            supportsFragmentation: message.supportsFragmentation === true,
          };
          // Only devices that can store the secret (and can be dialled by
          // their stable ID) get one; older versions pair per session.
          const reconnectSecret =
            message.supportsReconnect === true &&
            isValidDeviceId(message.deviceId)
              ? generateReconnectSecret()
              : undefined;
          await this.sendEncrypted(conn, {
            type: 'pairing-accept',
            deviceId: this.options.deviceId,
            deviceName: this.options.deviceName,
            profileId: this.options.profileId || '',
            schemaVersion: this.options.schemaVersion || 0,
            protocolVersion: 2,
            supportsFragmentation: true,
            ...(reconnectSecret ? { reconnectSecret } : {}),
          });
          this.authorizeDevice(conn, device, reconnectSecret);
          if (reconnectSecret) this.options.onPaired?.(device, reconnectSecret);
          else this.options.onPaired?.(device);
          this.options.onConnectionChange?.(conn.peer, true);
        } catch (error) {
          this.options.onError?.(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      async () => {
        if (handled) return;
        handled = true;
        await this.sendEncrypted(conn, {
          type: 'pairing-reject',
          reason: 'User rejected profile merge',
        });
      }
    );
  }
  private handlePairingAccept(
    conn: DataConnection,
    message: Extract<PairingMessage, { type: 'pairing-accept' }>
  ): void {
    this.validatePairing(message);
    const device: PeerDevice = {
      id: message.deviceId,
      name: message.deviceName,
      peerId: conn.peer,
      lastSyncAt: null,
      isConnected: true,
      localProfileId: this.options.profileId,
      remoteProfileId: message.profileId,
      protocolVersion: 2,
      supportsFragmentation: message.supportsFragmentation === true,
    };
    const reconnectSecret =
      isValidReconnectSecret(message.reconnectSecret) &&
      isValidDeviceId(message.deviceId)
        ? message.reconnectSecret
        : undefined;
    this.authorizeDevice(conn, device, reconnectSecret);
    if (reconnectSecret) this.options.onPaired?.(device, reconnectSecret);
    else this.options.onPaired?.(device);
    this.options.onConnectionChange?.(conn.peer, true);
  }

  /** Mark a connection as carrying an approved pairing for a device. */
  private authorizeDevice(
    conn: DataConnection,
    device: PeerDevice,
    reconnectSecret?: string
  ): void {
    for (const [peerId, deviceId] of this.authorizedPeers) {
      if (deviceId !== device.id || peerId === conn.peer) continue;
      const previous = this.connections.get(peerId);
      if (previous) this.replaceConnection(previous);
      else this.authorizedPeers.delete(peerId);
    }
    device.peerId = conn.peer;
    device.isConnected = true;
    this.pairedDevices.set(device.id, device);
    this.authorizedPeers.set(conn.peer, device.id);
    if (reconnectSecret) this.reconnectSecrets.set(device.id, reconnectSecret);
    this.blockedReconnects.delete(device.id);
    this.reconnectAttempts.delete(device.id);
    this.clearReconnectTimer(device.id);
    const dial = this.reconnectDials.get(device.id);
    if (dial && dial !== conn) {
      this.reconnectDials.delete(device.id);
      try {
        dial.close();
      } catch {
        // Already closed
      }
    } else if (dial) this.reconnectDials.delete(device.id);
  }

  /**
   * Start pairing mode with a code
   * Returns the pairing code to display to user
   */
  startPairing(): string {
    if (!this.options.profileId)
      throw new Error('Select a profile before pairing');
    this.pendingPairingCode = generatePairingCode();
    this.pairingExpiresAt = Date.now() + 120000;
    return this.pendingPairingCode;
  }

  /**
   * Connect to another device using peer ID and pairing code
   */
  async connectWithCode(
    targetPeerId: string,
    pairingCode: string
  ): Promise<PeerDevice> {
    if (!this.peer) {
      throw new Error('Peer not initialized');
    }

    if (this.peer.id === targetPeerId) {
      throw new Error('cannot-connect-to-self');
    }

    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer destroyed'));
        return;
      }

      let isResolved = false;
      let connectionAttempted = false;
      // Note: keyExchangeComplete flag tracked for future debugging/assertions
      let _keyExchangeComplete = false;

      const conn = this.peer.connect(targetPeerId, {
        reliable: true,
      });
      this.outgoingConnections.add(conn);
      const fail = (error: Error) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeout);
        try {
          conn.close();
        } catch {
          // Ignore close errors
        }
        reject(error);
      };
      this.dialFailures.set(targetPeerId, () =>
        fail(new Error('peer-unavailable'))
      );

      // Reduced timeout to 20s - if it takes longer, likely a NAT/firewall issue
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          try {
            conn.close();
          } catch {
            // Ignore close errors
          }
          // Provide more helpful error message
          const errorMsg = connectionAttempted
            ? 'Connection timeout - the other device may be behind a restrictive firewall or NAT. Try connecting from a different network.'
            : 'Connection timeout - could not reach the peer server. Check your internet connection.';
          reject(new Error(errorMsg));
        }
      }, 20000);

      // Track when we actually start attempting connection
      conn.on('open', async () => {
        if (isResolved) return;
        connectionAttempted = true;
        this.dialFailures.delete(targetPeerId);
        if (!this.adoptConnection(conn)) {
          fail(new Error('Connection closed unexpectedly'));
          return;
        }

        // Start encryption key exchange
        try {
          const session = await this.ensureEncryptionSession(conn.peer);
          this.sendPublicKeyOnce(conn, session);
        } catch (err) {
          console.error('Failed to create encryption session:', err);
          isResolved = true;
          clearTimeout(timeout);
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      conn.on('data', async (data) => {
        if (isResolved) {
          try {
            await this.handleIncomingData(conn, data);
          } catch (error) {
            this.options.onError?.(
              error instanceof Error ? error : new Error(String(error))
            );
          }
          return;
        }

        // Handle key-exchange message (sent unencrypted)
        if (
          typeof data === 'object' &&
          data !== null &&
          (data as { type?: string }).type === 'key-exchange'
        ) {
          const keyExchangeMsg = data as {
            type: 'key-exchange';
            publicKey: SyncJsonWebKey;
          };
          const session = await this.ensureEncryptionSession(conn.peer);
          if (session) {
            try {
              if (session.isReady)
                throw new Error('Repeated key exchange is not allowed');
              const updatedSession = await completeKeyExchange(
                session,
                keyExchangeMsg.publicKey
              );
              if (
                this.connections.get(conn.peer) !== conn ||
                this.encryptionSessions.get(conn.peer) !== session
              )
                throw new Error('Sync disconnected during key exchange');
              this.encryptionSessions.set(conn.peer, updatedSession);
              _keyExchangeComplete = true;
              peerDebugLog(
                'Encryption key exchange completed with:',
                conn.peer
              );

              // Now send encrypted pairing request
              await this.sendEncrypted(conn, {
                type: 'pairing-request',
                pairingCode,
                deviceName: this.options.deviceName,
                deviceId: this.options.deviceId,
                profileId: this.options.profileId || '',
                schemaVersion: this.options.schemaVersion || 0,
                protocolVersion: 2,
                supportsFragmentation: true,
                ...(isValidDeviceId(this.options.deviceId)
                  ? { supportsReconnect: true as const }
                  : {}),
              });
            } catch (err) {
              console.error('Failed to complete key exchange:', err);
              isResolved = true;
              clearTimeout(timeout);
              reject(err instanceof Error ? err : new Error(String(err)));
            }
          }
          return;
        }

        // Decrypt if encrypted
        let message: PairingMessage;
        if (isEncryptedEnvelope(data)) {
          const session = this.encryptionSessions.get(conn.peer);
          if (!session?.isReady) {
            console.error('Received encrypted message but session not ready');
            return;
          }
          try {
            message = await decryptMessage<PairingMessage>(session, data);
          } catch (err) {
            console.error('Failed to decrypt message:', err);
            return;
          }
        } else {
          isResolved = true;
          clearTimeout(timeout);
          conn.close();
          reject(new Error('Unencrypted pairing message rejected'));
          return;
        }

        if (message.type === 'pairing-accept') {
          isResolved = true;
          clearTimeout(timeout);
          try {
            this.handlePairingAccept(conn, message);
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
            return;
          }
          const device = this.pairedDevices.get(message.deviceId);
          if (device) {
            resolve(device);
          } else {
            // Device should be set by handlePairingAccept, but just in case
            reject(new Error('Failed to register paired device'));
          }
        } else if (message.type === 'pairing-reject') {
          isResolved = true;
          clearTimeout(timeout);
          reject(new Error(message.reason));
        } else {
          // Handle other message types
          await this.handleMessage(conn, message);
        }
      });

      conn.on('error', (err) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeout);
        // Map common errors to more readable versions
        if ((err as any).type === 'peer-unavailable') {
          reject(new Error('peer-unavailable'));
        } else {
          reject(err);
        }
      });

      // Handle connection close before success
      conn.on('close', () => {
        this.closeConnection(conn);
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          reject(new Error('Connection closed unexpectedly'));
        }
      });
    });
  }

  /**
   * Send sync changes to a specific device
   */
  async sendChanges(deviceId: string, changes: SyncChange[]): Promise<number> {
    const device = this.pairedDevices.get(deviceId);
    const conn = device && this.connections.get(device.peerId);
    if (!conn?.open) throw new Error('Paired device is not connected');
    this.authorizedDevice(conn);
    const payload = this.fragmentedPayload(conn, changes);
    const requestId = crypto.randomUUID();
    const acknowledgement = this.waitForSync(
      conn,
      requestId,
      'push',
      payload === null ? 15000 : LARGE_SYNC_TIMEOUT_MS
    );
    void acknowledgement.catch(() => undefined);
    try {
      await this.sendSyncPayload(
        conn,
        { type: 'sync-push', changes, requestId },
        payload
      );
    } catch (error) {
      this.completeSync(conn, requestId, 0, String(error));
    }
    return acknowledgement;
  }

  async requestSync(deviceId: string, sinceTimestamp = 0): Promise<number> {
    const device = this.pairedDevices.get(deviceId);
    const conn = device && this.connections.get(device.peerId);
    if (!conn?.open) throw new Error('Paired device is not connected');
    this.authorizedDevice(conn);
    const requestId = crypto.randomUUID();
    const response = this.waitForSync(conn, requestId, 'request');
    void response.catch(() => undefined);
    try {
      await this.sendEncrypted(conn, {
        type: 'sync-request',
        sinceTimestamp,
        requestId,
      });
    } catch (error) {
      this.completeSync(conn, requestId, 0, String(error));
    }
    return response;
  }

  async broadcastChanges(changes: SyncChange[]): Promise<void> {
    const devices = this.getPairedDevices().filter(
      (device) => device.isConnected
    );
    if (!devices.length) throw new Error('No paired devices connected');
    await Promise.all(
      devices.map((device) => this.sendChanges(device.id, changes))
    );
  }

  /**
   * Restore a pairing from an earlier session so it can reconnect. Only
   * pairings of this profile with a valid reconnect secret are accepted.
   */
  restorePairedDevice(device: PeerDevice, reconnectSecret: string): boolean {
    if (
      !isValidDeviceId(device.id) ||
      !isValidReconnectSecret(reconnectSecret) ||
      device.protocolVersion !== 2 ||
      !device.remoteProfileId ||
      !this.options.profileId ||
      device.localProfileId !== this.options.profileId ||
      device.id === this.options.deviceId
    )
      return false;
    // A pairing that is already connected this session stays as it is.
    if (!this.pairedDevices.get(device.id)?.isConnected)
      this.pairedDevices.set(device.id, {
        ...device,
        peerId: homePeerId(device.id),
        isConnected: false,
      });
    this.reconnectSecrets.set(device.id, reconnectSecret);
    return true;
  }

  /** Whether a pairing can reconnect by itself after a restart. */
  canReconnect(deviceId: string): boolean {
    return this.reconnectSecrets.has(deviceId);
  }

  /** Whether the signalling connection is open (paired devices can dial in). */
  isSignallingOpen(): boolean {
    return !!this.peer && !this.peer.destroyed && this.peer.open;
  }

  /**
   * Dial every restored pairing that is not connected, resuming a dropped
   * signalling connection first. By default waiting attempts are retried now
   * (e.g. when the browser comes back online); `retryBlocked` also retries
   * pairings that needed the user, for an explicit "reconnect" action.
   * Returns false when the peer is gone and must be initialized again.
   */
  reconnectPairedDevices({
    resetBackoff = true,
    retryBlocked = false,
  }: { resetBackoff?: boolean; retryBlocked?: boolean } = {}): boolean {
    const peer = this.peer;
    if (!peer || peer.destroyed) return false;
    if (peer.disconnected) {
      try {
        // Dials resume from the 'open' event once the server accepts us.
        peer.reconnect();
      } catch (error) {
        peerDebugLog('Signalling reconnect failed:', error);
      }
    }
    for (const deviceId of this.reconnectSecrets.keys()) {
      if (resetBackoff) this.reconnectAttempts.delete(deviceId);
      if (retryBlocked) this.blockedReconnects.delete(deviceId);
      this.dialReconnect(deviceId);
    }
    return true;
  }

  private clearReconnectTimer(deviceId: string): void {
    const timer = this.reconnectTimers.get(deviceId);
    if (timer) clearTimeout(timer);
    this.reconnectTimers.delete(deviceId);
  }

  private scheduleReconnect(deviceId: string): void {
    if (
      !this.reconnectSecrets.has(deviceId) ||
      this.blockedReconnects.has(deviceId) ||
      this.reconnectTimers.has(deviceId) ||
      !this.peer ||
      this.peer.destroyed
    )
      return;
    const attempt = this.reconnectAttempts.get(deviceId) ?? 0;
    this.reconnectAttempts.set(deviceId, attempt + 1);
    this.reconnectTimers.set(
      deviceId,
      setTimeout(() => {
        this.reconnectTimers.delete(deviceId);
        this.dialReconnect(deviceId);
      }, reconnectDelay(attempt))
    );
  }

  /** Route a "Could not connect to peer X" signalling error to its dial. */
  private failDial(message: string | undefined): boolean {
    const target = message?.match(/peer (\S+)$/)?.[1];
    const handler = target && this.dialFailures.get(target);
    if (!target || !handler) return false;
    this.dialFailures.delete(target);
    handler(new Error('peer-unavailable'));
    return true;
  }

  private dialReconnect(deviceId: string): void {
    const device = this.pairedDevices.get(deviceId);
    const secret = this.reconnectSecrets.get(deviceId);
    if (
      !device ||
      !secret ||
      device.isConnected ||
      this.blockedReconnects.has(deviceId) ||
      this.reconnectDials.has(deviceId) ||
      !this.isSignallingOpen() ||
      (this.options.getActiveProfileId &&
        this.options.getActiveProfileId() !== this.options.profileId)
    )
      return;
    this.clearReconnectTimer(deviceId);
    const target = homePeerId(deviceId);
    const peer = this.peer;
    if (!peer) return;
    let conn: DataConnection;
    try {
      conn = peer.connect(target, { reliable: true });
    } catch (error) {
      peerDebugLog('Reconnect dial failed:', error);
      this.scheduleReconnect(deviceId);
      return;
    }
    this.outgoingConnections.add(conn);
    this.reconnectDials.set(deviceId, conn);
    const abandon = () => {
      clearTimeout(timeout);
      if (this.dialFailures.get(target) === onUnavailable)
        this.dialFailures.delete(target);
      if (this.reconnectDials.get(deviceId) !== conn) return;
      this.reconnectDials.delete(deviceId);
      try {
        conn.close();
      } catch {
        // Already closed
      }
      if (this.connections.get(conn.peer) === conn)
        this.closeConnection(conn, false);
      this.scheduleReconnect(deviceId);
    };
    // The other device is offline (or still behind its session ID) — it
    // dials this device when it comes online, and the backoff retries.
    const onUnavailable = () => abandon();
    this.dialFailures.set(target, onUnavailable);
    const timeout = setTimeout(abandon, 20000);
    this.afterKeyExchange.set(conn, async () => {
      const proof = await this.reconnectProof(conn, secret, 'request', {
        initiatorDeviceId: this.options.deviceId,
        responderDeviceId: deviceId,
        local: 'initiator',
      });
      await this.sendEncrypted(conn, {
        type: 'reconnect-request',
        deviceId: this.options.deviceId,
        deviceName: this.options.deviceName,
        profileId: this.options.profileId || '',
        schemaVersion: this.options.schemaVersion || 0,
        protocolVersion: 2,
        supportsFragmentation: true,
        proof,
      });
    });
    conn.on('open', async () => {
      if (this.reconnectDials.get(deviceId) !== conn) return;
      if (this.dialFailures.get(target) === onUnavailable)
        this.dialFailures.delete(target);
      if (!this.adoptConnection(conn)) {
        clearTimeout(timeout);
        this.reconnectDials.delete(deviceId);
        return;
      }
      try {
        const session = await this.ensureEncryptionSession(conn.peer);
        this.sendPublicKeyOnce(conn, session);
      } catch (error) {
        peerDebugLog('Reconnect key exchange failed:', error);
        abandon();
      }
    });
    conn.on('data', async (data) => {
      try {
        await this.handleIncomingData(conn, data);
      } catch (error) {
        // Failed reconnects are retried; only authorized sync errors surface.
        peerDebugLog('Reconnect message failed:', error);
        if (this.authorizedPeers.get(conn.peer) === deviceId)
          this.options.onError?.(
            error instanceof Error ? error : new Error(String(error))
          );
        else abandon();
      }
    });
    conn.on('close', () => {
      clearTimeout(timeout);
      this.closeConnection(conn);
    });
    conn.on('error', (error) => {
      peerDebugLog('Reconnect connection error:', error);
      abandon();
    });
    // completeReconnect clears the timeout once the pairing is confirmed.
    this.reconnectTimeouts.set(conn, timeout);
  }

  private async reconnectProof(
    conn: DataConnection,
    secret: string,
    role: 'request' | 'accept',
    ids: {
      initiatorDeviceId: string;
      responderDeviceId: string;
      local: 'initiator' | 'responder';
    },
    proof?: unknown
  ): Promise<string> {
    const input = await this.reconnectProofInput(conn, role, ids);
    if (proof === undefined) return computeReconnectProof(secret, input);
    if (!(await verifyReconnectProof(secret, proof, input)))
      throw new Error('Invalid reconnect proof');
    return proof as string;
  }

  private async reconnectProofInput(
    conn: DataConnection,
    role: 'request' | 'accept',
    ids: {
      initiatorDeviceId: string;
      responderDeviceId: string;
      local: 'initiator' | 'responder';
    }
  ): Promise<ReconnectProofInput> {
    const session = this.encryptionSessions.get(conn.peer);
    if (!session?.isReady || !session.remotePublicKey)
      throw new Error('Encryption session not ready');
    const localKey = session.localKeyPair.publicKeyJwk;
    const remoteKey = (await crypto.subtle.exportKey(
      'jwk',
      session.remotePublicKey
    )) as SyncJsonWebKey;
    return {
      role,
      initiatorDeviceId: ids.initiatorDeviceId,
      responderDeviceId: ids.responderDeviceId,
      initiatorPublicKey: ids.local === 'initiator' ? localKey : remoteKey,
      responderPublicKey: ids.local === 'initiator' ? remoteKey : localKey,
    };
  }

  /** Versions must match, as for pairing; the device must stay the same. */
  private reconnectMismatch(
    device: PeerDevice,
    message: Extract<
      PairingMessage,
      { type: 'reconnect-request' | 'reconnect-accept' }
    >
  ): ReconnectRejectReason | null {
    if (
      message.protocolVersion !== 2 ||
      message.schemaVersion !== this.options.schemaVersion
    )
      return 'version-mismatch';
    if (
      message.profileId !== device.remoteProfileId ||
      device.localProfileId !== this.options.profileId ||
      (this.options.getActiveProfileId &&
        this.options.getActiveProfileId() !== this.options.profileId)
    )
      return 'profile-mismatch';
    return null;
  }

  /** Whether an existing authorized connection should win over a new one. */
  private keepsExistingConnection(
    device: PeerDevice,
    conn: DataConnection
  ): boolean {
    for (const [peerId, deviceId] of this.authorizedPeers) {
      if (deviceId !== device.id || peerId === conn.peer) continue;
      const existing = this.connections.get(peerId);
      if (
        existing &&
        this.preferConnection(existing, conn, device.id) === existing
      )
        return true;
    }
    return false;
  }

  private completeReconnect(
    conn: DataConnection,
    device: PeerDevice,
    message: Extract<
      PairingMessage,
      { type: 'reconnect-request' | 'reconnect-accept' }
    >
  ): void {
    const timeout = this.reconnectTimeouts.get(conn);
    if (timeout) clearTimeout(timeout);
    if (
      typeof message.deviceName === 'string' &&
      message.deviceName.length <= 100
    )
      device.name = message.deviceName || device.name;
    device.supportsFragmentation = message.supportsFragmentation === true;
    this.authorizeDevice(conn, device);
    peerDebugLog('Reconnected paired device:', device.id);
    this.options.onReconnected?.(device);
    this.options.onConnectionChange?.(conn.peer, true);
  }

  private async handleReconnectRequest(
    conn: DataConnection,
    message: Extract<PairingMessage, { type: 'reconnect-request' }>
  ): Promise<void> {
    const reject = async (reason: ReconnectRejectReason) => {
      await this.sendEncrypted(conn, { type: 'reconnect-reject', reason });
      this.closeAfterDelivery(conn);
    };
    const device =
      typeof message.deviceId === 'string'
        ? this.pairedDevices.get(message.deviceId)
        : undefined;
    const secret = device && this.reconnectSecrets.get(device.id);
    if (!device || !secret || this.outgoingConnections.has(conn))
      // Paired with another local profile: retry once that profile is open.
      return reject(
        typeof message.deviceId === 'string' &&
          this.options.isKnownDevice?.(message.deviceId)
          ? 'profile-mismatch'
          : 'unknown-device'
      );
    try {
      await this.reconnectProof(
        conn,
        secret,
        'request',
        {
          initiatorDeviceId: device.id,
          responderDeviceId: this.options.deviceId,
          local: 'responder',
        },
        message.proof
      );
    } catch {
      return reject('invalid-proof');
    }
    const mismatch = this.reconnectMismatch(device, message);
    if (mismatch) {
      if (mismatch === 'version-mismatch') {
        this.blockedReconnects.add(device.id);
        this.options.onReconnectIssue?.(device, 'update-required');
      }
      return reject(mismatch);
    }
    if (this.connections.get(conn.peer) !== conn) return;
    if (this.keepsExistingConnection(device, conn)) {
      conn.close();
      return;
    }
    const proof = await this.reconnectProof(conn, secret, 'accept', {
      initiatorDeviceId: device.id,
      responderDeviceId: this.options.deviceId,
      local: 'responder',
    });
    // Authorize before answering: the other device may sync right away.
    this.completeReconnect(conn, device, message);
    try {
      await this.sendEncrypted(conn, {
        type: 'reconnect-accept',
        deviceId: this.options.deviceId,
        deviceName: this.options.deviceName,
        profileId: this.options.profileId || '',
        schemaVersion: this.options.schemaVersion || 0,
        protocolVersion: 2,
        supportsFragmentation: true,
        proof,
      });
    } catch (error) {
      this.closeConnection(conn);
      throw error;
    }
  }

  private async handleReconnectAccept(
    conn: DataConnection,
    message: Extract<PairingMessage, { type: 'reconnect-accept' }>
  ): Promise<void> {
    const device = this.pairedDevices.get(message.deviceId);
    const secret = device && this.reconnectSecrets.get(device.id);
    if (!device || !secret || this.reconnectDials.get(device.id) !== conn)
      throw new Error('Unsolicited reconnect acceptance');
    await this.reconnectProof(
      conn,
      secret,
      'accept',
      {
        initiatorDeviceId: this.options.deviceId,
        responderDeviceId: device.id,
        local: 'initiator',
      },
      message.proof
    );
    const mismatch = this.reconnectMismatch(device, message);
    if (mismatch) {
      if (mismatch === 'version-mismatch') {
        this.blockedReconnects.add(device.id);
        this.options.onReconnectIssue?.(device, 'update-required');
      }
      throw new Error('Reconnect rejected: ' + mismatch);
    }
    if (this.keepsExistingConnection(device, conn)) {
      this.reconnectDials.delete(device.id);
      conn.close();
      return;
    }
    this.completeReconnect(conn, device, message);
  }

  private handleReconnectReject(
    conn: DataConnection,
    reason: ReconnectRejectReason
  ): void {
    const entry = [...this.reconnectDials].find(([, dial]) => dial === conn);
    const device = entry && this.pairedDevices.get(entry[0]);
    if (device) {
      peerDebugLog('Reconnect rejected:', device.id, reason);
      // A reject is not authenticated, so the pairing is kept; retries pause
      // until the user acts (pair again or update) or the next session.
      if (reason === 'unknown-device' || reason === 'version-mismatch') {
        this.blockedReconnects.add(device.id);
        this.options.onReconnectIssue?.(
          device,
          reason === 'version-mismatch' ? 'update-required' : 'pair-again'
        );
      }
    }
    // Closing schedules the next attempt unless retries are paused.
    conn.close();
  }

  /**
   * Close after a final message: the receiver closes once it has handled it,
   * since closing right after sending can drop the message in transit.
   */
  private closeAfterDelivery(
    conn: DataConnection,
    onClosed?: () => void
  ): void {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      onClosed?.();
      try {
        conn.close();
      } catch {
        // Already closed
      }
    };
    const timer = setTimeout(finish, 5000);
    conn.once('close', finish);
  }

  /** Drop a pairing and its reconnect secret from this session. */
  private forgetDevice(deviceId: string): void {
    this.pairedDevices.delete(deviceId);
    this.reconnectSecrets.delete(deviceId);
    this.reconnectAttempts.delete(deviceId);
    this.blockedReconnects.delete(deviceId);
    this.clearReconnectTimer(deviceId);
    const dial = this.reconnectDials.get(deviceId);
    this.reconnectDials.delete(deviceId);
    dial?.close();
  }

  /**
   * Get list of paired devices
   */
  getPairedDevices(): PeerDevice[] {
    return Array.from(this.pairedDevices.values());
  }

  /**
   * Get current peer ID
   */
  getPeerId(): string | null {
    return this.peer?.id ?? null;
  }

  /**
   * Check if connected to peer network
   */
  isConnected(): boolean {
    return this.isInitialized && !this.peer?.destroyed;
  }

  /**
   * Disconnect from a specific device
   */
  disconnect(deviceId: string): void {
    const device = this.pairedDevices.get(deviceId);
    if (!device) return;
    const conn =
      this.authorizedPeers.get(device.peerId) === deviceId
        ? this.connections.get(device.peerId)
        : undefined;
    this.forgetDevice(deviceId);
    const cleanup = () => {
      if (conn) {
        this.closeConnection(conn, false);
        conn.close();
      }
      this.connections.delete(device.peerId);
      this.encryptionSessions.delete(device.peerId);
      this.sentKeyExchanges.delete(device.peerId);
      this.encryptionInitializers.delete(device.peerId);
    };
    if (!conn?.open) {
      cleanup();
      return;
    }
    // Tell the other device, so it stops reconnecting and drops the pairing.
    this.authorizedPeers.delete(conn.peer);
    void this.sendEncrypted(conn, { type: 'unpair' }).then(
      () => this.closeAfterDelivery(conn, cleanup),
      cleanup
    );
  }

  /**
   * Destroy peer connection
   */
  destroy(): void {
    this.cancelInitialization?.();
    // Forget reconnect state first so closing connections does not retry.
    this.reconnectSecrets.clear();
    for (const timer of this.reconnectTimers.values()) clearTimeout(timer);
    this.reconnectTimers.clear();
    this.reconnectAttempts.clear();
    this.blockedReconnects.clear();
    this.dialFailures.clear();
    this.afterKeyExchange.clear();
    const dials = [...this.reconnectDials.values()];
    this.reconnectDials.clear();
    for (const dial of dials) dial.close();
    this.authorizedPeers.clear();
    for (const key of this.incomingSnapshots.keys()) this.discardSnapshot(key);
    this.completedSnapshots.clear();
    for (const pending of this.pendingSync.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Sync disconnected'));
    }
    this.pendingSync.clear();
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
    this.pairedDevices.clear();
    this.encryptionSessions.clear();
    this.encryptionInitializers.clear();
    this.sentKeyExchanges.clear();
    this.peer?.destroy();
    this.peer = null;
    this.isInitialized = false;
  }
}

/**
 * Create a PeerSync instance with default options
 */
export function createPeerSync(options: PeerOptions): PeerSync {
  return new PeerSync(options);
}
