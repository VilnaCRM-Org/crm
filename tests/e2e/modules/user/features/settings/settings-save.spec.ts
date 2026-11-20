import ROUTE_PATHS from '@/routes/route-paths';
import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import { bellOf, sidebarSettingsOf } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  NOTIFICATION_STYLES,
  useNotificationStyle,
  watchNotificationFootprint,
} from '@tests/e2e/utils/notification-style';

import {
  PROFILE_NODE,
  holdReply,
  replyWithProfile,
  replyWithResent,
  replyWithSaved,
  signInToSettings,
  stubProfile,
  watchContactedOrigins,
  type StubbedProfile,
} from './utils/profile-stub';
import {
  editEmail,
  editName,
  editPassword,
  emailField,
  everySectionReplies,
  saveEverySection,
  emailPasswordField,
  expectEveryPasswordFieldEmpty,
  expectNoPersonalDataInUrls,
  expectOnlyAllowedOrigins,
  actionRowBottom,
  documentBoxOf,
  expectFocusKeptOnAppearance,
  expectSuccessOutcome,
  expectSuccessToast,
  inlineBlockOf,
  passwordFormOf,
  unreadDescription,
  watchFocusOnAppearance,
  expectToastsInOrder,
  fillCurrentPassword,
  namePasswordField,
  newPasswordField,
  openLoadedSettings,
  saveButton,
  saveEditedEmail,
  saveEditedName,
  saveEmailButton,
  saveNameButton,
  text,
  currentPasswordField,
  nameField,
} from './utils/settings-page';

const NEW_NAME = buildFullName();
const password = buildPassword();
const newPassword = buildPassword();
const newEmail = buildEmail();

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 1024, height: 1366 };
const MOBILE = { width: 375, height: 812 };

const EXPECTED_NOTIFICATION_CHUNKS = {
  toast: ['notifications-shell'],
  inline: ['notifications-shell'],
  bell: ['notifications-notice', 'notifications-shell'],
} as const;

const CONTAINER_CHUNK =
  /tsyringe|reflect-metadata|dependency-injection|container|apollo|graphql|zod/i;

const notificationChunksOf = (chunks: readonly string[]): string[] =>
  chunks.filter((chunk) => chunk.startsWith('notifications-'));

