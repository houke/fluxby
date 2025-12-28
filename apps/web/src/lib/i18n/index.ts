import { nl, TranslationKeys } from './nl';
import { en } from './en';

export type Language = 'nl' | 'en';

export const languages: Record<Language, { name: string; flag: string }> = {
  nl: { name: 'Nederlands', flag: '🇳🇱' },
  en: { name: 'English', flag: '🇬🇧' },
};

export const translations: Record<Language, TranslationKeys> = {
  nl,
  en,
};

export const LANGUAGE_STORAGE_KEY = 'fluxby.language';

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'nl';
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'nl' || stored === 'en') return stored;
  return 'nl'; // Default to Dutch
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export type { TranslationKeys };
export { nl, en };
