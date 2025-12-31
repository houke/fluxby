/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/database-reset', () => ({
  resetAppAndRestartOnboarding: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@fluxby/shared', () => ({
  FluxbyWebGL: () => <div data-testid='fluxby-webgl' />,
}));

import { LockScreen } from '@/components/LockScreen';
import * as lang from '@/contexts/LanguageContext';
import * as enc from '@/contexts/EncryptionContext';
import { resetAppAndRestartOnboarding } from '@/lib/database-reset';

describe('LockScreen forgot-password flow', () => {
  beforeEach(() => {
    vi.spyOn(lang, 'useLanguage').mockReturnValue({
      t: {
        common: { cancel: 'Cancel' },
        errors: { resetDatabase: 'Reset database' },
        security: {
          unlockTitle: 'Unlock Fluxby',
          unlockDescription: 'Enter your master password to access your data.',
          enterPassword: 'Enter password',
          unlock: 'Unlock',
          wrongPassword: 'Incorrect password',
          unlockError: 'Failed to unlock',
          forgotPassword: 'Forgot password?',
          forgotPasswordDialogTitle: 'Reset local data?',
          forgotPasswordDialogDescription:
            'Fluxby cannot recover your master password. Resetting will delete your local database and restart onboarding.',
          forgotPasswordDialogWarning: 'This action cannot be undone.',
          resetDatabase: 'Reset database',
        },
      },
      language: 'en',
      setLanguage: vi.fn(),
    } as any);

    vi.spyOn(enc, 'useEncryption').mockReturnValue({
      isEncryptionEnabled: true,
      isUnlocked: false,
      masterKey: null,
      setupEncryption: vi.fn(),
      unlock: vi.fn().mockResolvedValue(false),
      lock: vi.fn(),
      changePassword: vi.fn(),
      verifyPassword: vi.fn(),
      disableEncryption: vi.fn(),
    } as any);
  });

  it('does not show biometric unlock option', () => {
    render(<LockScreen />);
    expect(screen.queryByText(/use biometric/i)).toBeNull();
  });

  it('shows forgot-password dialog and triggers reset on confirm', async () => {
    render(<LockScreen />);

    const forgotButton = screen.getByRole('button', {
      name: 'Forgot password?',
    });
    fireEvent.click(forgotButton);

    const dialogTitle = await screen.findByText('Reset local data?');
    expect(dialogTitle).toBeTruthy();

    const resetButton = screen.getByRole('button', { name: 'Reset database' });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(resetAppAndRestartOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  it('adds a visible border class to the password input', () => {
    render(<LockScreen />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input.className).toContain('border-input');
  });
});
