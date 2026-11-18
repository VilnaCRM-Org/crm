import { test, expect } from '@playwright/test';

import { t } from '@tests/e2e/utils/initialize-localization';
import { answerCallback, answerInitiate, signedIn } from '@tests/e2e/utils/social-sign-in-stubs';

test.describe('Social sign-in on a touch device', () => {
  test('a tap on Google signs in through the same tab', async ({ page }) => {
    const initiated = await answerInitiate(page, 'touch-code');
    await answerCallback(page, 200, signedIn());
    await page.goto('/sign-in');

    await page
      .getByRole('button', { name: t('auth.oauth.continue_with', { provider: 'Google' }) })
      .tap();

    await expect(page).toHaveURL(/\/$/);
    expect(initiated).toEqual(['google']);
  });

  test('the callback error actions meet the 44 px touch floor', async ({ page }) => {
    await answerCallback(page, 422, { status: 422, error_code: 'state_expired' });
    await page.goto('/auth/callback/google?code=c&state=touch');

    for (const action of [
      page.getByRole('button', { name: t('auth.social.try_again') }),
      page.getByRole('link', { name: t('auth.social.back_to_sign_in') }),
    ]) {
      const box = await action.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});
