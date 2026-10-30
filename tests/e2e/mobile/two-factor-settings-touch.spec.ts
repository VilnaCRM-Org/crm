import type { Locator, Page } from '@playwright/test';

import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  cancelOf,
  codeCellsOf,
  codesHeadingOf,
  confirmOf,
  copyCodesOf,
  copyKeyOf,
  disableFieldOf,
  disableSubmitOf,
  doneOf,
  expectEveryStateInsideCard,
  openDisableOf,
  openRegenerateOf,
  openSetup,
  reachCodes,
  regenerateSubmitOf,
  savedBoxOf,
  sectionOf,
  signInToTwoFactorSettings,
  startOf,
  statusHeadingOf,
  stubClipboard,
  twoFactorText,
} from '@tests/e2e/modules/user/features/settings/utils/two-factor-page';
import { expectNoSecrets } from '@tests/e2e/utils/expect-no-secrets';
import { test, expect } from '@tests/e2e/utils/fixtures';
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

import {
  CONTAINMENT_WIDTHS,
  MIN_SMALL_TARGET_PX,
  OVERFLOW_WIDTHS,
  expectInsideContentBox,
  expectNoHorizontalOverflow,
  expectNoMotionOf,
  expectReachableAtKeyboardHeight,
  resizeTo,
} from './utils/layout';
import expectTouchTarget from './utils/touch-target';

const SETTINGS_URL = '/settings';
const CODE = '123456';
const CELL_COUNT = 6;
const CARD_WIDTHS: readonly number[] = [320, 375, 390, 412, 767];
const SECRETS = {
  secret: SETUP_SECRET,
  uri: SETUP_URI,
  code: RECOVERY_CODES[0] ?? '',
  fresh: NEW_RECOVERY_CODES[0] ?? '',
};

async function tapCode(page: Page, code: string): Promise<void> {
  await codeCellsOf(page).first().tap();
  await page.keyboard.type(code);
}

async function tapSavedAndDone(page: Page): Promise<void> {
  await sectionOf(page).getByText(twoFactorText.saved, { exact: true }).tap();
  await expect(savedBoxOf(page)).toBeChecked();
  await doneOf(page).tap();
  await expect(statusHeadingOf(page, twoFactorText.statusOn)).toBeVisible();
}

async function enrolByTap(page: Page): Promise<void> {
  await startOf(page).tap();
  await expect(codeCellsOf(page)).toHaveCount(CELL_COUNT);
  await tapCode(page, CODE);
  await confirmOf(page).tap();
  await expect(codesHeadingOf(page)).toBeVisible();
  await tapSavedAndDone(page);
}

async function expectTouchTargets(
  entries: readonly (readonly [Locator, string])[],
  minimum?: number
): Promise<void> {
  for (const [locator, name] of entries) {
    await expectTouchTarget(locator, name, minimum);
  }
}

