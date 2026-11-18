import { buildUserId } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  answerCallback,
  answerInitiate,
  problem,
  signedIn,
} from '@tests/e2e/utils/social-sign-in-stubs';

const errorTitle = (provider: string): string => t('auth.social.error.title', { provider });
const tryAgain = t('auth.social.try_again');
const backToSignIn = t('auth.social.back_to_sign_in');

test.describe('Social sign-in', () => {
  for (const [label, provider] of [
    ['Google', 'google'],
    ['GitHub', 'github'],
  ] as const) {
    test(`signs in with ${label} from /sign-in in the same tab`, async ({ page }) => {
      const initiated = await answerInitiate(page, 'e2e-code');
      const relayed = await answerCallback(page, 200, signedIn());
      await page.goto('/sign-in');

      await page
        .getByRole('button', { name: t('auth.oauth.continue_with', { provider: label }) })
        .click();

      await expect(page).toHaveURL(/\/$/);
      expect(initiated).toEqual([provider]);
      expect(relayed).toHaveLength(1);
      expect(new URL(relayed[0] ?? '').searchParams.get('code')).toBe('e2e-code');
      await expect(page.locator('main')).toBeFocused();
    });
  }

  test('signs in from /sign-up as well', async ({ page }) => {
    await answerInitiate(page, 'e2e-code');
    await answerCallback(page, 200, signedIn());
    await page.goto('/sign-up');

    await page
      .getByRole('button', { name: t('auth.oauth.continue_with', { provider: 'Google' }) })
      .click();

    await expect(page).toHaveURL(/\/$/);
  });

  test('returns to the protected page that sent the user to sign in', async ({ page }) => {
    await answerInitiate(page, 'e2e-code');
    await answerCallback(page, 200, signedIn());
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/sign-in$/);

    await page
      .getByRole('button', { name: t('auth.oauth.continue_with', { provider: 'GitHub' }) })
      .click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.locator('main')).toBeFocused();
  });

  test('strips the code and state from the address bar', async ({ page }) => {
    await answerCallback(page, 422, problem(422, 'state_expired'));

    await page.goto('/auth/callback/google?code=secret-code&state=secret-state');

    await expect(page.getByRole('heading', { level: 1, name: errorTitle('Google') })).toBeVisible();
    expect(page.url()).not.toContain('secret');
  });

  for (const [errorCode, status, messageKey, retryable] of [
    ['state_expired', 422, 'expired', true],
    ['invalid_state', 422, 'expired', true],
    ['unverified_provider_email', 422, 'email_unverified', true],
    ['provider_email_unavailable', 422, 'email_unavailable', true],
    ['provider_unavailable', 503, 'unavailable', true],
    ['duplicate_email', 409, 'duplicate_email', false],
    ['provider_mismatch', 400, 'provider_mismatch', false],
  ] as const) {
    test(`explains ${errorCode} and offers the right way out`, async ({ page }) => {
      await answerCallback(page, status, problem(status, errorCode));

      await page.goto(`/auth/callback/google?code=c&state=${errorCode}`);

      await expect(
        page.getByRole('heading', { level: 1, name: errorTitle('Google') })
      ).toBeFocused();
      await expect(
        page
          .getByRole('status')
          .filter({ hasText: t(`auth.social.error.${messageKey}`, { provider: 'Google' }) })
      ).toBeVisible();
      await expect(page.getByRole('button', { name: tryAgain })).toHaveCount(retryable ? 1 : 0);
      await expect(page.getByRole('link', { name: backToSignIn })).toHaveAttribute(
        'href',
        '/sign-in'
      );
    });
  }

  test('shows a cancelled sign-in without calling user-service', async ({ page }) => {
    const relayed = await answerCallback(page, 200, signedIn());

    await page.goto('/auth/callback/github?error=access_denied&state=s');

    await expect(
      page
        .getByRole('status')
        .filter({ hasText: t('auth.social.error.cancelled', { provider: 'GitHub' }) })
    ).toBeVisible();
    expect(relayed).toHaveLength(0);
  });

  test('tells a 2FA account to finish with its password', async ({ page }) => {
    await answerCallback(page, 200, { '2fa_enabled': true, pending_session_id: buildUserId() });

    await page.goto('/auth/callback/google?code=c&state=two-factor');

    await expect(
      page.getByRole('status').filter({ hasText: t('auth.social.error.two_factor_required') })
    ).toBeVisible();
  });

  test('retries the same provider with the keyboard only', async ({ page }) => {
    await answerCallback(page, 503, problem(503, 'provider_unavailable'));
    const initiated = await answerInitiate(page, 'second-code');
    await page.goto('/auth/callback/google?code=c&state=retry');
    await expect(page.getByRole('heading', { level: 1, name: errorTitle('Google') })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: tryAgain })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: backToSignIn })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');

    await expect.poll(() => initiated).toEqual(['google']);
  });

  test('goes back to sign-in from the error view', async ({ page }) => {
    await answerCallback(page, 409, problem(409, 'duplicate_email'));
    await page.goto('/auth/callback/google?code=c&state=back');

    await page.getByRole('link', { name: backToSignIn }).click();

    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
