import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';

// Import modular settings components
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppSettings } from '@/components/settings/AppSettings';
import { PaymentProcessorSettings } from '@/components/settings/PaymentProcessorSettings';
import { DataManagementSettings } from '@/components/settings/DataManagementSettings';
import { ProfileManager } from '@/components/settings/ProfileManager';
import { OnboardingSettings } from '@/components/settings/OnboardingSettings';
import { ProfileDataSettings } from '@/components/settings/ProfileDataSettings';
import { SyncSettings } from '@/components/settings/SyncSettings';

const VALID_TABS = ['active-profile', 'manage-profiles', 'app-settings'];

export default function Settings() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  useDocumentTitle(t.settings.title);

  // Get tab from URL or default to 'active-profile'
  const tabParam = searchParams.get('tab');
  const activeTab =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'active-profile';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className='space-y-0 sm:space-y-6'>
      <PageHeader
        title={t.settings.title}
        subtitle={t.settings.subtitle}
        dataOnboarding='settings-greeting'
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='space-y-0 sm:space-y-6'
        data-onboarding='settings-tabs'
      >
        <TabsList>
          <TabsTrigger
            value='active-profile'
            data-onboarding='settings-profile-tab'
          >
            {t.settings.tabs?.activeProfile || 'Active Profile'}
          </TabsTrigger>
          <TabsTrigger
            value='manage-profiles'
            data-onboarding='settings-manage-tab'
          >
            {t.settings.tabs?.manageProfiles || 'Manage Profiles'}
          </TabsTrigger>
          <TabsTrigger value='app-settings' data-onboarding='settings-app-tab'>
            {t.settings.tabs?.appSettings || 'App Settings'}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Active Profile Settings */}
        <TabsContent
          value='active-profile'
          className='space-y-0 sm:space-y-6'
          data-onboarding='settings-profile-content'
        >
          <AccountSettings />
          <ProfileDataSettings />
        </TabsContent>

        {/* Tab 2: Profile Management */}
        <TabsContent
          value='manage-profiles'
          className='space-y-0 sm:space-y-6'
          data-onboarding='settings-manage-content'
        >
          <ProfileManager />
        </TabsContent>

        {/* Tab 3: Global App Settings */}
        <TabsContent
          value='app-settings'
          className='space-y-0 sm:space-y-6'
          data-onboarding='settings-app-content'
        >
          <OnboardingSettings />
          <AppSettings />
          <PaymentProcessorSettings />
          <SyncSettings />
          <DataManagementSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
