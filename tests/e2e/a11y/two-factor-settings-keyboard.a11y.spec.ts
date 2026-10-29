import type { Locator } from '@playwright/test';

import {
  PROFILE_NODE,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { nameField } from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import {
  cancelOf,
  codeCellsOf,
  codesHeadingOf,
  confirmOf,
  copyCodesOf,
  copyKeyOf,
  disableFieldOf,
  disableHeadingOf,
  disableSubmitOf,
  doneOf,
  enableTwoFactor,
  errorBannerOf,
  openDisableOf,
  openRegenerateOf,
  openSetup,
  reachCodes,
  reauthSignInOf,
  regenerateHeadingOf,
  regenerateSubmitOf,
  savedBoxOf,
  sectionOf,
  signInToTwoFactorSettings,
  startOf,
  statusHeadingOf,
  stubClipboard,
  twoFactorText,
} from '@tests/e2e/modules/user/features/settings/utils/two-factor-page';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  stubConfirm,
  stubDisable,
  stubRegenerate,
  stubSetup,
} from '@tests/e2e/utils/two-factor-settings-responses';
import { expectTabOrder } from '@tests/utils/a11y/keyboard';

const SETTINGS_URL = '/settings';
const SETTINGS_RING = 'rgb(26, 28, 30)';
const CELL_RING = 'rgb(64, 65, 66)';
const CELL_BORDER = 'rgb(128, 135, 138)';
const ERROR_TEXT = 'rgb(198, 40, 40)';
const CELL_INDEXES = [0, 1, 2, 3, 4, 5] as const;

async function expectRing(target: Locator, color: string): Promise<void> {
  await expect(target).toHaveCSS('outline-style', 'solid');
  await expect(target).toHaveCSS('outline-width', '2px');
  await expect(target).toHaveCSS('outline-color', color);
  await expect(target).toHaveCSS('outline-offset', '2px');
}

