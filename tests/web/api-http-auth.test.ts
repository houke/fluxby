/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setApiAuthToken } from '@/lib/api-http';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  write: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: (key: string) =>
    key === 'fluxby.activeProfileId' ? '1' : '',
  writeToOPFSWithCache: mocks.write,
  deleteFromOPFSWithCache: mocks.remove,
}));
vi.mock('@/lib/i18n', () => ({
  getStoredLanguage: () => 'en',
  getTranslations: () => ({ common: { requestFailed: 'Request failed' } }),
}));

describe('optional HTTP client session authentication', () => {
  const token = 'integration-token-'.repeat(3);
  beforeEach(() => {
    vi.clearAllMocks();
    setApiAuthToken(null);
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
  });
  afterEach(() => {
    setApiAuthToken(null);
    vi.unstubAllGlobals();
  });

  it('continues token-free loopback requests when no session token is configured', async () => {
    await api.getAccounts();
    expect(mocks.fetch).toHaveBeenCalledWith('/api/accounts', {
      headers: {
        'Content-Type': 'application/json',
        'X-Profile-ID': '1',
        'X-Language': 'en',
      },
    });
  });
  it('adds bearer authentication to both normal and explicitly scoped requests without storing credentials', async () => {
    setApiAuthToken(` ${token} `);
    await api.getAccounts();
    await api.createAccountForProfile(9, {
      iban: 'NL00DEMO9999999999',
      name: 'Account',
      type: 'checking',
    });
    expect(mocks.fetch.mock.calls[0][1].headers).toMatchObject({
      Authorization: `Bearer ${token}`,
      'X-Profile-ID': '1',
    });
    expect(mocks.fetch.mock.calls[1][1].headers).toMatchObject({
      Authorization: `Bearer ${token}`,
      'X-Profile-ID': '9',
    });
    expect(mocks.write).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();

    setApiAuthToken(null);
    await api.getAccounts();
    expect(mocks.fetch.mock.calls[2][1].headers).not.toHaveProperty(
      'Authorization'
    );
  });
  it('rejects short or malformed values before replacing valid credentials', async () => {
    setApiAuthToken(token);
    for (const invalid of [
      'short',
      `${token}\r\nInjected: value`,
      `${token} value`,
    ])
      expect(() => setApiAuthToken(invalid)).toThrow('API_AUTH_TOKEN');
    await api.getAccounts();
    expect(mocks.fetch.mock.calls[0][1].headers.Authorization).toBe(
      `Bearer ${token}`
    );
  });
});
