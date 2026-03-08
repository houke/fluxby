import { describe, it, expect } from 'vitest';
import {
  generatePairingCode,
  getDefaultStunServers,
  getDefaultTurnServers,
  getIceServers,
} from '@fluxby/core';

describe('generatePairingCode', () => {
  it('generates a 6-character code', () => {
    const code = generatePairingCode();
    expect(code).toHaveLength(6);
  });

  it('contains only allowed characters (no ambiguous chars)', () => {
    const allowedChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    for (let i = 0; i < 100; i++) {
      const code = generatePairingCode();
      for (const char of code) {
        expect(allowedChars).toContain(char);
      }
    }
  });

  it('excludes ambiguous characters (0, O, 1, I, L)', () => {
    const ambiguousChars = ['0', 'O', '1', 'I', 'L'];

    for (let i = 0; i < 100; i++) {
      const code = generatePairingCode();
      for (const char of ambiguousChars) {
        expect(code).not.toContain(char);
      }
    }
  });

  it('generates different codes on each call', () => {
    const codes = new Set<string>();

    for (let i = 0; i < 100; i++) {
      codes.add(generatePairingCode());
    }

    // With 33 possible characters and 6 positions, collisions are unlikely
    // but not impossible. We expect most codes to be unique.
    expect(codes.size).toBeGreaterThan(90);
  });

  it('generates uppercase characters', () => {
    const code = generatePairingCode();
    expect(code).toBe(code.toUpperCase());
  });
});

describe('ICE Server Configuration', () => {
  describe('getDefaultStunServers', () => {
    it('returns an array of STUN servers', () => {
      const servers = getDefaultStunServers();
      expect(servers).toBeInstanceOf(Array);
      expect(servers.length).toBeGreaterThan(0);
    });

    it('all servers have stun: prefix', () => {
      const servers = getDefaultStunServers();
      for (const server of servers) {
        expect(server.urls).toMatch(/^stun:/);
      }
    });

    it('includes Google STUN servers', () => {
      const servers = getDefaultStunServers();
      const googleServers = servers.filter((s) =>
        String(s.urls).includes('google.com')
      );
      expect(googleServers.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultTurnServers', () => {
    it('returns an array of TURN servers', () => {
      const servers = getDefaultTurnServers();
      expect(servers).toBeInstanceOf(Array);
      expect(servers.length).toBeGreaterThan(0);
    });

    it('all servers have turn: prefix', () => {
      const servers = getDefaultTurnServers();
      for (const server of servers) {
        expect(server.urls).toMatch(/^turn:/);
      }
    });

    it('all servers have username and credential', () => {
      const servers = getDefaultTurnServers();
      for (const server of servers) {
        expect(server.username).toBeDefined();
        expect(server.credential).toBeDefined();
      }
    });
  });

  describe('getIceServers', () => {
    it('combines STUN and TURN servers', () => {
      const servers = getIceServers();
      const stunCount = servers.filter((s) =>
        String(s.urls).startsWith('stun:')
      ).length;
      const turnCount = servers.filter((s) =>
        String(s.urls).startsWith('turn:')
      ).length;

      expect(stunCount).toBeGreaterThan(0);
      expect(turnCount).toBeGreaterThan(0);
      expect(servers.length).toBe(stunCount + turnCount);
    });
  });
});
