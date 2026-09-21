import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('Tauri TypeSafe network policy', () => {
  it('allows the direct Jev endpoint used by the Tauri client', () => {
    const configPath = join(__dirname, '../../apps/tauri/tauri.conf.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as {
      app: { security: { csp: string } };
    };

    expect(config.app.security.csp).toContain('https://api.typesafe.ai');
  });
});
