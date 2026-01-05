/**
 * Enhanced Peer Sync
 * Robust peer-to-peer connections with heartbeats, auto-reconnection, and logging
 *
 * This module builds on the basic PeerSync with:
 * - Heartbeat keepalive (detects dead connections)
 * - Auto-reconnection to last known peers
 * - Structured logging via SyncLogger
 * - Enhanced error handling and recovery
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Peer, DataConnection } from 'peerjs';
import { getSyncLogger } from './sync-logger.js';
import type { SyncChange, SyncableRow } from './sync.js';
import {
  type SyncProtocolMessage,
  type SyncProtocolConfig,
  type SyncSession,
  type SyncSessionState,
  DEFAULT_SYNC_CONFIG,
  isSyncProtocolMessage,
  createHeartbeatMessage,
  createDebugPingMessage,
  SYNC_PROTOCOL_VERSION,
} from './sync-protocol.js';
import {
  generatePairingCode,
  type PairingMessage,
  type PeerDevice,
} from './peer.js';

// ============================================================================
// Types
// ============================================================================

export interface EnhancedPeerOptions {
  /** Device ID for this device */
  deviceId: string;
  /** Human-readable device name */
  deviceName: string;
  /** Database schema version */
  schemaVersion: number;
  /** Protocol configuration */
  config?: Partial<SyncProtocolConfig>;
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
  /** Callback when session state changes */
  onSessionStateChange?: (peerId: string, state: SyncSessionState) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Callback for debug pings (for connectivity testing) */
  onDebugPong?: (peerId: string, rtt: number, payload?: string) => void;
}

interface ConnectionState {
  conn: DataConnection;
  session: SyncSession;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
  lastHeartbeatSent: number | null;
}

// ============================================================================
// EnhancedPeerSync Class
// ============================================================================

/**
 * EnhancedPeerSync - Robust peer-to-peer sync with heartbeats and auto-reconnection
 */
export class EnhancedPeerSync {
  private peer: Peer | null = null;
  private connections: Map<string, ConnectionState> = new Map();
  private pairedDevices: Map<string, PeerDevice> = new Map();
  private options: EnhancedPeerOptions;
  private config: SyncProtocolConfig;
  private pendingPairingCode: string | null = null;
  private isInitialized = false;
  private sessionId: string = Math.random().toString(36).substring(2, 8);
  private logger = getSyncLogger();

  constructor(options: EnhancedPeerOptions) {
    this.options = options;
    this.config = { ...DEFAULT_SYNC_CONFIG, ...options.config };
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize PeerJS connection
   */
  async initialize(): Promise<string> {
    if (this.isInitialized && this.peer && !this.peer.destroyed) {
      return this.peer.id;
    }

    this.isInitialized = false;
    this.cleanup();

    return new Promise((resolve, reject) => {
      const timeoutMs = this.config.connectionTimeout;
      const timeout = setTimeout(() => {
        this.cleanup();
        const error = new Error('Connection to peer server timed out');
        this.logger.error('peer:error', error.message);
        reject(error);
      }, timeoutMs);

      this.setupPeer(
        `fluxby-${this.options.deviceId}-${this.sessionId}`,
        timeout,
        resolve,
        reject
      );
    });
  }

  private setupPeer(
    id: string,
    timeout: ReturnType<typeof setTimeout>,
    resolve: (peerId: string) => void,
    reject: (error: Error) => void,
    retryCount = 0
  ): void {
    try {
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      this.logger.debug('peer:open', `Attempting to connect with ID: ${id}`);

      const peer = new Peer(id, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });
      this.peer = peer;

      peer.on('open', (peerId) => {
        if (this.peer !== peer || (peer as any)._ignoreEvents) return;

        this.logger.info('peer:open', `Connected with ID: ${peerId}`);
        clearTimeout(timeout);
        this.isInitialized = true;
        resolve(peerId);
      });

      peer.on('error', (err) => {
        if (this.peer !== peer || (peer as any)._ignoreEvents) return;
        this.handlePeerError(err, id, timeout, resolve, reject, retryCount);
      });

      peer.on('connection', (conn) => {
        if (this.peer !== peer || (peer as any)._ignoreEvents) return;
        this.logger.info(
          'connection:open',
          `Incoming connection from: ${conn.peer}`,
          conn.peer
        );
        this.handleIncomingConnection(conn);
      });

      peer.on('disconnected', () => {
        if (this.peer !== peer || peer.destroyed || (peer as any)._ignoreEvents)
          return;

        this.logger.warn(
          'peer:disconnected',
          'Disconnected from signaling server'
        );

        try {
          if (!peer.destroyed && this.peer === peer) {
            this.logger.info('peer:reconnecting', 'Attempting to reconnect...');
            peer.reconnect();
          }
        } catch (e) {
          if (e instanceof Error && !e.message.includes('destroyed')) {
            this.logger.error('peer:error', `Reconnect failed: ${e.message}`);
          }
        }
      });

      peer.on('close', () => {
        this.logger.info('peer:close', 'Peer connection closed');
      });
    } catch (error) {
      clearTimeout(timeout);
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('peer:error', `Setup failed: ${err.message}`);
      reject(err);
    }
  }

