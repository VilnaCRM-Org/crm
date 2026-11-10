import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildCredentials, buildTotpCode } from '@tests/builders';
import { expectNoSecrets } from '@tests/e2e/utils/expect-no-secrets';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  authenticatorToggleOf,
  challengeBackOf,
  challengeText,
  codeCellsOf,
  confirmButtonOf,
  recoveryFieldOf,
  recoveryToggleOf,
  signInToChallenge,
} from '@tests/e2e/utils/reach-challenge';
import {
  CHALLENGE_ACCESS_TOKEN,
  SIGN_IN_PENDING_SESSION_ID,
  stubChallenge,
} from '@tests/e2e/utils/two-factor-responses';
import { expectNextTabStop, expectTabOrder } from '@tests/utils/a11y/keyboard';

const CODE = buildTotpCode();
const credentials = buildCredentials();
const secrets = {
  sessionId: SIGN_IN_PENDING_SESSION_ID,
  code: CODE,
  token: CHALLENGE_ACCESS_TOKEN,
  password: credentials.password,
};
const BRAND_LINK = 'rgb(0, 116, 181)';
const SHARED_RING = 'rgb(64, 65, 66)';
const CELL_BORDER = 'rgb(225, 231, 234)';
const ERROR_TEXT = 'rgb(214, 51, 51)';

const backToMainOf = (page: Page): Locator =>
  page.getByRole('link', { name: t('buttons.back_to_main') });

const firstFooterLinkOf = (page: Page): Locator =>
  page.getByRole('contentinfo').getByRole('link', { name: t('footer.privacy') });

async function climbToTop(page: Page): Promise<void> {
  await expectTabOrder(
    page,
    [{ locator: challengeBackOf(page) }, { locator: backToMainOf(page) }],
    'Shift+Tab'
  );
}

async function expectRing(target: Locator, color: string): Promise<void> {
  await expect(target).toHaveCSS('outline-style', 'solid');
  await expect(target).toHaveCSS('outline-width', '2px');
  await expect(target).toHaveCSS('outline-color', color);
  await expect(target).toHaveCSS('outline-offset', '2px');
}

