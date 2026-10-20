/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppSettings } from '@/components/settings/AppSettings';
import { en } from '@/lib/i18n/en';
const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  password: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: en,
    language: 'en',
    setLanguage: vi.fn(),
    languages: [],
  }),
}));
vi.mock('@/contexts/EncryptionContext', () => ({
  useEncryption: () => ({ changePassword: mocks.password }),
}));
vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));
vi.mock('@/lib/api', () => ({
  api: {
    getUser: async () => ({ id: 'user', name: 'Existing user' }),
    updateUser: mocks.update,
  },
}));
vi.mock('@fluxby/database', () => ({
  isSettingsCacheInitialized: () => false,
  getStoredDbVersion: () => 23,
  getLatestMigrationVersion: () => 23,
}));
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.update.mockResolvedValue({ id: 'user', name: 'New user' });
  mocks.password.mockResolvedValue(true);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});
async function show() {
  render(
    <QueryClientProvider client={client}>
      <AppSettings />
    </QueryClientProvider>
  );
  await screen.findByText('Existing user');
}
describe('app settings global feedback', () => {
  it.each(['general', 'security', 'about'] as const)(
    'shows only controls for the %s section',
    async (section) => {
      render(
        <QueryClientProvider client={client}>
          <AppSettings section={section} />
        </QueryClientProvider>
      );
      if (section === 'general') {
        await screen.findByText('Existing user');
        expect(
          screen.queryByRole('button', { name: 'Change password', exact: true })
        ).toBeNull();
        expect(screen.queryByText(en.settings.versions)).toBeNull();
      } else if (section === 'security') {
        expect(
          screen.getByRole('button', { name: 'Change password', exact: true })
        ).toBeTruthy();
        expect(screen.queryByText(en.settings.language)).toBeNull();
        expect(screen.queryByText(en.settings.versions)).toBeNull();
      } else {
        expect(
          screen.getByText(en.settings.versions, { selector: 'h3' })
        ).toBeTruthy();
        expect(screen.queryByText(en.settings.language)).toBeNull();
        expect(
          screen.queryByRole('button', { name: 'Change password', exact: true })
        ).toBeNull();
      }
    }
  );
  it('reports a successful user name update through the global toast', async () => {
    await show();
    fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }));
    fireEvent.change(screen.getByLabelText('Your name'), {
      target: { value: 'New user' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({ name: 'New user' })
    );
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith('Name saved')
    );
  });
  it('keeps the name editor open and gives localized feedback when saving fails', async () => {
    mocks.update.mockRejectedValueOnce(new Error('Network failure'));
    await show();
    fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }));
    fireEvent.change(screen.getByLabelText('Your name'), {
      target: { value: 'New user' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(en.settings.appNameSaveError)
    );
    expect(screen.getByLabelText('Your name')).toHaveProperty(
      'value',
      'New user'
    );
  });
  it('uses the same global toast after changing the master password', async () => {
    await show();
    fireEvent.click(
      screen.getByRole('button', { name: 'Change password', exact: true })
    );
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'oldpassword' },
    });
    fireEvent.change(screen.getByLabelText('New password', { exact: true }), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'newpassword' },
    });
    const dialog = screen.getByRole('dialog');
    const submit = [...dialog.querySelectorAll('button')].find(
      (button) => button.textContent === 'Change password'
    );
    expect(submit).toBeDefined();
    if (!submit) throw new Error('Missing password submit button');
    fireEvent.click(submit);
    await waitFor(() =>
      expect(mocks.password).toHaveBeenCalledWith('oldpassword', 'newpassword')
    );
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith(
        en.security.passwordChangedSuccess
      )
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
