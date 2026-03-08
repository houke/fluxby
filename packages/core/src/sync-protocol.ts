/**
 * Sync Protocol
 * Defines the message types and protocol for peer-to-peer database synchronization
 */

import type { SyncableRow, SyncChange } from './sync.js';

// ============================================================================
// Protocol Version
// ============================================================================

/**
 * Current protocol version. Increment when making breaking changes.
 */
export const SYNC_PROTOCOL_VERSION = 1;

// ============================================================================
// Message Types
// ============================================================================

/**
 * Handshake - First message sent when connecting
 * Used to verify protocol compatibility and exchange device info
 */
export interface SyncHandshakeMessage {
  type: 'sync:handshake';
  protocolVersion: number;
  deviceId: string;
  deviceName: string;
  /** Last sync timestamp (to help determine what data to exchange) */
  lastSyncTimestamp: number;
  /** Schema version (to ensure database compatibility) */
  schemaVersion: number;
}

/**
 * Handshake Response - Response to handshake
 */
export interface SyncHandshakeAckMessage {
  type: 'sync:handshake-ack';
  protocolVersion: number;
  deviceId: string;
  deviceName: string;
  lastSyncTimestamp: number;
  schemaVersion: number;
  /** Whether the handshake was accepted */
  accepted: boolean;
  /** Reason if rejected */
  rejectReason?: string;
}

/**
 * Heartbeat - Keepalive message
 */
export interface SyncHeartbeatMessage {
  type: 'sync:heartbeat';
  timestamp: number;
}

/**
 * Heartbeat Ack - Response to heartbeat
 */
export interface SyncHeartbeatAckMessage {
  type: 'sync:heartbeat-ack';
  timestamp: number;
  /** Original heartbeat timestamp for RTT calculation */
  originalTimestamp: number;
}

/**
 * Sync Request - Request changes from peer
 * Initiates the diffing process
 */
export interface SyncRequestMessage {
  type: 'sync:request';
  /** Request changes since this timestamp */
  sinceTimestamp: number;
  /** Optional: specific tables to sync (empty = all) */
  tables?: string[];
  /** Request ID for correlation */
  requestId: string;
}

/**
 * Sync Manifest - Response to sync request with list of changed rows
 * This is the "diffing" step - sending IDs and timestamps, not full data
 */
export interface SyncManifestMessage {
  type: 'sync:manifest';
  requestId: string;
  /** List of row summaries (id + updated_at for each table) */
  manifest: SyncManifestEntry[];
  /** Total number of changes available */
  totalChanges: number;
}

export interface SyncManifestEntry {
  table: string;
  rowId: string;
  updatedAt: number;
  isDeleted: boolean;
}

/**
 * Sync Fetch - Request specific rows based on manifest comparison
 */
export interface SyncFetchMessage {
  type: 'sync:fetch';
  requestId: string;
  /** Rows to fetch (by table and id) */
  rows: Array<{ table: string; rowId: string }>;
}

/**
 * Sync Data - Actual row data
 */
export interface SyncDataMessage {
  type: 'sync:data';
  requestId: string;
  /** Full row data */
  changes: SyncChange<SyncableRow>[];
  /** Is this the final batch? */
  isFinal: boolean;
  /** Batch number (for chunked transfers) */
  batchIndex: number;
  /** Total batches expected */
  totalBatches: number;
}

/**
 * Sync Push - Push changes to peer (proactive sync)
 */
export interface SyncPushMessage {
  type: 'sync:push';
  changes: SyncChange<SyncableRow>[];
  /** Push ID for acknowledgment */
  pushId: string;
}

/**
 * Sync Ack - Acknowledge received data
 */
export interface SyncAckMessage {
  type: 'sync:ack';
  requestId?: string;
  pushId?: string;
  /** Number of changes applied */
  applied: number;
  /** Number of changes skipped (e.g., older than local) */
  skipped: number;
  /** Any conflicts that occurred */
  conflicts: number;
}

/**
 * Sync Error - Error during sync
 */
export interface SyncErrorMessage {
  type: 'sync:error';
  requestId?: string;
  pushId?: string;
  errorCode: SyncErrorCode;
  message: string;
}

