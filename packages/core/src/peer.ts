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

// Pairing message types
export type PairingMessage =
  | { type: 'pairing-request'; pairingCode: string; deviceName: string }
  | { type: 'pairing-accept'; deviceId: string; deviceName: string }
  | { type: 'pairing-reject'; reason: string }
  | { type: 'sync-request'; sinceTimestamp: number }
  | { type: 'sync-response'; changes: SyncChange[] }
  | { type: 'sync-push'; changes: SyncChange[] }
  | { type: 'sync-ack'; applied: number };

export interface PeerDevice {
  id: string;
  name: string;
  peerId: string;
  lastSyncAt: number | null;
  isConnected: boolean;
}

export interface PeerOptions {
  /** Device ID for this device */
  deviceId: string;
  /** Human-readable device name */
  deviceName: string;
  /** Callback when a new device wants to pair */
  onPairingRequest?: (
    deviceName: string,
    accept: () => void,
    reject: () => void
  ) => void;
  /** Callback when pairing is complete */
  onPaired?: (device: PeerDevice) => void;
  /** Callback when sync data is received */
  onSyncReceived?: (changes: SyncChange<SyncableRow>[]) => void;
  /** Callback when connection status changes */
  onConnectionChange?: (peerId: string, connected: boolean) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

/**
 * Generate a 6-digit pairing code
 */
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
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
  private options: PeerOptions;
  private pendingPairingCode: string | null = null;
  private isInitialized = false;
  // Track session ID to ensure unique peer IDs across page refreshes
  private sessionId: string = Math.random().toString(36).substring(2, 8);

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

          const peer = new Peer(id, {
            debug: 1, // Increased debug level for better troubleshooting
            config: {
              iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            },
          });
          this.peer = peer;

