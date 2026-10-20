import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allowSentryInCsp } from '../../scripts/sentry-csp.mjs';

const html = readFileSync('apps/web/index.html', 'utf8');
const connectSrc = (page: string) =>
  page.match(/connect-src ([^;"]*)/)?.[1].split(/\s+/) ?? [];

describe('Sentry CSP allowance', () => {
  it('leaves the CSP unchanged when no DSN is configured', () => {
    expect(allowSentryInCsp(html, undefined)).toBe(html);
    expect(allowSentryInCsp(html, '')).toBe(html);
  });

  it('allows only the DSN ingest origin, without credentials or path', () => {
    const result = allowSentryInCsp(
      html,
      'https://publickey@o12345.ingest.sentry.io/678'
    );
    const sources = connectSrc(result);
    expect(sources).toContain('https://o12345.ingest.sentry.io');
    expect(result).not.toContain('publickey');
    expect(sources).toEqual([
      ...connectSrc(html),
      'https://o12345.ingest.sentry.io',
    ]);
    // Rebuilding the same page does not duplicate the source.
    expect(
      allowSentryInCsp(result, 'https://publickey@o12345.ingest.sentry.io/678')
    ).toBe(result);
  });

  it('fails the build for a malformed DSN instead of silently blocking reports', () => {
    expect(() => allowSentryInCsp(html, 'not a url')).toThrow(
      'VITE_SENTRY_DSN'
    );
    expect(() => allowSentryInCsp(html, 'javascript:alert(1)')).toThrow(
      'VITE_SENTRY_DSN'
    );
  });
});

describe('Tauri release configuration', () => {
  it('keeps webview devtools out of release builds', () => {
    const config = JSON.parse(
      readFileSync('apps/tauri/tauri.conf.json', 'utf8')
    );
    for (const window of config.app.windows) {
      expect(window.devtools).not.toBe(true);
    }
    const cargo = readFileSync('apps/tauri/Cargo.toml', 'utf8');
    const tauriLine = cargo.match(/^tauri = .*$/m)?.[0] ?? '';
    expect(tauriLine).not.toContain('devtools');
  });
});
