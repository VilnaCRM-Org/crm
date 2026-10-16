import { buildPassword } from '@tests/builders';
import fillInput from '@tests/e2e/utils/fill-input';
import { test, expect } from '@tests/e2e/utils/fixtures';

import {
  replyWithGraphQLError,
  replyWithSaved,
  replyWithStatus,
  signInWithFlag,
  stubProfile,
  watchContactedOrigins,
  type StubbedProfile,
} from './utils/profile-stub';
import {
  currentPasswordField,
  editName,
  emailField,
  expectNoPersonalDataInUrls,
  expectOnlyAllowedOrigins,
  openLoadedSettings,
  saveButton,
  text,
} from './utils/settings-page';

const NEW_NAME = 'Іван Коваль';
const password = buildPassword();

test.describe('Settings save failures (issue #330)', () => {
  let contacted: () => string[] = () => [];
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    contacted = watchContactedOrigins(page);
    await signInWithFlag(page, true);
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

    await editName(page, NEW_NAME, password);
    await saveButton(page).click();

    await expect(page.getByText(text.passwordWrong, { exact: true })).toBeVisible();
    await expect(currentPasswordField(page)).toHaveAttribute('aria-invalid', 'true');
    expect(stub.count('UpdateUser')).toBe(1);
  });

  test('shows the taken-e-mail error on the e-mail field for a 422', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithGraphQLError('email: This email address is already registered', 422)],
    });
    await openLoadedSettings(page);

    await fillInput(emailField(page), 'taken@example.com');
    await fillInput(currentPasswordField(page), password);
    await saveButton(page).click();

    await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();
    await expect(emailField(page)).toHaveAttribute('aria-invalid', 'true');
  });

  test('shows the rate-limit toast with no retry action for an HTTP 429', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithStatus(429)] });
    await openLoadedSettings(page);

    await editName(page, NEW_NAME, password);
    await saveButton(page).click();

    await expect(page.getByRole('alert').filter({ hasText: text.rateLimited })).toBeVisible();
    await expect(page.getByRole('button', { name: text.tryAgain })).toHaveCount(0);
  });

  test('offers a retry for an HTTP 503 that sends exactly one more update', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithSaved({ initials: NEW_NAME })],
    });
    await openLoadedSettings(page);

    await editName(page, NEW_NAME, password);
    await saveButton(page).click();
    await expect(page.getByRole('alert').filter({ hasText: text.transient })).toBeVisible();
    expect(stub.count('UpdateUser')).toBe(1);

    await page.getByRole('button', { name: text.tryAgain, exact: true }).click();

    await expect(page.getByText(text.saved, { exact: true })).toBeVisible();
    expect(stub.count('UpdateUser')).toBe(2);
  });

  test('disables Save while offline and sends nothing', async ({ page, context }) => {
    stub = await stubProfile(page);
    await openLoadedSettings(page);
    await page.evaluate(() => document.fonts.ready);
    await editName(page, NEW_NAME, password);

    await context.setOffline(true);

    await expect(saveButton(page)).toBeDisabled();
    expect(stub.count('UpdateUser')).toBe(0);
  });
});