test.describe('Two-factor settings keyboard contract (issue #331)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToTwoFactorSettings(page);
    await stubProfile(page);
    await stubSetup(page);
    await stubConfirm(page);
    await stubClipboard(page, 'works');
    await page.goto(SETTINGS_URL);
    await expect(sectionOf(page)).toBeVisible();
    await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
  });

  test('off offers the start button as its only stop', async ({ page }) => {
    await page.getByRole('button', { name: t('settings.profile.clear'), exact: true }).focus();

    await expectTabOrder(page, [
      { locator: startOf(page), visibleFocus: true },
      { locator: page.getByRole('contentinfo').getByRole('link', { name: t('footer.privacy') }) },
    ]);
  });

  test('setup tabs from the copy button through the cells to Підтвердити', async ({ page }) => {
    await openSetup(page);

    await expectTabOrder(page, [
      { locator: copyKeyOf(page), visibleFocus: true },
      ...CELL_INDEXES.map((index) => ({
        locator: codeCellsOf(page).nth(index),
        visibleFocus: true,
      })),
      { locator: confirmOf(page), visibleFocus: true },
    ]);
  });

  test('Enter in the cells submits the code', async ({ page }) => {
    const confirm = await stubConfirm(page);
    await openSetup(page);
    await page.keyboard.press('Tab');
    await expect(copyKeyOf(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(codeCellsOf(page).first()).toBeFocused();

    await page.keyboard.type('123456');
    await page.keyboard.press('Enter');

    await expect.poll(() => confirm.count()).toBe(1);
    await expect(codesHeadingOf(page)).toBeFocused();
  });

  test('copy feedback leaves focus on the copy button', async ({ page }) => {
    await openSetup(page);

    await copyKeyOf(page).focus();
    await page.keyboard.press('Enter');

    await expect(sectionOf(page).getByText(twoFactorText.keyCopied)).toBeVisible();
    await expect(copyKeyOf(page)).toBeFocused();
  });

  test('paints the cells and the error as the contract names them', async ({ page }) => {
    await stubConfirm(page, ['invalid_code']);
    await openSetup(page);
    for (const cell of await codeCellsOf(page).all()) {
      await expect(cell).toHaveCSS('border-top-color', CELL_BORDER);
    }
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(codeCellsOf(page).first()).toBeFocused();
    await expectRing(codeCellsOf(page).first(), CELL_RING);

    await page.keyboard.type('123456');
    await confirmOf(page).click();

    await expect(sectionOf(page).getByText(twoFactorText.invalidCode)).toHaveCSS(
      'color',
      ERROR_TEXT
    );
  });

  test('codes tab from Скопіювати коди through the checkbox to a focusable blocked Готово', async ({
    page,
  }) => {
    await reachCodes(page);

    await expectTabOrder(page, [
      { locator: copyCodesOf(page), visibleFocus: true },
      { locator: savedBoxOf(page), visibleFocus: true },
      { locator: doneOf(page), visibleFocus: true },
    ]);
    await expect(doneOf(page)).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Enter');
    await expect(codesHeadingOf(page)).toBeVisible();
    await expect(sectionOf(page).getByText(twoFactorText.blocked)).toBeVisible();
  });

  test('Space ticks the checkbox and Enter on Готово then finishes', async ({ page }) => {
    await reachCodes(page);
    await savedBoxOf(page).focus();

    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(doneOf(page)).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(statusHeadingOf(page, twoFactorText.statusOn)).toBeFocused();
  });

  test('on tabs from Вимкнути to Створити нові резервні коди', async ({ page }) => {
    await enableTwoFactor(page);

    await expectTabOrder(page, [
      { locator: openDisableOf(page), visibleFocus: true },
      { locator: openRegenerateOf(page), visibleFocus: true },
    ]);
    await expectRing(openRegenerateOf(page), SETTINGS_RING);
  });

  test('disable tabs from the field to Вимкнути and Скасувати, and Escape cancels', async ({
    page,
  }) => {
    await enableTwoFactor(page);
    await openDisableOf(page).click();
    await expect(disableHeadingOf(page)).toBeFocused();

    await expectTabOrder(page, [
      { locator: disableFieldOf(page), visibleFocus: true },
      { locator: disableSubmitOf(page), visibleFocus: true },
      { locator: cancelOf(page), visibleFocus: true },
    ]);
    await expectRing(cancelOf(page), SETTINGS_RING);
    await page.keyboard.press('Escape');

    await expect(openDisableOf(page)).toBeFocused();
    await expect(disableHeadingOf(page)).toHaveCount(0);
  });

  test('Enter in the disable field submits it', async ({ page }) => {
    const disable = await stubDisable(page);
    await enableTwoFactor(page);
    await openDisableOf(page).click();
    await page.keyboard.press('Tab');
    await expect(disableFieldOf(page)).toBeFocused();

    await page.keyboard.type('123456');
    await page.keyboard.press('Enter');

    await expect.poll(() => disable.count()).toBe(1);
    await expect(statusHeadingOf(page, twoFactorText.statusDisabled)).toBeFocused();
  });

  test('regenerate tabs from Створити коди to Скасувати, and Escape cancels', async ({ page }) => {
    await enableTwoFactor(page);
    await openRegenerateOf(page).click();
    await expect(regenerateHeadingOf(page)).toBeFocused();

    await expectTabOrder(page, [
      { locator: regenerateSubmitOf(page), visibleFocus: true },
      { locator: cancelOf(page), visibleFocus: true },
    ]);
    await page.keyboard.press('Escape');

    await expect(openRegenerateOf(page)).toBeFocused();
  });

  test('re-authentication offers Увійти знову as its only stop', async ({ page }) => {
    await stubRegenerate(page, ['reauth_required']);
    await enableTwoFactor(page);
    await openRegenerateOf(page).click();
    await regenerateSubmitOf(page).click();
    await expect(sectionOf(page).getByText(twoFactorText.reauthMessage)).toBeFocused();

    await expectTabOrder(page, [{ locator: reauthSignInOf(page), visibleFocus: true }]);
    await expectRing(reauthSignInOf(page), SETTINGS_RING);
  });

  test('a failure shows a focused alert banner and Escape still cancels', async ({ page }) => {
    await stubDisable(page, ['rate_limited']);
    await enableTwoFactor(page);
    await openDisableOf(page).click();
    await disableFieldOf(page).fill('123456');
    await disableSubmitOf(page).click();
    await expect(errorBannerOf(page, twoFactorText.rateLimited)).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(openDisableOf(page)).toBeFocused();
    await expect(disableHeadingOf(page)).toHaveCount(0);
  });
});
