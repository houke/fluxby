import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { onboardingChapters } from '../apps/web/src/components/onboarding/onboarding-data';
import { en } from '../apps/web/src/lib/i18n/en';
import { nl } from '../apps/web/src/lib/i18n/nl';

for (const language of ['nl', 'en'] as const) {
  for (const viewport of ['desktop', 'mobile'] as const) {
    test(`complete tour explains every step and reaches its screen (${language}, ${viewport})`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(480000);
      await page.setViewportSize(
        viewport === 'desktop'
          ? { width: 1440, height: 1000 }
          : { width: 393, height: 852 }
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/app/');
      await page
        .getByRole('button', {
          name: language === 'nl' ? /Nederlands|Dutch/i : /English|Engels/i,
        })
        .click();
      await page.locator('input[type="text"]').fill('Tour coverage');
      await page.getByRole('button', { name: /^(Next|Volgende)/ }).click();
      await page.locator('input[type="password"]').nth(0).fill('test1234');
      await page.locator('input[type="password"]').nth(1).fill('test1234');
      await page.locator('button[type="submit"]').click();
      const unlock = page.getByRole('button', {
        name: /^(Unlock|Ontgrendelen)$/,
      });
      const tour = page.getByTestId('onboarding-step');
      await expect(unlock.or(tour)).toBeVisible({ timeout: 90000 });
      if (await unlock.isVisible()) {
        await page.locator('input[type="password"]').fill('test1234');
        await unlock.click();
      }
      const copy = language === 'nl' ? nl : en;
      const targets: { id: string; selector: string; visible: boolean }[] = [];
      for (const chapter of onboardingChapters) {
        for (const step of chapter.steps) {
          await expect(tour.getByRole('heading', { level: 2 })).toHaveText(
            step.title[language]
          );
          await expect(page).toHaveURL(`/app${step.route ?? chapter.route}`);
          if (step.id !== 'completion-next-steps')
            await expect(
              tour.getByText(step.content[language], { exact: true })
            ).toBeVisible();
          if (step.selector) {
            if (step.action === 'click')
              await expect(page.locator(step.selector)).toHaveAttribute(
                'aria-expanded',
                'true'
              );
            const primary = page.locator(`${step.selector}:visible`).first();
            const target =
              (await primary.isVisible()) || !step.fallbackSelector
                ? primary
                : page.locator(`${step.fallbackSelector}:visible`).first();
            const visible = await target.isVisible();
            targets.push({ id: step.id, selector: step.selector, visible });
            if (step.route || step.fallbackSelector)
              await expect(target).toBeVisible();
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1
            ),
            `${step.id} horizontal overflow`
          ).toBe(true);
          await expect
            .poll(
              async () => {
                const bounds = await tour.boundingBox();
                const height = viewport === 'desktop' ? 1000 : 852;
                return (
                  !!bounds &&
                  bounds.y >= 0 &&
                  bounds.y + bounds.height <=
                    height - (chapter.id === 'welcome' ? 0 : 120)
                );
              },
              {
                message: `${step.id}: explanation stays on screen above navigation`,
              }
            )
            .toBe(true);
          await expect(
            tour.getByRole('heading', { level: 2 })
          ).toBeInViewport();
          if (
            [
              'review-repayments',
              'planning-daily-forecast',
              'settings-account-types',
            ].includes(step.id)
          )
            await page.screenshot({
              path: `.nexus/tmp/tour-${step.id}-${language}-${viewport}.png`,
            });
          const navigation = page.getByTestId('onboarding-navigation');
          if (chapter.id !== 'welcome') {
            const bounds = await navigation.boundingBox();
            if (!bounds) throw new Error('Tour navigation is missing');
            expect(bounds.x).toBeGreaterThanOrEqual(0);
            expect(bounds.x + bounds.width).toBeLessThanOrEqual(
              viewport === 'desktop' ? 1440 : 393
            );
          }
          if (chapter.id === 'welcome') {
            await tour
              .getByRole('button', {
                name: copy.onboarding.getStarted,
                exact: true,
              })
              .click();
          } else {
            await page
              .getByRole('button', {
                name:
                  step.id === onboardingChapters.at(-1)?.steps.at(-1)?.id
                    ? copy.onboarding.finish
                    : copy.onboarding.next,
                exact: true,
              })
              .click();
          }
        }
      }
      writeFileSync(
        `.nexus/tmp/tour-targets-${language}-${viewport}.json`,
        JSON.stringify(targets, null, 2)
      );
      await testInfo.attach('tour-targets', {
        body: JSON.stringify(targets, null, 2),
        contentType: 'application/json',
      });
      await expect(tour).toHaveCount(0);
      await page.reload();
      await expect(unlock).toBeVisible({ timeout: 30000 });
      await page.locator('input[type="password"]').fill('test1234');
      await unlock.click();
      await expect(
        page.getByRole('link', { name: 'Dashboard', exact: true })
      ).toBeVisible();
      await expect(tour).toHaveCount(0);
    });
  }
}

for (const language of ['nl', 'en'] as const) {
  test(`feature help explains compact rows and household entry point (${language})`, async ({
    page,
  }) => {
    await page.goto('/help/transactions');
    await page
      .getByRole('button', { name: language.toUpperCase(), exact: true })
      .click();
    await expect(
      page.getByRole('heading', {
        name: language === 'nl' ? 'Compacte weergave' : 'Compact view',
        exact: true,
      })
    ).toBeVisible();
    await expect(page.locator('main')).toContainText(
      language === 'nl'
        ? 'actierij onder de transactiefilters'
        : 'action row below the transaction filters'
    );
    await page.goto('/help/planning');
    await expect(page.locator('main')).toContainText(
      language === 'nl'
        ? 'Open Planning → Huishoudplanning en kies Plan toevoegen.'
        : 'Open Planning → Household planning and choose Add plan.'
    );
    await page.setViewportSize({ width: 393, height: 852 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true);
    await expect(page.locator('main')).not.toContainText(
      /\bundefined\b|\[object Object\]/
    );
  });
}
