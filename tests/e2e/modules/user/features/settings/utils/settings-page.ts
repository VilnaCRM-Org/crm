import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { sidebarSettingsOf } from '@tests/e2e/utils/app-shell';
import fillInput from '@tests/e2e/utils/fill-input';
import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

import { PROFILE_NODE, type RecordedCall, configuredOrigin, originsOf } from './profile-stub';

export const text = {
  title: `${t('settings.title')} - VilnaCRM`,
  heading: t('settings.heading'),
  loading: t('settings.profile.loading'),
  name: t('settings.profile.full_name'),
  email: t('sign_up.form.email_input.label'),
  namePassword: t('settings.profile.full_name_password'),
  emailPassword: t('settings.profile.email_password'),
  currentPassword: t('settings.profile.current_password'),
  newPassword: t('settings.profile.new_password'),
  save: t('settings.profile.save'),
  saveName: t('settings.profile.save_name'),
  saveEmail: t('settings.profile.save_email'),
  clear: t('settings.profile.clear'),
  noChanges: t('settings.profile.no_changes'),
  unconfirmed: t('settings.profile.email_unconfirmed'),
  resend: t('settings.profile.resend'),
  saved: t('settings.toasts.saved'),
  emailSent: t('settings.toasts.email_sent'),
  passwordChanged: t('settings.toasts.password_changed'),
  resent: t('settings.toasts.resent'),
  transient: t('settings.toasts.save_failed_transient'),
  rateLimited: t('settings.toasts.rate_limited'),
  toastClose: t('ui_toast.close'),
  passwordWrong: t('settings.errors.password_wrong'),
  emailTaken: t('sign_up.errors.email_used'),
  tryAgain: t('auth.error.tryAgain'),
  sessionEnded: t('sign_in.notices.session_ended'),
  signInTitle: t('sign_in.title'),
};

export const nameField = (page: Page): Locator => page.getByLabel(text.name, { exact: true });
export const emailField = (page: Page): Locator => page.getByLabel(text.email, { exact: true });
export const namePasswordField = (page: Page): Locator =>
  page.getByLabel(text.namePassword, { exact: true });
export const emailPasswordField = (page: Page): Locator =>
  page.getByLabel(text.emailPassword, { exact: true });
export const currentPasswordField = (page: Page): Locator =>
  page.getByLabel(text.currentPassword, { exact: true });
export const newPasswordField = (page: Page): Locator =>
  page.getByLabel(text.newPassword, { exact: true });
export const saveButton = (page: Page): Locator =>
  page.getByRole('button', { name: text.save, exact: true });
export const saveNameButton = (page: Page): Locator =>
  page.getByRole('button', { name: text.saveName, exact: true });
export const saveEmailButton = (page: Page): Locator =>
  page.getByRole('button', { name: text.saveEmail, exact: true });
export const clearButtonOf = (field: Locator): Locator =>
  field.locator('xpath=ancestor::form').getByRole('button', { name: text.clear, exact: true });

export const toastClose = (page: Page): Locator =>
  page.getByRole('button', { name: text.toastClose, exact: true });

const shownToasts = (page: Page): Locator => toastClose(page).locator('xpath=..');

export const toastMessage = (page: Page, message: string): Locator =>
  shownToasts(page).getByText(message, { exact: true });

export async function expectSuccessToast(page: Page, message: string): Promise<void> {
  await expect(toastMessage(page, message)).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: message })).toBeAttached();
}

export async function expectErrorToast(page: Page, message: string): Promise<void> {
  await expect(toastMessage(page, message)).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: message })).toBeAttached();
  await expect(toastClose(page)).toHaveAccessibleDescription(message);
}

export async function openSettingsFromHome(page: Page): Promise<void> {
  await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
  await sidebarSettingsOf(page).click();
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
  await fillInput(namePasswordField(page), password);
}

export async function saveEditedName(
  page: Page,
  fullName: string,
  password: string
): Promise<void> {
  await editName(page, fullName, password);
  await saveNameButton(page).click();
}

export async function editEmail(page: Page, email: string, password: string): Promise<void> {
  await fillInput(emailField(page), email);
  await fillInput(emailPasswordField(page), password);
}

export async function saveEditedEmail(page: Page, email: string, password: string): Promise<void> {
  await editEmail(page, email, password);
  await saveEmailButton(page).click();
}

export async function editPassword(
  page: Page,
  password: string,
  newPassword: string
): Promise<void> {
  await fillCurrentPassword(page, password);
  await fillInput(newPasswordField(page), newPassword);
}

export async function expectToastsInOrder(page: Page, messages: string[]): Promise<void> {
  const escaped = messages.map((message) => message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const toasts = shownToasts(page).getByText(new RegExp(`^(${escaped.join('|')})$`));
  await expect(toasts).toHaveText(messages);
  await expect(page.getByRole('status').filter({ hasText: messages.at(-1) ?? '' })).toBeAttached();
}

export function expectOnlyAllowedOrigins(
  urls: readonly string[],
  documentUrl: string,
  calls: readonly RecordedCall[],
  extra: readonly string[] = []
): void {
  const graphqlOrigin = configuredOrigin(process.env.REACT_APP_GRAPHQL_URL, documentUrl);
  const permitted = [new URL(documentUrl).origin, graphqlOrigin, ...extra];
  expect(originsOf(calls.map((call) => call.url)).filter((o) => o !== graphqlOrigin)).toEqual([]);
  expect(originsOf(urls).filter((origin) => !permitted.includes(origin))).toEqual([]);
}

export function expectNoPersonalDataInUrls(urls: readonly string[], secrets: string[]): void {
  const decoded = urls.map((url) => decodeURIComponent(url));
  expect(decoded.filter((url) => secrets.some((secret) => url.includes(secret)))).toEqual([]);
}