export type SyncErrorCode =
  | 'PROTOCOL_MISMATCH'
  | 'SCHEMA_MISMATCH'
  | 'TIMEOUT'
  | 'DATA_CORRUPT'
  | 'CHUNK_MISSING'
  | 'INTERNAL_ERROR';

/**
 * Debug Ping - Simple connectivity test
 */
export interface SyncDebugPingMessage {
  type: 'sync:debug-ping';
  timestamp: number;
  payload?: string;
}

/**
 * Debug Pong - Response to ping
 */
export interface SyncDebugPongMessage {
  type: 'sync:debug-pong';
  timestamp: number;
  originalTimestamp: number;
  payload?: string;
}

/**
 * Union type of all sync protocol messages
 */
export type SyncProtocolMessage =
  | SyncHandshakeMessage
  | SyncHandshakeAckMessage
  | SyncHeartbeatMessage
  | SyncHeartbeatAckMessage
  | SyncRequestMessage
  | SyncManifestMessage
  | SyncFetchMessage
  | SyncDataMessage
  | SyncPushMessage
  | SyncAckMessage
  | SyncErrorMessage
  | SyncDebugPingMessage
  | SyncDebugPongMessage;

// ============================================================================
// Sync State
// ============================================================================

export type SyncSessionState =
  | 'disconnected'
  | 'connecting'
  | 'handshaking'
  | 'connected'
  | 'syncing'
  | 'error';

export interface SyncSession {
  peerId: string;
  deviceId: string;
  deviceName: string;
  state: SyncSessionState;
  connectedAt: number | null;
  lastHeartbeat: number | null;
  lastSyncAt: number | null;
  /** Round-trip time in ms (from heartbeats) */
  rtt: number | null;
  /** Error if in error state */
  error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

export interface SyncProtocolConfig {
  /** Heartbeat interval in ms (default: 5000) */
  heartbeatInterval: number;
  /** Heartbeat timeout in ms (default: 15000) */
  heartbeatTimeout: number;
  /** Maximum chunk size for data messages (default: 16KB) */
  maxChunkSize: number;
  /** Connection timeout in ms (default: 30000) */
  connectionTimeout: number;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect: boolean;
  /** Max reconnect attempts (default: 5) */
  maxReconnectAttempts: number;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay: number;
  /** Exponential backoff factor (default: 1.5) */
  reconnectBackoff: number;
}

export const DEFAULT_SYNC_CONFIG: SyncProtocolConfig = {
  heartbeatInterval: 5000,
  heartbeatTimeout: 30000, // Increased from 15s for slow networks
  maxChunkSize: 16 * 1024, // 16KB - safe for WebRTC
  connectionTimeout: 30000,
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  reconnectBackoff: 1.5,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique request/push ID
 */
export function generateSyncId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a message is a sync protocol message
 */
export function isSyncProtocolMessage(
  message: unknown
): message is SyncProtocolMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    typeof (message as { type: unknown }).type === 'string' &&
    (message as { type: string }).type.startsWith('sync:')
  );
}

/**
 * Create a handshake message
 */
export function createHandshakeMessage(
  deviceId: string,
  deviceName: string,
  lastSyncTimestamp: number,
  schemaVersion: number
): SyncHandshakeMessage {
  return {
    type: 'sync:handshake',
    protocolVersion: SYNC_PROTOCOL_VERSION,
    deviceId,
    deviceName,
    lastSyncTimestamp,
    schemaVersion,
  };
}

/**
 * Create a heartbeat message
 */
export function createHeartbeatMessage(): SyncHeartbeatMessage {
  return {
    type: 'sync:heartbeat',
    timestamp: Date.now(),
  };
}

/**
 * Create a sync request message
 */
export function createSyncRequestMessage(
  sinceTimestamp: number,
  tables?: string[]
): SyncRequestMessage {
  return {
    type: 'sync:request',
    sinceTimestamp,
    tables,
    requestId: generateSyncId(),
  };
}

/**
 * Create a debug ping message
 */
export function createDebugPingMessage(payload?: string): SyncDebugPingMessage {
  return {
    type: 'sync:debug-ping',
    timestamp: Date.now(),
    payload,
  };
}

/**
 * Chunk an array into smaller arrays of specified size
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Estimate the byte size of a message (rough estimate for chunking)
 */
export function estimateMessageSize(message: unknown): number {
  return new TextEncoder().encode(JSON.stringify(message)).length;
}
