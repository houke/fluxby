import { nl, LandingTranslationKeys } from './nl';
import { en } from './en';

export type Language = 'nl' | 'en';

export const languages: Record<Language, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  nl: { name: 'Nederlands', flag: '🇳🇱' },
};

export const translations: Record<Language, LandingTranslationKeys> = {
  en,
  nl,
};

export const LANDING_LANGUAGE_STORAGE_KEY = 'fluxby.landing.language';

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(LANDING_LANGUAGE_STORAGE_KEY);
  if (stored === 'nl' || stored === 'en') return stored;
  return 'en'; // Default to English
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANDING_LANGUAGE_STORAGE_KEY, lang);
}

export type { LandingTranslationKeys };
export { nl, en };
