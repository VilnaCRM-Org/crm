import { test, expect } from '@playwright/test';

import { t } from '../../../../utils/initialize-localization';

const SIGN_UP_URL = '/sign-up';
const SIGN_IN_URL = '/sign-in';

const toSignInLabel: string = t('sign_up.form.switcher_text_have_account');
const toSignUpLabel: string = t('sign_up.form.switcher_text_no_account');

type ReloadMarkedWindow = Window & { __noReloadMarker?: boolean };

test.describe('Auth swap-link navigation', () => {
  test('navigates /sign-up → /sign-in client-side without a full reload', async ({ page }) => {
    await page.goto(SIGN_UP_URL);
    await page.evaluate(() => {
      (window as ReloadMarkedWindow).__noReloadMarker = true;
    });

    const link = page.locator(`a[href="${SIGN_IN_URL}"]`).filter({ hasText: toSignInLabel });
    await expect(link).toHaveCount(1);

    await link.click();
    await expect(page).toHaveURL(/\/sign-in$/);

    const survivedNavigation = await page.evaluate(
      () => (window as ReloadMarkedWindow).__noReloadMarker === true
    );
    expect(survivedNavigation).toBe(true);
  });

  test('navigates /sign-in → /sign-up client-side without a full reload', async ({ page }) => {
    await page.goto(SIGN_IN_URL);
    await page.evaluate(() => {
      (window as ReloadMarkedWindow).__noReloadMarker = true;
    });

    const link = page.locator(`a[href="${SIGN_UP_URL}"]`).filter({ hasText: toSignUpLabel });
    await expect(link).toHaveCount(1);

    await link.click();
    await expect(page).toHaveURL(/\/sign-up$/);

    const survivedNavigation = await page.evaluate(
      () => (window as ReloadMarkedWindow).__noReloadMarker === true
    );
    expect(survivedNavigation).toBe(true);
  });
});
