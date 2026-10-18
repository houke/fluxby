// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '@fluxby/database';
import { en } from '@/lib/i18n/en';

const testDom = (
  globalThis as typeof globalThis & {
    jsdom: { reconfigure(options: { url: string }): void };
  }
).jsdom;

const mocks = vi.hoisted(() => ({
  encryption: {
    isEncryptionEnabled: false,
    isUnlocked: true,
    encryptionKey: null as Uint8Array | null,
    isHydrated: true,
  },
  existing: null as Database | null,
  createDatabase: vi.fn(),
  closeAndResetForReinit: vi.fn(),
  setGlobalDatabase: vi.fn(),
  createDataService: vi.fn(() => ({})),
}));

vi.mock('@fluxby/database', () => ({
  createDatabase: mocks.createDatabase,
  getDatabaseInstance: () => mocks.existing,
  closeAndResetForReinit: mocks.closeAndResetForReinit,
  resetDatabase: vi.fn(),
  isSettingsCacheInitialized: () => false,
  readFromOPFSSync: () => null,
}));
vi.mock('@/contexts/EncryptionContext', () => ({
  useEncryption: () => mocks.encryption,
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en }),
}));
vi.mock('@/lib/data-service', () => ({
  createDataService: mocks.createDataService,
}));
vi.mock('@/lib/db-singleton', () => ({
  setGlobalDatabase: mocks.setGlobalDatabase,
}));
vi.mock('@/lib/database-reset', () => ({
  resetAppAndRestartOnboarding: vi.fn(),
}));
vi.mock('@/lib/debug', () => ({ debugLog: vi.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  testDom.reconfigure({ url: 'https://fluxby.local:5177/app/' });
  vi.resetModules();
  vi.resetAllMocks();
  mocks.createDataService.mockReturnValue({});
  mocks.existing = null;
  mocks.encryption = {
    isEncryptionEnabled: false,
    isUnlocked: true,
    encryptionKey: null,
    isHydrated: true,
  };
  vi.stubGlobal(
    'navigator',
    new Proxy(navigator, {
      has(target, property) {
        return property === 'storage' || Reflect.has(target, property);
      },
      get(target, property) {
        return property === 'storage'
          ? { getDirectory: vi.fn() }
          : Reflect.get(target, property);
      },
    })
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  testDom.reconfigure({ url: 'http://localhost:3000/' });
});

async function showProvider(strict = false) {
  // resetModules() discards the translations preloaded by tests/setup.ts.
  const { loadTranslations } = await import('@/lib/i18n/loader');
  await loadTranslations('en');
  const { DatabaseProvider, useDatabase } =
    await import('@/contexts/DatabaseContext');
  function State() {
    const { isReady } = useDatabase();
    return <output data-testid='database-state'>{String(isReady)}</output>;
  }
  const view = () => {
    const content = (
      <DatabaseProvider>
        <State />
      </DatabaseProvider>
    );
    return strict ? <React.StrictMode>{content}</React.StrictMode> : content;
  };
  return { ...render(view()), view };
}

describe('database initialization effect ownership', () => {
  it('completes the active StrictMode initialization and releases both effect timeouts', async () => {
    vi.useFakeTimers();
    const pending = deferred<Database>();
    mocks.createDatabase.mockReturnValue(pending.promise);
    await showProvider(true);
    expect(mocks.createDatabase).toHaveBeenCalledTimes(2);
    const database = {} as Database;
    await act(async () => pending.resolve(database));
    expect(screen.getByTestId('database-state').textContent).toBe('true');
    expect(mocks.setGlobalDatabase).toHaveBeenLastCalledWith(database);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not install an obsolete unencrypted initialization after the app starts waiting for unlock', async () => {
    const pending = deferred<Database>();
    mocks.createDatabase.mockReturnValue(pending.promise);
    const provider = await showProvider();
    expect(mocks.createDatabase).toHaveBeenCalledTimes(1);

    mocks.encryption = {
      ...mocks.encryption,
      isEncryptionEnabled: true,
      isUnlocked: false,
    };
    provider.rerender(provider.view());
    expect(screen.getByTestId('database-state').textContent).toBe('false');

    await act(async () => pending.resolve({} as Database));
    expect(mocks.setGlobalDatabase).not.toHaveBeenCalled();
    expect(screen.getByTestId('database-state').textContent).toBe('false');
  });

  it('ignores an obsolete rejection instead of poisoning the current unlock state and later initialization', async () => {
    const obsolete = deferred<Database>();
    const current = deferred<Database>();
    mocks.createDatabase
      .mockReturnValueOnce(obsolete.promise)
      .mockReturnValueOnce(current.promise);
    const provider = await showProvider();
    mocks.encryption = {
      ...mocks.encryption,
      isEncryptionEnabled: true,
      isUnlocked: false,
    };
    provider.rerender(provider.view());

    await act(async () => obsolete.reject(new Error('Obsolete init failed')));
    expect(screen.getByTestId('database-state').textContent).toBe('false');

    mocks.encryption = {
      ...mocks.encryption,
      isUnlocked: true,
      encryptionKey: new Uint8Array(32),
    };
    provider.rerender(provider.view());
    expect(mocks.createDatabase).toHaveBeenCalledTimes(2);
    const database = {} as Database;
    await act(async () => current.resolve(database));
    expect(screen.getByTestId('database-state').textContent).toBe('true');
    expect(mocks.setGlobalDatabase).toHaveBeenLastCalledWith(database);
  });

  it('waits for the same encrypted reopen after effect changes and never reinstalls its closing connection', async () => {
    expect(window.location.hostname).toBe('fluxby.local');
    expect('getDirectory' in navigator.storage).toBe(true);
    const original = {} as Database;
    const encrypted = {} as Database;
    const closing = deferred<void>();
    const reopening = deferred<Database>();
    mocks.createDatabase
      .mockImplementationOnce(async () => {
        mocks.existing = original;
        return original;
      })
      .mockImplementationOnce(() =>
        reopening.promise.then((database) => {
          mocks.existing = database;
          return database;
        })
      );
    mocks.closeAndResetForReinit.mockImplementation(() =>
      closing.promise.then(() => {
        mocks.existing = null;
      })
    );
    const provider = await showProvider();
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('database-state').textContent).toBe('true');
    mocks.setGlobalDatabase.mockClear();

    mocks.encryption = {
      ...mocks.encryption,
      isEncryptionEnabled: true,
      encryptionKey: new Uint8Array(32),
    };
    provider.rerender(provider.view());
    expect(mocks.closeAndResetForReinit).toHaveBeenCalledTimes(1);
    mocks.encryption = { ...mocks.encryption, isUnlocked: false };
    provider.rerender(provider.view());
    mocks.encryption = { ...mocks.encryption, isUnlocked: true };
    provider.rerender(provider.view());
    expect(mocks.setGlobalDatabase).not.toHaveBeenCalled();
    expect(screen.queryByTestId('database-state')).toBeNull();

    await act(async () => closing.resolve());
    expect(mocks.createDatabase).toHaveBeenCalledTimes(2);
    await act(async () => reopening.resolve(encrypted));
    expect(screen.getByTestId('database-state').textContent).toBe('true');
    expect(mocks.setGlobalDatabase).toHaveBeenLastCalledWith(encrypted);
    expect(mocks.closeAndResetForReinit).toHaveBeenCalledTimes(1);
  });

  it('does not retain an initialization failure after its provider unmounts', async () => {
    const obsolete = deferred<Database>();
    const current = deferred<Database>();
    mocks.createDatabase
      .mockReturnValueOnce(obsolete.promise)
      .mockReturnValueOnce(current.promise);
    const oldProvider = await showProvider();
    oldProvider.unmount();
    await act(async () => obsolete.reject(new Error('Unmounted init failed')));

    await showProvider();
    expect(mocks.createDatabase).toHaveBeenCalledTimes(2);
    const database = {} as Database;
    await act(async () => current.resolve(database));
    expect(screen.getByTestId('database-state').textContent).toBe('true');
    expect(mocks.setGlobalDatabase).toHaveBeenLastCalledWith(database);
  });
});
