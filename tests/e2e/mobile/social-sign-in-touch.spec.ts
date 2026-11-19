import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  answerComplete,
  answerInitiate,
  refused,
  signedIn,
} from '@tests/e2e/utils/social-sign-in-stubs';

import expectTouchTarget from './utils/touch-target';

test.describe('Social sign-in on a touch device', () => {
  test('a tap on Google signs in through the same tab', async ({ page }) => {
    const initiated = await answerInitiate(page, 'touch-code');
    await answerComplete(page, signedIn());
    await page.goto('/sign-in');

    await page
      .getByRole('button', { name: t('auth.oauth.continue_with', { provider: 'Google' }) })
      .tap();

    await expect(page).toHaveURL(/\/$/);
    expect(initiated.map((input) => input.provider)).toEqual(['google']);
  });

  test('the callback error actions meet the 44 px touch floor', async ({ page }) => {
    await answerInitiate(page, 'touch-code');
    await answerComplete(page, refused(422, 'state_expired'));
    await page.goto('/sign-in');
    await page
      .getByRole('button', { name: t('auth.oauth.continue_with', { provider: 'Google' }) })
      .tap();
    await expect(page.getByRole('button', { name: t('auth.social.try_again') })).toBeVisible();

    await expectTouchTarget(
      page.getByRole('button', { name: t('auth.social.try_again') }),
      'try again button'
    );
    await expectTouchTarget(
      page.getByRole('link', { name: t('auth.social.back_to_sign_in') }),
      'back to sign-in link'
    );
  });
});
