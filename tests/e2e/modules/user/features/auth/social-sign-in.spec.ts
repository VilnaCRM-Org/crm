import type { Page } from '@playwright/test';

import { buildUserId } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { challengeHeadingOf, codeCellsOf, typeCode } from '@tests/e2e/utils/reach-challenge';
import { bounceFromProtectedDestination, signOutToSignIn } from '@tests/e2e/utils/sign-out';
import {
  answerComplete,
  answerInitiate,
  E2E_STATE,
  refused,
  refuseInitiate,
  signedIn,
  twoFactor,
  unreachableComplete,
} from '@tests/e2e/utils/social-sign-in-stubs';
import { stubChallenge } from '@tests/e2e/utils/two-factor-responses';

const errorTitle = (provider: string): string => t('auth.social.error.title', { provider });
const tryAgain = t('auth.social.try_again');
const backToSignIn = t('auth.social.back_to_sign_in');
const button = (provider: string): string => t('auth.oauth.continue_with', { provider });
const PROTECTED_DESTINATION = '/?tab=deals#pipeline';

async function signInWith(page: Page, provider: string, from = '/sign-in'): Promise<void> {
  await page.goto(from);
  await page.getByRole('button', { name: button(provider) }).click();
}

test.describe('Social sign-in', () => {
  for (const [label, provider] of [
    ['Google', 'google'],
    ['GitHub', 'github'],
    ['Facebook', 'facebook'],
    ['Twitter', 'twitter'],
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
    const initiated = await answerInitiate(page, 'e2e-code');
    const completed = await answerComplete(page, signedIn());

    await signInWith(page, 'Google', '/sign-up');

    await expect(page).toHaveURL(/\/$/);
    expect(initiated.map((input) => input.provider)).toEqual(['google']);
    expect(completed).toEqual([
      expect.objectContaining({ provider: 'google', code: 'e2e-code', state: E2E_STATE }),
    ]);
  });

  test('strips the code and state from the address bar', async ({ page }) => {
    await answerInitiate(page, 'secret-code');
    await answerComplete(page, refused(422, 'state_expired'));

    await signInWith(page, 'Google');

    await expect(page.getByRole('heading', { level: 1, name: errorTitle('Google') })).toBeVisible();
    expect(page.url()).not.toContain('secret');
    expect(page.url()).not.toContain(E2E_STATE);
  });

  test('refuses a cancel for a state this tab never started', async ({ page }) => {
    await page.goto(`/auth/callback/github?error=access_denied&state=${E2E_STATE}`);

    await expect(
      page.getByRole('status').filter({ hasText: t('auth.social.error.expired') })
    ).toBeVisible();
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
    ['missing_oauth_parameters', 400, 'missing_parameters', true],
    ['unsupported_provider', 400, 'unsupported_provider', false],
    ['an_unmapped_code', 422, 'generic', true],
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
    await answerInitiate(page, 'unused', 'error=access_denied');
    const completed = await answerComplete(page, signedIn());

    await signInWith(page, 'GitHub');

    await expect(
      page
        .getByRole('status')
        .filter({ hasText: t('auth.social.error.cancelled', { provider: 'GitHub' }) })
    ).toBeVisible();
    expect(completed).toHaveLength(0);
  });

  test('hands a 2FA account to the challenge and lands it on the page it came from', async ({
    page,
  }) => {
    const pendingSessionId = buildUserId();
    await answerInitiate(page, 'e2e-code');
    await answerComplete(page, twoFactor(pendingSessionId));
    const challenge = await stubChallenge(page);
    await signOutToSignIn(page);
    await bounceFromProtectedDestination(page, PROTECTED_DESTINATION);

    await page.getByRole('button', { name: button('Google') }).click();

    await expect(page).toHaveURL(/\/sign-in\/two-factor$/);
    await expect(challengeHeadingOf(page)).toBeVisible();
    await expect(codeCellsOf(page).first()).toBeFocused();
    await expect(page.getByRole('heading', { level: 1, name: errorTitle('Google') })).toHaveCount(
      0
    );

    await typeCode(page, '246810');

    await expect(page).toHaveURL(PROTECTED_DESTINATION);
    await expect(page.getByRole('main')).toBeFocused();
    expect(challenge.calls[0]?.variables['input']).toMatchObject({
      pendingSessionId,
      twoFactorCode: '246810',
    });
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

    await expect.poll(() => initiated.map((input) => input.provider)).toEqual(['google', 'google']);
  });

  test.describe('dropped connection', () => {
    test.use({ allowedConsoleErrors: [/^\[JavaScript Error: "Cross-Origin Request Blocked:/] });

    test('explains a completion user-service could not be reached for', async ({ page }) => {
      await answerInitiate(page, 'e2e-code');
      await unreachableComplete(page);

      await signInWith(page, 'Google');

      await expect(
        page
          .getByRole('status')
          .filter({ hasText: t('auth.social.error.unavailable', { provider: 'Google' }) })
      ).toBeVisible();
      await expect(page.getByRole('button', { name: tryAgain })).toHaveCount(1);
    });
  });

  test('refuses an unknown provider without asking user-service', async ({ page }) => {
    const initiated = await answerInitiate(page, 'e2e-code');

    await page.goto('/auth/callback/unknown');

    await expect(
      page.getByRole('status').filter({
        hasText: t('auth.social.error.unsupported_provider', {
          provider: t('auth.social.provider_fallback'),
        }),
      })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: tryAgain })).toHaveCount(0);
    await expect(page.getByRole('link', { name: backToSignIn })).toHaveAttribute(
      'href',
      '/sign-in'
    );
    expect(initiated).toHaveLength(0);
  });

  test('returns to the protected page a signed-out visitor was sent away from', async ({
    page,
  }) => {
    await answerInitiate(page, 'e2e-code');
    await answerComplete(page, signedIn());
    await signOutToSignIn(page);
    await bounceFromProtectedDestination(page, PROTECTED_DESTINATION);

    await page.getByRole('button', { name: button('Google') }).click();

    await expect(page).toHaveURL(PROTECTED_DESTINATION);
    await expect(page.locator('main')).toBeFocused();
  });

  test('never starts again on Back to a failed start', async ({ page }) => {
    const initiated = await refuseInitiate(page, 503, 'provider_unavailable');
    await signInWith(page, 'Google');
    await expect(page.getByRole('heading', { level: 1, name: errorTitle('Google') })).toBeFocused();
    await page.getByRole('link', { name: backToSignIn }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.goBack();

    await expect(
      page
        .getByRole('status')
        .filter({ hasText: t('auth.social.error.missing_parameters', { provider: 'Google' }) })
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: errorTitle('Google') })).toBeFocused();
    expect(initiated).toHaveLength(1);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: tryAgain })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect.poll(() => initiated).toHaveLength(2);
  });

  test('goes back to sign-in from the error view', async ({ page }) => {
    await answerInitiate(page, 'e2e-code');
    await answerComplete(page, refused(409, 'duplicate_email'));
    await signInWith(page, 'Google');

    await page.getByRole('link', { name: backToSignIn }).click();

    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
