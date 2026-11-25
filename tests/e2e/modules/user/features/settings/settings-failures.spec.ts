import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';

import {
  holdReply,
  replyWithGraphQLError,
  replyWithResent,
  replyWithSaved,
  replyWithStatus,
  replyWithUnparsedUpdate,
  signInToSettings,
  stubProfile,
  watchContactedOrigins,
  type StubbedProfile,
} from './utils/profile-stub';
import {
  editName,
  emailField,
  expectErrorOutcome,
  expectFocusKeptOnAppearance,
  expectNoPersonalDataInUrls,
  expectOnlyAllowedOrigins,
  expectSuccessOutcome,
  expectUnread,
  namePasswordField,
  noticeClose,
  openLoadedSettings,
  outcomeIn,
  saveEditedEmail,
  saveEditedName,
  saveNameButton,
  text,
  watchFocusOnAppearance,
} from './utils/settings-page';

const NEW_NAME = buildFullName();
const password = buildPassword();

test.describe('Settings save failures (issues #330, #391)', () => {
  let contacted: () => string[] = () => [];
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    contacted = watchContactedOrigins(page);
    await signInToSettings(page);
  });

  test.afterEach(async ({ page, context }) => {
    await context.setOffline(false);
    expectOnlyAllowedOrigins(contacted(), page.url(), stub.calls);
    expectNoPersonalDataInUrls(contacted(), [password, NEW_NAME]);
  });

  test('shows the wrong-password error on the field for a message-only answer', async ({
    page,
  }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithGraphQLError('Old password is invalid')],
    });
    await openLoadedSettings(page);

    await saveEditedName(page, NEW_NAME, password);

    await expect(page.getByText(text.passwordWrong, { exact: true })).toBeVisible();
    await expect(namePasswordField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(namePasswordField(page)).toBeFocused();
    expect(stub.count('UpdateUser')).toBe(1);
  });

  test('shows the taken-e-mail error on the e-mail field for a 422', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithGraphQLError('email: This email address is already registered', 422)],
    });
    await openLoadedSettings(page);

    await saveEditedEmail(page, buildEmail(), password);

    await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();
    await expect(emailField(page)).toHaveAttribute('aria-invalid', 'true');
  });

  test('J6: shows the rate-limit outcome with no retry action for an HTTP 429', async ({
    page,
  }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithStatus(429)] });
    await openLoadedSettings(page);

    await saveEditedName(page, NEW_NAME, password);

    await expectErrorOutcome(page, text.rateLimited);
    await expectUnread(page, 2);
    await expect(noticeClose(page)).toHaveAccessibleDescription(text.rateLimited);
    await expect(page.getByRole('button', { name: text.tryAgain })).toHaveCount(0);
  });

  test('J5: offers a retry for an HTTP 503 that sends exactly one more update', async ({
    page,
  }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithSaved({ initials: NEW_NAME })],
    });
    await openLoadedSettings(page);

    await saveEditedName(page, NEW_NAME, password);
    await expectErrorOutcome(page, text.transient);
    await expectUnread(page, 2);
    expect(stub.count('UpdateUser')).toBe(1);

    await page.getByRole('button', { name: text.tryAgain, exact: true }).click();

    await expectSuccessOutcome(page, text.saved);
    await expect(outcomeIn(page, text.transient)).toHaveCount(0);
    await expectUnread(page, 3);
    expect(stub.count('UpdateUser')).toBe(2);
  });

  test('J5: retries the failed name save, not an e-mail saved after it', async ({ page }) => {
    const newEmail = buildEmail();
    stub = await stubProfile(page, {
      UpdateUser: [
        replyWithStatus(503),
        replyWithSaved({ email: newEmail, confirmed: false }),
        replyWithSaved({ initials: NEW_NAME, email: newEmail, confirmed: false }),
      ],
    });
    await openLoadedSettings(page);
    await saveEditedName(page, NEW_NAME, password);
    await expectErrorOutcome(page, text.transient);
    await saveEditedEmail(page, newEmail, password);
    await expectSuccessOutcome(page, text.emailSent);

    await page.getByRole('button', { name: text.tryAgain, exact: true }).click();

    await expectSuccessOutcome(page, text.saved);
    await expectUnread(page, 4);
    const updates = stub.calls.filter((call) => call.operation === 'UpdateUser');
    expect(updates).toHaveLength(3);
    expect(updates[2]?.variables['input']).toMatchObject({ initials: NEW_NAME });
    expect(updates[2]?.variables['input']).not.toHaveProperty('email');
  });

  test('moves focus to the heading when a Save settles offline', async ({ page, context }) => {
    const gate = holdReply(replyWithStatus(503));
    stub = await stubProfile(page, { UpdateUser: [gate.reply] });
    await openLoadedSettings(page);
    await editName(page, NEW_NAME, password);
    await saveNameButton(page).click();
    await expect(saveNameButton(page)).toBeDisabled();
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await expect(page.locator('body')).toBeFocused();

    await context.setOffline(true);
    gate.release();

    await expectErrorOutcome(page, text.transient);
    await expect(saveNameButton(page)).toBeDisabled();
    await expect(page.getByRole('heading', { level: 1, name: text.heading })).toBeFocused();
  });

  test('disables Save while offline and sends nothing, Enter included', async ({
    page,
    context,
  }) => {
    stub = await stubProfile(page);
    await openLoadedSettings(page);
    await page.evaluate(() => document.fonts.ready);
    await editName(page, NEW_NAME, password);

    await context.setOffline(true);
    await expect(saveNameButton(page)).toBeDisabled();
    await namePasswordField(page).press('Enter');

    await expect(namePasswordField(page)).toBeFocused();
    await expect(saveNameButton(page)).toBeDisabled();
    await expect(page.getByRole('status').filter({ hasText: text.saved })).toHaveCount(0);
    expect(stub.count('UpdateUser')).toBe(0);
  });

  test('J7: shows the save failure with no retry action and announces it assertively', async ({
    page,
  }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithUnparsedUpdate] });
    await openLoadedSettings(page);
    await editName(page, NEW_NAME, password);
    await watchFocusOnAppearance(page, text.saveFailed);

    await saveNameButton(page).click();

    await expectErrorOutcome(page, text.saveFailed);
    await expectUnread(page, 2);
    await expectFocusKeptOnAppearance(page);
    await expect(saveNameButton(page)).toBeFocused();
    await expect(page.getByRole('button', { name: text.tryAgain })).toHaveCount(0);
    expect(stub.count('UpdateUser')).toBe(1);
  });

  test('J9: shows the resend failure in the bell card', async ({ page }) => {
    const newEmail = buildEmail();
    stub = await stubProfile(page, {
      UpdateUser: [replyWithSaved({ email: newEmail, confirmed: false })],
      ResendEmailToUser: [replyWithStatus(503), replyWithResent()],
    });
    await openLoadedSettings(page);
    await saveEditedEmail(page, newEmail, password);
    await expectSuccessOutcome(page, text.emailSent);

    await page.getByRole('button', { name: text.resend, exact: true }).click();

    await expectErrorOutcome(page, text.resendFailed);
    await expectUnread(page, 3);
    expect(stub.count('ResendEmailToUser')).toBe(1);
  });
});

test.describe('Notice focus return (issue #330)', () => {
  let contacted: () => string[] = () => [];
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    contacted = watchContactedOrigins(page);
    await signInToSettings(page);
  });

  test.afterEach(({ page }) => {
    expectOnlyAllowedOrigins(contacted(), page.url(), stub.calls);
    expectNoPersonalDataInUrls(contacted(), [password, NEW_NAME]);
  });

  test('returns focus to the e-mail field when the last notice row closes', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithSaved({ email: buildEmail() })],
    });
    await openLoadedSettings(page);
    await saveEditedName(page, NEW_NAME, password);
    await expectErrorOutcome(page, text.transient);
    await saveEditedEmail(page, buildEmail(), password);
    await expectSuccessOutcome(page, text.emailSent);
    const close = noticeClose(page);

    await close.last().click();
    await expect(close).toHaveCount(1);
    await expect(close).toBeFocused();
    await close.click();

    await expect(close).toHaveCount(0);
    await expect(emailField(page)).toBeFocused();
  });
});
