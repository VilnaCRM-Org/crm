import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { sidebarSettingsOf } from '@tests/e2e/utils/app-shell';
import fillInput from '@tests/e2e/utils/fill-input';
import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

import {
  PROFILE_NODE,
  type ProfileReplies,
  type RecordedCall,
  configuredOrigin,
  originsOf,
  replyWithSaved,
} from './profile-stub';

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
  saveFailed: t('settings.toasts.save_failed'),
  resendFailed: t('settings.toasts.resend_failed'),
  rateLimited: t('settings.toasts.rate_limited'),
  noticeClose: t('ui_notification.close'),
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

export const noticeClose = (page: Page): Locator =>
  page.getByRole('banner').getByRole('button', { name: text.noticeClose, exact: true });

export const noticeCardOf = (page: Page): Locator =>
  noticeClose(page).first().locator('xpath=ancestor::ul[1]/../..');

export const outcomeIn = (page: Page, message: string): Locator =>
  page.getByRole('banner').getByText(message, { exact: true });

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

type LiveRole = 'status' | 'alert';

const OTHER_LIVE_ROLE: Record<LiveRole, LiveRole> = { status: 'alert', alert: 'status' };

export async function expectAnnouncedOnce(
  page: Page,
  message: string,
  role: LiveRole
): Promise<void> {
  await expect(page.getByRole(role).filter({ hasText: message })).toHaveCount(1);
  await expect(page.getByRole(OTHER_LIVE_ROLE[role]).filter({ hasText: message })).toHaveCount(0);
}

async function expectShownOnce(page: Page, message: string): Promise<void> {
  await expect(outcomeIn(page, message)).toHaveCount(1);
  await expect(outcomeIn(page, message)).toBeVisible();
}

export async function expectSuccessOutcome(page: Page, message: string): Promise<void> {
  await expectShownOnce(page, message);
  await expectAnnouncedOnce(page, message, 'status');
}

export async function expectErrorOutcome(page: Page, message: string): Promise<void> {
  await expectShownOnce(page, message);
  await expectAnnouncedOnce(page, message, 'alert');
}

const FOCUS_WATCH_KEY = '__notificationFocusWatch';

interface FocusWatch {
  readonly settled: boolean;
  readonly kept: boolean;
}

export async function watchFocusOnAppearance(page: Page, message: string): Promise<void> {
  await page.evaluate(
    ({ key, expected }) => {
      const state = { settled: false, kept: false };
      Reflect.set(window, key, state);
      const shownMessage = (): Element | undefined =>
        [...document.querySelectorAll('span')].find(
          (element) =>
            element.textContent === expected &&
            element.closest('[role="status"], [role="alert"]') === null
        );
      const outsideOutcome = (outcome: Element | null): boolean =>
        outcome === null || !outcome.contains(document.activeElement);
      const observer = new MutationObserver(() => {
        const message = shownMessage();
        if (message === undefined) return;
        observer.disconnect();
        const outcome = message.parentElement;
        const atAppearance = outsideOutcome(outcome);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            state.kept = atAppearance && outsideOutcome(outcome);
            state.settled = true;
          })
        );
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    },
    { key: FOCUS_WATCH_KEY, expected: message }
  );
}

export async function expectFocusKeptOnAppearance(page: Page): Promise<void> {
  const read = (): Promise<FocusWatch> =>
    page.evaluate((key) => Reflect.get(window, key) as FocusWatch, FOCUS_WATCH_KEY);
  await expect.poll(async () => (await read()).settled).toBe(true);
  expect((await read()).kept).toBe(true);
}

export const unreadDescription = (count: number): string =>
  t('notification_center.bell.unread_count', { count });

export interface DocumentBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface SectionEdits {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly newPassword: string;
}

export const everySectionReplies = (edits: SectionEdits): ProfileReplies => {
  const saved = replyWithSaved({ initials: edits.fullName, email: edits.email, confirmed: false });
  return { UpdateUser: [replyWithSaved({ initials: edits.fullName }), saved, saved] };
};

export async function saveEverySection(page: Page, edits: SectionEdits): Promise<void> {
  await saveEditedName(page, edits.fullName, edits.password);
  await expectSuccessOutcome(page, text.saved);
  await saveEditedEmail(page, edits.email, edits.password);
  await expectSuccessOutcome(page, text.emailSent);
  await editPassword(page, edits.password, edits.newPassword);
  await saveButton(page).click();
  await expectSuccessOutcome(page, text.passwordChanged);
}
