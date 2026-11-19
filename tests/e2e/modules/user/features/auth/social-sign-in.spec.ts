import type { Page } from '@playwright/test';

import { buildUserId } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  answerComplete,
  answerInitiate,
  E2E_STATE,
  refused,
  signedIn,
  twoFactor,
} from '@tests/e2e/utils/social-sign-in-stubs';

const errorTitle = (provider: string): string => t('auth.social.error.title', { provider });
const tryAgain = t('auth.social.try_again');
const backToSignIn = t('auth.social.back_to_sign_in');
const button = (provider: string): string => t('auth.oauth.continue_with', { provider });

async function signInWith(page: Page, provider: string, from = '/sign-in'): Promise<void> {
  await page.goto(from);
  await page.getByRole('button', { name: button(provider) }).click();
}

test.describe('Social sign-in', () => {
  for (const [label, provider] of [
    ['Google', 'google'],
    ['GitHub', 'github'],
  ] as const) {
    test(`signs in with ${label} from /sign-in in the same tab`, async ({ page }) => {
      const initiated = await answerInitiate(page, 'e2e-code');
      const completed = await answerComplete(page, signedIn());

      await signInWith(page, label);

      await expect(page).toHaveURL(/\/$/);
      expect(initiated.map((input) => input.provider)).toEqual([provider]);
      expect(completed).toEqual([
        expect.objectContaining({ provider, code: 'e2e-code', state: E2E_STATE }),
      ]);
      await expect(page.locator('main')).toBeFocused();
    });
  }

  test('signs in from /sign-up as well', async ({ page }) => {
    await answerInitiate(page, 'e2e-code');
    await answerComplete(page, signedIn());

    await signInWith(page, 'Google', '/sign-up');

    await expect(page).toHaveURL(/\/$/);
  });

  test('strips the code and state from the address bar', async ({ page }) => {
    await answerInitiate(page, 'secret-code');
    await answerComplete(page, refused(422, 'state_expired'));

    await signInWith(page, 'Google');

    await expect(page.getByRole('heading', { level: 1, name: errorTitle('Google') })).toBeVisible();
    expect(page.url()).not.toContain('secret');
    expect(page.url()).not.toContain(E2E_STATE);
  });

  test('refuses a callback for a state this tab never started', async ({ page }) => {
    const completed = await answerComplete(page, signedIn());

    await page.goto('/auth/callback/google?code=c&state=forged');

    await expect(
      page.getByRole('status').filter({ hasText: t('auth.social.error.expired') })
    ).toBeVisible();
    expect(completed).toHaveLength(0);
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
      await answerInitiate(page, 'e2e-code');
      await answerComplete(page, refused(status, errorCode));

      await signInWith(page, 'Google');

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

  test('shows a cancelled sign-in without completing it', async ({ page }) => {
    const completed = await answerComplete(page, signedIn());

    await page.goto(`/auth/callback/github?error=access_denied&state=${E2E_STATE}`);

    await expect(
      page
        .getByRole('status')
        .filter({ hasText: t('auth.social.error.cancelled', { provider: 'GitHub' }) })
    ).toBeVisible();
    expect(completed).toHaveLength(0);
  });

  test('tells a 2FA account to finish with its password', async ({ page }) => {
    await answerInitiate(page, 'e2e-code');
    await answerComplete(page, twoFactor(buildUserId()));

    await signInWith(page, 'Google');

    await expect(
      page.getByRole('status').filter({ hasText: t('auth.social.error.two_factor_required') })
    ).toBeVisible();
  });

  test('retries the same provider with the keyboard only', async ({ page }) => {
    const initiated = await answerInitiate(page, 'e2e-code');
    await answerComplete(page, refused(503, 'provider_unavailable'));
    await signInWith(page, 'Google');
    await expect(page.getByRole('heading', { level: 1, name: errorTitle('Google') })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: tryAgain })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: backToSignIn })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');

    await expect.poll(() => initiated.length).toBe(2);
  });

  test('goes back to sign-in from the error view', async ({ page }) => {
    await answerInitiate(page, 'e2e-code');
    await answerComplete(page, refused(409, 'duplicate_email'));
    await signInWith(page, 'Google');

    await page.getByRole('link', { name: backToSignIn }).click();

    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
