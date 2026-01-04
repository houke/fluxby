import { nl, TranslationKeys } from './nl';
import { en } from './en';
import {
  readFromOPFSSync,
  writeToOPFSWithCache,
  isSettingsCacheInitialized,
} from '@fluxby/database';

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

  // Try to get from OPFS cache first
  if (isSettingsCacheInitialized()) {
    const stored = readFromOPFSSync<Language>(LANGUAGE_STORAGE_KEY);
    if (stored === 'nl' || stored === 'en') return stored;
  }

  return 'nl'; // Default to Dutch
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;

  // Store in OPFS (async, but we don't need to wait)
  writeToOPFSWithCache(LANGUAGE_STORAGE_KEY, lang).catch((err) => {
    console.warn('Failed to save language to OPFS:', err);
  });
}

export type { TranslationKeys };
export { nl, en };
