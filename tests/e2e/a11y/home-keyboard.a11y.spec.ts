import type { Page, Route } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildCredentials } from '@tests/builders';
import { expectShellReady, sidebarSignOutOf } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  continueButtonOf,
  expectSignInSuccessCard,
  successCardHeading,
} from '@tests/e2e/utils/sign-in-result-card';
import { expectTabOrder } from '@tests/utils/a11y/keyboard';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const LOGIN_API_URL = '**/api/users';

const homeHeading: string = t('home.heading');
const signInTitle: string = t('sign_in.title');
const privacyLabel: string = t('footer.privacy');
const termsLabel: string = t('footer.usage_policy');

const credentials = buildCredentials();

async function openHome(page: Page): Promise<void> {
  await seedPreloadedAuthToken(page);
  await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
  await expectShellReady(page);
}

async function focusSignOut(page: Page): Promise<void> {
  await sidebarSignOutOf(page).focus();
  await expect(sidebarSignOutOf(page)).toBeFocused();
}

async function answerLoginWithToken(route: Route): Promise<void> {
  if (route.request().method() !== 'POST') {
    await route.fallback();
    return;
  }

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ token: 'e2e-login-token' }),
  });
}

async function signInFromKeyboard(page: Page): Promise<void> {
  await page.locator('#email').fill(credentials.email);
  await page.locator('#password').fill(credentials.password);
  await page.locator('#password').press('Enter');
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

  test('Tab leaves the sidebar sign out for the footer links with a focus ring', async ({
    page,
  }) => {
    const footer = page.getByRole('contentinfo');
    await focusSignOut(page);

    await expectTabOrder(page, [
      { locator: footer.getByRole('link', { name: privacyLabel }), visibleFocus: true },
      { locator: footer.getByRole('link', { name: termsLabel }), visibleFocus: true },
    ]);
  });

  test('Enter on sign out lands on /sign-in with main focused', async ({ page }) => {
    await focusSignOut(page);

    await page.keyboard.press('Enter');

    await expectSignedOutToSignIn(page);
  });

  test('Space on sign out lands on /sign-in with main focused', async ({ page }) => {
    await focusSignOut(page);

    await page.keyboard.press('Space');

    await expectSignedOutToSignIn(page);
  });

  test('signing back in focuses the success card and Enter on Продовжити returns home', async ({
    page,
  }) => {
    await page.route(LOGIN_API_URL, answerLoginWithToken);
    await focusSignOut(page);
    await page.keyboard.press('Enter');
    await expectSignedOutToSignIn(page);

    await signInFromKeyboard(page);

    await expectSignInSuccessCard(page);
    await expectTabOrder(page, [{ locator: continueButtonOf(page) }]);
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();
    await expect(successCardHeading(page)).toHaveCount(0);
  });
});
