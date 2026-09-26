import { describe, it, expect } from 'vitest';

import { parseLocalizedReleaseNotes } from '../../apps/web/src/lib/release-notes';

describe('parseLocalizedReleaseNotes', () => {
  describe('HTML comment format', () => {
    const htmlCommentBody = `
<!-- nl -->
### Nieuw in deze versie
- Verbeterde prestaties
- Bug fixes
<!-- /nl -->

<!-- en -->
### New in this version
- Improved performance
- Bug fixes
<!-- /en -->
`;

    it('extracts Dutch content when language is nl', () => {
      const result = parseLocalizedReleaseNotes(htmlCommentBody, 'nl');
      expect(result).toContain('Nieuw in deze versie');
      expect(result).toContain('Verbeterde prestaties');
      expect(result).not.toContain('New in this version');
    });

    it('extracts English content when language is en', () => {
      const result = parseLocalizedReleaseNotes(htmlCommentBody, 'en');
      expect(result).toContain('New in this version');
      expect(result).toContain('Improved performance');
      expect(result).not.toContain('Nieuw in deze versie');
    });
  });

  describe('Markdown header format', () => {
    const markdownHeaderBody = `
## 🇳🇱 Nederlands

### Wijzigingen
- Nieuwe functies toegevoegd
- Bugs opgelost

## 🇬🇧 English

### Changes
- New features added
- Bugs fixed
`;

    it('extracts Dutch content when language is nl', () => {
      const result = parseLocalizedReleaseNotes(markdownHeaderBody, 'nl');
      expect(result).toContain('Wijzigingen');
      expect(result).toContain('Nieuwe functies toegevoegd');
      expect(result).not.toContain('Changes');
    });

    it('extracts English content when language is en', () => {
      const result = parseLocalizedReleaseNotes(markdownHeaderBody, 'en');
      expect(result).toContain('Changes');
      expect(result).toContain('New features added');
      expect(result).not.toContain('Wijzigingen');
    });

    it('handles header without flag emoji', () => {
      const bodyWithoutFlags = `
## Nederlands

Dutch content here

## English

English content here
`;
      const resultNl = parseLocalizedReleaseNotes(bodyWithoutFlags, 'nl');
      expect(resultNl).toContain('Dutch content here');

      const resultEn = parseLocalizedReleaseNotes(bodyWithoutFlags, 'en');
      expect(resultEn).toContain('English content here');
    });

    it('does not include later non-language sections', () => {
      const bodyWithDownloads = [
        '## 🇳🇱 Nederlands',
        'Dutch release notes',
        '',
        '## 🇬🇧 English',
        'English release notes',
        '',
        '## Downloads / Downloads',
        'Download table',
      ].join('\n');

      expect(parseLocalizedReleaseNotes(bodyWithDownloads, 'en')).toContain(
        'English release notes'
      );
      expect(parseLocalizedReleaseNotes(bodyWithDownloads, 'en')).not.toContain(
        'Download table'
      );
    });
  });

  describe('Simple bracket format', () => {
    const bracketBody = `
[nl]
Nederlandse versie notities
- Item 1
- Item 2

[en]
English release notes
- Item 1
- Item 2
`;

    it('extracts Dutch content when language is nl', () => {
      const result = parseLocalizedReleaseNotes(bracketBody, 'nl');
      expect(result).toContain('Nederlandse versie notities');
      expect(result).not.toContain('English release notes');
    });

    it('extracts English content when language is en', () => {
      const result = parseLocalizedReleaseNotes(bracketBody, 'en');
      expect(result).toContain('English release notes');
      expect(result).not.toContain('Nederlandse versie notities');
    });
  });

  describe('Fallback behavior', () => {
    it('returns full body when no language markers found', () => {
      const plainBody = `
### What's New
- Feature 1
- Feature 2
- Bug fixes
`;
      const result = parseLocalizedReleaseNotes(plainBody, 'nl');
      expect(result).toBe(plainBody);
    });

    it('returns empty string for undefined body', () => {
      const result = parseLocalizedReleaseNotes(undefined, 'nl');
      expect(result).toBe('');
    });

    it('returns empty string for empty body', () => {
      const result = parseLocalizedReleaseNotes('', 'nl');
      expect(result).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('handles extra whitespace in HTML comments', () => {
      const body = `
<!--   nl   -->
Dutch content
<!--   /nl   -->
`;
      const result = parseLocalizedReleaseNotes(body, 'nl');
      expect(result).toBe('Dutch content');
    });

    it('handles case-insensitive markers', () => {
      const body = `
<!-- NL -->
Dutch content
<!-- /NL -->
`;
      const result = parseLocalizedReleaseNotes(body, 'nl');
      expect(result).toBe('Dutch content');
    });

    it('handles multiline content with code blocks', () => {
      const body = `
<!-- en -->
### Changes
\`\`\`javascript
const x = 1;
\`\`\`
- Item 1
<!-- /en -->
`;
      const result = parseLocalizedReleaseNotes(body, 'en');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('### Changes');
    });
  });
});
