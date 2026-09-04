import { test, expect, type Page, type Route } from '@playwright/test';

import { buildCredentials } from '@tests/builders';

import fillInput from '../../../../utils/fill-input';
import { t } from '../../../../utils/initialize-localization';

const SIGN_IN_URL = '/sign-in';
const LOGIN_API_URL = '**/api/users';

const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

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

test.describe('Post-login redirect stays transition-only (issue #150)', () => {
  // The prod test build bakes the LHCI preloaded auth token, so every page load is
  // already authenticated; the unauthenticated bounce-and-return path is pinned by
  // unit tests until issue #158 gates the seed out of production builds.
  test('a login while already authenticated never navigates away from /sign-in', async ({
    page,
  }) => {
    await mockLoginSuccess(page);

    await page.goto(SIGN_IN_URL);

    // Without observing the request, this test would also pass if the login never fired at all —
    // the URL holding on /sign-in is exactly what a dead submit button produces.
    const loginRequest = page.waitForRequest(
      (request) => request.url().includes('/api/users') && request.method() === 'POST'
    );

    await submitValidLogin(page);

    expect((await loginRequest).postDataJSON()).toMatchObject({ email: validCredentials.email });

    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('lands back on /sign-in without redirect after a failed login', async ({ page }) => {
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });

    await page.goto(SIGN_IN_URL);
    await submitValidLogin(page);

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