for (const style of NOTIFICATION_STYLES) {
  test.describe(`Settings save journeys under ${style} (issues #330, #391)`, () => {
    let contacted: () => string[] = () => [];
    let stub: StubbedProfile;

    test.beforeEach(async ({ page }) => {
      contacted = watchContactedOrigins(page);
      await useNotificationStyle(page, style);
      await signInToSettings(page);
    });

    test.afterEach(({ page }) => {
      expectOnlyAllowedOrigins(contacted(), page.url(), stub.calls);
      expectNoPersonalDataInUrls(contacted(), [password, newPassword, newEmail, NEW_NAME]);
    });

    test('opens through the sidebar Settings link: skeleton, then the card, one read', async ({
      page,
    }) => {
      const gate = holdReply(replyWithProfile());
      stub = await stubProfile(page, { CurrentUser: [gate.reply] });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const documents: string[] = [];
      page.on('request', (request) => {
        if (request.resourceType() === 'document') documents.push(request.url());
      });

      await sidebarSettingsOf(page).click();

      await expect(page).toHaveTitle(text.title);
      await expect(page.getByRole('main')).toBeFocused();
      await expect(page.getByRole('heading', { level: 1, name: text.heading })).toBeVisible();
      await expect(page.getByRole('status').filter({ hasText: text.loading })).toBeAttached();
      await expect(page.locator('#profile-skeleton-save')).toBeVisible();

      gate.release();

      await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
      await expect(page.locator('#profile-skeleton-save')).toHaveCount(0);
      expect(documents).toEqual([]);
      expect(stub.count('CurrentUser')).toBe(1);
      expect(stub.shellCalls).toHaveLength(1);
      expect(stub.calls[0]?.authorization).toMatch(/^Bearer \S+/);
    });

    test('J1: saves a name with the exact input keys and collapses the name form', async ({
      page,
    }) => {
      stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
      await openLoadedSettings(page);
      await expect(saveNameButton(page)).toBeHidden();
      await expect(namePasswordField(page)).toHaveCount(0);
      await editName(page, NEW_NAME, password);
      await watchFocusOnAppearance(page, text.saved);

      await saveNameButton(page).click();

      await expectSuccessOutcome(page, style, text.saved);
      await expectFocusKeptOnAppearance(page);
      await expect(page.getByText(NEW_NAME, { exact: true })).toBeVisible();
      await expect(namePasswordField(page)).toHaveCount(0);
      await expect(saveNameButton(page)).toBeHidden();
      await expect(nameField(page)).toBeFocused();
      await expectEveryPasswordFieldEmpty(page);
      const updates = stub.calls.filter((call) => call.operation === 'UpdateUser');
      expect(updates).toHaveLength(1);
      expect(Object.keys(updates[0]?.variables.input as object).sort()).toEqual([
        'clientMutationId',
        'id',
        'initials',
        'password',
      ]);
    });

    test('J1: saves a name from its Save straight from the empty, focused new password', async ({
      page,
    }) => {
      stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
      await openLoadedSettings(page);
      await editName(page, NEW_NAME, password);
      await newPasswordField(page).click();
      await expect(page.locator('#new-password-rules')).toBeVisible();

      await saveNameButton(page).click();

      await expectSuccessOutcome(page, style, text.saved);
      expect(stub.count('UpdateUser')).toBe(1);
    });

    test('J1: a name save sends only the name and keeps the e-mail and password drafts', async ({
      page,
    }) => {
      stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
      await openLoadedSettings(page);
      await editEmail(page, newEmail, password);
      await editPassword(page, password, newPassword);

      await saveEditedName(page, NEW_NAME, password);

      await expectSuccessOutcome(page, style, text.saved);
      const update = stub.calls.find((call) => call.operation === 'UpdateUser');
      expect(Object.keys(update?.variables.input as object).sort()).toEqual([
        'clientMutationId',
        'id',
        'initials',
        'password',
      ]);
      await expect(emailField(page)).toHaveValue(newEmail);
      await expect(emailPasswordField(page)).toHaveValue(password);
      await expect(currentPasswordField(page)).toHaveValue(password);
      await expect(newPasswordField(page)).toHaveValue(newPassword);
    });

    test('J2 and J8: saves an e-mail, shows the unconfirmed row and resends once', async ({
      page,
    }) => {
      stub = await stubProfile(page, {
        UpdateUser: [replyWithSaved({ email: newEmail, confirmed: false })],
        ResendEmailToUser: [replyWithResent()],
      });
      await openLoadedSettings(page);

      await saveEditedEmail(page, newEmail, password);

      await expectSuccessOutcome(page, style, text.emailSent);
      await expect(saveEmailButton(page)).toBeHidden();
      await expect(page.getByText(text.unconfirmed, { exact: true })).toBeVisible();

      await page.getByRole('button', { name: text.resend, exact: true }).click();

      await expectSuccessOutcome(page, style, text.resent);
      expect(stub.count('ResendEmailToUser')).toBe(1);
    });

    test('J3: changes the password and empties both password fields', async ({ page }) => {
      stub = await stubProfile(page);
      await openLoadedSettings(page);
      await editPassword(page, password, newPassword);

      await saveButton(page).click();

      await expectSuccessOutcome(page, style, text.passwordChanged);
      await expectEveryPasswordFieldEmpty(page);
      expect(stub.count('UpdateUser')).toBe(1);
    });

    test('J4: three section saves in turn raise the badge from one to four', async ({ page }) => {
      const edits = { fullName: NEW_NAME, email: newEmail, password, newPassword };
      stub = await stubProfile(page, everySectionReplies(edits));
      await page.setViewportSize(DESKTOP);
      await openLoadedSettings(page);
      await expect(bellOf(page).getByText('1', { exact: true })).toBeVisible();

      await saveEverySection(page, style, edits);

      expect(stub.count('UpdateUser')).toBe(3);
      await expect(bellOf(page).getByText('4', { exact: true })).toBeVisible();
      await expect(bellOf(page)).toHaveAccessibleDescription(unreadDescription(4));
      await page.setViewportSize(TABLET);
      await expect(bellOf(page).getByText('4', { exact: true })).toBeVisible();
      await page.setViewportSize(MOBILE);
      await expect(bellOf(page)).toHaveAccessibleDescription(unreadDescription(4));
    });

    test('sends nothing and says so when only the current password is typed', async ({ page }) => {
      stub = await stubProfile(page);
      await openLoadedSettings(page);

      await fillCurrentPassword(page, password);
      await saveButton(page).click();

      await expect(page.getByText(text.noChanges, { exact: true })).toBeVisible();
      expect(stub.count('UpdateUser')).toBe(0);
    });
  });

  test.describe(`Notification footprint under ${style} (issue #391)`, () => {
    test('loads only the expected notification chunks and writes no notification data', async ({
      page,
    }) => {
      const footprint = await watchNotificationFootprint(page);
      const styled = await useNotificationStyle(page, style);
      await signInToSettings(page);
      const stub = await stubProfile(page, {
        UpdateUser: [replyWithSaved({ initials: NEW_NAME })],
      });
      await page.setViewportSize(DESKTOP);

      const response = await page.goto(ROUTE_PATHS.home, { waitUntil: 'domcontentloaded' });
      await expect(bellOf(page)).toBeEnabled();

      await expect
        .poll(() => notificationChunksOf(footprint.scriptChunks()))
        .toEqual([...EXPECTED_NOTIFICATION_CHUNKS[style]]);
      expect(footprint.scriptChunks().filter((chunk) => CONTAINER_CHUNK.test(chunk))).toEqual([]);
      expect(styled.documents().map((document) => document.contentSecurityPolicy)).toEqual([
        response?.headers()['content-security-policy'],
      ]);

      await sidebarSettingsOf(page).click();
      await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
      await saveEditedName(page, NEW_NAME, password);
      await expectSuccessOutcome(page, style, text.saved);

      expect(notificationChunksOf(footprint.scriptChunks())).toEqual([
        ...EXPECTED_NOTIFICATION_CHUNKS[style],
      ]);
      expect(footprint.scriptLoads('notifications-history')).toBe(0);

      await bellOf(page).click();
      await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'true');

      await expect.poll(() => footprint.scriptLoads('notifications-history')).toBe(1);
      await bellOf(page).click();
      await bellOf(page).click();
      await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'true');
      expect(footprint.scriptLoads('notifications-history')).toBe(1);
      expect(footprint.notificationRequests()).toEqual([]);
      expect(await footprint.notificationStorageWrites()).toEqual([]);
      expect(stub.calls.filter((call) => /notification/i.test(call.operation))).toEqual([]);
    });
  });
}

