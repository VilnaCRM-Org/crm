import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectTabOrder } from '@tests/utils/a11y/keyboard';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const homeHeading: string = t('home.heading');
const signOutLabel: string = t('home.sign_out');
const signInTitle: string = t('sign_in.title');
const privacyLabel: string = t('footer.privacy');
const termsLabel: string = t('footer.usage_policy');

const signOutButtonOf = (page: Page): Locator =>
  page.getByRole('button', { name: signOutLabel, exact: true });

async function openHome(page: Page): Promise<void> {
  await seedPreloadedAuthToken(page);
  await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
}

async function expectSignedOutToSignIn(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole('heading', { level: 1, name: signInTitle })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
}

test.describe('Home page keyboard contract (issue #106)', () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
  });

  test('Tab visits sign out, then the footer links, with a visible focus indicator', async ({
    page,
  }) => {
    const footer = page.getByRole('contentinfo');

    await expectTabOrder(page, [
      { locator: signOutButtonOf(page), visibleFocus: true },
      { locator: footer.getByRole('link', { name: privacyLabel }), visibleFocus: true },
      { locator: footer.getByRole('link', { name: termsLabel }), visibleFocus: true },
    ]);
  });

  test('Enter on sign out lands on /sign-in with main focused', async ({ page }) => {
    await expectTabOrder(page, [{ locator: signOutButtonOf(page) }]);

    await page.keyboard.press('Enter');

    await expectSignedOutToSignIn(page);
  });

  test('Space on sign out lands on /sign-in with main focused', async ({ page }) => {
    await expectTabOrder(page, [{ locator: signOutButtonOf(page) }]);

    await page.keyboard.press('Space');

    await expectSignedOutToSignIn(page);
  });
});
