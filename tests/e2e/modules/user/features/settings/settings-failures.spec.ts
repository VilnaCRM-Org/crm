import type { Page } from '@playwright/test';

import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';

import {
  holdReply,
  replyWithGraphQLError,
  replyWithSaved,
  replyWithStatus,
  signInToSettings,
  stubProfile,
  watchContactedOrigins,
  type StubbedProfile,
} from './utils/profile-stub';
import {
  editName,
  editPassword,
  emailField,
  expectErrorToast,
  expectNoPersonalDataInUrls,
  expectOnlyAllowedOrigins,
  expectSuccessToast,
  namePasswordField,
  openLoadedSettings,
  saveButton,
  saveEditedEmail,
  saveEditedName,
  saveNameButton,
  text,
  toastClose,
} from './utils/settings-page';

const NEW_NAME = buildFullName();
const password = buildPassword();
const newPassword = buildPassword();
const TOAST_VIEWPORT = { width: 1440, height: 1000 };
const RESIZED_HEIGHTS = [900, 700, 860];

async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
}

async function expectClearanceSettled(page: Page): Promise<void> {
  const stack = toastClose(page).locator('../..');
  await expect
    .poll(() =>
      stack.evaluate(
        (node) =>
          Number.parseFloat(document.documentElement.style.scrollPaddingBottom) -
          (window.innerHeight - node.getBoundingClientRect().top)
      )
    )
    .toBeCloseTo(0, 0);
}

test.describe('Settings save failures (issue #330)', () => {
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

  test('shows the rate-limit toast with no retry action for an HTTP 429', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithStatus(429)] });
    await openLoadedSettings(page);

    await saveEditedName(page, NEW_NAME, password);

    await expectErrorToast(page, text.rateLimited);
    await expect(page.getByRole('button', { name: text.tryAgain })).toHaveCount(0);
  });

  test('offers a retry for an HTTP 503 that sends exactly one more update', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithSaved({ initials: NEW_NAME })],
    });
    await openLoadedSettings(page);

    await saveEditedName(page, NEW_NAME, password);
    await expectErrorToast(page, text.transient);
    expect(stub.count('UpdateUser')).toBe(1);

    await page.getByRole('button', { name: text.tryAgain, exact: true }).click();

    await expectSuccessToast(page, text.saved);
    expect(stub.count('UpdateUser')).toBe(2);
  });

  test('retries the failed name save, not an e-mail saved after it', async ({ page }) => {
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
    await expectErrorToast(page, text.transient);
    await saveEditedEmail(page, newEmail, password);
    await expectSuccessToast(page, text.emailSent);

    await page.getByRole('button', { name: text.tryAgain, exact: true }).click();

    await expectSuccessToast(page, text.saved);
    const updates = stub.calls.filter((call) => call.operation === 'UpdateUser');
    expect(updates).toHaveLength(3);
    expect(updates[2]?.variables['input']).toMatchObject({ initials: NEW_NAME });
    expect(updates[2]?.variables['input']).not.toHaveProperty('email');
  });

  test('returns focus to the name Save when its failure toast closes last', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithSaved({ email: buildEmail() })],
    });
    await openLoadedSettings(page);
    await saveEditedName(page, NEW_NAME, password);
    await expectErrorToast(page, text.transient);
    await saveEditedEmail(page, buildEmail(), password);
    await expectSuccessToast(page, text.emailSent);
    const close = page.getByRole('button', { name: text.toastClose });

    await close.last().click();
    await expect(close).toHaveCount(1);
    await expect(close).toBeFocused();
    await close.click();

    await expect(close).toHaveCount(0);
    await expect(saveNameButton(page)).toBeFocused();
  });

  test('keeps the scroll the user chose when the window resizes under a toast', async ({
    page,
  }) => {
    await page.setViewportSize(TOAST_VIEWPORT);
    stub = await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await openLoadedSettings(page);
    await editPassword(page, password, newPassword);
    await saveButton(page).click();
    await expectErrorToast(page, text.transient);
    await expect(saveButton(page)).toBeFocused();
    await scrollToTop(page);

    for (const height of RESIZED_HEIGHTS) {
      await page.setViewportSize({ ...TOAST_VIEWPORT, height });
      await expectClearanceSettled(page);

      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }
  });

  test('keeps a Save in view clear of the toast when the window shrinks', async ({ page }) => {
    await page.setViewportSize(TOAST_VIEWPORT);
    stub = await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await openLoadedSettings(page);
    await editPassword(page, password, newPassword);
    await saveButton(page).click();
    await expectErrorToast(page, text.transient);
    await expect(saveButton(page)).toBeFocused();

    for (const height of RESIZED_HEIGHTS) {
      await page.setViewportSize({ ...TOAST_VIEWPORT, height });
      await expectClearanceSettled(page);

      await expect(saveButton(page)).toBeInViewport({ ratio: 1 });
      const save = await saveButton(page).boundingBox();
      const toast = await toastClose(page).locator('..').boundingBox();
      expect((save?.y ?? Infinity) + (save?.height ?? 0)).toBeLessThanOrEqual(toast?.y ?? 0);
    }
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

    await expectErrorToast(page, text.transient);
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
});