          peer.on('open', (peerId) => {
            if (this.peer !== peer || (peer as any)._ignoreEvents) return;
            console.log('PeerJS connection opened with ID:', peerId);
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

                console.log(
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
            console.log('Incoming peer connection from:', conn.peer);
            this.handleIncomingConnection(conn);
          });

          peer.on('disconnected', () => {
            if (
              this.peer !== peer ||
              peer.destroyed ||
              (peer as any)._ignoreEvents
            )
              return;
            console.log(
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

  /**
   * Handle incoming peer connection
   */
  private handleIncomingConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.options.onConnectionChange?.(conn.peer, true);
    });

    conn.on('data', (data) => {
      this.handleMessage(conn, data as PairingMessage);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
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
   * Handle incoming messages
   */
  private handleMessage(conn: DataConnection, message: PairingMessage): void {
    switch (message.type) {
      case 'pairing-request':
        this.handlePairingRequest(conn, message);
        break;

      case 'pairing-accept':
        this.handlePairingAccept(conn, message);
        break;

      case 'pairing-reject':
        this.options.onError?.(
          new Error(`Pairing rejected: ${message.reason}`)
        );
        break;

      case 'sync-request':
        // Emit event for app to respond with changes
        this.options.onSyncReceived?.([]); // Signal sync request
        break;

      case 'sync-response':
      case 'sync-push':
        this.options.onSyncReceived?.(
          message.changes as SyncChange<SyncableRow>[]
        );
        break;

      case 'sync-ack':
        // Sync acknowledged
        break;
    }
  }

  /**
   * Handle incoming pairing request
   */
  private handlePairingRequest(
    conn: DataConnection,
    message: {
      type: 'pairing-request';
      pairingCode: string;
      deviceName: string;
    }
  ): void {
    // Verify pairing code
    if (
      this.pendingPairingCode &&
      message.pairingCode === this.pendingPairingCode
    ) {
      // Auto-accept if code matches
      const device: PeerDevice = {
        id: conn.peer,
        name: message.deviceName,
        peerId: conn.peer,
        lastSyncAt: null,
        isConnected: true,
      };

      this.pairedDevices.set(device.id, device);
      this.pendingPairingCode = null;

      // Send acceptance
      conn.send({
        type: 'pairing-accept',
        deviceId: this.options.deviceId,
        deviceName: this.options.deviceName,
      });

      this.options.onPaired?.(device);
    } else if (this.options.onPairingRequest) {
      // Ask user to accept/reject
      this.options.onPairingRequest(
        message.deviceName,
        () => {
          // Accept
          const device: PeerDevice = {
            id: conn.peer,
            name: message.deviceName,
            peerId: conn.peer,
            lastSyncAt: null,
            isConnected: true,
          };

          this.pairedDevices.set(device.id, device);

          conn.send({
            type: 'pairing-accept',
            deviceId: this.options.deviceId,
            deviceName: this.options.deviceName,
          });

          this.options.onPaired?.(device);
        },
        () => {
          // Reject
          conn.send({
            type: 'pairing-reject',
            reason: 'User rejected pairing request',
          });
        }
      );
    } else {
      // No handler, reject
      conn.send({
        type: 'pairing-reject',
        reason: 'Pairing not allowed',
      });
    }
  }

  /**
   * Handle pairing acceptance
   */
  private handlePairingAccept(
    conn: DataConnection,
    message: { type: 'pairing-accept'; deviceId: string; deviceName: string }
  ): void {
    const device: PeerDevice = {
      id: message.deviceId,
      name: message.deviceName,
      peerId: conn.peer,
      lastSyncAt: null,
      isConnected: true,
    };

    this.pairedDevices.set(device.id, device);
    this.options.onPaired?.(device);
  }

  /**
   * Start pairing mode with a code
   * Returns the pairing code to display to user
   */
  startPairing(): string {
    this.pendingPairingCode = generatePairingCode();
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

      const conn = this.peer.connect(targetPeerId, {
        reliable: true,
      });

      const timeout = setTimeout(() => {
        conn.close();
        reject(new Error('Connection timeout'));
      }, 30000);

      conn.on('open', () => {
        this.connections.set(conn.peer, conn);
        this.options.onConnectionChange?.(conn.peer, true);

        // Send pairing request
        conn.send({
          type: 'pairing-request',
          pairingCode,
          deviceName: this.options.deviceName,
        });
      });

      conn.on('data', (data) => {
        const message = data as PairingMessage;

        if (message.type === 'pairing-accept') {
          clearTimeout(timeout);
          this.handlePairingAccept(conn, message);
          const device = this.pairedDevices.get(message.deviceId);
          if (device) {
            resolve(device);
          }
        } else if (message.type === 'pairing-reject') {
          clearTimeout(timeout);
          reject(new Error(message.reason));
        } else {
          // Handle other message types
          this.handleMessage(conn, message);
        }
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        // Map common errors to more readable versions
        if ((err as any).type === 'peer-unavailable') {
          reject(new Error('peer-unavailable'));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Send sync changes to a specific device
   */
  sendChanges(deviceId: string, changes: SyncChange[]): void {
    const device = this.pairedDevices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const conn = this.connections.get(device.peerId);
    if (!conn || !conn.open) {
      throw new Error(`Not connected to device ${deviceId}`);
    }

    conn.send({
      type: 'sync-push',
      changes,
    });

    device.lastSyncAt = Date.now();
  }

  /**
   * Request sync from a specific device
   */
  requestSync(deviceId: string, sinceTimestamp: number = 0): void {
    const device = this.pairedDevices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const conn = this.connections.get(device.peerId);
    if (!conn || !conn.open) {
      throw new Error(`Not connected to device ${deviceId}`);
    }

    conn.send({
      type: 'sync-request',
      sinceTimestamp,
    });
  }

  /**
   * Broadcast changes to all connected devices
   */
  broadcastChanges(changes: SyncChange[]): void {
    for (const [peerId, conn] of this.connections) {
      if (conn.open) {
        conn.send({
          type: 'sync-push',
          changes,
        });

        // Update last sync time for paired devices
        for (const device of this.pairedDevices.values()) {
          if (device.peerId === peerId) {
            device.lastSyncAt = Date.now();
          }
        }
      }
    }
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
      this.pairedDevices.delete(deviceId);
    }
  }

  /**
   * Destroy peer connection
   */
  destroy(): void {
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
    this.pairedDevices.clear();
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