  private handlePeerError(
    err: any,
    id: string,
    timeout: ReturnType<typeof setTimeout>,
    resolve: (peerId: string) => void,
    reject: (error: Error) => void,
    retryCount: number
  ): void {
    // Suppress network-related errors
    const isNetworkError =
      err.type === 'network' ||
      err.type === 'socket-error' ||
      err.type === 'socket-closed' ||
      (err.message &&
        (err.message.includes('WebSocket') ||
          err.message.toLowerCase().includes('time') ||
          err.message.toLowerCase().includes('connect')));

    if (isNetworkError) {
      this.logger.warn(
        'peer:error',
        `Network error (offline?): ${err.type || err.message}`
      );
      clearTimeout(timeout);
      this.isInitialized = true;
      resolve(id);
      return;
    }

    this.logger.error(
      'peer:error',
      `Error: ${err.type} - ${err.message}`,
      undefined,
      { errorType: err.type }
    );

    if (err.type === 'unavailable-id') {
      (this.peer as any)._ignoreEvents = true;
      this.peer = null;

      if (retryCount < 3) {
        const waitTime = [3000, 5000, 8000][retryCount];
        this.logger.info(
          'peer:reconnecting',
          `ID unavailable, retry ${retryCount + 1}/3 in ${waitTime / 1000}s`
        );

        setTimeout(() => {
          const retryId =
            retryCount === 0
              ? `fluxby-${this.options.deviceId}`
              : `fluxby-${this.options.deviceId}-retry${retryCount + 1}`;
          this.setupPeer(retryId, timeout, resolve, reject, retryCount + 1);
        }, waitTime);
      } else {
        this.logger.warn(
          'peer:error',
          'Max retries reached, using timestamp-based ID'
        );
        setTimeout(() => {
          this.setupPeer(
            `fluxby-${this.options.deviceId}-${Date.now()}`,
            timeout,
            resolve,
            reject,
            0
          );
        }, 500);
      }
    } else {
      clearTimeout(timeout);
      this.options.onError?.(err);

      if (err.type !== 'peer-unavailable' && err.type !== 'server-error') {
        reject(err);
      } else {
        this.isInitialized = true;
        resolve(id);
      }
    }
  }

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  private handleIncomingConnection(conn: DataConnection): void {
    const state: ConnectionState = {
      conn,
      session: {
        peerId: conn.peer,
        deviceId: '',
        deviceName: '',
        state: 'connecting',
        connectedAt: null,
        lastHeartbeat: null,
        lastSyncAt: null,
        rtt: null,
      },
      heartbeatTimer: null,
      heartbeatTimeoutTimer: null,
      reconnectAttempts: 0,
      lastHeartbeatSent: null,
    };

    conn.on('open', () => {
      this.logger.info('connection:open', 'Connection opened', conn.peer);
      state.session.connectedAt = Date.now();
      state.session.state = 'connected';
      this.connections.set(conn.peer, state);
      this.startHeartbeat(conn.peer);
      this.options.onConnectionChange?.(conn.peer, true);
    });

    conn.on('data', (data) => {
      this.handleMessage(conn, data, state);
    });

    conn.on('close', () => {
      this.logger.info('connection:close', 'Connection closed', conn.peer);
      this.handleConnectionClose(conn.peer);
    });

    conn.on('error', (err) => {
      this.logger.error('connection:error', `Error: ${err.message}`, conn.peer);
      this.options.onError?.(err);
    });
  }