test.describe('Sign-in challenge keyboard contract (issue #331)', () => {
  test('authenticator mode is operable in reading order', async ({ page }) => {
    await signInToChallenge(page, credentials);
    await expect(codeCellsOf(page).first()).toBeFocused();
    await climbToTop(page);

    await expectTabOrder(page, [
      { locator: challengeBackOf(page), visibleFocus: true },
      ...[0, 1, 2, 3, 4, 5].map((index) => ({
        locator: codeCellsOf(page).nth(index),
        visibleFocus: true,
      })),
      { locator: confirmButtonOf(page), visibleFocus: true },
      { locator: recoveryToggleOf(page), visibleFocus: true },
      { locator: firstFooterLinkOf(page), visibleFocus: true },
    ]);
  });

  test('the sixth digit submits once, with no key or button pressed', async ({ page }) => {
    const challenge = await stubChallenge(page);
    await signInToChallenge(page, credentials);
    await expect(codeCellsOf(page).first()).toBeFocused();

    await page.keyboard.type(CODE);

    await expect.poll(() => challenge.count()).toBe(1);
    expect(challenge.calls[0]?.variables['input']).toMatchObject({ twoFactorCode: CODE });
    await expect(page).not.toHaveURL(new RegExp(`${ROUTE_PATHS.twoFactorChallenge}$`));
    await expectNoSecrets(page, secrets);
  });

  test('Enter on Підтвердити retries a kept code and Space does too', async ({ page }) => {
    const challenge = await stubChallenge(page, ['unavailable', 'unavailable', 'completed']);
    await signInToChallenge(page, credentials);
    await page.keyboard.type(CODE);
    await expect.poll(() => challenge.count()).toBe(1);

    await expect(confirmButtonOf(page)).toBeEnabled();
    await confirmButtonOf(page).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => challenge.count()).toBe(2);

    await expect(confirmButtonOf(page)).toBeEnabled();
    await confirmButtonOf(page).focus();
    await page.keyboard.press('Space');

    await expect.poll(() => challenge.count()).toBe(3);
    await expect(page).not.toHaveURL(new RegExp(`${ROUTE_PATHS.twoFactorChallenge}$`));
    await expectNoSecrets(page, secrets);
  });

  test('recovery mode swaps the cells for the field and renames the toggle', async ({ page }) => {
    await signInToChallenge(page, credentials);
    await recoveryToggleOf(page).click();
    await expect(recoveryFieldOf(page)).toBeFocused();
    await expect(codeCellsOf(page)).toHaveCount(0);
    await expect(authenticatorToggleOf(page)).toHaveText(challengeText.useAuthenticator);
    await climbToTop(page);

    await expectTabOrder(page, [
      { locator: challengeBackOf(page), visibleFocus: true },
      { locator: recoveryFieldOf(page), visibleFocus: true },
      { locator: confirmButtonOf(page), visibleFocus: true },
      { locator: authenticatorToggleOf(page), visibleFocus: true },
      { locator: firstFooterLinkOf(page), visibleFocus: true },
    ]);
  });

  test('Enter in the recovery field submits it', async ({ page }) => {
    const challenge = await stubChallenge(page);
    await signInToChallenge(page, credentials);
    await recoveryToggleOf(page).click();
    await expect(recoveryFieldOf(page)).toBeFocused();

    await page.keyboard.type('abcd0001');
    await page.keyboard.press('Enter');

    await expect.poll(() => challenge.count()).toBe(1);
    expect(challenge.calls[0]?.variables['input']).toMatchObject({ twoFactorCode: 'ABCD-0001' });
    await expect(page).not.toHaveURL(new RegExp(`${ROUTE_PATHS.twoFactorChallenge}$`));
    await expectNoSecrets(page, { ...secrets, code: 'ABCD-0001', typed: 'abcd0001' });
  });

  test('paints the mode toggle in brand blue with its own ring in both modes', async ({ page }) => {
    await signInToChallenge(page, credentials);
    await confirmButtonOf(page).focus();
    await expectNextTabStop(page, { locator: recoveryToggleOf(page) });

    await expect(recoveryToggleOf(page)).toHaveCSS('color', BRAND_LINK);
    await expectRing(recoveryToggleOf(page), BRAND_LINK);
    await recoveryToggleOf(page).click();
    await expect(recoveryFieldOf(page)).toBeFocused();
    await confirmButtonOf(page).focus();
    await expectNextTabStop(page, { locator: authenticatorToggleOf(page) });

    await expect(authenticatorToggleOf(page)).toHaveCSS('color', BRAND_LINK);
    await expectRing(authenticatorToggleOf(page), BRAND_LINK);
  });

  test('paints a resting cell border, a focused cell ring and the error text', async ({ page }) => {
    await stubChallenge(page, ['invalid_code']);
    await signInToChallenge(page, credentials);
    for (const cell of await codeCellsOf(page).all()) {
      await expect(cell).toHaveCSS('border-top-color', CELL_BORDER);
    }

    await expect(codeCellsOf(page).first()).toBeFocused();
    await expect(codeCellsOf(page).first()).toHaveCSS('outline-style', 'none');
    await expect(codeCellsOf(page).first()).not.toHaveCSS('box-shadow', 'none');
    await page.keyboard.type(CODE);

    await expect(page.getByText(challengeText.invalidCode)).toHaveCSS('color', ERROR_TEXT);
  });

  test('shows the shared ring on Назад reached with the keyboard', async ({ page }) => {
    await signInToChallenge(page, credentials);

    await page.keyboard.press('Shift+Tab');

    await expect(challengeBackOf(page)).toBeFocused();
    await expectRing(challengeBackOf(page), SHARED_RING);
  });
});
