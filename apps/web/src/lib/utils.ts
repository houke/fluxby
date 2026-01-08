import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  getMonthName,
} from '@fluxby/shared';

export { formatCurrency, formatDate, formatPercentage, getMonthName };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Apply cleanup rules to a name string (client-side version)
 * Supports both literal strings and regex patterns
 * Regex patterns must be in format: /pattern/flags
 * All other patterns are treated as literal strings (e.g., 'SumUp *' matches 'SumUp *')
 */
export function applyCleanupRulesClient(
  name: string,
  rules: { pattern: string }[]
): string {
  let cleaned = name;
  for (const rule of rules) {
    // Try to parse as regex first (if pattern starts/ends with /)
    if (rule.pattern.startsWith('/') && rule.pattern.lastIndexOf('/') > 0) {
      const lastSlash = rule.pattern.lastIndexOf('/');
      const pattern = rule.pattern.slice(1, lastSlash);
      const flags = rule.pattern.slice(lastSlash + 1) || 'gi';
      try {
        const regex = new RegExp(pattern, flags);
        cleaned = cleaned.replace(regex, '').trim();
      } catch {
        // Invalid regex, skip
      }
    } else {
      // For literal patterns, use case-insensitive global replacement
      // Pattern 'SumUp *' matches the literal string 'SumUp *'
      const escapedPattern = rule.pattern.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );
      cleaned = cleaned.replace(new RegExp(escapedPattern, 'gi'), '').trim();
    }
  }
  // Clean up multiple spaces
  return cleaned.replace(/\s+/g, ' ').trim() || name;
}

/**
 * Common business entity suffixes that should be ignored in matching
 */
const BUSINESS_SUFFIXES = [
  'bv',
  'b.v.',
  'nv',
  'n.v.',
  'se',
  'ag',
  'gmbh',
  'ltd',
  'llc',
  'inc',
  'holding',
  'group',
  'europe',
  'nederland',
  'netherlands',
  'nl',
  'international',
];

/**
 * Extract key parts from a Dutch name for fuzzy matching
 * Removes salutations (Hr, Mw, Dhr, etc.), initials, business suffixes, and normalizes the surname
 */
export function extractDutchNameParts(name: string): {
  surname: string;
  normalized: string;
  significantWords: string[];
} {
  // Normalize: lowercase, trim
  let normalized = name.toLowerCase().trim();

  // Remove common Dutch salutations
  normalized = normalized.replace(
    /^(hr\.?|mw\.?|dhr\.?|mevr\.?|de heer|mevrouw|de hr\.?)\s*/i,
    ''
  );

  // Remove initials (single letters followed by dots or spaces)
  normalized = normalized.replace(/\b[a-z]\.\s*/gi, '');
  normalized = normalized.replace(/\b[a-z]\s+(?=[a-z]{2,})/gi, '');

  // Extract words and filter out business suffixes
  const allWords = normalized.split(/\s+/).filter((w) => w.length > 0);

  // Dutch tussenvoegsels (prefixes to surnames)
  const tussenvoegsels = [
    'de',
    'van',
    'den',
    'ter',
    'ten',
    'het',
    "'t",
    'vd',
    'v/d',
    'vander',
  ];

  // Get significant words: longer than 3 chars, not a business suffix, not a tussenvoegsel
  const significantWords = allWords.filter((w) => {
    const cleaned = w.replace(/[-'.]/g, '');
    return (
      cleaned.length >= 4 &&
      !BUSINESS_SUFFIXES.includes(cleaned) &&
      !tussenvoegsels.includes(cleaned)
    );
  });

  // Find the surname (skip tussenvoegsels and business suffixes)
  let surname = '';
  for (let i = allWords.length - 1; i >= 0; i--) {
    const word = allWords[i].replace(/[-']/g, '');
    if (
      !tussenvoegsels.includes(word) &&
      !BUSINESS_SUFFIXES.includes(word) &&
      word.length >= 4
    ) {
      surname = word;
      break;
    }
  }

  return {
    surname,
    normalized: normalized.replace(/[-\s]+/g, ' ').trim(),
    significantWords,
  };
}

/**
 * Check if two names might be the same person/entity
 * Returns a similarity score between 0 and 1
 * Requires significant word matches (4+ chars) to avoid false positives
 */
export function nameSimilarity(name1: string, name2: string): number {
  const parts1 = extractDutchNameParts(name1);
  const parts2 = extractDutchNameParts(name2);

  // If surnames match exactly and are long enough, high confidence
  if (
    parts1.surname &&
    parts2.surname &&
    parts1.surname.length >= 4 &&
    parts1.surname === parts2.surname
  ) {
    return 0.9;
  }

  // If one surname contains the other and both are substantial (e.g., "kwant" vs "kwant-vd")
  if (
    parts1.surname &&
    parts2.surname &&
    parts1.surname.length >= 4 &&
    parts2.surname.length >= 4 &&
    (parts1.surname.includes(parts2.surname) ||
      parts2.surname.includes(parts1.surname))
  ) {
    return 0.7;
  }

  // Use significant words (already filtered for length and business suffixes)
  const words1 = new Set(parts1.significantWords);
  const words2 = new Set(parts2.significantWords);

  // Need at least one significant word in each name
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((w) => words2.has(w)));

  // Require at least one matching significant word
  if (intersection.size === 0) return 0;

  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find groups of similar names in a list
 * Returns an array of groups, where each group contains indices of similar names
 * @param names - List of names to compare
 * @param threshold - Minimum similarity score (0-1) to consider names similar
 * @param cleanupRules - Optional cleanup rules to apply before comparing
 */
export function findSimilarNameGroups(
  names: string[],
  threshold: number = 0.6,
  cleanupRules?: { pattern: string }[]
): number[][] {
  // Apply cleanup rules to names if provided
  const cleanedNames = cleanupRules
    ? names.map((n) => applyCleanupRulesClient(n, cleanupRules))
    : names;

  const groups: number[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < cleanedNames.length; i++) {
    if (assigned.has(i)) continue;

    const group = [i];
    assigned.add(i);

    for (let j = i + 1; j < cleanedNames.length; j++) {
      if (assigned.has(j)) continue;

      if (nameSimilarity(cleanedNames[i], cleanedNames[j]) >= threshold) {
        group.push(j);
        assigned.add(j);
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  }

  return groups;
}
