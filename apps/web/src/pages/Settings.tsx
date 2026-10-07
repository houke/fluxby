import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  DatabaseBackup,
  HelpCircle,
  MonitorSmartphone,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  SETTINGS_SECTIONS,
  getSettingsLink,
  getSettingsSection,
} from '@/lib/settings-navigation';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppSettings } from '@/components/settings/AppSettings';
import { PaymentProcessorSettings } from '@/components/settings/PaymentProcessorSettings';
import { DataManagementSettings } from '@/components/settings/DataManagementSettings';
import { ProfileManager } from '@/components/settings/ProfileManager';
import { OnboardingSettings } from '@/components/settings/OnboardingSettings';
import { ProfileDataSettings } from '@/components/settings/ProfileDataSettings';
import { SyncSettings } from '@/components/settings/SyncSettings';
import { TypeSafeSettings } from '@/components/settings/TypeSafeSettings';
import { WebMcpSettings } from '@/components/settings/WebMcpSettings';

const SECTION_ICONS = {
  general: SlidersHorizontal,
  profiles: Wallet,
  security: ShieldCheck,
  data: DatabaseBackup,
  sync: MonitorSmartphone,
  automation: Sparkles,
  about: HelpCircle,
};

export default function Settings() {
  const { t } = useLanguage();
  const { activeProfile } = useProfile();
  const [searchParams] = useSearchParams();
  const section = getSettingsSection(searchParams);
  const copy = t.settings.navigation;
  const topic = section ? copy.sections[section] : null;
  const manageProfiles =
    searchParams.get('view') === 'manage' ||
    searchParams.get('tab') === 'manage-profiles';
  const profileName =
    activeProfile?.name || t.settings.profileData.profileNameFallback;
  useDocumentTitle(
    topic ? `${topic.title} · ${t.settings.title}` : t.settings.title
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section, manageProfiles]);

  return (
    <div className='space-y-6'>
      {section && (
        <Link
          to={getSettingsLink(null)}
          className='mx-3 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-purple-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:mx-0'
          data-onboarding='settings-back'
        >
          <ArrowLeft className='h-4 w-4' aria-hidden='true' />
          {copy.back}
        </Link>
      )}
      <PageHeader
        title={topic?.title || t.settings.title}
        subtitle={topic?.description || copy.overviewDescription}
        dataOnboarding='settings-greeting'
      />
      {!section && (
        <div className='space-y-5 px-3 sm:px-0'>
          <nav
            aria-label={t.settings.title}
            className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
            data-onboarding='settings-overview'
          >
            {SETTINGS_SECTIONS.filter((key) => key !== 'about').map((key) => {
              const Icon = SECTION_ICONS[key];
              const item = copy.sections[key];
              return (
                <Link
                  key={key}
                  to={getSettingsLink(key)}
                  className='group flex min-w-0 items-start gap-3 rounded-2xl border bg-card p-5 text-card-foreground shadow-sm transition-colors hover:border-purple-400 hover:bg-purple-50/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:min-h-32 dark:hover:border-purple-500 dark:hover:bg-purple-950/20'
                  data-onboarding={`settings-${key}-link`}
                >
                  <Icon
                    className='mt-0.5 h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400'
                    aria-hidden='true'
                  />
                  <div className='min-w-0 flex-1'>
                    <span className='block font-semibold'>{item.title}</span>
                    <span className='mt-1 block text-sm text-muted-foreground'>
                      {item.description}
                    </span>
                  </div>
                  <ChevronRight
                    className='mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-purple-600'
                    aria-hidden='true'
                  />
                </Link>
              );
            })}
          </nav>
          <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-4'>
            <p className='text-sm text-muted-foreground'>{copy.chooseTopic}</p>
            <Link
              to={getSettingsLink('about')}
              className='inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-purple-600 hover:underline dark:text-purple-400'
              data-onboarding='settings-about-link'
            >
              {copy.sections.about.title}
              <ChevronRight className='h-4 w-4' aria-hidden='true' />
            </Link>
          </div>
        </div>
      )}
      {section && (
        <div
          className='space-y-6'
          data-onboarding={`settings-${section}-content`}
        >
          {(section === 'general' || section === 'security') && (
            <>
              <p className='px-3 text-sm text-muted-foreground sm:px-0'>
                {copy.globalScope}
              </p>
              <AppSettings key={section} section={section} />
            </>
          )}
          {section === 'profiles' &&
            (manageProfiles ? (
              <>
                <Button asChild variant='outline' className='mx-3 sm:mx-0'>
                  <Link to={getSettingsLink('profiles')}>
                    <ArrowLeft className='mr-2 h-4 w-4' aria-hidden='true' />
                    {copy.backToAccounts}
                  </Link>
                </Button>
                <ProfileManager />
              </>
            ) : (
              <>
                <Card
                  className='mx-3 sm:mx-0'
                  data-onboarding='settings-current-profile'
                >
                  <CardContent className='flex flex-wrap items-center justify-between gap-4 p-5'>
                    <div>
                      <h2 className='font-semibold'>
                        {copy.activeProfile.replace('{profile}', profileName)}
                      </h2>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {copy.manageProfilesDescription}
                      </p>
                    </div>
                    <Button asChild variant='outline'>
                      <Link
                        to={getSettingsLink('profiles', true)}
                        data-onboarding='settings-manage-profiles-link'
                      >
                        {copy.manageProfiles}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                <p className='px-3 text-sm text-muted-foreground sm:px-0'>
                  {copy.profileScope.replace('{profile}', profileName)}
                </p>
                <AccountSettings />
              </>
            ))}
          {section === 'data' && (
            <>
              <p className='px-3 text-sm text-muted-foreground sm:px-0'>
                {copy.backupScope}
              </p>
              <DataManagementSettings section='backup' />
              <details
                className='mx-3 rounded-2xl border border-destructive/25 bg-card sm:mx-0'
                data-onboarding='settings-delete-data'
              >
                <summary className='cursor-pointer rounded-2xl p-5 font-semibold text-destructive focus-visible:ring-2 focus-visible:ring-ring'>
                  {copy.deleteData}
                </summary>
                <div className='space-y-5 pb-5'>
                  <p className='px-5 text-sm text-muted-foreground'>
                    {copy.deleteDataDescription}
                  </p>
                  <ProfileDataSettings />
                  <DataManagementSettings section='reset' />
                </div>
              </details>
            </>
          )}
          {section === 'sync' && <SyncSettings />}
          {section === 'automation' && (
            <>
              <PaymentProcessorSettings />
              <div data-onboarding='settings-typesafe'>
                <TypeSafeSettings />
              </div>
              <WebMcpSettings />
            </>
          )}
          {section === 'about' && (
            <>
              <Card className='mx-3 sm:mx-0'>
                <CardContent className='flex flex-wrap items-center justify-between gap-4 p-5'>
                  <p className='text-sm text-muted-foreground'>
                    {copy.helpDescription}
                  </p>
                  <Button asChild variant='outline'>
                    <Link to='/help'>{copy.helpCenter}</Link>
                  </Button>
                </CardContent>
              </Card>
              <OnboardingSettings />
              <AppSettings section='about' />
            </>
          )}
        </div>
      )}
    </div>
  );
}
