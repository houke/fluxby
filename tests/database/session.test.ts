/**
 * Tests for session management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionManager,
  resetSessionManager,
} from '../../packages/database/src/session.js';
import { generateMasterKey } from '../../packages/database/src/encryption.js';

describe('SessionManager', () => {
  let session: SessionManager;
  let masterKey: Uint8Array;

  beforeEach(() => {
    resetSessionManager();
    session = new SessionManager(1000); // 1 second timeout for tests
    masterKey = generateMasterKey();
  });

  afterEach(() => {
    session.destroy();
  });

  describe('unlock/lock', () => {
    it('should start locked', () => {
      expect(session.isUnlocked()).toBe(false);
      expect(session.getMasterKey()).toBeNull();
    });

    it('should unlock with master key', () => {
      session.unlock(masterKey);

      expect(session.isUnlocked()).toBe(true);
      expect(session.getMasterKey()).toEqual(masterKey);
    });

    it('should lock and wipe master key', () => {
      session.unlock(masterKey);
      session.lock();

      expect(session.isUnlocked()).toBe(false);
      expect(session.getMasterKey()).toBeNull();
    });

    it('should return a copy of master key', () => {
      session.unlock(masterKey);

      const key1 = session.getMasterKey();
      const key2 = session.getMasterKey();

      // Should be equal values
      expect(key1).toEqual(key2);
      expect(key1).toEqual(masterKey);

      // But not the same reference
      expect(key1).not.toBe(key2);
    });
  });

  describe('state', () => {
    it('should track state correctly', () => {
      const state1 = session.getState();
      expect(state1.isUnlocked).toBe(false);
      expect(state1.unlockedAt).toBeNull();

      session.unlock(masterKey);

      const state2 = session.getState();
      expect(state2.isUnlocked).toBe(true);
      expect(state2.unlockedAt).toBeTypeOf('number');
    });

    it('should update last activity', () => {
      session.unlock(masterKey);
      const state1 = session.getState();

      // Record activity
      session.recordActivity();

      const state2 = session.getState();
      expect(state2.lastActivity).toBeGreaterThanOrEqual(state1.lastActivity);
    });
  });

  describe('events', () => {
    it('should emit unlock event', () => {
      const listener = vi.fn();
      session.subscribe(listener);

      session.unlock(masterKey);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'unlock' })
      );
    });

    it('should emit lock event', () => {
      const listener = vi.fn();
      session.subscribe(listener);

      session.unlock(masterKey);
      session.lock();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'lock' })
      );
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = session.subscribe(listener);

      unsubscribe();
      session.unlock(masterKey);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('auto-lock timeout', () => {
    it('should update timeout setting', () => {
      session.setAutoLockTimeout(5000);

      const state = session.getState();
      expect(state.autoLockTimeoutMs).toBe(5000);
    });

    it('should calculate time until lock', () => {
      session.unlock(masterKey);

      const timeUntilLock = session.getTimeUntilLock();
      expect(timeUntilLock).toBeGreaterThan(0);
      expect(timeUntilLock).toBeLessThanOrEqual(1000);
    });

    it('should return 0 when locked', () => {
      expect(session.getTimeUntilLock()).toBe(0);
    });
  });
});