test.describe('Inline outcome placement (issue #391)', () => {
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    await useNotificationStyle(page, 'inline');
    await signInToSettings(page);
  });

  test.afterEach(() => {
    expect(stub.count('UpdateUser')).toBe(1);
  });

  for (const viewport of [DESKTOP, TABLET, MOBILE]) {
    test(`places the password outcome at ${viewport.width} × ${viewport.height}`, async ({
      page,
    }) => {
      stub = await stubProfile(page);
      await page.setViewportSize(DESKTOP);
      await openLoadedSettings(page);
      await page.setViewportSize(viewport);
      await page.evaluate(() => document.fonts.ready);
      await editPassword(page, password, newPassword);
      const save = saveButton(page);
      await save.focus();
      const before = await documentBoxOf(save);

      await save.press('Enter');

      const form = passwordFormOf(page);
      const block = inlineBlockOf(form, text.passwordChanged);
      await expect(block).toBeInViewport({ ratio: 1 });
      await expect(save).toBeFocused();
      expect(await documentBoxOf(save)).toEqual(before);
      const gap = (await documentBoxOf(block)).y - (await actionRowBottom(form));
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(16);
    });
  }
});

test.describe('Toast stack order (issue #330)', () => {
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('stacks one toast per save in order when each aspect is saved in turn', async ({ page }) => {
    const saved = replyWithSaved({ initials: NEW_NAME, email: newEmail, confirmed: false });
    stub = await stubProfile(page, {
      UpdateUser: [replyWithSaved({ initials: NEW_NAME }), saved, saved],
    });
    await openLoadedSettings(page);

    await saveEditedName(page, NEW_NAME, password);
    await expectSuccessToast(page, text.saved);
    await saveEditedEmail(page, newEmail, password);
    await expectSuccessToast(page, text.emailSent);
    await editPassword(page, password, newPassword);
    await saveButton(page).click();

    await expectToastsInOrder(page, [text.saved, text.emailSent, text.passwordChanged]);
    expect(stub.count('UpdateUser')).toBe(3);
  });
});
