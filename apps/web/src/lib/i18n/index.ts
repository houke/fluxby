import type { TranslationKeys } from './nl';
import { getLoadedTranslations, type Language } from './loader';
import {
  readFromOPFSSync,
  writeToOPFSWithCache,
  isSettingsCacheInitialized,
} from '@fluxby/database';

export type { Language };
export {
  loadTranslations,
  preloadTranslations,
  getLoadedTranslations,
} from './loader';

export const languages: Record<Language, { name: string; flag: string }> = {
  nl: { name: 'Nederlands', flag: '🇳🇱' },
  en: { name: 'English', flag: '🇬🇧' },
};

export const LANGUAGE_STORAGE_KEY = 'fluxby.language';

// OPFS stays the source of truth. This copy only lets startup fetch the right
// translation chunk before the OPFS settings cache has been read.
const LANGUAGE_HINT_KEY = 'fluxby.language-hint';

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
  setLanguageHint(lang);
}

/** Best guess of the stored language, readable before OPFS is available. */
export function getLanguageHint(): Language {
  try {
    const hint = window.localStorage.getItem(LANGUAGE_HINT_KEY);
    if (hint === 'nl' || hint === 'en') return hint;
  } catch {
    // Storage can be blocked; fall back to the default language.
  }
  return 'nl';
}

export function setLanguageHint(lang: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_HINT_KEY, lang);
  } catch {
    // The hint only speeds up startup; ignore blocked storage.
  }
}

/**
 * Translations for the stored UI language, for code outside React.
 * Startup (main.tsx) loads the stored language before the first render, and
 * LanguageContext loads a new language before storing it.
 */
export function getTranslations(): TranslationKeys {
  const translations =
    getLoadedTranslations(getStoredLanguage()) ??
    getLoadedTranslations('nl') ??
    getLoadedTranslations('en');
  if (!translations) {
    throw new Error('Translations are not loaded yet');
  }
  return translations;
}

export type { TranslationKeys };
