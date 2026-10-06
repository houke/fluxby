// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '../../apps/landing/src/lib/i18n/en';
import { nl } from '../../apps/landing/src/lib/i18n/nl';
import DocsOpenAPI from '../../apps/landing/src/pages/docs/DocsOpenAPI';

const context = vi.hoisted(() => ({ language: 'en' }));
vi.mock('../../apps/landing/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: context.language,
    t: context.language === 'nl' ? nl : en,
  }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('OpenAPI schema at the deployed base path', () => {
  it.each([
    { base: '/', language: 'en' },
    { base: '/repository/', language: 'en' },
    { base: '/', language: 'nl' },
    { base: '/repository/', language: 'nl' },
  ])(
    'loads the precached schema for $base $language',
    async ({ base, language }) => {
      context.language = language;
      vi.stubGlobal('React', React);
      vi.stubEnv('BASE_URL', base);
      const fetchSchema = vi.fn().mockResolvedValue({
        json: async () => ({
          openapi: '3.0.0',
          info: { title: 'Fluxby API', version: '1.0.0' },
          paths: {},
        }),
      });
      vi.stubGlobal('fetch', fetchSchema);
      render(<DocsOpenAPI />);
      const translation = language === 'nl' ? nl : en;
      const download = screen.getByRole('button', {
        name: translation.docs.openapi.download,
      });
      await waitFor(() =>
        expect(download.hasAttribute('disabled')).toBe(false)
      );
      expect(fetchSchema).toHaveBeenCalledWith(`${base}openapi.json`);
    }
  );
});
