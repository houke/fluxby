import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setupApp, dismissOnboardingTour } from './fixtures';
import { en } from '../apps/web/src/lib/i18n/en';
import { nl } from '../apps/web/src/lib/i18n/nl';

for (const language of ['en', 'nl'] as const) {
  test(`settings overview and topic pages work on desktop and mobile (${language})`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await setupApp(page);
    await dismissOnboardingTour(page);
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.locator('[data-onboarding="settings-general-link"]').click();
    if (language === 'nl')
      await page.getByRole('button', { name: /Nederlands/ }).click();
    const settings = (language === 'nl' ? nl : en).settings;
    const copy = settings.navigation;
    await page.locator('[data-onboarding="settings-back"]').click();
    for (const width of [1440, 393, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['light', 'dark'] as const) {
        await page.locator('[data-onboarding="settings-general-link"]').click();
        await page
          .getByRole('button', {
            name:
              language === 'en'
                ? theme === 'light'
                  ? /Light/
                  : /Dark/
                : theme === 'light'
                  ? /Licht/
                  : /Donker/,
          })
          .click();
        await page.locator('[data-onboarding="settings-back"]').click();
        await expect(
          page.locator('[data-onboarding="settings-overview"] a')
        ).toHaveCount(6);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          language === 'en' ? 'Settings' : 'Instellingen'
        );
        const accessibility = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(
          accessibility.violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          }))
        ).toEqual([]);
        if (theme === 'light' && width !== 320) {
          await page.screenshot({
            path: `.nexus/tmp/settings-overview/settings-overview-${language}-${width === 1440 ? 'desktop' : 'mobile'}.png`,
            fullPage: true,
          });
        }
        for (const section of [
          'general',
          'profiles',
          'security',
          'data',
          'sync',
          'automation',
          'about',
        ] as const) {
          await page
            .locator(`[data-onboarding="settings-${section}-link"]`)
            .click();
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            copy.sections[section].title
          );
          await expect(
            page.locator(`[data-onboarding="settings-${section}-content"]`)
          ).toBeVisible();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1
            ),
            `${language}/${theme}/${width}/${section} overflow`
          ).toBe(true);
          if (section === 'general') {
            await expect(
              page.locator('[data-onboarding="settings-about-updates"]')
            ).toHaveCount(0);
            await expect(
              page.locator('[data-onboarding="settings-security"]')
            ).toHaveCount(0);
          }
          if (section === 'profiles') {
            await page
              .locator('[data-onboarding="settings-manage-profiles-link"]')
              .click();
            await expect(
              page.locator('[data-onboarding="settings-profiles"]')
            ).toBeVisible();
            await page
              .getByRole('link', { name: copy.backToAccounts, exact: true })
              .click();
            await expect(
              page.locator('[data-onboarding="settings-accounts"]')
            ).toBeVisible();
          }
          if (section === 'security') {
            await page
              .getByRole('button', {
                name: settings.masterPasswordChange,
                exact: true,
              })
              .click();
            const dialog = page.getByRole('dialog', {
              name: settings.masterPasswordDialogTitle,
            });
            await expect(dialog).toBeVisible();
            // The app background is transparent; dialogs need an opaque surface.
            expect(
              await dialog.evaluate(
                (element) => getComputedStyle(element).backgroundColor
              )
            ).toMatch(/^rgb\(/);
            if (language === 'en' && width !== 320) {
              await dialog.screenshot({
                path: `.nexus/tmp/settings-overview/password-dialog-${theme}-${width}.png`,
              });
            }
            await page.keyboard.press('Escape');
            await expect(dialog).not.toBeVisible();
          }
          if (section === 'data') {
            await expect(
              page.locator('[data-onboarding="settings-delete-data"]')
            ).not.toHaveAttribute('open', '');
            await expect(
              page.locator('[data-onboarding="settings-reset"]')
            ).not.toBeVisible();
            await page.getByText(copy.deleteData, { exact: true }).click();
            await expect(
              page.locator('[data-onboarding="settings-profile-data"]')
            ).toBeVisible();
            await expect(
              page.locator('[data-onboarding="settings-reset"]')
            ).toBeVisible();
            for (const selector of [
              'settings-profile-data',
              'settings-reset',
            ]) {
              const styles = await page
                .locator(`[data-onboarding="${selector}"]`)
                .evaluate((element) => {
                  const style = getComputedStyle(element);
                  return {
                    background: style.backgroundColor,
                    border: style.borderLeftWidth,
                    shadow: style.boxShadow,
                  };
                });
              expect(styles).toEqual({
                background: 'rgba(0, 0, 0, 0)',
                border: '0px',
                shadow: 'none',
              });
            }
            expect(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1
              ),
              `${language}/${theme}/${width}/delete data overflow`
            ).toBe(true);
            if (language === 'en' && theme === 'light' && width !== 320) {
              await page
                .locator('[data-onboarding="settings-delete-data"]')
                .screenshot({
                  path: `.nexus/tmp/settings-overview/delete-data-${width}.png`,
                });
            }
          }
          if (section === 'about')
            await expect(
              page.locator('[data-onboarding="onboarding-settings"]')
            ).toBeVisible();
          await page.locator('[data-onboarding="settings-back"]').click();
        }
      }
    }
    expect(errors).toEqual([]);
  });
}
