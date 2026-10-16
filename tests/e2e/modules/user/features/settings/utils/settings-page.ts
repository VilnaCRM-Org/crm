import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import fillInput from '@tests/e2e/utils/fill-input';
import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

import { PROFILE_NODE, originsOf } from './profile-stub';

export const text = {
  title: `${t('settings.title')} - VilnaCRM`,
  heading: t('settings.heading'),
  homeLink: t('home.settings_link'),
  loading: t('settings.profile.loading'),
  name: t('sign_up.form.name_input.label'),
  email: t('sign_up.form.email_input.label'),
  currentPassword: t('settings.profile.current_password'),
  newPassword: t('settings.profile.new_password'),
  save: t('settings.profile.save'),
  noChanges: t('settings.profile.no_changes'),
  unconfirmed: t('settings.profile.email_unconfirmed'),
  resend: t('settings.profile.resend'),
  saved: t('settings.toasts.saved'),
  emailSent: t('settings.toasts.email_sent'),
  passwordChanged: t('settings.toasts.password_changed'),
  resent: t('settings.toasts.resent'),
  transient: t('settings.toasts.save_failed_transient'),
  rateLimited: t('settings.toasts.rate_limited'),
  passwordWrong: t('settings.errors.password_wrong'),
  emailTaken: t('sign_up.errors.email_used'),
  tryAgain: t('auth.error.tryAgain'),
  sessionEnded: t('sign_in.notices.session_ended'),
  signInTitle: t('sign_in.title'),
};

export const nameField = (page: Page): Locator => page.getByLabel(text.name, { exact: true });
export const emailField = (page: Page): Locator => page.getByLabel(text.email, { exact: true });
export const currentPasswordField = (page: Page): Locator =>
  page.getByLabel(text.currentPassword, { exact: true });
export const newPasswordField = (page: Page): Locator =>
  page.getByLabel(text.newPassword, { exact: true });
export const saveButton = (page: Page): Locator =>
  page.getByRole('button', { name: text.save, exact: true });

export async function openSettingsFromHome(page: Page): Promise<void> {
  await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: text.homeLink, exact: true }).click();
}

export async function openLoadedSettings(page: Page): Promise<void> {
  await openSettingsFromHome(page);
  await expect(page).toHaveURL(ROUTE_PATHS.settings);
  await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
}

export async function expectEveryPasswordFieldEmpty(page: Page): Promise<void> {
  await expect(currentPasswordField(page)).toHaveValue('');
  await expect(newPasswordField(page)).toHaveValue('');
}

export async function fillCurrentPassword(page: Page, password: string): Promise<void> {
  await fillInput(currentPasswordField(page), password);
}

export async function editName(page: Page, fullName: string, password: string): Promise<void> {
  await fillInput(nameField(page), fullName);
  await fillCurrentPassword(page, password);
}

export async function expectToastsInOrder(page: Page, messages: string[]): Promise<void> {
  const escaped = messages.map((message) => message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const toasts = page.getByText(new RegExp(`^(${escaped.join('|')})$`));
  await expect(toasts).toHaveText(messages);
}

export function expectOnlyAllowedOrigins(
  urls: readonly string[],
  documentUrl: string,
  allowed: readonly string[]
): void {
  const permitted = [new URL(documentUrl).origin, ...allowed];
  expect(originsOf(urls).filter((origin) => !permitted.includes(origin))).toEqual([]);
}

export function expectNoPersonalDataInUrls(urls: readonly string[], secrets: string[]): void {
  const decoded = urls.map((url) => decodeURIComponent(url));
  expect(decoded.filter((url) => secrets.some((secret) => url.includes(secret)))).toEqual([]);
}
