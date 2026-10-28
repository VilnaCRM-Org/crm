import { buildCredentials } from '@tests/builders';
import { expectNoSecrets } from '@tests/e2e/utils/expect-no-secrets';
import { expect, test } from '@tests/e2e/utils/fixtures';
import { submitSignIn, typeCode as typeChallengeCode } from '@tests/e2e/utils/reach-challenge';
import { stubChallenge, stubSignIn } from '@tests/e2e/utils/two-factor-responses';
import {
  NEW_RECOVERY_CODES,
  RECOVERY_CODES,
  SETUP_SECRET,
  SETUP_URI,
  stubConfirm,
  stubDisable,
  stubRegenerate,
  stubSetup,
} from '@tests/e2e/utils/two-factor-settings-responses';

import { replyWithEndedSession, stubProfile } from './utils/profile-stub';
import {
  cancelOf,
  codeListOf,
  codesHeadingOf,
  disableFieldOf,
  disableHeadingOf,
  disableSubmitOf,
  enableTwoFactor,
  openDisableOf,
  openRegenerateOf,
  reauthSignInOf,
  regenerateHeadingOf,
  regenerateSubmitOf,
  sectionOf,
  signInToTwoFactorSettings,
  startOf,
  statusHeadingOf,
  twoFactorText,
} from './utils/two-factor-page';

const SETTINGS_URL = '/settings';
const credentials = buildCredentials();
const SECRETS = {
  secret: SETUP_SECRET,
  uri: SETUP_URI,
  code: RECOVERY_CODES[0] ?? '',
  fresh: NEW_RECOVERY_CODES[0] ?? '',
};
const SHARED_RING = { style: 'solid', width: '2px', color: 'rgb(26, 28, 30)' } as const;

