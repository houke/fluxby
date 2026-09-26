import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { en } from '../apps/landing/src/lib/i18n/en';
import { nl } from '../apps/landing/src/lib/i18n/nl';

type Locale = typeof en | typeof nl;
type ReleaseFeature = { title: string; description: string };
type Release = {
  date: string;
  title: string;
  description: string;
  features: ReleaseFeature[];
};

function getText(
  translations: Record<string, unknown>,
  key: string,
  language: string
): string {
  const value = translations[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Missing ' + language + ' release translation: ' + key);
  }
  return value.trim();
}

function getRelease(
  locale: Locale,
  versionKey: string,
  language: string
): Release {
  const translations = locale.legal.updatesPage as unknown as Record<
    string,
    unknown
  >;
  const prefix = 'v' + versionKey;
  const date = getText(translations, prefix + 'Date', language);
  const title = getText(translations, prefix + 'Title', language);
  const description = getText(translations, prefix + 'Description', language);

  const featureNumbers = Array.from(
    new Set(
      Object.keys(translations)
        .map((key) => {
          const match = key.match(
            new RegExp('^' + prefix + 'F(\\d+)(?:Title|Desc)$')
          );
          return match ? Number(match[1]) : null;
        })
        .filter((number): number is number => number !== null)
    )
  ).sort((a, b) => a - b);

  featureNumbers.forEach((number, index) => {
    if (number !== index + 1) {
      throw new Error(
        'Release translations have a missing feature number for v' + versionKey
      );
    }
  });

  const features = featureNumbers.map((number) => ({
    title: getText(translations, prefix + 'F' + number + 'Title', language),
    description: getText(
      translations,
      prefix + 'F' + number + 'Desc',
      language
    ),
  }));

  return { date, title, description, features };
}

function formatSection(language: string, release: Release): string {
  const lines = [
    '## ' + language,
    '',
    '### ' + release.title + ' — ' + release.date,
    '',
    release.description,
  ];

  for (const feature of release.features) {
    lines.push('', '- **' + feature.title + '** — ' + feature.description);
  }

  return lines.join('\n');
}

export function generateLocalizedReleaseNotes(version: string): string {
  const normalizedVersion = version.trim().replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(normalizedVersion)) {
    throw new Error('Invalid release version: ' + version);
  }

  const versionKey = normalizedVersion.replace(/\./g, '');
  const dutch = getRelease(nl, versionKey, 'Dutch');
  const english = getRelease(en, versionKey, 'English');

  return [
    formatSection('🇳🇱 Nederlands', dutch),
    formatSection('🇬🇧 English', english),
  ].join('\n\n');
}

const invokedPath = process.argv[1];
if (
  invokedPath &&
  import.meta.url === pathToFileURL(resolve(invokedPath)).href
) {
  const version = process.argv[2];
  if (!version) {
    process.stderr.write('Usage: generate-release-notes.ts <version>\n');
    process.exitCode = 1;
  } else {
    try {
      process.stdout.write(generateLocalizedReleaseNotes(version) + '\n');
    } catch (error) {
      process.stderr.write(
        (error instanceof Error ? error.message : String(error)) + '\n'
      );
      process.exitCode = 1;
    }
  }
}
