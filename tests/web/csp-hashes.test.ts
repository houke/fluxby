import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf8');

function contentSecurityPolicy(html: string): string {
  const match = html.match(
    /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/
  );
  if (!match) throw new Error('Missing Content-Security-Policy meta tag');
  return match[1];
}

describe('HTML Content-Security-Policy', () => {
  it('allows the landing theme script by hash instead of unsafe-inline', () => {
    const html = read('../../apps/landing/index.html');
    const policy = contentSecurityPolicy(html);
    const scriptSrc = policy.match(/script-src ([^;]+)/)?.[1] ?? '';
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script\s*>/gi)];
    expect(inlineScripts.length).toBeGreaterThan(0);
    for (const [, body] of inlineScripts) {
      const hash = createHash('sha256').update(body).digest('base64');
      expect(scriptSrc).toContain(`'sha256-${hash}'`);
    }
  });

  it.each(['../../apps/landing/index.html', '../../apps/web/index.html'])(
    '%s blocks plugins, base rewriting and third-party fonts',
    (path) => {
      const html = read(path);
      const policy = contentSecurityPolicy(html);
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("base-uri 'self'");
      expect(policy).toContain("form-action 'self'");
      expect(policy).not.toContain('fonts.googleapis.com');
      expect(html).not.toContain('fonts.googleapis.com');
    }
  );
});
