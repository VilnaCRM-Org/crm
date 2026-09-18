import { type Page, type Route } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';

import fillInput from '../../../../../../../utils/fill-input';
import { t } from '../../../../../../../utils/initialize-localization';

const LOGIN_URL = '/sign-in';
const LOGIN_API_URL = '**/api/users';

const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

const validCredentials = buildCredentials();

async function submitValidLogin(page: Page): Promise<void> {
  await page.goto(LOGIN_URL);
  await fillInput(page.getByPlaceholder(emailPlaceholder), validCredentials.email);
  await fillInput(page.getByPlaceholder(passwordPlaceholder), validCredentials.password);
  await page.locator('button', { hasText: submitLabel }).click();
}

function isPostLogin(route: Route): boolean {
  return route.request().method() === 'POST';
}

const loginToken = (): { status: number; contentType: string; body: string } => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ token: 'e2e-login-token' }),
});

const unavailable = (): { status: number; contentType: string; body: string } => ({
  status: 503,
  contentType: 'application/json',
  body: JSON.stringify({ message: 'Service unavailable' }),
});

// The login POST opts in to the retry policy (issue #147): a transport failure or a 5xx is
// retried with backoff before the error banner appears, and a permanent failure is not.
test.describe('Login request retry (issue #147)', () => {
  test('recovers from a dropped connection on the first attempt', async ({ page }) => {
    let posts = 0;
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      posts += 1;
      return posts === 1 ? route.abort('failed') : route.fulfill(loginToken());
    });

    await submitValidLogin(page);

    await expect.poll(() => posts).toBe(2);
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  });

  test('retries a 503 twice and settles on the third answer', async ({ page }) => {
    let posts = 0;
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      posts += 1;
      return route.fulfill(posts < 3 ? unavailable() : loginToken());
    });

    await submitValidLogin(page);

    await expect.poll(() => posts).toBe(3);
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  });

  test('shows the error banner after the third transient failure', async ({ page }) => {
    let posts = 0;
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      posts += 1;
      return route.fulfill(unavailable());
    });

    await submitValidLogin(page);

    await expect(page.locator('[role="alert"]')).toBeVisible();
    expect(posts).toBe(3);
  });

  test('does not retry a permanent 401', async ({ page }) => {
    let posts = 0;
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      posts += 1;
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });

    await submitValidLogin(page);

    await expect(page.locator('[role="alert"]')).toBeVisible();
    expect(posts).toBe(1);
  });
});
