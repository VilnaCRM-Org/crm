import type { Locator, Page } from '@playwright/test';

import { buildTotpCode } from '@tests/builders';
import { sidebarOf, sidebarSettingsOf } from '@tests/e2e/utils/app-shell';
import { expectNoSecrets } from '@tests/e2e/utils/expect-no-secrets';
import { expect, test } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  RECOVERY_CODES,
  SETUP_REPLIES,
  SETUP_SECRET,
  SETUP_URI,
  stubConfirm,
  stubSetup,
} from '@tests/e2e/utils/two-factor-settings-responses';

import { holdReply, signInToSettings, stubProfile } from './utils/profile-stub';
import {
  codeCellsOf,
  codeListOf,
  codesHeadingOf,
  confirmOf,
  copiedText,
  copyCodesOf,
  copyKeyOf,
  doneOf,
  errorBannerOf,
  expectEveryStateInsideCard,
  KEY_IN_GROUPS,
  openSetup,
  qrOf,
  reachCodes,
  savedBoxOf,
  sectionOf,
  selectedText,
  setupHeadingOf,
  startOf,
  statusHeadingOf,
  stubClipboard,
  twoFactorText,
  typeCode,
} from './utils/two-factor-page';

const SETTINGS_URL = '/settings';
const socialTitle: string = t('settings.social.heading');
const CODE = buildTotpCode();
const SECRETS = { secret: SETUP_SECRET, uri: SETUP_URI, code: RECOVERY_CODES[0] ?? '' };
async function boxOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error(`${locator.toString()} has no bounding box`);
  return box;
}

const SHARED_RING = { style: 'solid', width: '2px', color: 'rgb(64, 65, 66)' } as const;
const WIDTHS = [320, 360, 600, 767, 768, 1024] as const;
const MUTED_FILL = 'rgb(87, 89, 91)';
const SAVED_BOX = { outline: 'rgb(128, 135, 138)', fill: 'rgb(0, 116, 181)' } as const;

async function clickCopyKey(page: Page, clipboard: 'works' | 'missing'): Promise<void> {
  await stubClipboard(page, clipboard);
  await stubSetup(page);
  await page.goto(SETTINGS_URL);
  await openSetup(page);
  await copyKeyOf(page).click();
}

async function expectCopyAnnounced(page: Page, text: string): Promise<void> {
  await expect(page.getByRole('status').filter({ hasText: text })).toBeAttached();
  await expect(copyKeyOf(page)).toBeFocused();
}

