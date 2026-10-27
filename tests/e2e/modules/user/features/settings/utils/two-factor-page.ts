import type { Locator, Page } from '@playwright/test';

import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import { signInToSettings } from './profile-stub';

export const twoFactorText = {
  title: t('settings.two_factor.title'),
  start: t('settings.two_factor.start'),
  preparing: t('settings.two_factor.preparing'),
  setupTitle: t('settings.two_factor.setup.title'),
  qrLabel: t('settings.two_factor.setup.qr_label'),
  copyKey: t('settings.two_factor.setup.copy_key'),
  keyCopied: t('settings.two_factor.setup.key_copied'),
  copyFailed: t('settings.two_factor.setup.copy_failed'),
  codeLabel: t('settings.two_factor.confirm.code_label'),
  note: t('settings.two_factor.confirm.note'),
  confirm: t('settings.two_factor.confirm.submit'),
  incomplete: t('settings.two_factor.errors.incomplete'),
  invalidCode: t('settings.two_factor.errors.invalid_code'),
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
} as const;

export const KEY_IN_GROUPS = 'JBSW Y3DP EHPK 3PXP';

export async function signInToTwoFactorSettings(
  page: Page,
  twoFactorAuth: boolean = true
): Promise<void> {
  await seedPreloadedAuthToken(page);
  await overrideRuntimeConfig(page, { flags: { userSettings: true, twoFactorAuth } });
  await signInToSettings(page);
}

export const sectionOf = (page: Page): Locator =>
  page.getByRole('region', { name: twoFactorText.title, exact: true });

export const startOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.start, exact: true });

export const setupHeadingOf = (page: Page): Locator =>
  sectionOf(page).getByRole('heading', { level: 3, name: twoFactorText.setupTitle, exact: true });

export const qrOf = (page: Page): Locator =>
  sectionOf(page).getByRole('img', { name: twoFactorText.qrLabel, exact: true });

export const copyKeyOf = (page: Page): Locator =>
  sectionOf(page).getByRole('button', { name: twoFactorText.copyKey, exact: true });

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
  sectionOf(page).getByRole('heading', { level: 3, name: text, exact: true });

export async function typeCode(page: Page, code: string): Promise<void> {
  await codeCellsOf(page).first().click();
  await page.keyboard.type(code);
}

export async function openSetup(page: Page): Promise<void> {
  await startOf(page).click();
  await expect(setupHeadingOf(page)).toBeFocused();
}

export async function reachCodes(page: Page): Promise<void> {
  await openSetup(page);
  await typeCode(page, '123456');
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
