import type { Page, Route } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectTabOrder } from '@tests/utils/a11y/keyboard';

const LOGIN_API_URL = '**/api/users';

const backToMainLabel: string = t('buttons.back_to_main');
const showPasswordLabel: string = t('auth.password.show');
const rememberMeLabel: string = t('sign_in.form.remember_me');
const submitLabel: string = t('sign_in.form.submit_button');

const credentials = buildCredentials();

async function openSignIn(page: Page): Promise<void> {
  await page.goto(ROUTE_PATHS.signIn, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
}

function isPostLogin(route: Route): boolean {
  return route.request().method() === 'POST';
}

test.describe('Sign-in form keyboard contract (issue #118)', () => {
  test.beforeEach(async ({ page }) => {
    await openSignIn(page);
  });

  test('Tab visits the controls in reading order with a visible focus indicator', async ({
    page,
  }) => {
    await expectTabOrder(page, [
      { locator: page.getByRole('link', { name: backToMainLabel }), visibleFocus: true },
      { locator: page.locator('#email'), visibleFocus: true },
      { locator: page.locator('#password'), visibleFocus: true },
      { locator: page.getByRole('button', { name: showPasswordLabel }) },
      { locator: page.getByRole('checkbox', { name: rememberMeLabel }) },
      { locator: page.getByRole('button', { name: submitLabel }), visibleFocus: true },
    ]);
  });

  test('the back-to-main link paints a 2px dark focus ring from the keyboard', async ({ page }) => {
    const backToMain = page.getByRole('link', { name: backToMainLabel });

    await page.keyboard.press('Tab');

    await expect(backToMain).toBeFocused();
    await expect(backToMain).toHaveCSS('outline-style', 'solid');
    await expect(backToMain).toHaveCSS('outline-width', '2px');
    await expect(backToMain).toHaveCSS('outline-color', 'rgb(26, 28, 30)');
  });

  test('the remember-me box paints a 2px dark focus ring from the keyboard', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: rememberMeLabel });
    const box = checkbox.locator('..').locator('.ui-checkbox-box');

    await page.getByRole('button', { name: showPasswordLabel }).focus();
    await page.keyboard.press('Tab');

    await expect(checkbox).toBeFocused();
    await expect(box).toHaveCSS('outline-style', 'solid');
    await expect(box).toHaveCSS('outline-width', '2px');
    await expect(box).toHaveCSS('outline-color', 'rgb(64, 65, 66)');
    await expect(box).toHaveCSS('outline-offset', '2px');
  });

  test('the remember-me box paints no focus ring after a pointer click', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: rememberMeLabel });

    await checkbox.click();

    await expect(checkbox).toBeChecked();
    await expect(checkbox.locator('..').locator('.ui-checkbox-box')).toHaveCSS(
      'outline-style',
      'none'
    );
  });

  test('Space toggles the password visibility from the keyboard', async ({ page }) => {
    const password = page.locator('#password');
    const toggle = page.getByRole('button', { name: showPasswordLabel });

    await toggle.focus();
    await page.keyboard.press('Space');

    await expect(password).toHaveAttribute('type', 'text');
  });

  test('Enter in the password field submits the form', async ({ page }) => {
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    const login = page.waitForRequest(
      (request) => request.url().includes('/api/users') && request.method() === 'POST'
    );

    await page.locator('#email').fill(credentials.email);
    await page.locator('#password').fill(credentials.password);
    await page.locator('#password').press('Enter');

    expect((await login).postDataJSON()).toMatchObject({ email: credentials.email });
  });

  test('an empty submission moves the error into the accessibility tree', async ({ page }) => {
    await page.getByRole('button', { name: submitLabel }).focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#email')).toHaveAccessibleDescription(/./);
  });
});
