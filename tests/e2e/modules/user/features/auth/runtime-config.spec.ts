import type { Page, Request, Route } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';

const SIGN_IN_URL = '/sign-in';
const LOGIN_PATH = '/api/users';
const RUNTIME_API_PREFIX = '/runtime-config-api';
const BUILD_TIME_API_ORIGIN = new URL(process.env.REACT_APP_MOCKOON_URL ?? '').origin;

const forgotPasswordLabel: string = t('sign_in.form.forgot_password');

const credentials = buildCredentials();

async function fulfillLogin(route: Route): Promise<void> {
  if (route.request().method() !== 'POST') {
    await route.fallback();
    return;
  }

  await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
}

async function submitSignIn(page: Page): Promise<Request> {
  const login = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith(LOGIN_PATH)
  );

  await page.locator('#email').fill(credentials.email);
  await page.locator('#password').fill(credentials.password);
  await page.locator('#password').press('Enter');

  return login;
}

/**
 * Acceptance criterion 1 of issue #145: the SAME production build artifact runs against two
 * different configurations without a rebuild. Both submission cases below hit the identical served
 * bundle; only the inline runtime-configuration block in the document differs, which is exactly
 * what scripts/render-app-config.js rewrites at container start. The override is observed on the
 * request the page actually issues, because the validated configuration only loads with the first
 * auth action.
 */
test.describe('Runtime configuration', () => {
  test('renders the forgot-password link by default, pointing at the recovery route', async ({
    page,
  }) => {
    await page.goto(SIGN_IN_URL);

    const link = page.getByRole('link', { name: forgotPasswordLabel });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '/password-recovery');
  });

  test('posts sign-in to the build-time API origin under the shipped default', async ({ page }) => {
    await page.route(`**${LOGIN_PATH}`, fulfillLogin);
    await page.goto(SIGN_IN_URL);

    const login = await submitSignIn(page);
    const loginUrl = new URL(login.url());

    expect(loginUrl.origin).toBe(BUILD_TIME_API_ORIGIN);
    expect(loginUrl.pathname).toBe(LOGIN_PATH);
  });

  test('posts sign-in to the runtime-configured API base URL from the same artifact', async ({
    page,
    baseURL,
  }) => {
    const apiBaseUrl = new URL(RUNTIME_API_PREFIX, baseURL).href;
    await overrideRuntimeConfig(page, { apiBaseUrl, flags: {} });
    await page.route(`**${RUNTIME_API_PREFIX}${LOGIN_PATH}`, fulfillLogin);
    await page.goto(SIGN_IN_URL);

    const login = await submitSignIn(page);

    expect(login.url()).toBe(`${apiBaseUrl}${LOGIN_PATH}`);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
