import type { Locator, Page } from '@playwright/test';

import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  codeListOf,
  codesHeadingOf,
  copyKeyOf,
  disableFieldOf,
  disableHeadingOf,
  disableSubmitOf,
  doneOf,
  enableTwoFactor,
  errorBannerOf,
  confirmOf,
  openDisableOf,
  openRegenerateOf,
  openSetup,
  reachCodes,
  reauthSignInOf,
  regenerateHeadingOf,
  regenerateSubmitOf,
  sectionOf,
  signInToTwoFactorSettings,
  startOf,
  statusHeadingOf,
  stubClipboard,
  twoFactorText,
  typeCode,
} from '@tests/e2e/modules/user/features/settings/utils/two-factor-page';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  stubConfirm,
  stubDisable,
  stubRegenerate,
  stubSetup,
} from '@tests/e2e/utils/two-factor-settings-responses';
import expectCleanScan from '@tests/utils/a11y/expect-clean-scan';

const SETTINGS_URL = '/settings';

test.describe('WCAG 2.1 AA scans of the two-factor settings states (issue #331)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToTwoFactorSettings(page);
    await stubProfile(page);
    await stubSetup(page);
    await stubConfirm(page);
    await stubClipboard(page, 'works');
    await page.goto(SETTINGS_URL);
    await expect(sectionOf(page)).toBeVisible();
  });

  test('off has no axe violations', async ({ page }) => {
    await expect(startOf(page)).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    await expectCleanScan(page);
  });

  test('setup has no axe violations', async ({ page }) => {
    await openSetup(page);
    await expect(copyKeyOf(page)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the copied-key feedback has no axe violations', async ({ page }) => {
    await openSetup(page);
    await copyKeyOf(page).click();
    await expect(sectionOf(page).getByText(twoFactorText.keyCopied)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the incomplete-code error has no axe violations', async ({ page }) => {
    await openSetup(page);
    await typeCode(page, '1234');
    await confirmOf(page).click();
    await expect(sectionOf(page).getByText(twoFactorText.incomplete)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the wrong-code error has no axe violations', async ({ page }) => {
    await stubConfirm(page, ['invalid_code']);
    await openSetup(page);
    await typeCode(page, '123456');
    await confirmOf(page).click();
    await expect(sectionOf(page).getByText(twoFactorText.invalidCode)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the recovery codes with the blocked Готово have no axe violations', async ({ page }) => {
    await reachCodes(page);
    await expect(codeListOf(page)).toBeVisible();
    await expect(doneOf(page)).toHaveAttribute('aria-disabled', 'true');

    await expectCleanScan(page);
  });

  test('the codes after the copy feedback have no axe violations', async ({ page }) => {
    await reachCodes(page);
    await sectionOf(page).getByRole('button', { name: twoFactorText.copyCodes }).click();
    await expect(sectionOf(page).getByText(twoFactorText.codesCopied)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the on view has no axe violations', async ({ page }) => {
    await enableTwoFactor(page);
    await expect(openDisableOf(page)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the disable confirmation has no axe violations', async ({ page }) => {
    await enableTwoFactor(page);
    await openDisableOf(page).click();
    await expect(disableHeadingOf(page)).toBeFocused();

    await expectCleanScan(page);
  });

  test('the disable format and wrong-code errors have no axe violations', async ({ page }) => {
    await stubDisable(page, ['invalid_code']);
    await enableTwoFactor(page);
    await openDisableOf(page).click();
    await disableFieldOf(page).fill('12345');
    await disableSubmitOf(page).click();
    await expect(sectionOf(page).getByText(twoFactorText.formatError)).toBeVisible();
    await expectCleanScan(page);

    await disableFieldOf(page).fill('123456');
    await disableSubmitOf(page).click();
    await expect(sectionOf(page).getByText(twoFactorText.invalidCode)).toBeVisible();
    await expectCleanScan(page);
  });

  test('the regenerate confirmation has no axe violations', async ({ page }) => {
    await enableTwoFactor(page);
    await openRegenerateOf(page).click();
    await expect(regenerateHeadingOf(page)).toBeFocused();

    await expectCleanScan(page);
  });

  test('the regenerated codes have no axe violations', async ({ page }) => {
    await stubRegenerate(page);
    await enableTwoFactor(page);
    await openRegenerateOf(page).click();
    await regenerateSubmitOf(page).click();
    await expect(codesHeadingOf(page)).toBeFocused();

    await expectCleanScan(page);
  });

  test('the re-authentication message has no axe violations', async ({ page }) => {
    await stubRegenerate(page, ['reauth_required']);
    await enableTwoFactor(page);
    await openRegenerateOf(page).click();
    await regenerateSubmitOf(page).click();
    await expect(reauthSignInOf(page)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the already-on status heading has no axe violations', async ({ page }) => {
    await stubSetup(page, ['already_enabled']);
    await startOf(page).click();
    await expect(statusHeadingOf(page, twoFactorText.statusAlreadyOn)).toBeFocused();

    await expectCleanScan(page);
  });

  test('the disabled status heading has no axe violations', async ({ page }) => {
    await stubDisable(page);
    await enableTwoFactor(page);
    await openDisableOf(page).click();
    await disableFieldOf(page).fill('123456');
    await disableSubmitOf(page).click();
    await expect(statusHeadingOf(page, twoFactorText.statusDisabled)).toBeFocused();

    await expectCleanScan(page);
  });

  test('the rate-limited banner has no axe violations', async ({ page }) => {
    await stubDisable(page, ['rate_limited']);
    await enableTwoFactor(page);
    await openDisableOf(page).click();
    await disableFieldOf(page).fill('123456');
    await disableSubmitOf(page).click();
    await expect(errorBannerOf(page, twoFactorText.rateLimited)).toBeFocused();

    await expectCleanScan(page);
  });

  test('the transient banner with its retry has no axe violations', async ({ page }) => {
    await stubRegenerate(page, ['unavailable']);
    await enableTwoFactor(page);
    await openRegenerateOf(page).click();
    await regenerateSubmitOf(page).click();
    await expect(errorBannerOf(page, twoFactorText.transient)).toBeFocused();
    await expect(sectionOf(page).getByRole('button', { name: twoFactorText.retry })).toBeVisible();

    await expectCleanScan(page);
  });
});
