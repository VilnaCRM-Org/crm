import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import { sidebarSettingsOf } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';

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
  emailPasswordField,
  expectEveryPasswordFieldEmpty,
  expectNoPersonalDataInUrls,
  expectOnlyAllowedOrigins,
  expectSuccessToast,
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

test.describe('Settings save journeys (issue #330)', () => {
  let contacted: () => string[] = () => [];
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    contacted = watchContactedOrigins(page);
    await signInToSettings(page);
  });

  test.afterEach(({ page }) => {
    expectOnlyAllowedOrigins(contacted(), page.url(), stub.calls);
    expectNoPersonalDataInUrls(contacted(), [password, newPassword, newEmail, NEW_NAME]);
  });

  test('opens through the sidebar Settings link: skeleton first, then the card, one read', async ({
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

  test('saves a name with the exact input keys and collapses the name form', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openLoadedSettings(page);
    await expect(saveNameButton(page)).toBeHidden();
    await expect(namePasswordField(page)).toHaveCount(0);

    await saveEditedName(page, NEW_NAME, password);

    await expectSuccessToast(page, text.saved);
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

  test('saves a name from its Save straight from the empty, focused new password', async ({
    page,
  }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openLoadedSettings(page);
    await editName(page, NEW_NAME, password);
    await newPasswordField(page).click();
    await expect(page.locator('#new-password-rules')).toBeVisible();

    await saveNameButton(page).click();

    await expectSuccessToast(page, text.saved);
    expect(stub.count('UpdateUser')).toBe(1);
  });

  test('a name save sends only the name and keeps the e-mail and password drafts', async ({
    page,
  }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openLoadedSettings(page);
    await editEmail(page, newEmail, password);
    await editPassword(page, password, newPassword);

    await saveEditedName(page, NEW_NAME, password);

    await expectSuccessToast(page, text.saved);
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

  test('saves an e-mail, shows the unconfirmed row and resends the link once', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithSaved({ email: newEmail, confirmed: false })],
      ResendEmailToUser: [replyWithResent()],
    });
    await openLoadedSettings(page);

    await saveEditedEmail(page, newEmail, password);

    await expectSuccessToast(page, text.emailSent);
    await expect(saveEmailButton(page)).toBeHidden();
    await expect(page.getByText(text.unconfirmed, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: text.resend, exact: true }).click();

    await expectSuccessToast(page, text.resent);
    expect(stub.count('ResendEmailToUser')).toBe(1);
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

  test('sends nothing and says so when only the current password is typed', async ({ page }) => {
    stub = await stubProfile(page);
    await openLoadedSettings(page);

    await fillCurrentPassword(page, password);
    await saveButton(page).click();

    await expect(page.getByText(text.noChanges, { exact: true })).toBeVisible();
    expect(stub.count('UpdateUser')).toBe(0);
  });
});
