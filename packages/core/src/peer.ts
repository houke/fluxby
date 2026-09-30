/**
 * Peer-to-Peer Device Pairing
 * Uses PeerJS for WebRTC connections and a simple pairing code for authentication
 *
 * Note: This file uses `any` types and console statements intentionally for PeerJS
 * library interop where type information is not available.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, no-console */

import { Peer, DataConnection } from 'peerjs';
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
    }
  | {
      type: 'pairing-accept';
      deviceId: string;
      deviceName: string;
      profileId: string;
      schemaVersion: number;
      protocolVersion: 2;
    }
  | { type: 'pairing-reject'; reason: string }
  | { type: 'sync-request'; sinceTimestamp: number; requestId: string }
  | { type: 'sync-response'; changes: SyncChange[]; requestId: string }
  | { type: 'sync-push'; changes: SyncChange[]; requestId: string }
  | { type: 'sync-ack'; applied: number; requestId: string }
  | { type: 'sync-error'; reason: string; requestId: string };

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
}

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
  /** Callback when pairing is complete */
  onPaired?: (device: PeerDevice) => void;
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
  private options: PeerOptions;
  private pendingPairingCode: string | null = null;
  private isInitialized = false;
  private pairingExpiresAt = 0;
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
      const timeoutMs = 15000; // 15s timeout
      const timeout = setTimeout(() => {
        if (this.peer) {
          this.peer.destroy();
          this.peer = null;
        }
        reject(
          new Error(
            'Connection to peer server timed out. Check your internet connection.'
          )
        );
      }, timeoutMs);

      const setupPeer = (id: string, _isRetry = false) => {
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

          const peer = new Peer(id, peerOptions);
          this.peer = peer;

          peer.on('open', (peerId) => {
            if (this.peer !== peer || (peer as any)._ignoreEvents) return;
            peerDebugLog('PeerJS connection opened with ID:', peerId);
            clearTimeout(timeout);
            this.isInitialized = true;
            resolve(peerId);
          });

          peer.on('error', (err) => {
            if (this.peer !== peer || (peer as any)._ignoreEvents) return;

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
              clearTimeout(timeout);
              // Don't reject - allow offline operation
              this.isInitialized = true; // Mark as initialized anyway so app doesn't hang
              resolve(id); // Return the ID even if connection failed
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

              // Track retry count to implement exponential backoff
              // Extract retry count from ID if it's a retry ID
              const retryMatch = id.match(/-retry(\d+)$/);
              const currentRetryCount = retryMatch
                ? parseInt(retryMatch[1], 10)
                : 0;

              if (currentRetryCount < 3) {
                // Retry up to 3 times with the same base ID but increasing delays
                // Wait longer each time: 3s, 5s, 8s
                const waitTime = [3000, 5000, 8000][currentRetryCount];
                const nextRetryCount = currentRetryCount + 1;
                const retryId =
                  nextRetryCount === 1
                    ? `fluxby-${this.options.deviceId}`
                    : `fluxby-${this.options.deviceId}-retry${nextRetryCount}`;

                peerDebugLog(
                  `Peer ID unavailable, retry ${nextRetryCount}/3 in ${waitTime / 1000}s...`
                );
                setTimeout(() => {
                  setupPeer(retryId, true);
                }, waitTime);
              } else {
                // After 3 retries, use a timestamp-based fallback
                // This ensures the app can still function even if the ID is stuck
                console.warn(
                  'Peer ID unavailable after 3 retries. Using fallback ID with timestamp.'
                );
                setTimeout(() => {
                  setupPeer(
                    `fluxby-${this.options.deviceId}-${Date.now()}`,
                    true
                  );
                }, 500);
              }
            } else {
              clearTimeout(timeout);
              this.options.onError?.(err);
              // Don't reject for non-critical errors
              if (
                err.type !== 'peer-unavailable' &&
                err.type !== 'server-error'
              ) {
                reject(err);
              } else {
                this.isInitialized = true;
                resolve(id);
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
          clearTimeout(timeout);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };

      // Use session ID to create unique peer ID per browser session
      // This prevents "ID taken" errors after page refresh while old connection times out
      setupPeer(`fluxby-${this.options.deviceId}-${this.sessionId}`);
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
        this.encryptionSessions.set(peerId, session);
        return session;
      });
      this.encryptionInitializers.set(peerId, pending);
    }
    try {
      return await pending;
    } finally {
      this.encryptionInitializers.delete(peerId);
    }
  }
  private sendPublicKeyOnce(
    conn: DataConnection,
    session: SyncEncryptionSession
  ): void {
    if (this.sentKeyExchanges.has(conn.peer)) return;
    this.sentKeyExchanges.add(conn.peer);
    conn.send({
      type: 'key-exchange',
      publicKey: session.localKeyPair.publicKeyJwk,
    });
  }

  /**
   * Handle incoming peer connection
   */
  private handleIncomingConnection(conn: DataConnection): void {
    conn.on('open', async () => {
      this.connections.set(conn.peer, conn);
      this.options.onConnectionChange?.(conn.peer, true);

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
      this.connections.delete(conn.peer);
      this.encryptionSessions.delete(conn.peer);
      this.sentKeyExchanges.delete(conn.peer);
      this.encryptionInitializers.delete(conn.peer);
      this.options.onConnectionChange?.(conn.peer, false);

      // Update paired device status
      for (const device of this.pairedDevices.values()) {
        if (device.peerId === conn.peer) {
          device.isConnected = false;
        }
      }
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
        this.encryptionSessions.set(conn.peer, updatedSession);
        this.sendPublicKeyOnce(conn, session);
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
      this.encryptionSessions.set(conn.peer, updatedSession);
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
    const device = [...this.pairedDevices.values()].find(
      (item) => item.peerId === conn.peer
    );
    if (
      !device ||
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
    kind: 'push' | 'request'
  ): Promise<number> {
    if (this.pendingSync.has(requestId))
      throw new Error('Duplicate sync request');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingSync.delete(requestId);
        reject(new Error('Sync acknowledgement timed out'));
      }, 15000);
      this.pendingSync.set(requestId, {
        peerId: conn.peer,
        kind,
        resolve,
        reject,
        timer,
      });
    });
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
    message: PairingMessage
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
    const device = this.authorizedDevice(conn);
    if (
      !('requestId' in message) ||
      typeof message.requestId !== 'string' ||
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
      this.completeSync(conn, message.requestId, 0, message.reason);
      return;
    }
    try {
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
        const acknowledgement = this.waitForSync(
          conn,
          message.requestId,
          'push'
        );
        void acknowledgement.catch(() => undefined);
        await this.sendEncrypted(conn, {
          type: 'sync-response',
          changes,
          requestId: message.requestId,
        });
        await acknowledgement;
        device.lastSyncAt = Date.now();
      } else if (
        message.type === 'sync-push' ||
        message.type === 'sync-response'
      ) {
        if (
          !Array.isArray(message.changes) ||
          message.changes.length > 50000 ||
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
          };
          this.pairedDevices.set(device.id, device);
          await this.sendEncrypted(conn, {
            type: 'pairing-accept',
            deviceId: this.options.deviceId,
            deviceName: this.options.deviceName,
            profileId: this.options.profileId || '',
            schemaVersion: this.options.schemaVersion || 0,
            protocolVersion: 2,
          });
          this.options.onPaired?.(device);
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
    };
    this.pairedDevices.set(device.id, device);
    this.options.onPaired?.(device);
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
        this.connections.set(conn.peer, conn);
        this.options.onConnectionChange?.(conn.peer, true);

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
        this.connections.delete(conn.peer);
        this.encryptionSessions.delete(conn.peer);
        this.sentKeyExchanges.delete(conn.peer);
        this.encryptionInitializers.delete(conn.peer);
        for (const device of this.pairedDevices.values())
          if (device.peerId === conn.peer) device.isConnected = false;
        this.options.onConnectionChange?.(conn.peer, false);
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
    const requestId = crypto.randomUUID();
    const acknowledgement = this.waitForSync(conn, requestId, 'push');
    void acknowledgement.catch(() => undefined);
    try {
      await this.sendEncrypted(conn, { type: 'sync-push', changes, requestId });
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
    if (device) {
      const conn = this.connections.get(device.peerId);
      conn?.close();
      this.connections.delete(device.peerId);
      this.encryptionSessions.delete(device.peerId);
      this.sentKeyExchanges.delete(device.peerId);
      this.encryptionInitializers.delete(device.peerId);
      this.pairedDevices.delete(deviceId);
    }
  }

  /**
   * Destroy peer connection
   */
  destroy(): void {
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