test.describe('Turning two-factor off and regenerating codes (issue #331)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToTwoFactorSettings(page);
    await stubProfile(page);
    await stubSetup(page);
    await stubConfirm(page);
    await page.goto(SETTINGS_URL);
  });

  test('offers the two outlined buttons by name, in that order', async ({ page }) => {
    await enableTwoFactor(page);

    await page.keyboard.press('Tab');
    await expect(openDisableOf(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(openRegenerateOf(page)).toBeFocused();
  });

  test.describe('disable', () => {
    test('opens the confirmation with focus on its title and one labelled field', async ({
      page,
    }) => {
      await enableTwoFactor(page);

      await openDisableOf(page).click();

      await expect(disableHeadingOf(page)).toBeFocused();
      await expect(sectionOf(page).getByText(twoFactorText.disableDescription)).toBeVisible();
      await expect(disableFieldOf(page)).toBeVisible();
      await expect(disableFieldOf(page)).not.toHaveAttribute('placeholder', /.+/);
      await expect(disableSubmitOf(page)).toBeVisible();
      await expect(cancelOf(page)).toBeVisible();
    });

    test('sends 123456 as it is and abcd-2345 as ABCD-2345', async ({ page }) => {
      const disable = await stubDisable(page, ['invalid_code', 'invalid_code']);
      await enableTwoFactor(page);
      await openDisableOf(page).click();

      await disableFieldOf(page).fill('123456');
      await disableSubmitOf(page).click();
      await expect(sectionOf(page).getByText(twoFactorText.invalidCode)).toBeVisible();
      await disableFieldOf(page).fill('abcd-2345');
      await disableSubmitOf(page).click();

      await expect.poll(() => disable.count()).toBe(2);
      expect(disable.calls[0]?.variables).toMatchObject({ input: { twoFactorCode: '123456' } });
      expect(disable.calls[1]?.variables).toMatchObject({ input: { twoFactorCode: 'ABCD-2345' } });
    });

    test('refuses a malformed value and sends nothing', async ({ page }) => {
      const disable = await stubDisable(page);
      await enableTwoFactor(page);
      await openDisableOf(page).click();

      await disableFieldOf(page).fill('12345');
      await disableSubmitOf(page).click();

      await expect(sectionOf(page).getByText(twoFactorText.formatError)).toBeVisible();
      expect(disable.count()).toBe(0);
    });

    test('shows the wrong-code text with aria-invalid and focus in the field', async ({ page }) => {
      await stubDisable(page, ['invalid_code']);
      await enableTwoFactor(page);
      await openDisableOf(page).click();

      await disableFieldOf(page).fill('123456');
      await disableSubmitOf(page).click();

      await expect(sectionOf(page).getByText(twoFactorText.invalidCode)).toBeVisible();
      await expect(disableFieldOf(page)).toHaveAttribute('aria-invalid', 'true');
      await expect(disableFieldOf(page)).toBeFocused();
    });

    test('turns off, shows the off view with its status heading and no codes', async ({ page }) => {
      await stubDisable(page);
      await enableTwoFactor(page);
      await openDisableOf(page).click();

      await disableFieldOf(page).fill('123456');
      await disableSubmitOf(page).click();

      await expect(statusHeadingOf(page, twoFactorText.statusDisabled)).toBeFocused();
      await expect(startOf(page)).toBeVisible();
      await expectNoSecrets(page, SECRETS);
    });

    test('shows the already-off heading when 2FA turns out not to be enabled', async ({ page }) => {
      await stubDisable(page, ['not_enabled']);
      await enableTwoFactor(page);
      await openDisableOf(page).click();

      await disableFieldOf(page).fill('123456');
      await disableSubmitOf(page).click();

      await expect(statusHeadingOf(page, twoFactorText.statusAlreadyOff)).toBeFocused();
    });
  });

  test.describe('regenerate', () => {
    test('opens the confirmation and replaces the codes with eight new ones', async ({ page }) => {
      const regenerate = await stubRegenerate(page);
      await enableTwoFactor(page);

      await openRegenerateOf(page).click();
      await expect(regenerateHeadingOf(page)).toBeFocused();
      await expect(sectionOf(page).getByText(twoFactorText.regenerateDescription)).toBeVisible();
      await regenerateSubmitOf(page).click();

      await expect(codesHeadingOf(page)).toBeFocused();
      await expect(codeListOf(page).getByRole('listitem')).toHaveText([...NEW_RECOVERY_CODES]);
      expect(regenerate.count()).toBe(1);
      await expectNoSecrets(page, SECRETS);
    });

    test('shows the re-authentication message and signs in again back to settings', async ({
      page,
    }) => {
      await stubRegenerate(page, ['reauth_required']);
      await stubSignIn(page, ['challenge']);
      await stubChallenge(page);
      await enableTwoFactor(page);
      await openRegenerateOf(page).click();

      await regenerateSubmitOf(page).click();
      await expect(sectionOf(page).getByText(twoFactorText.reauthMessage)).toBeFocused();
      await reauthSignInOf(page).click();

      await expect(page).toHaveURL(/\/sign-in$/);
      await expect(page.getByText(twoFactorText.sessionEnded)).toHaveCount(0);
      await submitSignIn(page, credentials);
      await typeChallengeCode(page, '123456');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${SETTINGS_URL}$`));
    });

    test('ends the session on a transport 401 with no banner in the section', async ({ page }) => {
      await stubRegenerate(page, [replyWithEndedSession]);
      await enableTwoFactor(page);
      await openRegenerateOf(page).click();

      await regenerateSubmitOf(page).click();

      await expect(page).toHaveURL(/\/sign-in$/);
      await expect(page.getByText(twoFactorText.sessionEnded)).toBeVisible();
    });
  });

  test.describe('cancelling', () => {
    test('returns focus to the disable button after Скасувати', async ({ page }) => {
      await enableTwoFactor(page);
      await openDisableOf(page).click();

      await cancelOf(page).click();

      await expect(openDisableOf(page)).toBeFocused();
    });

    test('returns focus to the regenerate button after Escape', async ({ page }) => {
      await enableTwoFactor(page);
      await openRegenerateOf(page).click();
      await expect(regenerateHeadingOf(page)).toBeFocused();

      await page.keyboard.press('Escape');

      await expect(openRegenerateOf(page)).toBeFocused();
      await expect(regenerateHeadingOf(page)).toHaveCount(0);
    });
  });

  test.describe('failures', () => {
    test('shows the rate-limited banner on disable without Retry or a resend', async ({ page }) => {
      const disable = await stubDisable(page, ['rate_limited']);
      await enableTwoFactor(page);
      await openDisableOf(page).click();

      await disableFieldOf(page).fill('123456');
      await disableSubmitOf(page).click();

      const banner = sectionOf(page)
        .getByRole('alert')
        .filter({ hasText: twoFactorText.rateLimited });
      await expect(banner).toBeFocused();
      await expect(sectionOf(page).getByRole('button', { name: twoFactorText.retry })).toHaveCount(
        0
      );
      await expect(disableFieldOf(page)).toHaveValue('123456');
      expect(disable.count()).toBe(1);
    });

    test('retries a transient disable failure with the code as it is now', async ({ page }) => {
      const disable = await stubDisable(page, ['unavailable', 'disabled']);
      await enableTwoFactor(page);
      await openDisableOf(page).click();
      await disableFieldOf(page).fill('123456');
      await disableSubmitOf(page).click();
      await expect(
        sectionOf(page).getByRole('alert').filter({ hasText: twoFactorText.transient })
      ).toBeVisible();

      await disableFieldOf(page).fill('654321');
      await sectionOf(page).getByRole('button', { name: twoFactorText.retry }).click();

      await expect(statusHeadingOf(page, twoFactorText.statusDisabled)).toBeFocused();
      expect(disable.count()).toBe(2);
      expect(disable.calls[1]?.variables['input']).toMatchObject({ twoFactorCode: '654321' });
    });

    test('retries a transient regenerate failure exactly once more', async ({ page }) => {
      const regenerate = await stubRegenerate(page, ['unavailable', 'regenerated']);
      await enableTwoFactor(page);
      await openRegenerateOf(page).click();
      await regenerateSubmitOf(page).click();
      await expect(
        sectionOf(page).getByRole('alert').filter({ hasText: twoFactorText.transient })
      ).toBeFocused();
      expect(regenerate.count()).toBe(1);

      await sectionOf(page).getByRole('button', { name: twoFactorText.retry }).click();

      await expect(codesHeadingOf(page)).toBeFocused();
      expect(regenerate.count()).toBe(2);
    });
  });

  test('shows the shared focus ring on the new outlined controls reached with Tab', async ({
    page,
  }) => {
    await stubRegenerate(page, ['reauth_required']);
    await enableTwoFactor(page);
    await page.keyboard.press('Tab');

    await expect(openDisableOf(page)).toHaveCSS('outline-style', SHARED_RING.style);
    await expect(openDisableOf(page)).toHaveCSS('outline-width', SHARED_RING.width);
    await expect(openDisableOf(page)).toHaveCSS('outline-color', SHARED_RING.color);
    await openRegenerateOf(page).click();
    await page.keyboard.press('Tab');
    await expect(cancelOf(page)).toHaveCSS('outline-width', SHARED_RING.width);
    await expect(cancelOf(page)).toHaveCSS('outline-color', SHARED_RING.color);
    await regenerateSubmitOf(page).click();
    await page.keyboard.press('Tab');
    await expect(reauthSignInOf(page)).toBeFocused();
    await expect(reauthSignInOf(page)).toHaveCSS('outline-width', SHARED_RING.width);
    await expect(reauthSignInOf(page)).toHaveCSS('outline-color', SHARED_RING.color);
  });
});
