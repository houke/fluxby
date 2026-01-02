import { describe, it, expect } from 'vitest';
import { generatePairingCode } from '@fluxby/core';

describe('generatePairingCode', () => {
  it('generates a 6-character code', () => {
    const code = generatePairingCode();
    expect(code).toHaveLength(6);
  });

  it('contains only allowed characters (no ambiguous chars)', () => {
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (let i = 0; i < 100; i++) {
      const code = generatePairingCode();
      for (const char of code) {
        expect(allowedChars).toContain(char);
      }
    }
  });

  it('excludes ambiguous characters (0, O, 1, I)', () => {
    // Note: L is included as it's less ambiguous than I
    const ambiguousChars = ['0', 'O', '1', 'I'];

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

    // With 34 possible characters and 6 positions, collisions are unlikely
    // but not impossible. We expect most codes to be unique.
    expect(codes.size).toBeGreaterThan(90);
  });

  it('generates uppercase characters', () => {
    const code = generatePairingCode();
    expect(code).toBe(code.toUpperCase());
  });
});
