import type { Language } from './i18n';

/**
 * Extract the requested language from a GitHub release body. Markdown sections
 * stop at the next level-two heading, including sections such as Downloads.
 */
export function parseLocalizedReleaseNotes(
  body: string | undefined,
  language: Language
): string {
  if (!body) return '';

  const commentRegex = new RegExp(
    '<!--\\s*' +
      language +
      '\\s*-->([\\s\\S]*?)<!--\\s*\\/' +
      language +
      '\\s*-->',
    'i'
  );
  const commentMatch = body.match(commentRegex);
  if (commentMatch) return commentMatch[1].trim();

  const headerPatterns: Record<Language, RegExp> = {
    nl: /##\s*(?:🇳🇱\s*)?Nederlands\s*\n([\s\S]*?)(?=\n##\s|$)/i,
    en: /##\s*(?:🇬🇧\s*)?English\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  };
  const headerMatch = body.match(headerPatterns[language]);
  if (headerMatch) return headerMatch[1].trim();

  const simpleRegex = new RegExp(
    '\\[' + language + '\\]([\\s\\S]*?)(?=\\[(?:nl|en)\\]|$)',
    'i'
  );
  const simpleMatch = body.match(simpleRegex);
  if (simpleMatch) return simpleMatch[1].trim();

  return body;
}
