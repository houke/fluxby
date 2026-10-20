/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Language,
  languages,
  TranslationKeys,
  getLoadedTranslations,
  getStoredLanguage,
  getTranslations,
  loadTranslations,
  setStoredLanguage,
} from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  /** Resolves once the language's translations are loaded and applied. */
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationKeys;
  languages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);
  // Only the most recent choice is applied when switches overlap.
  const latestRequest = useRef(0);

  useEffect(() => {
    // Sync with storage on mount
    setLanguageState(getStoredLanguage());
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    const request = ++latestRequest.current;
    try {
      await loadTranslations(lang);
    } catch (error) {
      console.warn(`Failed to load ${lang} translations:`, error);
      return;
    }
    if (request !== latestRequest.current) return;
    setStoredLanguage(lang);
    setLanguageState(lang);
  }, []);

  useEffect(() => {
    // Screen readers and search engines read the page language from <html>.
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: getLoadedTranslations(language) ?? getTranslations(),
      languages,
    }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Helper hook for getting translations directly
export function useTranslations() {
  const { t } = useLanguage();
  return t;
}

/**
 * Translations for a language other than the app language (e.g. onboarding's
 * own choice). Shows the app language until that language has loaded.
 */
export function useTranslationsFor(language: Language): TranslationKeys {
  const { t } = useLanguage();
  const [, setLoaded] = useState<Language | null>(null);
  const loaded = getLoadedTranslations(language);

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    loadTranslations(language)
      .then(() => {
        if (!cancelled) setLoaded(language);
      })
      .catch((error) => {
        console.warn(`Failed to load ${language} translations:`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [language, loaded]);

  return loaded ?? t;
}
