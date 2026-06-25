import { test, expect } from '@playwright/test';

import { t } from '../../../../utils/initialize-localization';

const SIGN_UP_URL = '/sign-up';
const SIGN_IN_URL = '/sign-in';

const toSignInLabel: string = t('sign_up.form.switcher_text_have_account');
const toSignUpLabel: string = t('sign_up.form.switcher_text_no_account');

test.describe('Auth swap-link navigation', () => {
  test('navigates from /sign-up to /sign-in via the swap link', async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    const link = page.locator(`a[href="${SIGN_IN_URL}"]`).filter({ hasText: toSignInLabel });
    await expect(link).toHaveCount(1);

    await link.click();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('navigates from /sign-in to /sign-up via the swap link', async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    const link = page.locator(`a[href="${SIGN_UP_URL}"]`).filter({ hasText: toSignUpLabel });
    await expect(link).toHaveCount(1);

    await link.click();
    await expect(page).toHaveURL(/\/sign-up$/);
  });
});