  private handleConnectionClose(peerId: string): void {
    const state = this.connections.get(peerId);
    if (state) {
      this.stopHeartbeat(peerId);
      state.session.state = 'disconnected';
      this.options.onSessionStateChange?.(peerId, 'disconnected');
      this.connections.delete(peerId);
    }

    // Update paired device status
    for (const device of this.pairedDevices.values()) {
      if (device.peerId === peerId) {
        device.isConnected = false;
      }
    }

    this.options.onConnectionChange?.(peerId, false);

    // Auto-reconnect if enabled
    if (this.config.autoReconnect) {
      const device = Array.from(this.pairedDevices.values()).find(
        (d) => d.peerId === peerId
      );
      if (device) {
        this.scheduleReconnect(device);
      }
    }
  }

  private scheduleReconnect(device: PeerDevice): void {
    const state = this.connections.get(device.peerId);
    const attempts = state?.reconnectAttempts ?? 0;

    if (attempts >= this.config.maxReconnectAttempts) {
      this.logger.warn(
        'connection:error',
        `Max reconnect attempts reached for ${device.name}`,
        device.peerId
      );
      return;
    }

    const delay =
      this.config.reconnectDelay *
      Math.pow(this.config.reconnectBackoff, attempts);
    this.logger.info(
      'peer:reconnecting',
      `Reconnecting to ${device.name} in ${delay}ms (attempt ${attempts + 1})`,
      device.peerId
    );

    setTimeout(() => {
      this.reconnectToDevice(device, attempts + 1);
    }, delay);
  }

  private async reconnectToDevice(
    device: PeerDevice,
    attemptCount: number
  ): Promise<void> {
    if (!this.peer || this.peer.destroyed) {
      this.logger.warn('peer:error', 'Cannot reconnect: peer not initialized');
      return;
    }

    try {
      const conn = this.peer.connect(device.peerId, { reliable: true });

      const state: ConnectionState = {
        conn,
        session: {
          peerId: device.peerId,
          deviceId: device.id,
          deviceName: device.name,
          state: 'connecting',
          connectedAt: null,
          lastHeartbeat: null,
          lastSyncAt: null,
          rtt: null,
        },
        heartbeatTimer: null,
        heartbeatTimeoutTimer: null,
        reconnectAttempts: attemptCount,
        lastHeartbeatSent: null,
      };

      conn.on('open', () => {
        this.logger.info(
          'connection:open',
          `Reconnected to ${device.name}`,
          device.peerId
        );
        state.session.connectedAt = Date.now();
        state.session.state = 'connected';
        state.reconnectAttempts = 0;
        this.connections.set(conn.peer, state);
        device.isConnected = true;
        this.startHeartbeat(conn.peer);
        this.options.onConnectionChange?.(conn.peer, true);
      });

      conn.on('data', (data) => {
        this.handleMessage(conn, data, state);
      });

      conn.on('close', () => {
        this.handleConnectionClose(conn.peer);
      });

      conn.on('error', (err) => {
        this.logger.error(
          'connection:error',
          `Reconnect error: ${err.message}`,
          device.peerId
        );
        // Schedule another reconnect
        this.scheduleReconnect(device);
      });
    } catch (error) {
      this.logger.error(
        'connection:error',
        `Failed to reconnect: ${error}`,
        device.peerId
      );
      this.scheduleReconnect(device);
    }
  }

  // ==========================================================================
  // Heartbeat Management
  // ==========================================================================

