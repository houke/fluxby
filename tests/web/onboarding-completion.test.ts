import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const appRoot = join(__dirname, '../..');
const readAppFile = (relativePath: string) =>
  readFileSync(join(appRoot, relativePath), 'utf-8');

describe('first-run onboarding completion', () => {
  it('persists completion when the user starts secure setup', () => {
    const securitySetup = readAppFile(
      'apps/web/src/components/SecuritySetup.tsx'
    );

    const markSeenAt = securitySetup.indexOf('await onOnboardingSeen();');
    const loadingAt = securitySetup.indexOf('// Switch to loading step');

    expect(markSeenAt).toBeGreaterThan(-1);
    expect(markSeenAt).toBeLessThan(loadingAt);
  });

  it('wires the completion marker to the onboarding persistence callback', () => {
    const app = readAppFile('apps/web/src/App.tsx');

    expect(app).toContain('onOnboardingSeen={completeOnboarding}');
  });

  it('does not require the tour after its completion marker is set', () => {
    const onboardingContext = readAppFile(
      'apps/web/src/components/onboarding/OnboardingContext.tsx'
    );

    expect(onboardingContext).toMatch(
      /isEncryptionEnabled\s*&&\s*!state\.hasCompletedOnboarding\s*&&\s*\(userData === null \|\| !hasDemoProfile\)/
    );
  });
});
