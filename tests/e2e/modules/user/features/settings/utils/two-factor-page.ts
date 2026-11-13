import type { Locator, Page } from '@playwright/test';

import { buildTotpCode } from '@tests/builders';
import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { RECOVERY_CODES, SETUP_SECRET } from '@tests/e2e/utils/two-factor-settings-responses';

export const twoFactorText = {
  title: t('settings.two_factor.title'),
  start: t('settings.two_factor.start'),
  preparing: t('settings.two_factor.preparing'),
  setupTitle: t('settings.two_factor.setup.title'),
  qrLabel: t('settings.two_factor.setup.qr_label'),
  copyKey: t('settings.two_factor.setup.copy_key'),
  copyBackupKey: t('settings.two_factor.setup.copy_backup_key'),
  keyInfoLabel: t('settings.two_factor.setup.key_info_label'),
  keyInfo: t('settings.two_factor.setup.key_info'),
  keyCopied: t('settings.two_factor.setup.key_copied'),
  copyFailed: t('settings.two_factor.setup.copy_failed'),
  codeLabel: t('settings.two_factor.confirm.code_label'),
  note: t('settings.two_factor.confirm.note'),
  confirm: t('settings.two_factor.confirm.submit'),
  incomplete: t('settings.two_factor.errors.incomplete'),
  invalidCode: t('settings.two_factor.errors.invalid_code'),
  confirmInvalidCode: t('settings.two_factor.errors.confirm_invalid_code'),
  codesTitle: t('settings.two_factor.codes.title'),
  copyCodes: t('settings.two_factor.codes.copy'),
  codesCopied: t('settings.two_factor.codes.copied'),
  saved: t('settings.two_factor.codes.saved'),
  done: t('settings.two_factor.codes.done'),
  blocked: t('settings.two_factor.codes.blocked'),
  statusOn: t('settings.two_factor.status.on'),
  statusAlreadyOn: t('settings.two_factor.status.already_on'),
  statusStale: t('settings.two_factor.status.stale'),
  rateLimited: t('settings.two_factor.banner.rate_limited'),
  transient: t('settings.two_factor.banner.transient'),
  retry: t('auth.error.tryAgain'),
  openDisable: t('settings.two_factor.on.disable'),
  openRegenerate: t('settings.two_factor.on.regenerate'),
  cancel: t('settings.two_factor.cancel'),
  disableTitle: t('settings.two_factor.disable.title'),
  disableDescription: t('settings.two_factor.disable.description'),
  disableLabel: t('settings.two_factor.disable.code_label'),
  disableSubmit: t('settings.two_factor.disable.submit'),
  regenerateTitle: t('settings.two_factor.regenerate.title'),
  regenerateDescription: t('settings.two_factor.regenerate.description'),
  regenerateSubmit: t('settings.two_factor.regenerate.submit'),
  reauthMessage: t('settings.two_factor.reauth.message'),
  reauthSignIn: t('settings.two_factor.reauth.sign_in'),
  formatError: t('settings.two_factor.errors.format'),
  statusDisabled: t('settings.two_factor.status.disabled'),
  statusAlreadyOff: t('settings.two_factor.status.already_off'),
  sessionEnded: t('sign_in.notices.session_ended'),
} as const;

export const KEY_IN_GROUPS = SETUP_SECRET.replace(/(.{4})(?=.)/gu, '$1 ');

export const sectionOf = (page: Page): Locator =>
  page.getByRole('region', { name: twoFactorText.title, exact: true });

export const errorBannerOf = (page: Page, text: string): Locator =>
  sectionOf(page).getByRole('alert').filter({ hasText: text }).locator('..');

export const startOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.start, exact: true });

export const setupHeadingOf = (page: Page): Locator =>
  sectionOf(page).getByRole('heading', { level: 2, name: twoFactorText.setupTitle, exact: true });

export const qrOf = (page: Page): Locator =>
  sectionOf(page).getByRole('img', { name: twoFactorText.qrLabel, exact: true });

export const copyKeyOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.copyKey, exact: true });

export const copyBackupKeyOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.copyBackupKey, exact: true });

export const keyInfoOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.keyInfoLabel, exact: true });

export const keyInfoTipOf = (page: Page): Locator => page.getByRole('tooltip');

export const codeGroupOf = (page: Page): Locator =>
  sectionOf(page).getByRole('group', { name: twoFactorText.codeLabel, exact: true });

export const codeCellsOf = (page: Page): Locator => codeGroupOf(page).getByRole('textbox');

export const confirmOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.confirm, exact: true });

export const codesHeadingOf = (page: Page): Locator =>
  sectionOf(page).getByRole('heading', { level: 3, name: twoFactorText.codesTitle, exact: true });

export const codeListOf = (page: Page): Locator =>
  sectionOf(page).getByRole('list', { name: twoFactorText.codesTitle, exact: true });

export const copyCodesOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.copyCodes, exact: true });

