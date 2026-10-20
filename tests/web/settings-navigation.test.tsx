/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import Settings from '@/pages/Settings';
import { en } from '@/lib/i18n/en';
import { nl } from '@/lib/i18n/nl';
import { getSettingsSection, getSettingsLink } from '@/lib/settings-navigation';
const mocks = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: mocks.language === 'nl' ? nl : en }),
}));
vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => ({ activeProfile: { id: 'personal', name: 'Personal' } }),
}));
vi.mock('@/components/settings/AppSettings', () => ({
  AppSettings: ({ section }: { section: string }) => (
    <div data-testid={`app-${section}`} />
  ),
}));
vi.mock('@/components/settings/AccountSettings', () => ({
  AccountSettings: () => <div data-testid='accounts' />,
}));
vi.mock('@/components/settings/ProfileManager', () => ({
  ProfileManager: () => <div data-testid='profiles' />,
}));
vi.mock('@/components/settings/ProfileDataSettings', () => ({
  ProfileDataSettings: () => <div data-testid='profile-delete' />,
}));
vi.mock('@/components/settings/DataManagementSettings', () => ({
  DataManagementSettings: ({ section }: { section: string }) => (
    <div data-testid={`data-${section}`} />
  ),
}));
vi.mock('@/components/settings/SyncSettings', () => ({
  SyncSettings: () => <div data-testid='sync' />,
}));
vi.mock('@/components/settings/PaymentProcessorSettings', () => ({
  PaymentProcessorSettings: () => <div data-testid='provider-rules' />,
}));
vi.mock('@/components/settings/TypeSafeSettings', () => ({
  TypeSafeSettings: () => <div data-testid='ai' />,
}));
vi.mock('@/components/settings/WebMcpSettings', () => ({
  WebMcpSettings: () => <div data-testid='webmcp' />,
}));
vi.mock('@/components/settings/OnboardingSettings', () => ({
  OnboardingSettings: () => <div data-testid='tour' />,
}));
function History() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid='location'>
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => navigate(-1)}>History back</button>
    </>
  );
}
function show(url = '/settings') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Settings />
      <History />
    </MemoryRouter>
  );
}
beforeEach(() => {
  mocks.language = 'en';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('settings overview and topic routing', () => {
  it.each(['en', 'nl'])(
    'shows six topic links and help in %s without mounting controls',
    (language) => {
      mocks.language = language;
      show();
      const copy = (language === 'nl' ? nl : en).settings.navigation;
      expect(screen.getAllByRole('link')).toHaveLength(7);
      for (const section of Object.values(copy.sections))
        expect(
          screen.getByRole('link', {
            name: new RegExp(
              section.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            ),
          })
        ).toBeTruthy();
      expect(screen.queryByTestId('accounts')).toBeNull();
      expect(screen.queryByTestId('app-general')).toBeNull();
      expect(screen.queryByTestId('sync')).toBeNull();
    }
  );
  it('opens a topic, scrolls to the top and supports browser back', () => {
    show();
    fireEvent.click(screen.getByRole('link', { name: /^General/ }));
    expect(screen.getByTestId('app-general')).toBeTruthy();
    expect(screen.queryByTestId('app-security')).toBeNull();
    expect(screen.getByTestId('location').textContent).toBe(
      '/settings?section=general'
    );
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(screen.getByRole('navigation', { name: 'Settings' })).toBeTruthy();
  });
  it('keeps accounts scoped to the active profile and provides profile management', () => {
    show('/settings?section=profiles');
    expect(screen.getByText('Current profile: Personal')).toBeTruthy();
    expect(screen.getByTestId('accounts')).toBeTruthy();
    expect(screen.queryByTestId('profile-delete')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Manage all profiles' }));
    expect(screen.getByTestId('profiles')).toBeTruthy();
    expect(screen.queryByTestId('accounts')).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Back to accounts' }));
    expect(screen.getByTestId('accounts')).toBeTruthy();
  });
  it('groups deletion under a closed disclosure and states the backup scope', () => {
    show('/settings?section=data');
    expect(screen.getByText(en.settings.navigation.backupScope)).toBeTruthy();
    expect(screen.getByTestId('data-backup')).toBeTruthy();
    const disclosure = screen.getByText('Delete data').closest('details');
    expect(disclosure?.open).toBe(false);
    expect(
      disclosure?.querySelector('[data-testid="profile-delete"]')
    ).toBeTruthy();
    expect(
      disclosure?.querySelector('[data-testid="data-reset"]')
    ).toBeTruthy();
  });
  it.each([
    ['security', 'app-security'],
    ['sync', 'sync'],
    ['automation', 'provider-rules'],
    ['about', 'app-about'],
  ])('opens the %s destination directly', (section, control) => {
    show(`/settings?section=${section}`);
    expect(screen.getByTestId(control)).toBeTruthy();
    expect(screen.queryByTestId('app-general')).toBeNull();
    if (section === 'automation') {
      expect(screen.getByTestId('ai')).toBeTruthy();
      expect(screen.getByTestId('webmcp')).toBeTruthy();
    }
    if (section === 'about') expect(screen.getByTestId('tour')).toBeTruthy();
  });
  it('preserves legacy profile-management bookmarks', () => {
    show('/settings?tab=manage-profiles');
    expect(screen.getByTestId('profiles')).toBeTruthy();
  });
  it('falls back to the overview for an unknown section', () => {
    show('/settings?section=unknown');
    expect(screen.getByRole('navigation', { name: 'Settings' })).toBeTruthy();
  });
  it('resolves old links and lets explicit new sections take precedence', () => {
    expect(getSettingsSection(new URLSearchParams('tab=active-profile'))).toBe(
      'profiles'
    );
    expect(getSettingsSection(new URLSearchParams('tab=app-settings'))).toBe(
      'general'
    );
    expect(
      getSettingsSection(new URLSearchParams('tab=app-settings&section=data'))
    ).toBe('data');
    expect(getSettingsLink('profiles', true)).toBe(
      '/settings?section=profiles&view=manage'
    );
  });
});
