export const SETTINGS_SECTIONS = [
  'general',
  'profiles',
  'security',
  'data',
  'sync',
  'automation',
  'about',
] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export function getSettingsSection(
  params: URLSearchParams
): SettingsSection | null {
  const section = params.get('section');
  if (section !== null) {
    return SETTINGS_SECTIONS.includes(section as SettingsSection)
      ? (section as SettingsSection)
      : null;
  }
  // Existing bookmarks and profile-switcher links keep a useful destination.
  switch (params.get('tab')) {
    case 'active-profile':
    case 'manage-profiles':
      return 'profiles';
    case 'app-settings':
      return 'general';
    default:
      return null;
  }
}

export function getSettingsLink(
  section: SettingsSection | null,
  manageProfiles = false
): string {
  if (!section) return '/settings';
  const params = new URLSearchParams({ section });
  if (manageProfiles) params.set('view', 'manage');
  return `/settings?${params}`;
}
