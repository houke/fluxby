/**
 * Session & Auto-Lock Manager
 * Handles the volatile vault - Master Key only in RAM
 * Auto-locks after idle timeout
 */

export interface SessionState {
  isUnlocked: boolean;
  unlockedAt: number | null;
  lastActivity: number;
  autoLockTimeoutMs: number;
}

export type SessionEventType = 'unlock' | 'lock' | 'activity' | 'timeout';

export interface SessionEvent {
  type: SessionEventType;
  timestamp: number;
}

/**
 * Default auto-lock timeout (15 minutes)
 */
const DEFAULT_AUTO_LOCK_TIMEOUT = 15 * 60 * 1000;

/**
 * Session Manager
 * Manages the volatile master key in RAM
 */
export class SessionManager {
  private masterKey: Uint8Array | null = null;
  private state: SessionState;
  private listeners: Set<(event: SessionEvent) => void> = new Set();
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private activityHandler: (() => void) | null = null;

  constructor(autoLockTimeoutMs: number = DEFAULT_AUTO_LOCK_TIMEOUT) {
    this.state = {
      isUnlocked: false,
      unlockedAt: null,
      lastActivity: Date.now(),
      autoLockTimeoutMs,
    };
  }

  /**
   * Unlock the session with a master key
   */
  unlock(masterKey: Uint8Array): void {
    // Store master key in RAM
    this.masterKey = new Uint8Array(masterKey);

    this.state = {
      ...this.state,
      isUnlocked: true,
      unlockedAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.emit('unlock');
    this.startIdleTracking();
  }

  /**
   * Lock the session, wiping the master key from RAM
   */
  lock(): void {
    // Securely wipe the master key from RAM
    if (this.masterKey) {
      this.masterKey.fill(0);
      this.masterKey = null;
    }

    this.state = {
      ...this.state,
      isUnlocked: false,
      unlockedAt: null,
    };

    this.stopIdleTracking();
    this.emit('lock');
  }

  /**
   * Check if session is unlocked
   */
  isUnlocked(): boolean {
    return this.state.isUnlocked && this.masterKey !== null;
  }

  /**
   * Get the master key (only if unlocked)
   */
  getMasterKey(): Uint8Array | null {
    if (!this.isUnlocked()) {
      return null;
    }
    // Return a copy to prevent external modification
    return this.masterKey ? new Uint8Array(this.masterKey) : null;
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Update auto-lock timeout
   */
  setAutoLockTimeout(timeoutMs: number): void {
    this.state = {
      ...this.state,
      autoLockTimeoutMs: timeoutMs,
    };

    // Restart idle tracking with new timeout
    if (this.state.isUnlocked) {
      this.resetIdleTimer();
    }
  }

  /**
   * Record user activity (resets idle timer)
   */
  recordActivity(): void {
    if (!this.state.isUnlocked) return;

    this.state = {
      ...this.state,
      lastActivity: Date.now(),
    };

    this.resetIdleTimer();
    this.emit('activity');
  }

  /**
   * Start tracking idle time
   */
  private startIdleTracking(): void {
    if (typeof window === 'undefined') return;

    // Setup activity listeners
    this.activityHandler = () => this.recordActivity();

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
    ];
    const handler = this.activityHandler;
    events.forEach((event) => {
      window.addEventListener(event, handler, { passive: true });
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, could lock immediately or reduce timeout
      } else {
        // Page is visible again
        this.recordActivity();
      }
    });

    // Start idle timer
    this.resetIdleTimer();
  }

  /**
   * Stop idle tracking
   */
  private stopIdleTracking(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (typeof window !== 'undefined' && this.activityHandler) {
      const events = [
        'mousedown',
        'mousemove',
        'keydown',
        'scroll',
        'touchstart',
      ];
      const handler = this.activityHandler;
      events.forEach((event) => {
        window.removeEventListener(event, handler);
      });
      this.activityHandler = null;
    }
  }

  /**
   * Reset the idle timer
   */
  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.emit('timeout');
      this.lock();
    }, this.state.autoLockTimeoutMs);
  }

  /**
   * Subscribe to session events
   */
  subscribe(callback: (event: SessionEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Emit a session event
   */
  private emit(type: SessionEventType): void {
    const event: SessionEvent = {
      type,
      timestamp: Date.now(),
    };

    this.listeners.forEach((callback) => callback(event));
  }

  /**
   * Get time until auto-lock
   */
  getTimeUntilLock(): number {
    if (!this.state.isUnlocked) return 0;

    const elapsed = Date.now() - this.state.lastActivity;
    return Math.max(0, this.state.autoLockTimeoutMs - elapsed);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.lock();
    this.listeners.clear();
  }
}

/**
 * Create a singleton session manager
 */
let sessionInstance: SessionManager | null = null;

export function getSessionManager(autoLockTimeoutMs?: number): SessionManager {
  if (!sessionInstance) {
    sessionInstance = new SessionManager(autoLockTimeoutMs);
  }
  return sessionInstance;
}

/**
 * Reset the session manager (for testing)
 */
export function resetSessionManager(): void {
  if (sessionInstance) {
    sessionInstance.destroy();
    sessionInstance = null;
  }
}
