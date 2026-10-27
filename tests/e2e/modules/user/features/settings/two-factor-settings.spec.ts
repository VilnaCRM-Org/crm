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

import { holdReply, stubProfile } from './utils/profile-stub';
import {
  codeCellsOf,
  codeListOf,
  codesHeadingOf,
  confirmOf,
  copiedText,
  copyCodesOf,
  copyKeyOf,
  doneOf,
  KEY_IN_GROUPS,
  openSetup,
  qrOf,
  reachCodes,
  savedBoxOf,
  sectionOf,
  selectedText,
  setupHeadingOf,
  signInToTwoFactorSettings,
  startOf,
  statusHeadingOf,
  stubClipboard,
  twoFactorText,
  typeCode,
} from './utils/two-factor-page';

const SETTINGS_URL = '/settings';
const socialTitle: string = t('settings.social.heading');
const SECRETS = { secret: SETUP_SECRET, uri: SETUP_URI, code: RECOVERY_CODES[0] ?? '' };
const SHARED_RING = { style: 'solid', width: '2px', color: 'rgb(26, 28, 30)' } as const;
const WIDTHS = [320, 360, 600, 767, 768, 1024] as const;

test.describe('Two-factor settings section (issue #331)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToTwoFactorSettings(page);
    await stubProfile(page);
  });

  test.describe('the section and its flag', () => {
    test('shows the off view beside the profile column above 1024 px and sends nothing', async ({
      page,
    }) => {
      const setup = await stubSetup(page);
      await page.setViewportSize({ width: 1440, height: 1000 });

      await page.goto(SETTINGS_URL);

      await expect(sectionOf(page).getByRole('heading', { level: 2 })).toHaveText(
        twoFactorText.title
      );
      await expect(startOf(page)).toBeVisible();
      const section = await sectionOf(page).boundingBox();
      const profile = await page.getByRole('heading', { level: 1 }).boundingBox();
      expect(section?.x).toBeGreaterThan((profile?.x ?? 0) + 400);
      expect(setup.count()).toBe(0);
    });

    test('stacks below the profile column at 1024 px', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1000 });

      await page.goto(SETTINGS_URL);

      const section = await sectionOf(page).boundingBox();
      const social = await page
        .getByRole('heading', { level: 2, name: socialTitle, exact: true })
        .boundingBox();
      expect(section?.y).toBeGreaterThan(social?.y ?? 0);
    });
  });

  test('leaves the section out and runs no 2FA operation while the flag is off', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signInToTwoFactorSettings(page, false);
    await stubProfile(page);
    const setup = await stubSetup(page);

    await page.goto(SETTINGS_URL);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(sectionOf(page)).toHaveCount(0);
    expect(setup.count()).toBe(0);
    await context.close();
  });

  test.describe('turning two-factor on', () => {
    test('starts setup once with the Authorization header and a busy status', async ({ page }) => {
      const gate = holdReply(SETUP_REPLIES.created);
      const setup = await stubSetup(page, [gate.reply]);
      await page.goto(SETTINGS_URL);

      await startOf(page).click();

      await expect(sectionOf(page).locator('form[aria-busy="true"]')).toBeVisible();
      await expect(
        page.getByRole('status').filter({ hasText: twoFactorText.preparing })
      ).toBeAttached();
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
      await expect(sectionOf(page).getByText(KEY_IN_GROUPS, { exact: true })).toBeVisible();
      await expect(codeCellsOf(page)).toHaveCount(6);
      await expect(sectionOf(page).getByText(twoFactorText.note)).toBeVisible();
      await expect(confirmOf(page)).toBeEnabled();
      await expectNoSecrets(page, SECRETS);
    });

    test('copies the key without spaces and announces it, keeping focus on the button', async ({
      page,
    }) => {
      await stubClipboard(page, 'works');
      await stubSetup(page);
      await page.goto(SETTINGS_URL);
      await openSetup(page);

      await copyKeyOf(page).click();

      expect(await copiedText(page)).toBe(SETUP_SECRET);
      await expect(
        page.getByRole('status').filter({ hasText: twoFactorText.keyCopied })
      ).toBeAttached();
      await expect(copyKeyOf(page)).toBeFocused();
    });

    test('selects the key and announces the manual fallback without a clipboard', async ({
      page,
    }) => {
      await stubClipboard(page, 'missing');
      await stubSetup(page);
      await page.goto(SETTINGS_URL);
      await openSetup(page);

      await copyKeyOf(page).click();

      expect(await selectedText(page)).toBe(KEY_IN_GROUPS);
      await expect(
        page.getByRole('status').filter({ hasText: twoFactorText.copyFailed })
      ).toBeAttached();
      await expect(copyKeyOf(page)).toBeFocused();
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

    test('keeps the QR image and key for a wrong code and focuses the field', async ({ page }) => {
      await stubSetup(page);
      await stubConfirm(page, ['invalid_code']);
      await page.goto(SETTINGS_URL);
      await openSetup(page);

      await typeCode(page, '123456');
      await confirmOf(page).click();

      await expect(sectionOf(page).getByText(twoFactorText.invalidCode)).toBeVisible();
      await expect(codeCellsOf(page).first()).toHaveAttribute('aria-invalid', 'true');
      await expect(codeCellsOf(page).first()).toBeFocused();
      await expect(qrOf(page)).toBeVisible();
      await expect(sectionOf(page).getByText(KEY_IN_GROUPS, { exact: true })).toBeVisible();
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
      await expect(doneOf(page)).toHaveAccessibleDescription(new RegExp(twoFactorText.blocked));
      await doneOf(page).click();
      await expect(doneOf(page)).toBeVisible();
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

      await typeCode(page, '123456');
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

      const banner = sectionOf(page)
        .getByRole('alert')
        .filter({ hasText: twoFactorText.rateLimited });
      await expect(banner).toBeVisible();
      await expect(banner).toBeFocused();
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
      await expect(
        sectionOf(page).getByRole('alert').filter({ hasText: twoFactorText.transient })
      ).toBeFocused();
      expect(setup.count()).toBe(1);

      await sectionOf(page).getByRole('button', { name: twoFactorText.retry }).click();

      await expect(setupHeadingOf(page)).toBeFocused();
      expect(setup.count()).toBe(2);
    });

    test('keeps the typed values and sends one more confirm on Retry', async ({ page }) => {
      await stubSetup(page);
      const confirm = await stubConfirm(page, ['network', 'confirmed']);
      await page.goto(SETTINGS_URL);
      await openSetup(page);
      await typeCode(page, '123456');
      await confirmOf(page).click();
      await expect(
        sectionOf(page).getByRole('alert').filter({ hasText: twoFactorText.transient })
      ).toBeFocused();
      await expect(qrOf(page)).toBeVisible();

      await sectionOf(page).getByRole('button', { name: twoFactorText.retry }).click();

      await expect(codesHeadingOf(page)).toBeFocused();
      expect(confirm.count()).toBe(2);
      expect(confirm.calls[1]?.variables).toEqual(confirm.calls[0]?.variables);
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
      await copyKeyOf(page).focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');

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