  private startHeartbeat(peerId: string): void {
    const state = this.connections.get(peerId);
    if (!state) return;

    // Clear any existing timers
    this.stopHeartbeat(peerId);

    // Start heartbeat interval
    state.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat(peerId);
    }, this.config.heartbeatInterval);

    this.logger.debug('heartbeat:sent', 'Heartbeat started', peerId);
  }

  private stopHeartbeat(peerId: string): void {
    const state = this.connections.get(peerId);
    if (!state) return;

    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }

    if (state.heartbeatTimeoutTimer) {
      clearTimeout(state.heartbeatTimeoutTimer);
      state.heartbeatTimeoutTimer = null;
    }
  }

  private sendHeartbeat(peerId: string): void {
    const state = this.connections.get(peerId);
    if (!state || !state.conn.open) return;

    const msg = createHeartbeatMessage();
    state.lastHeartbeatSent = msg.timestamp;

    try {
      state.conn.send(msg);
      this.logger.debug('heartbeat:sent', 'Sent heartbeat', peerId);

      // Set timeout for response
      state.heartbeatTimeoutTimer = setTimeout(() => {
        this.handleHeartbeatTimeout(peerId);
      }, this.config.heartbeatTimeout);
    } catch (error) {
      this.logger.error(
        'heartbeat:timeout',
        `Failed to send heartbeat: ${error}`,
        peerId
      );
    }
  }

  private handleHeartbeatResponse(
    peerId: string,
    originalTimestamp: number
  ): void {
    const state = this.connections.get(peerId);
    if (!state) return;

    // Clear timeout
    if (state.heartbeatTimeoutTimer) {
      clearTimeout(state.heartbeatTimeoutTimer);
      state.heartbeatTimeoutTimer = null;
    }

    // Calculate RTT
    const rtt = Date.now() - originalTimestamp;
    state.session.rtt = rtt;
    state.session.lastHeartbeat = Date.now();

    this.logger.debug('heartbeat:received', `RTT: ${rtt}ms`, peerId);
  }

  private handleHeartbeatTimeout(peerId: string): void {
    this.logger.warn(
      'heartbeat:timeout',
      'Heartbeat timeout - connection may be dead',
      peerId
    );

    const state = this.connections.get(peerId);
    if (state) {
      // Consider the connection dead
      state.conn.close();
      this.handleConnectionClose(peerId);
    }
  }

  // ==========================================================================
  // Message Handling
  // ==========================================================================

  private handleMessage(
    conn: DataConnection,
    data: unknown,
    state: ConnectionState
  ): void {
    // Handle sync protocol messages
    if (isSyncProtocolMessage(data)) {
      this.handleSyncProtocolMessage(conn, data, state);
      return;
    }

    // Handle legacy pairing messages
    this.handleLegacyMessage(conn, data as PairingMessage);
  }

  private handleSyncProtocolMessage(
    conn: DataConnection,
    message: SyncProtocolMessage,
    state: ConnectionState
  ): void {
    this.logger.debug(
      'connection:data',
      `Received: ${message.type}`,
      conn.peer
    );

    switch (message.type) {
      case 'sync:heartbeat':
        // Respond to heartbeat
        conn.send({
          type: 'sync:heartbeat-ack',
          timestamp: Date.now(),
          originalTimestamp: message.timestamp,
        });
        break;

      case 'sync:heartbeat-ack':
        this.handleHeartbeatResponse(conn.peer, message.originalTimestamp);
        break;

      case 'sync:debug-ping':
        conn.send({
          type: 'sync:debug-pong',
          timestamp: Date.now(),
          originalTimestamp: message.timestamp,
          payload: message.payload,
        });
        break;

      case 'sync:debug-pong': {
        const rtt = Date.now() - message.originalTimestamp;
        this.logger.info(
          'connection:data',
          `Debug pong received, RTT: ${rtt}ms`,
          conn.peer
        );
        this.options.onDebugPong?.(conn.peer, rtt, message.payload);
        break;
      }

      case 'sync:handshake':
        this.handleHandshake(conn, message, state);
        break;

      case 'sync:handshake-ack':
        if (message.accepted) {
          state.session.deviceId = message.deviceId;
          state.session.deviceName = message.deviceName;
          state.session.state = 'connected';
          this.logger.info(
            'connection:open',
            `Handshake accepted by ${message.deviceName}`,
            conn.peer
          );
        } else {
          this.logger.warn(
            'connection:error',
            `Handshake rejected: ${message.rejectReason}`,
            conn.peer
          );
        }
        break;

      case 'sync:push':
        this.logger.info(
          'sync:push',
          `Received ${message.changes.length} changes`,
          conn.peer
        );
        this.options.onSyncReceived?.(message.changes);
        // Send acknowledgment
        conn.send({
          type: 'sync:ack',
          pushId: message.pushId,
          applied: message.changes.length,
          skipped: 0,
          conflicts: 0,
        });
        break;

      case 'sync:request':
        this.logger.info(
          'sync:request',
          `Sync requested since ${message.sinceTimestamp}`,
          conn.peer
        );
        // Signal that sync was requested (app needs to respond with data)
        this.options.onSyncReceived?.([]);
        break;

      case 'sync:data':
        this.logger.info(
          'sync:response',
          `Received batch ${message.batchIndex + 1}/${message.totalBatches}`,
          conn.peer
        );
        this.options.onSyncReceived?.(message.changes);
        break;

      case 'sync:ack':
        this.logger.debug(
          'sync:ack',
          `Applied: ${message.applied}, Skipped: ${message.skipped}`,
          conn.peer
        );
        break;

      case 'sync:error':
        this.logger.error(
          'sync:error',
          `Error: ${message.errorCode} - ${message.message}`,
          conn.peer
        );
        break;
    }
  }

  private handleHandshake(
    conn: DataConnection,
    message: SyncProtocolMessage & { type: 'sync:handshake' },
    state: ConnectionState
  ): void {
    // Check protocol version
    if (message.protocolVersion !== SYNC_PROTOCOL_VERSION) {
      conn.send({
        type: 'sync:handshake-ack',
        protocolVersion: SYNC_PROTOCOL_VERSION,
        deviceId: this.options.deviceId,
        deviceName: this.options.deviceName,
        lastSyncTimestamp: 0,
        schemaVersion: this.options.schemaVersion,
        accepted: false,
        rejectReason: `Protocol version mismatch: expected ${SYNC_PROTOCOL_VERSION}, got ${message.protocolVersion}`,
      });
      return;
    }

    // Check schema version
    if (message.schemaVersion !== this.options.schemaVersion) {
      conn.send({
        type: 'sync:handshake-ack',
        protocolVersion: SYNC_PROTOCOL_VERSION,
        deviceId: this.options.deviceId,
        deviceName: this.options.deviceName,
        lastSyncTimestamp: 0,
        schemaVersion: this.options.schemaVersion,
        accepted: false,
        rejectReason: `Schema version mismatch: expected ${this.options.schemaVersion}, got ${message.schemaVersion}`,
      });
      return;
    }

    // Accept handshake
    state.session.deviceId = message.deviceId;
    state.session.deviceName = message.deviceName;
    state.session.state = 'connected';

    conn.send({
      type: 'sync:handshake-ack',
      protocolVersion: SYNC_PROTOCOL_VERSION,
      deviceId: this.options.deviceId,
      deviceName: this.options.deviceName,
      lastSyncTimestamp: Date.now(),
      schemaVersion: this.options.schemaVersion,
      accepted: true,
    });

    this.logger.info(
      'connection:open',
      `Handshake complete with ${message.deviceName}`,
      conn.peer
    );
  }

  private handleLegacyMessage(
    conn: DataConnection,
    message: PairingMessage
  ): void {
    this.logger.debug(
      'connection:data',
      `Legacy message: ${message.type}`,
      conn.peer
    );

    switch (message.type) {
      case 'pairing-request':
        this.handlePairingRequest(conn, message);
        break;

      case 'pairing-accept':
        this.handlePairingAccept(conn, message);
        break;

      case 'pairing-reject':
        this.logger.warn(
          'pairing:reject',
          `Rejected: ${message.reason}`,
          conn.peer
        );
        this.options.onError?.(
          new Error(`Pairing rejected: ${message.reason}`)
        );
        break;

      case 'sync-request':
        this.logger.info('sync:request', 'Legacy sync request', conn.peer);
        this.options.onSyncReceived?.([]);
        break;

      case 'sync-response':
      case 'sync-push':
        this.logger.info(
          'sync:push',
          `Received ${message.changes.length} changes (legacy)`,
          conn.peer
        );
        this.options.onSyncReceived?.(
          message.changes as SyncChange<SyncableRow>[]
        );
        break;

      case 'sync-ack':
        this.logger.debug(
          'sync:ack',
          `Acknowledged ${message.applied} changes`,
          conn.peer
        );
        break;
    }
  }

  // ==========================================================================
  // Pairing
  // ==========================================================================

  private handlePairingRequest(
    conn: DataConnection,
    message: {
      type: 'pairing-request';
      pairingCode: string;
      deviceName: string;
    }
  ): void {
    this.logger.info(
      'pairing:request',
      `Request from ${message.deviceName}`,
      conn.peer
    );

    if (
      this.pendingPairingCode &&
      message.pairingCode === this.pendingPairingCode
    ) {
      const device: PeerDevice = {
        id: conn.peer,
        name: message.deviceName,
        peerId: conn.peer,
        lastSyncAt: null,
        isConnected: true,
      };

      this.pairedDevices.set(device.id, device);
      this.pendingPairingCode = null;

      conn.send({
        type: 'pairing-accept',
        deviceId: this.options.deviceId,
        deviceName: this.options.deviceName,
      });

      this.logger.info(
        'pairing:accept',
        `Auto-accepted ${message.deviceName}`,
        conn.peer
      );
      this.options.onPaired?.(device);
    } else if (this.options.onPairingRequest) {
      this.options.onPairingRequest(
        message.deviceName,
        () => {
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

          this.logger.info(
            'pairing:accept',
            `User accepted ${message.deviceName}`,
            conn.peer
          );
          this.options.onPaired?.(device);
        },
        () => {
          conn.send({
            type: 'pairing-reject',
            reason: 'User rejected pairing request',
          });
          this.logger.info(
            'pairing:reject',
            `User rejected ${message.deviceName}`,
            conn.peer
          );
        }
      );
    } else {
      conn.send({
        type: 'pairing-reject',
        reason: 'Pairing not allowed',
      });
      this.logger.warn('pairing:reject', 'No pairing handler', conn.peer);
    }
  }

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
    this.logger.info(
      'pairing:accept',
      `Paired with ${message.deviceName}`,
      conn.peer
    );
    this.options.onPaired?.(device);
  }

  /**
   * Start pairing mode with a code
   */
  startPairing(): string {
    this.pendingPairingCode = generatePairingCode();
    this.logger.info(
      'pairing:request',
      `Generated pairing code: ${this.pendingPairingCode}`
    );
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

    this.logger.info(
      'connection:open',
      `Connecting to ${targetPeerId}`,
      targetPeerId
    );

    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer destroyed'));
        return;
      }

      const conn = this.peer.connect(targetPeerId, { reliable: true });

      const timeout = setTimeout(() => {
        conn.close();
        this.logger.error(
          'connection:error',
          'Connection timeout',
          targetPeerId
        );
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      const state: ConnectionState = {
        conn,
        session: {
          peerId: targetPeerId,
          deviceId: '',
          deviceName: '',
          state: 'connecting',
          connectedAt: null,
          lastHeartbeat: null,
          lastSyncAt: null,
          rtt: null,
        },
        heartbeatTimer: null,
        heartbeatTimeoutTimer: null,
        reconnectAttempts: 0,
        lastHeartbeatSent: null,
      };

      conn.on('open', () => {
        this.logger.info(
          'connection:open',
          'Connection established',
          targetPeerId
        );
        this.connections.set(conn.peer, state);
        this.options.onConnectionChange?.(conn.peer, true);
        this.startHeartbeat(conn.peer);

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
          this.logger.warn('pairing:reject', message.reason, targetPeerId);
          reject(new Error(message.reason));
        } else {
          this.handleMessage(conn, data, state);
        }
      });

      conn.on('close', () => {
        this.handleConnectionClose(conn.peer);
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        this.logger.error('connection:error', err.message, targetPeerId);
        if ((err as any).type === 'peer-unavailable') {
          reject(new Error('peer-unavailable'));
        } else {
          reject(err);
        }
      });
    });
  }

  // ==========================================================================
  // Sync Operations
  // ==========================================================================

  /**
   * Send sync changes to a specific device
   */
  sendChanges(deviceId: string, changes: SyncChange[]): void {
    const device = this.pairedDevices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const state = this.connections.get(device.peerId);
    if (!state || !state.conn.open) {
      throw new Error(`Not connected to device ${deviceId}`);
    }

    const pushId = `push_${Date.now()}`;

    state.conn.send({
      type: 'sync:push',
      changes,
      pushId,
    });

    device.lastSyncAt = Date.now();
    this.logger.info(
      'sync:push',
      `Sent ${changes.length} changes`,
      device.peerId
    );
  }

  /**
   * Request sync from a specific device
   */
  requestSync(deviceId: string, sinceTimestamp: number = 0): void {
    const device = this.pairedDevices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const state = this.connections.get(device.peerId);
    if (!state || !state.conn.open) {
      throw new Error(`Not connected to device ${deviceId}`);
    }

    state.conn.send({
      type: 'sync:request',
      sinceTimestamp,
      requestId: `req_${Date.now()}`,
    });

    this.logger.info(
      'sync:request',
      `Requested sync since ${sinceTimestamp}`,
      device.peerId
    );
  }

  /**
   * Broadcast changes to all connected devices
   */
  broadcastChanges(changes: SyncChange[]): void {
    for (const [peerId, state] of this.connections) {
      if (state.conn.open) {
        const pushId = `push_${Date.now()}`;
        state.conn.send({
          type: 'sync:push',
          changes,
          pushId,
        });

        for (const device of this.pairedDevices.values()) {
          if (device.peerId === peerId) {
            device.lastSyncAt = Date.now();
          }
        }
      }
    }

    this.logger.info(
      'sync:push',
      `Broadcast ${changes.length} changes to ${this.connections.size} peers`
    );
  }

  // ==========================================================================
  // Debug Tools
  // ==========================================================================

  /**
   * Send a debug ping to test connectivity
   */
  sendDebugPing(peerId: string, payload?: string): void {
    const state = this.connections.get(peerId);
    if (!state || !state.conn.open) {
      throw new Error(`Not connected to peer ${peerId}`);
    }

    state.conn.send(createDebugPingMessage(payload));
    this.logger.debug('connection:data', 'Sent debug ping', peerId);
  }

  /**
   * Get connection stats for a peer
   */
  getConnectionStats(peerId: string): SyncSession | null {
    const state = this.connections.get(peerId);
    return state?.session ?? null;
  }

  /**
   * Get all connection stats
   */
  getAllConnectionStats(): SyncSession[] {
    return Array.from(this.connections.values()).map((s) => s.session);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  getPairedDevices(): PeerDevice[] {
    return Array.from(this.pairedDevices.values());
  }

  getPeerId(): string | null {
    return this.peer?.id ?? null;
  }

  isConnected(): boolean {
    return this.isInitialized && !this.peer?.destroyed;
  }

  disconnect(deviceId: string): void {
    const device = this.pairedDevices.get(deviceId);
    if (device) {
      const state = this.connections.get(device.peerId);
      if (state) {
        this.stopHeartbeat(device.peerId);
        state.conn.close();
      }
      this.connections.delete(device.peerId);
      this.pairedDevices.delete(deviceId);
      this.logger.info(
        'connection:close',
        `Disconnected from ${device.name}`,
        device.peerId
      );
    }
  }

  private cleanup(): void {
    if (this.peer) {
      try {
        (this.peer as any)._ignoreEvents = true;
        this.peer.removeAllListeners();
        this.peer.destroy();
      } catch {
        // Ignore cleanup errors
      }
      this.peer = null;
    }

    // Stop all heartbeats
    for (const peerId of this.connections.keys()) {
      this.stopHeartbeat(peerId);
    }
    this.connections.clear();
  }

  destroy(): void {
    this.logger.info('peer:close', 'Destroying peer sync');

    for (const state of this.connections.values()) {
      this.stopHeartbeat(state.conn.peer);
      state.conn.close();
    }

    this.connections.clear();
    this.pairedDevices.clear();
    this.cleanup();
    this.isInitialized = false;
  }
}

/**
 * Create an EnhancedPeerSync instance
 */
export function createEnhancedPeerSync(
  options: EnhancedPeerOptions
): EnhancedPeerSync {
  return new EnhancedPeerSync(options);
}
