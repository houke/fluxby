import { afterEach, describe, expect, it, vi } from 'vitest';
import { api as httpApi } from '../../apps/web/src/lib/api-http';
import { api as localApi } from '../../apps/web/src/lib/api-compat';
import * as i18n from '../../apps/web/src/lib/i18n';

const createDemoData = vi.hoisted(() => vi.fn());
vi.mock('../../apps/web/src/lib/db-singleton', () => ({
  getDataService: () => ({ createDemoData }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  createDemoData.mockClear();
});

describe('demo seed API language propagation', () => {
  it('passes the current language through local demo creation when omitted', async () => {
    const language = vi.spyOn(i18n, 'getStoredLanguage').mockReturnValue('en');
    await localApi.seedDemoData('profile');
    expect(createDemoData).toHaveBeenLastCalledWith('profile', 'en');
    language.mockReturnValue('nl');
    await localApi.seedDemoData('profile');
    expect(createDemoData).toHaveBeenLastCalledWith('profile', 'nl');
    await localApi.seedDemoData('profile', 'en');
    expect(createDemoData).toHaveBeenLastCalledWith('profile', 'en');
  });

  it('sends the current or explicitly selected language to the developer API', async () => {
    vi.spyOn(i18n, 'getStoredLanguage').mockReturnValue('en');
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });
    vi.stubGlobal('fetch', fetch);
    await httpApi.seedDemoData(2);
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/profiles/2/seed-demo',
      expect.objectContaining({
        body: JSON.stringify({ language: 'en' }),
        headers: expect.objectContaining({ 'X-Language': 'en' }),
      })
    );
    await httpApi.seedDemoData(2, 'nl');
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/profiles/2/seed-demo',
      expect.objectContaining({
        body: JSON.stringify({ language: 'nl' }),
      })
    );
  });
});
