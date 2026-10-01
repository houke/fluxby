/** @vitest-environment jsdom */
import React, { StrictMode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/lib/i18n/en';

const mocks = vi.hoisted(() => ({
  isStaleCode: vi.fn(),
  hasNewMigrations: vi.fn(),
  updateCodeVersionInStorage: vi.fn(),
}));

vi.mock('@fluxby/database', () => mocks);
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: en }),
}));

import { MigrationGate } from '@/components/MigrationGate';

function renderGate() {
  return render(
    <StrictMode>
      <MigrationGate>
        <div>Database initialization reached</div>
      </MigrationGate>
    </StrictMode>
  );
}

describe('migration update handoff', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React);
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.isStaleCode.mockReturnValue(false);
    mocks.hasNewMigrations.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('starts database initialization when no update is needed', () => {
    renderGate();

    expect(screen.getByText('Database initialization reached')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: en.migrations.applyUpdate })
    ).toBeNull();
  });

  it('waits for approval before initializing a database with pending migrations', () => {
    mocks.hasNewMigrations.mockReturnValue(true);
    renderGate();

    expect(screen.queryByText('Database initialization reached')).toBeNull();
    expect(
      screen.getByRole('button', { name: en.migrations.applyUpdate })
    ).toBeTruthy();
  });

  it('reaches database initialization after an approved update reload in StrictMode', () => {
    mocks.hasNewMigrations.mockReturnValue(true);
    const beforeReload = renderGate();
    expect(
      screen.getByRole('button', { name: en.migrations.applyUpdate })
    ).toBeTruthy();

    // Apply update saves this handoff marker before reloading the page.
    sessionStorage.setItem('fluxby-migration-triggered', 'true');
    beforeReload.unmount();
    renderGate();

    expect(screen.getByText('Database initialization reached')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: en.migrations.applyUpdate })
    ).toBeNull();
    expect(sessionStorage.getItem('fluxby-migration-triggered')).toBeNull();
  });

  it('consumes approval so a later fresh mount still checks for pending migrations', () => {
    mocks.hasNewMigrations.mockReturnValue(true);
    sessionStorage.setItem('fluxby-migration-triggered', 'true');
    const approved = renderGate();
    expect(screen.getByText('Database initialization reached')).toBeTruthy();

    approved.unmount();
    renderGate();

    expect(screen.queryByText('Database initialization reached')).toBeNull();
    expect(
      screen.getByRole('button', { name: en.migrations.applyUpdate })
    ).toBeTruthy();
  });
});
