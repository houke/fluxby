export interface SettingsNavigationTranslations {
  overviewDescription: string;
  back: string;
  chooseTopic: string;
  preferencesTitle: string;
  globalScope: string;
  activeProfile: string;
  profileScope: string;
  backupScope: string;
  manageProfiles: string;
  manageProfilesDescription: string;
  backToAccounts: string;
  deleteData: string;
  deleteDataDescription: string;
  resetTitle: string;
  resetDescription: string;
  technicalDetails: string;
  helpCenter: string;
  helpDescription: string;
  sections: Record<
    | 'general'
    | 'profiles'
    | 'security'
    | 'data'
    | 'sync'
    | 'automation'
    | 'about',
    { title: string; description: string }
  >;
}

export const settingsNavigationEn: SettingsNavigationTranslations = {
  overviewDescription:
    'Make Fluxby work for you. Choose a topic to get started.',
  back: 'All settings',
  chooseTopic: 'Choose a topic to view its settings.',
  preferencesTitle: 'Preferences',
  globalScope: 'These settings apply to all profiles on this device.',
  activeProfile: 'Current profile: {profile}',
  profileScope: 'The bank accounts on this page belong to {profile}.',
  backupScope:
    'Backups contain all profiles. Restoring a backup replaces financial data across all profiles.',
  manageProfiles: 'Manage all profiles',
  manageProfilesDescription: 'Create, switch, rename, hide or remove profiles.',
  backToAccounts: 'Back to accounts',
  deleteData: 'Delete data',
  deleteDataDescription:
    'Clear selected data in the current profile or reset all of Fluxby. Download a backup first. Each action shows what will be deleted before you confirm.',
  resetTitle: 'Reset all of Fluxby',
  resetDescription:
    'Remove every profile and all app settings from this device, then start again.',
  technicalDetails: 'Technical details',
  helpCenter: 'Open help center',
  helpDescription: 'Find guides and answers to common questions.',
  sections: {
    general: {
      title: 'General',
      description: 'Your name, language and appearance.',
    },
    profiles: {
      title: 'Profiles & accounts',
      description: 'Manage profiles and the bank accounts within them.',
    },
    security: {
      title: 'Security',
      description: 'Manage your master password and protect your data.',
    },
    data: {
      title: 'Data & backups',
      description: 'Back up, restore or clear your data.',
    },
    sync: {
      title: 'Devices & sync',
      description: 'Connect devices and keep them in sync.',
    },
    automation: {
      title: 'AI & automation',
      description: 'Transaction recognition and optional AI tools.',
    },
    about: {
      title: 'Help & about',
      description: 'Get guidance, continue the tour and manage app updates.',
    },
  },
};

export const settingsNavigationNl: SettingsNavigationTranslations = {
  overviewDescription:
    'Stel Fluxby in zoals jij wilt. Kies een onderwerp om te beginnen.',
  back: 'Alle instellingen',
  chooseTopic: 'Kies een onderwerp om de instellingen te bekijken.',
  preferencesTitle: 'Voorkeuren',
  globalScope: 'Deze instellingen gelden voor alle profielen op dit apparaat.',
  activeProfile: 'Huidig profiel: {profile}',
  profileScope: 'De bankrekeningen op deze pagina horen bij {profile}.',
  backupScope:
    'Back-ups bevatten alle profielen. Bij herstel worden de financiële gegevens van alle profielen vervangen.',
  manageProfiles: 'Alle profielen beheren',
  manageProfilesDescription:
    'Maak, wissel, hernoem, verberg of verwijder profielen.',
  backToAccounts: 'Terug naar rekeningen',
  deleteData: 'Gegevens wissen',
  deleteDataDescription:
    'Wis bepaalde gegevens in het huidige profiel of stel heel Fluxby opnieuw in. Download eerst een back-up. Bij elke actie zie je welke gegevens worden gewist voordat je bevestigt.',
  resetTitle: 'Heel Fluxby opnieuw instellen',
  resetDescription:
    'Verwijder alle profielen en app-instellingen van dit apparaat en begin opnieuw.',
  technicalDetails: 'Technische details',
  helpCenter: 'Helpcentrum openen',
  helpDescription: 'Vind uitleg en antwoorden op veelgestelde vragen.',
  sections: {
    general: { title: 'Algemeen', description: 'Je naam, taal en weergave.' },
    profiles: {
      title: 'Profielen & rekeningen',
      description: 'Beheer je profielen en de bijbehorende bankrekeningen.',
    },
    security: {
      title: 'Beveiliging',
      description: 'Beheer je hoofdwachtwoord en bescherm je gegevens.',
    },
    data: {
      title: 'Gegevens & back-ups',
      description: 'Maak een back-up, herstel of wis je gegevens.',
    },
    sync: {
      title: 'Apparaten & synchronisatie',
      description: 'Koppel apparaten en houd ze gesynchroniseerd.',
    },
    automation: {
      title: 'AI & automatisering',
      description: 'Transactieherkenning en optionele AI-hulp.',
    },
    about: {
      title: 'Hulp & over Fluxby',
      description:
        'Vind uitleg, ga verder met de rondleiding en beheer app-updates.',
    },
  },
};
