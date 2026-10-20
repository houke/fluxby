import { expect, test } from '@playwright/test';
import { dismissOnboardingTour, setupApp, unlockTestApp } from './fixtures';
import { en } from '../apps/web/src/lib/i18n/en';
import { nl } from '../apps/web/src/lib/i18n/nl';
import { DEMO_PROFILE_ID } from '../packages/shared/src/types/profile';

for (const language of ['en', 'nl'] as const) {
  test(`refund category undo, anomaly evidence and manual contribution replacement persist (${language})`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    test.skip(
      process.env.PLAYWRIGHT_PRODUCTION === 'true',
      'Requires Vite source modules to seed this disposable database'
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await setupApp(page);
    await dismissOnboardingTour(page);
    const fixture = await page.evaluate(async (demoProfileId) => {
      const { getDataService, getGlobalDatabase } =
        await import('/app/src/lib/db-singleton.ts');
      const service = getDataService();
      const profile = (await service.getProfiles()).find(
        (p) => p.id === demoProfileId
      );
      const account = (await service.getAccounts())[0];
      const categories = await service.getCategories();
      const original = categories[0],
        previous = categories[1];
      if (!profile || !account || !original || !previous)
        throw new Error('Disposable demo fixture is incomplete');
      const date = new Date().toISOString().slice(0, 10);
      const expense = await service.createTransaction({
        date,
        amount: -50,
        type: 'expense',
        accountId: account.id,
        categoryId: original.id,
        description: 'Branch review original expense',
      });
      const refund = await service.createTransaction({
        date,
        amount: 50,
        type: 'income',
        accountId: account.id,
        categoryId: previous.id,
        description: 'Branch review refund',
      });
      await service.saveReviewedCategory(refund, previous.id);
      await service.createTransactionLink({
        sourceId: refund,
        targetId: expense,
        kind: 'refund',
        amount: 50,
      });
      const goal = await service.createSavingsGoal({
        name: 'Branch review goal',
        targetAmount: 500,
        monthlyContribution: 50,
      });
      await service.addSavingsContribution(goal.id, 50);
      const income = await service.createTransaction({
        date,
        amount: 50,
        type: 'income',
        accountId: account.id,
        categoryId: previous.id,
        description: 'Branch review goal funding',
      });
      for (let index = 0; index < 4; index++) {
        await service.createTransaction({
          date: new Date(Date.now() - (4 - index) * 86400000)
            .toISOString()
            .slice(0, 10),
          amount: index === 3 ? -200 : -50,
          type: 'expense',
          accountId: account.id,
          categoryId: original.id,
          merchantName: 'Branch review anomaly',
          description: 'Branch review anomaly',
        });
      }
      const queue = await service.getTransactionReviewInbox();
      const db = getGlobalDatabase();
      await db.transactionAsync(async (connection) => {
        for (const item of queue) {
          if (
            item.kind === 'spike' &&
            item.transaction.merchantName === 'Branch review anomaly'
          )
            continue;
          await connection.runAsync(
            "INSERT INTO transaction_review_decisions(id,item_key,status,profile_id,created_at,updated_at) VALUES(?,?,'done',?,?,?) ON CONFLICT(profile_id,item_key) DO UPDATE SET status='done',is_deleted=0",
            [crypto.randomUUID(), item.key, profile.id, Date.now(), Date.now()]
          );
        }
      });
      return {
        refund,
        expense,
        goal: goal.id,
        income,
        previous: previous.id,
        originalName: original.name,
      };
    }, DEMO_PROFILE_ID);
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Unlock', exact: true })
    ).toBeVisible({ timeout: 30000 });
    await unlockTestApp(page);
    if (language === 'nl') {
      await page.getByRole('link', { name: 'Settings', exact: true }).click();
      await page.locator('[data-onboarding="settings-general-link"]').click();
      await page.getByRole('button', { name: /Nederlands/ }).click();
    }
    const copy = language === 'nl' ? nl : en;
    if (language === 'nl')
      await page.setViewportSize({ width: 393, height: 852 });
    await page
      .getByRole('link', { name: copy.nav.transactions, exact: true })
      .first()
      .click();
    const review = page.locator('[data-onboarding="transaction-review"]');
    await review
      .getByRole('button', { name: copy.transactionReview.open, exact: true })
      .click();
    await expect(review.getByRole('article')).toContainText(
      'Branch review anomaly',
      { timeout: 30000 }
    );
    await expect(review.getByRole('article')).toContainText(
      language === 'nl' ? '3 eerdere betalingen' : '3 earlier payments'
    );
    await expect(review.getByRole('article')).toContainText('180');
    await review
      .getByRole('button', {
        name: new RegExp(`^${copy.transactionReview.links}`),
      })
      .click();
    const link = review
      .locator('div.space-y-3.rounded-lg.border')
      .filter({ hasText: 'Branch review refund' });
    const categoryState = () =>
      page.evaluate(async ({ refund, expense }) => {
        const { getDataService } = await import('/app/src/lib/db-singleton.ts');
        const transactions = await getDataService().getReviewTransactions();
        return {
          refund: transactions.find((transaction) => transaction.id === refund)
            ?.categoryId,
          expense: transactions.find(
            (transaction) => transaction.id === expense
          )?.categoryId,
        };
      }, fixture);
    const beforeInheritance = await categoryState();
    await link
      .getByRole('button', {
        name: copy.transactionReview.inheritCategory,
        exact: true,
      })
      .click();
    await expect
      .poll(async () => (await categoryState()).refund, { timeout: 30000 })
      .toBe(beforeInheritance.expense);
    await review
      .getByRole('button', {
        name: new RegExp(`^${copy.transactionReview.undo}`),
      })
      .click();
    await expect
      .poll(async () => (await categoryState()).refund, { timeout: 30000 })
      .toBe(beforeInheritance.refund);
    if (
      !(await page
        .getByRole('link', { name: 'Planning', exact: true })
        .first()
        .isVisible())
    ) {
      await page.getByRole('button', { name: /^(More|Meer)$/ }).click();
    }
    await page
      .getByRole('link', { name: 'Planning', exact: true })
      .first()
      .click();
    await page
      .getByRole('tab', { name: copy.householdPlanning.title, exact: true })
      .click();
    const goal = page
      .locator('div.rounded-md.border.p-3')
      .filter({ hasText: 'Branch review goal' });
    await goal
      .getByRole('button', { name: copy.householdPlanning.link, exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('combobox', {
        name: copy.householdPlanning.transaction,
        exact: true,
      })
      .click();
    await page
      .getByRole('option', { name: /Branch review goal funding/ })
      .click();
    const replacement = dialog.getByRole('combobox', {
      name: copy.householdPlanning.replaceManualContribution,
      exact: true,
    });
    await expect(replacement).toContainText(
      copy.householdPlanning.keepManualContributions
    );
    await replacement.click();
    await page
      .getByRole('option')
      .filter({ hasNotText: copy.householdPlanning.keepManualContributions })
      .click();
    await expect(replacement).toContainText('50');
    await dialog
      .getByRole('button', { name: copy.householdPlanning.save, exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    const readGoal = () =>
      page.evaluate(async (id) => {
        const { getDataService } = await import('/app/src/lib/db-singleton.ts');
        const service = getDataService();
        return {
          amount: (await service.getSavingsGoals()).find(
            (goal) => goal.id === id
          )?.currentAmount,
          manual: (await service.getGoalManualContributions(id)).length,
          linked: (await service.getGoalTransactionLinks()).filter(
            (link) => link.goalId === id
          ).length,
        };
      }, fixture.goal);
    await expect.poll(readGoal).toEqual({ amount: 50, manual: 0, linked: 1 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true);
    await page.screenshot({ path: `.nexus/tmp/branch-gaps-${language}.png` });
    await page.reload();
    const unlock = page.getByRole('button', {
      name: copy.security.unlock,
      exact: true,
    });
    await expect(unlock).toBeVisible({ timeout: 30000 });
    await page
      .getByLabel(copy.security.enterPassword, { exact: true })
      .fill('test1234');
    await unlock.click();
    await expect(
      page.locator('[data-onboarding="household-planning"]')
    ).toBeVisible();
    await expect.poll(readGoal).toEqual({ amount: 50, manual: 0, linked: 1 });
  });
}
