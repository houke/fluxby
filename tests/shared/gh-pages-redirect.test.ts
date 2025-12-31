import { describe, expect, it } from 'vitest';
import { consumeSessionRedirect, getRedirectToRestore } from '@fluxby/shared';

function createStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    removeItem: (key: string) => {
      data.delete(key);
    },
    _dump: () => Object.fromEntries(data.entries()),
  };
}

describe('gh-pages redirect helpers', () => {
  it('consumeSessionRedirect returns null when missing', () => {
    const storage = createStorage();
    expect(consumeSessionRedirect(storage)).toBeNull();
  });

  it('consumeSessionRedirect returns and removes value', () => {
    const storage = createStorage({
      __fluxby_redirect__: '/repo/app/transactions',
    });
    expect(consumeSessionRedirect(storage)).toBe('/repo/app/transactions');
    expect(storage._dump()).toEqual({});
  });

  it('getRedirectToRestore only allows matching prefix', () => {
    expect(getRedirectToRestore('/repo/app/transactions', '/repo/app/')).toBe(
      '/repo/app/transactions'
    );
    expect(getRedirectToRestore('/repo/docs', '/repo/app/')).toBeNull();
  });
});
