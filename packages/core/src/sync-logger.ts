/**
 * Sync Logger
 * Dedicated logging utility for peer-to-peer sync events
 * Provides structured logging with timestamps and severity levels
 */

export type SyncLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type SyncLogEvent =
  | 'peer:open'
  | 'peer:close'
  | 'peer:error'
  | 'peer:disconnected'
  | 'peer:reconnecting'
  | 'connection:open'
  | 'connection:close'
  | 'connection:error'
  | 'connection:data'
  | 'heartbeat:sent'
  | 'heartbeat:received'
  | 'heartbeat:timeout'
  | 'pairing:request'
  | 'pairing:accept'
  | 'pairing:reject'
  | 'sync:request'
  | 'sync:response'
  | 'sync:push'
  | 'sync:ack'
  | 'sync:start'
  | 'sync:complete'
  | 'sync:error'
  | 'sync:conflict';

export interface SyncLogEntry {
  timestamp: number;
  level: SyncLogLevel;
  event: SyncLogEvent;
  message: string;
  peerId?: string;
  data?: Record<string, unknown>;
}

export interface SyncLoggerOptions {
  /** Enable logging to console (default: true in development) */
  consoleEnabled?: boolean;
  /** Maximum number of log entries to keep in memory */
  maxEntries?: number;
  /** Callback when a log entry is added */
  onLog?: (entry: SyncLogEntry) => void;
  /** Minimum log level to record */
  minLevel?: SyncLogLevel;
}

const LOG_LEVEL_PRIORITY: Record<SyncLogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * SyncLogger - Structured logging for peer-to-peer sync
 */
export class SyncLogger {
  private entries: SyncLogEntry[] = [];
  private options: Required<SyncLoggerOptions>;
  private static instance: SyncLogger | null = null;

  constructor(options: SyncLoggerOptions = {}) {
    const defaultOnLog = (_entry: SyncLogEntry) => {
      // No-op by default
    };
    // Check if running in browser with localhost
    const isBrowser =
      typeof globalThis !== 'undefined' && 'location' in globalThis;
    const isLocalhost =
      isBrowser &&
      (globalThis as { location?: { hostname?: string } }).location
        ?.hostname === 'localhost';
    this.options = {
      consoleEnabled: options.consoleEnabled ?? isLocalhost,
      maxEntries: options.maxEntries ?? 500,
      onLog: options.onLog ?? defaultOnLog,
      minLevel: options.minLevel ?? 'debug',
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: SyncLoggerOptions): SyncLogger {
    if (!SyncLogger.instance) {
      SyncLogger.instance = new SyncLogger(options);
    }
    return SyncLogger.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    SyncLogger.instance = null;
  }

  /**
   * Log an event
   */
  log(
    level: SyncLogLevel,
    event: SyncLogEvent,
    message: string,
    peerId?: string,
    data?: Record<string, unknown>
  ): void {
    // Check minimum level
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.options.minLevel]) {
      return;
    }

    const entry: SyncLogEntry = {
      timestamp: Date.now(),
      level,
      event,
      message,
      peerId,
      data,
    };

    // Add to memory buffer
    this.entries.push(entry);

    // Trim if exceeds max
    if (this.entries.length > this.options.maxEntries) {
      this.entries = this.entries.slice(-this.options.maxEntries);
    }

    // Console output
    if (this.options.consoleEnabled) {
      this.logToConsole(entry);
    }

    // Callback
    this.options.onLog(entry);
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: SyncLogEntry): void {
    const time = new Date(entry.timestamp).toISOString().split('T')[1];
    const prefix = `[Sync ${time}]`;
    const eventStr = `[${entry.event}]`;
    const peerStr = entry.peerId ? `[${entry.peerId.slice(0, 12)}...]` : '';

    const logArgs: unknown[] = [
      `%c${prefix} %c${eventStr}%c ${peerStr} ${entry.message}`,
      'color: gray',
      this.getEventColor(entry.event),
      'color: inherit',
    ];

    if (entry.data) {
      logArgs.push(entry.data);
    }

    /* eslint-disable no-console */
    switch (entry.level) {
      case 'debug':
        console.debug(...logArgs);
        break;
      case 'info':
        console.info(...logArgs);
        break;
      case 'warn':
        console.warn(...logArgs);
        break;
      case 'error':
        console.error(...logArgs);
        break;
    }
    /* eslint-enable no-console */
  }

  /**
   * Get color for event type
   */
  private getEventColor(event: SyncLogEvent): string {
    if (event.startsWith('peer:')) return 'color: #8B5CF6'; // Purple
    if (event.startsWith('connection:')) return 'color: #3B82F6'; // Blue
    if (event.startsWith('heartbeat:')) return 'color: #10B981'; // Green
    if (event.startsWith('pairing:')) return 'color: #F59E0B'; // Amber
    if (event.startsWith('sync:')) return 'color: #EC4899'; // Pink
    return 'color: inherit';
  }

  // Convenience methods
  debug(
    event: SyncLogEvent,
    message: string,
    peerId?: string,
    data?: Record<string, unknown>
  ): void {
    this.log('debug', event, message, peerId, data);
  }

  info(
    event: SyncLogEvent,
    message: string,
    peerId?: string,
    data?: Record<string, unknown>
  ): void {
    this.log('info', event, message, peerId, data);
  }

  warn(
    event: SyncLogEvent,
    message: string,
    peerId?: string,
    data?: Record<string, unknown>
  ): void {
    this.log('warn', event, message, peerId, data);
  }

  error(
    event: SyncLogEvent,
    message: string,
    peerId?: string,
    data?: Record<string, unknown>
  ): void {
    this.log('error', event, message, peerId, data);
  }

  /**
   * Get all log entries
   */
  getEntries(): SyncLogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by event type
   */
  getEntriesByEvent(event: SyncLogEvent): SyncLogEntry[] {
    return this.entries.filter((e) => e.event === event);
  }

  /**
   * Get entries filtered by level
   */
  getEntriesByLevel(level: SyncLogLevel): SyncLogEntry[] {
    return this.entries.filter((e) => e.level === level);
  }

  /**
   * Get entries filtered by peer ID
   */
  getEntriesByPeer(peerId: string): SyncLogEntry[] {
    return this.entries.filter((e) => e.peerId === peerId);
  }

  /**
   * Get entries since a timestamp
   */
  getEntriesSince(timestamp: number): SyncLogEntry[] {
    return this.entries.filter((e) => e.timestamp >= timestamp);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Export entries as JSON string
   */
  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Get statistics about logged events
   */
  getStats(): {
    totalEntries: number;
    byLevel: Record<SyncLogLevel, number>;
    byEventPrefix: Record<string, number>;
    errorCount: number;
    warningCount: number;
  } {
    const byLevel: Record<SyncLogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    const byEventPrefix: Record<string, number> = {};

    for (const entry of this.entries) {
      byLevel[entry.level]++;

      const prefix = entry.event.split(':')[0];
      byEventPrefix[prefix] = (byEventPrefix[prefix] || 0) + 1;
    }

    return {
      totalEntries: this.entries.length,
      byLevel,
      byEventPrefix,
      errorCount: byLevel.error,
      warningCount: byLevel.warn,
    };
  }
}

/**
 * Get the global sync logger instance
 */
export function getSyncLogger(): SyncLogger {
  return SyncLogger.getInstance();
}
