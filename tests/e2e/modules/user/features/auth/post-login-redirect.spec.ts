import type { Page, Route } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  continueButtonOf,
  expectSignInErrorCard,
  expectSignInSuccessCard,
  signInErrorMessages,
  successCardHeading,
} from '@tests/e2e/utils/sign-in-result-card';
import { bounceFromProtectedDestination, signOutToSignIn } from '@tests/e2e/utils/sign-out';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import fillInput from '../../../../utils/fill-input';
import { t } from '../../../../utils/initialize-localization';

const LOGIN_API_URL = '**/api/users';
const PRESERVED_DESTINATION = '/?tab=deals#pipeline';

const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');
const homeHeading: string = t('home.heading');

const validCredentials = buildCredentials();

async function submitValidLogin(page: Page): Promise<void> {
  await fillInput(page.getByPlaceholder(emailPlaceholder), validCredentials.email);
  await fillInput(page.getByPlaceholder(passwordPlaceholder), validCredentials.password);
  await page.locator('button', { hasText: submitLabel }).click();
}

async function mockLoginSuccess(page: Page): Promise<void> {
  await page.route(LOGIN_API_URL, async (route: Route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'e2e-login-token' }),
    });
  });
}

async function expectHomeWithMainFocused(page: Page): Promise<void> {
  await expect(
    page.getByRole('main').getByRole('heading', { level: 1, name: homeHeading })
  ).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  await expect(successCardHeading(page)).toHaveCount(0);
}

test.describe('Post-login success card and redirect (issues #150, #315)', () => {
  test('a sign-in on a page that mounted signed in shows no card and stays on /sign-in', async ({
    page,
  }) => {
    await seedPreloadedAuthToken(page);
    await mockLoginSuccess(page);
    await page.goto(ROUTE_PATHS.signIn);

    // Without observing the request, this test would also pass if the login never fired at all —
    // the URL holding on /sign-in is exactly what a dead submit button produces.
    const loginRequest = page.waitForRequest(
      (request) => request.url().includes('/api/users') && request.method() === 'POST'
    );

    await submitValidLogin(page);

    expect((await loginRequest).postDataJSON()).toMatchObject({ email: validCredentials.email });

    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(successCardHeading(page)).toHaveCount(0);
    await expect(page.locator('#login-form')).not.toHaveAttribute('inert', '');
  });

  test('a sign-in after signing out shows the success card and waits for Продовжити', async ({
    page,
  }) => {
    await mockLoginSuccess(page);
    await signOutToSignIn(page);

    await submitValidLogin(page);

    await expectSignInSuccessCard(page);
    await expect(page).toHaveURL(/\/sign-in$/);

    await continueButtonOf(page).click();

    await expect(page).toHaveURL(ROUTE_PATHS.home);
    await expectHomeWithMainFocused(page);
  });

  test('Продовжити lands on the preserved protected destination', async ({ page }) => {
    await mockLoginSuccess(page);
    await signOutToSignIn(page);
    await bounceFromProtectedDestination(page, PRESERVED_DESTINATION);

    await submitValidLogin(page);
    await expectSignInSuccessCard(page);
    await continueButtonOf(page).click();

    await expect(page).toHaveURL(PRESERVED_DESTINATION);
    await expectHomeWithMainFocused(page);
  });

  test('a failed login shows the error card and never leaves /sign-in', async ({ page }) => {
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });

    await signOutToSignIn(page);
    await submitValidLogin(page);

    await expectSignInErrorCard(page, signInErrorMessages.invalidCredentials);
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(successCardHeading(page)).toHaveCount(0);
  });
});