test.describe('Two-factor settings on touch devices (issue #331)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToTwoFactorSettings(page);
    await stubProfile(page);
    await stubSetup(page);
    await stubConfirm(page);
    await stubClipboard(page, 'works');
    await page.goto(SETTINGS_URL);
    await expect(sectionOf(page)).toBeVisible();
  });

  test('enrols with taps only', async ({ page }) => {
    const setup = await stubSetup(page);
    const confirm = await stubConfirm(page);

    await enrolByTap(page);

    expect(setup.count()).toBe(1);
    expect(confirm.count()).toBe(1);
    expect(confirm.calls[0]?.variables['input']).toMatchObject({ twoFactorCode: CODE });
    await expectNoSecrets(page, SECRETS);
  });

  test('turns two-factor off with taps only', async ({ page }) => {
    const disable = await stubDisable(page);
    await enrolByTap(page);

    await openDisableOf(page).tap();
    await disableFieldOf(page).tap();
    await disableFieldOf(page).fill(CODE);
    await disableSubmitOf(page).tap();

    await expect(statusHeadingOf(page, twoFactorText.statusDisabled)).toBeVisible();
    expect(disable.count()).toBe(1);
    expect(disable.calls[0]?.variables['input']).toMatchObject({ twoFactorCode: CODE });
  });

  test('regenerates the codes with taps only and cancels with a tap', async ({ page }) => {
    const regenerate = await stubRegenerate(page);
    await enrolByTap(page);
    await openRegenerateOf(page).tap();
    await cancelOf(page).tap();
    await expect(openRegenerateOf(page)).toBeVisible();

    await openRegenerateOf(page).tap();
    await regenerateSubmitOf(page).tap();

    await expect(codesHeadingOf(page)).toBeVisible();
    expect(regenerate.count()).toBe(1);
    await expectNoSecrets(page, SECRETS);
  });

  test('copies the key and the codes with taps', async ({ page }) => {
    await openSetup(page);
    await copyKeyOf(page).tap();
    await expect(sectionOf(page).getByText(twoFactorText.keyCopied)).toBeVisible();
    await tapCode(page, CODE);
    await confirmOf(page).tap();
    await expect(codesHeadingOf(page)).toBeVisible();

    await copyCodesOf(page).tap();

    await expect(sectionOf(page).getByText(twoFactorText.codesCopied)).toBeVisible();
  });

  test('keeps the setup controls tappable', async ({ page }) => {
    await openSetup(page);

    await expect(codeCellsOf(page)).toHaveCount(CELL_COUNT);
    for (const [index, cell] of (await codeCellsOf(page).all()).entries()) {
      await expectTouchTarget(cell, `setup cell ${index + 1}`);
    }
    await expectTouchTarget(confirmOf(page), 'Підтвердити');
    await expectTouchTarget(copyKeyOf(page), 'copy key', MIN_SMALL_TARGET_PX);
  });

  test('keeps the codes controls tappable', async ({ page }) => {
    await reachCodes(page);

    await expectTouchTargets([[copyCodesOf(page), 'Скопіювати коди']], MIN_SMALL_TARGET_PX);
    await expectTouchTargets([[savedBoxOf(page), 'saved checkbox']], MIN_SMALL_TARGET_PX);
    await expectTouchTargets([[doneOf(page), 'Готово']]);
  });

  test('keeps the confirmation controls tappable', async ({ page }) => {
    await enrolByTap(page);
    await expectTouchTargets([
      [openDisableOf(page), 'Вимкнути'],
      [openRegenerateOf(page), 'Створити нові резервні коди'],
    ]);

    await openDisableOf(page).tap();

    await expectTouchTargets([
      [disableFieldOf(page), 'disable field'],
      [disableSubmitOf(page), 'disable submit'],
    ]);
    await expectTouchTargets([[cancelOf(page), 'Скасувати']], MIN_SMALL_TARGET_PX);
    await cancelOf(page).tap();
    await openRegenerateOf(page).tap();
    await expectTouchTargets([[regenerateSubmitOf(page), 'regenerate submit']]);
  });

  for (const width of OVERFLOW_WIDTHS) {
    test(`has no horizontal overflow at ${width} px in every state`, async ({ page }) => {
      await resizeTo(page, width);
      await expectNoHorizontalOverflow(page);

      await openSetup(page);
      await expectNoHorizontalOverflow(page);
      await tapCode(page, CODE);
      await confirmOf(page).tap();
      await expect(codesHeadingOf(page)).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await tapSavedAndDone(page);
      await expectNoHorizontalOverflow(page);
      await openDisableOf(page).tap();
      await expectNoHorizontalOverflow(page);
    });
  }

  for (const width of CONTAINMENT_WIDTHS) {
    test(`keeps every setup pin cell inside the section's content box at ${width} px`, async ({
      page,
    }) => {
      await resizeTo(page, width);
      await openSetup(page);

      await expectInsideContentBox(sectionOf(page), 'input', CELL_COUNT);
    });
  }

  for (const width of CARD_WIDTHS) {
    test(`keeps each submit, the disable field and every code in the card at ${width} px`, async ({
      page,
    }) => {
      await resizeTo(page, width);

      await expectEveryStateInsideCard(page, (control) => control.tap());
    });
  }

  test('keeps Підтвердити reachable at keyboard height', async ({ page }) => {
    await openSetup(page);
    await expectReachableAtKeyboardHeight(page, codeCellsOf(page).first(), confirmOf(page));
  });

  test('an empty submit shows the incomplete error and sends nothing', async ({ page }) => {
    const confirm = await stubConfirm(page);
    await openSetup(page);

    await confirmOf(page).tap();

    await expect(sectionOf(page).getByText(twoFactorText.incomplete)).toBeVisible();
    expect(confirm.count()).toBe(0);
  });

  test('with reduced motion a state change runs no transition or smooth scroll', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const confirm = await stubConfirm(page);

    await startOf(page).tap();
    await expect(codeCellsOf(page)).toHaveCount(CELL_COUNT);
    await expectNoMotionOf(page, [sectionOf(page)]);
    await confirmOf(page).tap();
    await expect(sectionOf(page).getByText(twoFactorText.incomplete)).toBeVisible();
    await expectNoMotionOf(page, [sectionOf(page)]);

    expect(confirm.count()).toBe(0);
  });
});