export const savedBoxOf = (page: Page): Locator =>
  sectionOf(page).getByRole('checkbox', { name: twoFactorText.saved, exact: true });

export const doneOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.done, exact: true });

export const statusHeadingOf = (page: Page, text: string): Locator =>
  sectionOf(page).getByRole('heading', { name: text, exact: true });

export async function typeCode(page: Page, code: string): Promise<void> {
  await codeCellsOf(page).first().click();
  await page.keyboard.type(code);
}

export async function openSetup(page: Page): Promise<void> {
  await startOf(page).click();
  await expect(setupHeadingOf(page)).toBeFocused();
}

const SETUP_CODE = buildTotpCode();

export async function reachCodes(page: Page): Promise<void> {
  await openSetup(page);
  await typeCode(page, SETUP_CODE);
  await confirmOf(page).click();
  await expect(codesHeadingOf(page)).toBeFocused();
}

export async function stubClipboard(page: Page, mode: 'works' | 'missing'): Promise<void> {
  await page.addInitScript((clipboardMode: string) => {
    const holder = globalThis as unknown as { copied?: string };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value:
        clipboardMode === 'missing'
          ? undefined
          : {
              writeText: (text: string): Promise<void> => {
                holder.copied = text;
                return Promise.resolve();
              },
            },
    });
  }, mode);
}

export const copiedText = (page: Page): Promise<string | undefined> =>
  page.evaluate(() => (globalThis as unknown as { copied?: string }).copied);

export const selectedText = (page: Page): Promise<string> =>
  page.evaluate(() => window.getSelection()?.toString() ?? '');

export const openDisableOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.openDisable, exact: true });

export const openRegenerateOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.openRegenerate, exact: true });

export const cancelOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.cancel, exact: true });

export const disableHeadingOf = (page: Page): Locator =>
  sectionOf(page).getByRole('heading', { level: 3, name: twoFactorText.disableTitle, exact: true });

export const regenerateHeadingOf = (page: Page): Locator =>
  sectionOf(page).getByRole('heading', {
    level: 3,
    name: twoFactorText.regenerateTitle,
    exact: true,
  });

export const disableFieldOf = (page: Page): Locator =>
  sectionOf(page).getByRole('textbox', { name: twoFactorText.disableLabel, exact: true });

export const disableSubmitOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.disableSubmit, exact: true });

export const regenerateSubmitOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.regenerateSubmit, exact: true });

export const reauthSignInOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.reauthSignIn, exact: true });

export async function enableTwoFactor(page: Page): Promise<void> {
  await reachCodes(page);
  await savedBoxOf(page).focus();
  await page.keyboard.press('Space');
  await doneOf(page).click();
  await expect(statusHeadingOf(page, twoFactorText.statusOn)).toBeFocused();
}

export type Activate = (control: Locator) => Promise<void>;

const CARD_CODE = buildTotpCode();

async function expectCardHolds(page: Page, items: Locator, count: number): Promise<void> {
  const card = await sectionOf(page).elementHandle();
  const fit = await items.evaluateAll((elements, root) => {
    const style = getComputedStyle(root);
    const box = root.getBoundingClientRect();
    const left = box.left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
    const right = box.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
    const rects = elements.map((element) => element.getBoundingClientRect());
    return {
      count: rects.length,
      outside: rects.filter((rect) => rect.left < left - 0.5 || rect.right > right + 0.5).length,
    };
  }, card);
  expect(fit).toEqual({ count, outside: 0 });
  const spill = await sectionOf(page).evaluate((root) => root.scrollWidth - root.clientWidth);
  expect(spill).toBeLessThanOrEqual(0);
}

export async function expectEveryStateInsideCard(page: Page, activate: Activate): Promise<void> {
  await expectCardHolds(page, startOf(page), 1);
  await activate(startOf(page));
  await expect(setupHeadingOf(page)).toBeVisible();
  await expectCardHolds(page, confirmOf(page), 1);
  await activate(codeCellsOf(page).first());
  await page.keyboard.type(CARD_CODE);
  await activate(confirmOf(page));
  await expect(codesHeadingOf(page)).toBeVisible();
  await expectCardHolds(page, codeListOf(page).getByRole('listitem'), RECOVERY_CODES.length);
  await expectCardHolds(page, doneOf(page), 1);
  await activate(sectionOf(page).getByText(twoFactorText.saved, { exact: true }));
  await activate(doneOf(page));
  await expect(statusHeadingOf(page, twoFactorText.statusOn)).toBeVisible();
  await activate(openDisableOf(page));
  await expect(disableHeadingOf(page)).toBeVisible();
  await expectCardHolds(page, disableFieldOf(page), 1);
  await expectCardHolds(page, disableSubmitOf(page), 1);
  await activate(cancelOf(page));
  await activate(openRegenerateOf(page));
  await expect(regenerateHeadingOf(page)).toBeVisible();
  await expectCardHolds(page, regenerateSubmitOf(page), 1);
}
