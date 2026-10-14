import type { Page, Route } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildResetToken } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectTabOrder } from '@tests/utils/a11y/keyboard';

const GRAPHQL_URL = '**/graphql';
const EMAIL = 'eirene@gmail.com';

const backToMainLabel: string = t('buttons.back_to_main');
const backLabel: string = t('password_recovery.back');
const submitLabel: string = t('password_recovery.submit_button');
const toSignIn: string = t('password_recovery.sent.to_sign_in');
const sentTitle: string = t('password_recovery.sent.title');
const tryAgain: string = t('auth.error.tryAgain');
const resetTitle: string = t('password_reset.title');
const newPasswordLabel: string = t('password_reset.new_password.label');
const showPasswordLabel: string = t('auth.password.show');
const invalidTitle: string = t('password_reset.invalid.title');
const requestNew: string = t('password_reset.invalid.request_new');

async function answerReset(page: Page, answer: (route: Route) => Promise<void>): Promise<void> {
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    if (body.operationName !== 'RequestPasswordReset') return route.fallback();
    return answer(route);
  });
}

async function openRequestForm(page: Page): Promise<void> {
  await page.goto(ROUTE_PATHS.passwordRecovery, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
}

async function openNewPasswordForm(page: Page): Promise<void> {
  await page.goto(`${ROUTE_PATHS.passwordReset}?token=${buildResetToken()}`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.getByRole('heading', { level: 1, name: resetTitle })).toBeVisible();
  await expect(page.getByLabel(newPasswordLabel)).toBeVisible();
}

async function expectDarkRing(page: Page, name: string): Promise<void> {
  const target = page.getByRole('button', { name });
  await expect(target).toBeFocused();
  await expect(target).toHaveCSS('outline-style', 'solid');
  await expect(target).toHaveCSS('outline-width', '2px');
  await expect(target).toHaveCSS('outline-color', 'rgb(64, 65, 66)');
}

test.describe('Password recovery keyboard contract (issue #315)', () => {
  test('the request form is operable in reading order', async ({ page }) => {
    await openRequestForm(page);

    await expectTabOrder(page, [
      { locator: page.getByRole('link', { name: backToMainLabel }), visibleFocus: true },
      { locator: page.getByRole('link', { name: backLabel }), visibleFocus: true },
      { locator: page.locator('#email'), visibleFocus: true },
      { locator: page.getByRole('button', { name: submitLabel }), visibleFocus: true },
    ]);
    await expect(page.getByRole('link', { name: backLabel })).toHaveCSS('color', 'rgb(64, 65, 66)');
  });

  test('an empty submit moves focus to the invalid e-mail field', async ({ page }) => {
    await openRequestForm(page);

    await page.getByRole('button', { name: submitLabel }).press('Enter');

    const email = page.locator('#email');
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute('aria-describedby', /email-helper-text/);
  });

  test('Retry is the next Tab stop after a transient banner', async ({ page }) => {
    await answerReset(page, (route) => route.fulfill({ status: 503, body: '' }));
    await openRequestForm(page);
    await page.locator('#email').fill(EMAIL);
    await page.getByRole('button', { name: submitLabel }).press('Enter');
    await expect(page.getByRole('alert')).toBeVisible();

    await page.keyboard.press('Tab');

    await expectDarkRing(page, tryAgain);
  });

  test('the sent step focuses its heading and leads to sign-in', async ({ page }) => {
    await answerReset(page, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { requestPasswordResetUser: null } }),
      })
    );
    await openRequestForm(page);
    await page.locator('#email').fill(EMAIL);
    await page.getByRole('button', { name: submitLabel }).press('Enter');

    await expect(page.getByRole('heading', { level: 1, name: sentTitle })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: backLabel })).toBeFocused();
    await page.keyboard.press('Tab');
    const link = page.getByRole('link', { name: toSignIn });
    await expect(link).toBeFocused();

    await link.press('Enter');

    await expect(page).toHaveURL(ROUTE_PATHS.signIn);
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('the new-password form is operable in reading order', async ({ page }) => {
    await openNewPasswordForm(page);
    const toggles = page.getByRole('button', { name: showPasswordLabel });
    await expect(toggles).toHaveCount(2);

    await expectTabOrder(page, [
      { locator: page.getByRole('link', { name: backToMainLabel }), visibleFocus: true },
      { locator: page.getByRole('link', { name: backLabel }), visibleFocus: true },
      { locator: page.locator('#newPassword'), visibleFocus: true },
      { locator: toggles.nth(0), visibleFocus: true },
      { locator: page.locator('#confirmPassword'), visibleFocus: true },
      { locator: toggles.nth(1), visibleFocus: true },
      { locator: page.getByRole('button', { name: submitLabel }), visibleFocus: true },
    ]);
  });

  test('Space toggles the new password visibility', async ({ page }) => {
    await openNewPasswordForm(page);
    const toggle = page.getByRole('button', { name: showPasswordLabel }).first();

    await toggle.focus();
    await page.keyboard.press('Space');

    await expect(page.locator('#newPassword')).toHaveAttribute('type', 'text');
  });

  test('the invalid-link state is operable in reading order', async ({ page }) => {
    await page.goto(ROUTE_PATHS.passwordReset, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: invalidTitle })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('link', { name: backLabel })).toBeFocused();

    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: requestNew })).toBeFocused();
  });
});
