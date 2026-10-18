/** @vitest-environment jsdom */
import React from 'react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/lib/i18n/en';
import { nl } from '@/lib/i18n/nl';

const settings = vi.hoisted(() => ({
  values: new Map<string, unknown>(),
  write: vi.fn(),
}));

vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => true,
  readFromOPFSSync: (key: string) => settings.values.get(key) ?? null,
  writeToOPFSWithCache: async (key: string, value: unknown) => {
    settings.values.set(key, value);
    settings.write(key, value);
  },
}));

// resetModules gives each test an empty translation cache, like a fresh page.
async function freshI18n() {
  vi.resetModules();
  return import('@/lib/i18n');
}

beforeEach(() => {
  settings.values.clear();
  settings.write.mockClear();
  window.localStorage.clear();
});
afterEach(cleanup);

describe('per-language translation loading', () => {
  it('loads a language once and shares the cached result', async () => {
    const i18n = await freshI18n();
    expect(i18n.getLoadedTranslations('en')).toBeUndefined();

    const [first, second] = await Promise.all([
      i18n.loadTranslations('en'),
      i18n.loadTranslations('en'),
    ]);

    expect(first).toEqual(en);
    expect(second).toBe(first);
    expect(i18n.getLoadedTranslations('en')).toBe(first);
    expect(i18n.getLoadedTranslations('nl')).toBeUndefined();
  });

  it('returns the stored language once it is loaded and refuses before any load', async () => {
    const i18n = await freshI18n();
    expect(() => i18n.getTranslations()).toThrow(/not loaded/);

    settings.values.set(i18n.LANGUAGE_STORAGE_KEY, 'en');
    await i18n.loadTranslations('nl');
    // English is stored but not loaded yet: keep showing what is available.
    expect(i18n.getTranslations().common.close).toBe(nl.common.close);

    await i18n.loadTranslations('en');
    expect(i18n.getTranslations().common.close).toBe(en.common.close);
  });

  it('remembers the chosen language as a startup hint next to OPFS', async () => {
    const i18n = await freshI18n();
    expect(i18n.getLanguageHint()).toBe('nl');

    i18n.setStoredLanguage('en');

    expect(settings.write).toHaveBeenCalledWith(
      i18n.LANGUAGE_STORAGE_KEY,
      'en'
    );
    expect(i18n.getLanguageHint()).toBe('en');
  });
});

describe('LanguageProvider language switching', () => {
  async function renderProvider() {
    const i18n = await freshI18n();
    await i18n.loadTranslations('nl');
    const { LanguageProvider, useLanguage } =
      await import('@/contexts/LanguageContext');
    let context!: ReturnType<typeof useLanguage>;
    function Probe() {
      context = useLanguage();
      return <p data-testid='close'>{context.t.common.close}</p>;
    }
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    return { i18n, getContext: () => context };
  }

  it('waits for the new language to load before switching and storing it', async () => {
    const { i18n, getContext } = await renderProvider();
    expect(screen.getByTestId('close').textContent).toBe(nl.common.close);
    expect(i18n.getLoadedTranslations('en')).toBeUndefined();

    let switching!: Promise<void>;
    act(() => {
      switching = getContext().setLanguage('en');
    });
    // Nothing changes until the English chunk has arrived.
    expect(getContext().language).toBe('nl');
    expect(settings.write).not.toHaveBeenCalled();

    await act(() => switching);

    expect(getContext().language).toBe('en');
    expect(screen.getByTestId('close').textContent).toBe(en.common.close);
    expect(document.documentElement.lang).toBe('en');
    expect(settings.values.get(i18n.LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(i18n.getTranslations()).toBe(i18n.getLoadedTranslations('en'));
  });

  it('applies only the latest choice when switches overlap', async () => {
    const { getContext } = await renderProvider();

    let toEnglish!: Promise<void>;
    let backToDutch!: Promise<void>;
    act(() => {
      toEnglish = getContext().setLanguage('en');
      backToDutch = getContext().setLanguage('nl');
    });
    await act(() => Promise.all([toEnglish, backToDutch]));

    expect(getContext().language).toBe('nl');
    expect(screen.getByTestId('close').textContent).toBe(nl.common.close);
  });
});

describe('startup bundle', () => {
  const webSrc = resolve(__dirname, '../../apps/web/src');
  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx)$/.test(name) ? [path] : [];
    });

  it('never imports a full language file statically', () => {
    const staticLanguageImport =
      /import\s+(?!type\b)[^;]*?from\s+['"][^'"]*i18n\/(nl|en)['"]|import\s+(?!type\b)[^;]*?from\s+['"]\.\/(nl|en)['"]/;
    const offenders = sourceFiles(webSrc).filter((file) =>
      staticLanguageImport.test(readFileSync(file, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});
