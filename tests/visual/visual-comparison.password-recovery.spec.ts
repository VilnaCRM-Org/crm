import { expect, test, type Page, type Route } from '@playwright/test';

import { buildResetToken } from '@tests/builders';
import { t } from '@tests/e2e/utils/initialize-localization';

import { currentLanguage, notFoundScreens, PAGES, type ScreenSize, screenSizes } from './constants';
import stabilizePage from './stabilize-page';
import waitForStableDom from './wait-for-stable-dom';

const GRAPHQL_URL = '**/graphql';
const CARD = '#auth-form-card';
const CARD_WIDTHS: ReadonlyArray<readonly [number, number]> = [
  [1440, 502],
  [1024, 632],
  [375, 363],
];

const resetTitle: string = t('password_reset.title');
const newPasswordLabel: string = t('password_reset.new_password.label');
const confirmLabel: string = t('password_reset.confirm_password.label');
const invalidTitle: string = t('password_reset.invalid.title');
const sentTitle: string = t('password_recovery.sent.title');
const submitLabel: string = t('password_recovery.submit_button');
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const notice: string = t('sign_in.notices.password_reset');

const resetUrl = (): string => `${PAGES.PASSWORD_RESET}?token=${buildResetToken()}`;

async function takeRecoverySnapshot(page: Page, screen: ScreenSize, name: string): Promise<void> {
  await waitForStableDom(page);
  await expect(page).toHaveScreenshot(`${currentLanguage}_${name}_${screen.name}.png`, {
    fullPage: true,
    animations: 'disabled',
    scale: 'css',
  });
}

async function openNewPasswordForm(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await stabilizePage(page, resetUrl());
  await expect(page.getByRole('heading', { level: 1, name: resetTitle })).toBeVisible();
  await expect(page.getByLabel(newPasswordLabel)).toBeVisible();
}

async function answer(page: Page, operation: string, data: unknown): Promise<void> {
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    if (body.operationName !== operation) return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
  });
}

test.describe.parallel('Password recovery visual tests (issue #315)', () => {
  for (const screen of screenSizes) {
    test(`[password-recovery] request form ${screen.name}`, async ({ page }) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await stabilizePage(page, PAGES.PASSWORD_RECOVERY);
      await expect(page.getByRole('button', { name: submitLabel })).toBeVisible();

      await takeRecoverySnapshot(page, screen, 'request-form');
    });

    test(`[password-reset] new-password form ${screen.name}`, async ({ page }) => {
      await openNewPasswordForm(page, screen);

      await takeRecoverySnapshot(page, screen, 'new-password-form');
    });
  }

  for (const screen of notFoundScreens) {
    test(`[password-recovery] sent step ${screen.name}`, async ({ page }) => {
      await answer(page, 'RequestPasswordReset', { requestPasswordResetUser: null });
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await stabilizePage(page, PAGES.PASSWORD_RECOVERY);
      await page.getByPlaceholder(emailPlaceholder).fill('eirene@gmail.com');
      await page.getByRole('button', { name: submitLabel }).click();
      await expect(page.getByRole('heading', { level: 1, name: sentTitle })).toBeVisible();

      await takeRecoverySnapshot(page, screen, 'sent-step');
    });

    test(`[password-reset] invalid link ${screen.name}`, async ({ page }) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await stabilizePage(page, PAGES.PASSWORD_RESET);
      await expect(page.getByRole('heading', { level: 1, name: invalidTitle })).toBeVisible();

      await takeRecoverySnapshot(page, screen, 'invalid-link');
    });

    test(`[sign-in] password-reset notice ${screen.name}`, async ({ page }) => {
      await answer(page, 'ConfirmPasswordReset', { confirmPasswordResetUser: null });
      await openNewPasswordForm(page, screen);
      await page.getByLabel(newPasswordLabel).fill('Password1');
      await page.getByLabel(confirmLabel).fill('Password1');
      await page.getByRole('button', { name: submitLabel }).click();
      await expect(page.getByRole('status').filter({ hasText: notice })).toBeVisible();

      await takeRecoverySnapshot(page, screen, 'sign-in-notice');
    });
  }

  for (const [width, cardWidth] of CARD_WIDTHS) {
    test(`[password-recovery] card matches sign-in at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await stabilizePage(page, PAGES.SIGN_IN);
      const signInCard = await page.locator(CARD).boundingBox();
      await stabilizePage(page, PAGES.PASSWORD_RECOVERY);
      const recoveryCard = await page.locator(CARD).boundingBox();

      expect(Math.round(recoveryCard?.width ?? 0)).toBe(cardWidth);
      expect(Math.round(recoveryCard?.width ?? 0)).toBe(Math.round(signInCard?.width ?? 0));
    });
  }
});
