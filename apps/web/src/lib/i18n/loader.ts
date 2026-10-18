import type { TranslationKeys } from './nl';

export type Language = 'nl' | 'en';

// Each language is its own chunk, so users only download the one they use.
// This module has no other imports so tests can preload both languages without
// pulling in the OPFS settings layer.
const translationLoaders: Record<Language, () => Promise<TranslationKeys>> = {
  nl: () => import('./nl').then((module) => module.nl),
  en: () => import('./en').then((module) => module.en),
};

const loadedTranslations: Partial<Record<Language, TranslationKeys>> = {};
const pendingLoads = new Map<Language, Promise<TranslationKeys>>();

/** Load a language's translations once; a failed load (offline) can be retried. */
export function loadTranslations(language: Language): Promise<TranslationKeys> {
  const loaded = loadedTranslations[language];
  if (loaded) return Promise.resolve(loaded);

  let pending = pendingLoads.get(language);
  if (!pending) {
    pending = translationLoaders[language]()
      .then((translations) => {
        loadedTranslations[language] = translations;
        return translations;
      })
      .finally(() => pendingLoads.delete(language));
    pendingLoads.set(language, pending);
  }
  return pending;
}

/** Start loading a language in the background, e.g. on hover of its button. */
export function preloadTranslations(language: Language): void {
  loadTranslations(language).catch(() => {
    // A real switch retries and reports the failure.
  });
}

export function getLoadedTranslations(
  language: Language
): TranslationKeys | undefined {
  return loadedTranslations[language];
}
