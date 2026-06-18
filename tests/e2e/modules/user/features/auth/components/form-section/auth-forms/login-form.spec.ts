import { test, expect, type Page, type Route } from '@playwright/test';

import fillInput from '../../../../../../../utils/fill-input';
import { t } from '../../../../../../../utils/initialize-localization';

const AUTH_URL = '/authentication';
const LOGIN_API_URL = '**/api/users';

const switcherToLogin: string = t('sign_up.form.switcher_text_have_account');
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

const validCredentials = { email: 'user@example.com', password: 'Q9validPassword1' };

async function gotoLogin(page: Page): Promise<void> {
  await page.goto(AUTH_URL);
  await page.locator('button', { hasText: switcherToLogin }).click();
}

async function fillValidLogin(page: Page): Promise<ReturnType<Page['locator']>> {
  await fillInput(page.getByPlaceholder(emailPlaceholder), validCredentials.email);
  await fillInput(page.getByPlaceholder(passwordPlaceholder), validCredentials.password);
  return page.locator('button', { hasText: submitLabel });
}

function isPostLogin(route: Route): boolean {
  return route.request().method() === 'POST';
}

test.describe('Login Form loader behaviour', () => {
  test('shows the in-button busy state and aria-busy while the request is in flight', async ({
    page,
  }) => {
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      await inFlight;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveClass(/MuiButton-loading/);
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');

    release();
  });

  test('does not submit a second time while the button is loading', async ({ page }) => {
    let postCount = 0;
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      postCount += 1;
      await inFlight;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();
    await expect(submitButton).toBeDisabled();
    await submitButton.click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);

    expect(postCount).toBe(1);
    release();
  });

  test('re-enables the button, clears aria-busy, and focuses the error banner on failure', async ({
    page,
  }) => {
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
    await expect(submitButton).toBeEnabled();

    const focusLandedOnBanner = await page.evaluate(() => {
      const active = document.activeElement;
      if (active === null || active === document.body) return false;
      const isAlert = active.closest('[role="alert"]') !== null;
      const wrapsAlert = active.querySelector('[role="alert"]') !== null;
      return isAlert || wrapsAlert;
    });
    expect(focusLandedOnBanner).toBe(true);
  });
});