test.describe('Two-factor settings section (issue #331)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
    await stubProfile(page);
  });

  test.afterEach(async ({ page }) => {
    await expectNoSecrets(page, SECRETS);
  });

  test.describe('the section', () => {
    test('shows the off view beside the profile column above 1024 px and sends nothing', async ({
      page,
    }) => {
      const setup = await stubSetup(page);
      await page.setViewportSize({ width: 1440, height: 1000 });

      await page.goto(SETTINGS_URL);

      await expect(sectionOf(page).getByRole('heading', { level: 2 })).toHaveText(
        twoFactorText.setupTitle
      );
      await expect(startOf(page)).toBeVisible();
      const section = await boxOf(sectionOf(page));
      const profile = await boxOf(page.getByRole('heading', { level: 1 }));
      expect(section.x).toBeGreaterThan(profile.x + 400);
      expect(setup.count()).toBe(0);
    });

    test('stacks below the profile column at 1024 px', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1000 });

      await page.goto(SETTINGS_URL);

      const section = await boxOf(sectionOf(page));
      const social = await boxOf(
        page.getByRole('heading', { level: 2, name: socialTitle, exact: true })
      );
      expect(section.y).toBeGreaterThan(social.y);
    });
  });

  test('keeps every submit, the disable field and each code inside the card at 1024 px', async ({
    page,
  }) => {
    await stubSetup(page);
    await stubConfirm(page);
    await page.setViewportSize({ width: 1024, height: 1000 });
    await page.goto(SETTINGS_URL);

    await expectEveryStateInsideCard(page, (control) => control.click());
  });

  test.describe('turning two-factor on', () => {
    test('starts setup once with the Authorization header and a busy status', async ({ page }) => {
      const gate = holdReply(SETUP_REPLIES.created);
      const setup = await stubSetup(page, [gate.reply]);
      await page.goto(SETTINGS_URL);

      await startOf(page).click();

      await expect(
        sectionOf(page).getByRole('status').filter({ hasText: twoFactorText.preparing })
      ).toBeAttached();
      await expect(startOf(page)).toBeDisabled();
      gate.release();
      await expect(setupHeadingOf(page)).toBeFocused();
      expect(setup.count()).toBe(1);
      expect(setup.calls[0]?.authorization).toMatch(/^Bearer .+/);
      await expectNoSecrets(page, SECRETS);
    });

    test('shows the QR image, the key in groups of four and the confirm form', async ({ page }) => {
      await stubSetup(page);
      await page.goto(SETTINGS_URL);

      await openSetup(page);

      await expect(qrOf(page)).toBeVisible();
      await expect(sectionOf(page).getByText(KEY_IN_GROUPS, { exact: true })).toHaveCount(2);
      await expect(codeCellsOf(page)).toHaveCount(6);
      await expect(sectionOf(page).getByText(twoFactorText.note)).toBeVisible();
      await expect(confirmOf(page)).toBeEnabled();
      await expectNoSecrets(page, SECRETS);
    });

    test('copies the key without spaces and announces it, keeping focus on the button', async ({
      page,
    }) => {
      await clickCopyKey(page, 'works');

      expect(await copiedText(page)).toBe(SETUP_SECRET);
      await expectCopyAnnounced(page, twoFactorText.keyCopied);
      await expect(copyKeyOf(page).locator('svg')).toHaveCSS('fill', MUTED_FILL);
    });

    test('selects the key and announces the manual fallback without a clipboard', async ({
      page,
    }) => {
      await clickCopyKey(page, 'missing');

      expect(await selectedText(page)).toBe(KEY_IN_GROUPS);
      await expectCopyAnnounced(page, twoFactorText.copyFailed);
    });

    test('refuses fewer than six digits and sends nothing', async ({ page }) => {
      await stubSetup(page);
      const confirm = await stubConfirm(page);
      await page.goto(SETTINGS_URL);
      await openSetup(page);

      await typeCode(page, '123');
      await confirmOf(page).click();

      await expect(sectionOf(page).getByText(twoFactorText.incomplete)).toBeVisible();
      expect(confirm.count()).toBe(0);
    });

    test('clears the six cells and keeps the QR image and key for a wrong code', async ({
      page,
    }) => {
      await stubSetup(page);
      await stubConfirm(page, ['invalid_code']);
      await page.goto(SETTINGS_URL);
      await openSetup(page);

      await typeCode(page, CODE);
      await confirmOf(page).click();

      await expect(
        sectionOf(page).getByText(twoFactorText.confirmInvalidCode, { exact: true })
      ).toBeVisible();
      await expect(codeCellsOf(page)).toHaveCount(6);
      for (const cell of await codeCellsOf(page).all()) {
        await expect(cell).toHaveValue('');
      }
      await expect(codeCellsOf(page).first()).toHaveAttribute('aria-invalid', 'true');
      await expect(codeCellsOf(page).first()).toBeFocused();
      await expect(qrOf(page)).toBeVisible();
      await expect(sectionOf(page).getByText(KEY_IN_GROUPS, { exact: true })).toHaveCount(2);
      await expectNoSecrets(page, SECRETS);
    });

    test('shows the recovery codes once and blocks Готово until they are acknowledged', async ({
      page,
    }) => {
      await stubSetup(page);
      const confirm = await stubConfirm(page);
      await page.goto(SETTINGS_URL);

      await reachCodes(page);

      await expect(codeListOf(page).getByRole('listitem')).toHaveText([...RECOVERY_CODES]);
      expect(confirm.count()).toBe(1);
      await expect(doneOf(page)).toHaveAttribute('aria-disabled', 'true');
      await expect(doneOf(page)).toBeDisabled();
      await expect(doneOf(page)).toHaveAccessibleDescription(new RegExp(twoFactorText.blocked));
      await doneOf(page).click({ force: true });
      await expect(codesHeadingOf(page)).toBeVisible();
      await expect(codeListOf(page).getByRole('listitem')).toHaveText([...RECOVERY_CODES]);
      await expectNoSecrets(page, SECRETS);
    });

    test('copies the codes newline-separated', async ({ page }) => {
      await stubClipboard(page, 'works');
      await stubSetup(page);
      await stubConfirm(page);
      await page.goto(SETTINGS_URL);
      await reachCodes(page);

      await copyCodesOf(page).click();

      expect(await copiedText(page)).toBe(RECOVERY_CODES.join('\n'));
      await expect(
        page.getByRole('status').filter({ hasText: twoFactorText.codesCopied })
      ).toBeAttached();
    });

    test('outlines the box in #80878A, keeps the hover edge dark and fills it #0074B5', async ({
      page,
    }) => {
      await stubSetup(page);
      await stubConfirm(page);
      await page.goto(SETTINGS_URL);
      await reachCodes(page);
      const glyph = savedBoxOf(page).locator('xpath=..').locator('.ui-checkbox-box');

      await expect(glyph).toHaveCSS('border-top-color', SAVED_BOX.outline);
      await savedBoxOf(page).hover();
      await expect(glyph).toHaveCSS('border-top-color', SAVED_BOX.fill);
      await savedBoxOf(page).check();

      await expect(glyph).toHaveCSS('background-color', SAVED_BOX.fill);
      await expect(glyph).toHaveCSS('background-image', /stroke%3D'white'/u);
    });

    test('ticks the box with Space, finishes with Готово and leaves no code in the page', async ({
      page,
    }) => {
      await stubSetup(page);
      await stubConfirm(page);
      await page.goto(SETTINGS_URL);
      await reachCodes(page);

      await savedBoxOf(page).focus();
      await page.keyboard.press('Space');
      await expect(savedBoxOf(page)).toBeChecked();
      await doneOf(page).click();

      await expect(statusHeadingOf(page, twoFactorText.statusOn)).toBeFocused();
      await expect(codeListOf(page)).toHaveCount(0);
      await expect(codesHeadingOf(page)).toHaveCount(0);
      expect(await page.content()).not.toContain(RECOVERY_CODES[0]);
      await expectNoSecrets(page, SECRETS);
    });

    test('comes back to the on view with no code after leaving the codes view', async ({
      page,
    }) => {
      await stubSetup(page);
      await stubConfirm(page);
      await page.goto(SETTINGS_URL);
      await reachCodes(page);

      await sidebarOf(page)
        .getByRole('link', { name: t('app_shell.items.boards') })
        .click();
      await expect(codesHeadingOf(page)).toHaveCount(0);
      await sidebarSettingsOf(page).click();

      await expect(statusHeadingOf(page, twoFactorText.statusOn)).toBeVisible();
      await expect(codeListOf(page).getByRole('listitem')).toHaveCount(0);
      await expectNoSecrets(page, SECRETS);
    });

    test('shows the already-on heading for a setup 409', async ({ page }) => {
      await stubSetup(page, ['already_enabled']);
      await page.goto(SETTINGS_URL);

      await startOf(page).click();

      await expect(statusHeadingOf(page, twoFactorText.statusAlreadyOn)).toBeFocused();
    });

    test('shows the stale heading when the setup was not initiated', async ({ page }) => {
      await stubSetup(page);
      await stubConfirm(page, ['setup_not_initiated']);
      await page.goto(SETTINGS_URL);
      await openSetup(page);

      await typeCode(page, CODE);
      await confirmOf(page).click();

      await expect(statusHeadingOf(page, twoFactorText.statusStale)).toBeFocused();
      await expect(startOf(page)).toBeVisible();
      await expectNoSecrets(page, SECRETS);
    });
  });

  test.describe('failures', () => {
    test('shows the rate-limited banner, focused, with no Retry, and keeps the view', async ({
      page,
    }) => {
      await stubSetup(page, ['rate_limited']);
      await page.goto(SETTINGS_URL);

      await startOf(page).click();

      await expect(sectionOf(page).getByRole('alert')).toHaveText(twoFactorText.rateLimited);
      await expect(errorBannerOf(page, twoFactorText.rateLimited)).toBeFocused();
      await expect(sectionOf(page).getByRole('button', { name: twoFactorText.retry })).toHaveCount(
        0
      );
      await expect(startOf(page)).toBeVisible();
    });

    test('shows the transient banner and Retry sends exactly one more request', async ({
      page,
    }) => {
      const setup = await stubSetup(page, ['unavailable', 'created']);
      await page.goto(SETTINGS_URL);
      await startOf(page).click();
      await expect(errorBannerOf(page, twoFactorText.transient)).toBeFocused();
      expect(setup.count()).toBe(1);

      await sectionOf(page).getByRole('button', { name: twoFactorText.retry }).click();

      await expect(setupHeadingOf(page)).toBeFocused();
      expect(setup.count()).toBe(2);
    });

    test.describe('after a dropped connection', () => {
      test.use({ allowedConsoleErrors: [/^\[JavaScript Error: "Cross-Origin Request Blocked:/] });

      test('keeps the typed values and sends one more confirm on Retry', async ({ page }) => {
        await stubSetup(page);
        const confirm = await stubConfirm(page, ['network', 'confirmed']);
        await page.goto(SETTINGS_URL);
        await openSetup(page);
        await typeCode(page, CODE);
        await confirmOf(page).click();
        await expect(errorBannerOf(page, twoFactorText.transient)).toBeFocused();
        await expect(qrOf(page)).toBeVisible();

        await sectionOf(page).getByRole('button', { name: twoFactorText.retry }).click();

        await expect(codesHeadingOf(page)).toBeFocused();
        expect(confirm.count()).toBe(2);
        const [first, second] = confirm.calls.map((call) => call.variables['input'] as object);
        expect(first).toMatchObject({ twoFactorCode: CODE });
        expect({ ...second, clientMutationId: 0 }).toEqual({ ...first, clientMutationId: 0 });
      });
    });
  });

  test.describe('keyboard focus and layout', () => {
    test('shows the shared focus ring on the copy key button when reached with Tab', async ({
      page,
    }) => {
      await stubSetup(page);
      await stubConfirm(page);
      await page.goto(SETTINGS_URL);
      await openSetup(page);
      await page.keyboard.press('Tab');

      await expect(copyKeyOf(page)).toBeFocused();
      await expect(copyKeyOf(page)).toHaveCSS('outline-style', SHARED_RING.style);
      await expect(copyKeyOf(page)).toHaveCSS('outline-width', SHARED_RING.width);
      await expect(copyKeyOf(page)).toHaveCSS('outline-color', SHARED_RING.color);
    });

    test('shows the shared focus ring on the copy codes button', async ({ page }) => {
      await stubSetup(page);
      await stubConfirm(page);
      await page.goto(SETTINGS_URL);
      await reachCodes(page);
      await page.keyboard.press('Tab');

      await expect(copyCodesOf(page)).toBeFocused();
      await expect(copyCodesOf(page)).toHaveCSS('outline-style', SHARED_RING.style);
      await expect(copyCodesOf(page)).toHaveCSS('outline-width', SHARED_RING.width);
      await expect(copyCodesOf(page)).toHaveCSS('outline-color', SHARED_RING.color);
    });

    for (const width of WIDTHS) {
      test(`keeps every pin cell inside the section at ${width} px with no overflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await stubSetup(page);
        await page.goto(SETTINGS_URL);
        await openSetup(page);

        const fit = await sectionOf(page).evaluate((section) => {
          const style = getComputedStyle(section);
          const box = section.getBoundingClientRect();
          const left = box.left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
          const right =
            box.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
          const cells = Array.from(section.querySelectorAll('input')).map((cell) =>
            cell.getBoundingClientRect()
          );
          return {
            inside:
              cells.length === 6 &&
              cells.every((c) => c.left >= left - 0.5 && c.right <= right + 0.5),
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });

        expect(fit.inside).toBe(true);
        expect(fit.overflow).toBeLessThanOrEqual(0);
      });
    }
  });
});
