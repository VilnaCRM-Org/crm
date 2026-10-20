import type { Locator, Page } from '@playwright/test';

import { buildPassword } from '@tests/builders';
import {
  PROFILE_NODE,
  replyWithEndedSession,
  replyWithGraphQLError,
  replyWithProfile,
  replyWithSaved,
  signInWithFlag,
  stubProfile,
  type StubbedProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  currentPasswordField,
  editName,
  emailField,
  expectSuccessToast,
  fillCurrentPassword,
  nameField,
  newPasswordField,
  saveButton,
  text,
  toastClose,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import fillInput from '@tests/e2e/utils/fill-input';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectTabOrder } from '@tests/utils/a11y/keyboard';

const NEW_NAME = 'Іван Коваль';
const password = buildPassword();
const MAIN_CONTROLS_WITH_ONE_TOAST = 10;

const clearLabel: string = t('settings.profile.clear');
const closeLabel: string = t('ui_toast.close');
const showPasswordLabel: string = t('auth.password.show');
const privacyLabel: string = t('footer.privacy');
const termsLabel: string = t('footer.usage_policy');

const clearButton = (page: Page): Locator =>
  page.getByRole('button', { name: clearLabel, exact: true });
const toggles = (page: Page): Locator => page.getByRole('button', { name: showPasswordLabel });
const resendButton = (page: Page): Locator =>
  page.getByRole('button', { name: text.resend, exact: true });

async function openSettings(page: Page, stub: Promise<StubbedProfile>): Promise<StubbedProfile> {
  const stubbed = await stub;
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  return stubbed;
}

async function saveName(page: Page): Promise<void> {
  await editName(page, NEW_NAME, password);
  await saveButton(page).click();
  await expectSuccessToast(page, text.saved);
}

test.describe('Settings keyboard contract (issue #330)', () => {
  test.beforeEach(async ({ page }) => {
    await signInWithFlag(page, true);
  });

  test('Tab visits the form, the toast and the footer in reading order', async ({ page }) => {
    await openSettings(
      page,
      stubProfile(page, {
        CurrentUser: [replyWithProfile({ confirmed: false })],
        UpdateUser: [replyWithSaved({ initials: NEW_NAME, confirmed: false })],
      })
    );
    await saveName(page);
    const footer = page.getByRole('contentinfo');
    await page.getByRole('main').focus();

    await expectTabOrder(page, [
      { locator: nameField(page), visibleFocus: true },
      { locator: emailField(page), visibleFocus: true },
      { locator: resendButton(page), visibleFocus: true },
      { locator: currentPasswordField(page), visibleFocus: true },
      { locator: toggles(page).first(), visibleFocus: true },
      { locator: newPasswordField(page), visibleFocus: true },
      { locator: toggles(page).nth(1), visibleFocus: true },
      { locator: saveButton(page), visibleFocus: true },
      { locator: clearButton(page), visibleFocus: true },
      { locator: page.getByRole('button', { name: closeLabel }), visibleFocus: true },
      { locator: footer.getByRole('link', { name: privacyLabel }), visibleFocus: true },
      { locator: footer.getByRole('link', { name: termsLabel }), visibleFocus: true },
    ]);
  });

  test('keeps the control count after an unconfirmed save (no stop from the empty slot)', async ({
    page,
  }) => {
    await openSettings(
      page,
      stubProfile(page, {
        CurrentUser: [replyWithProfile({ confirmed: false })],
        UpdateUser: [replyWithSaved({ initials: NEW_NAME, confirmed: false })],
      })
    );
    await saveName(page);

    await expect(
      page.getByRole('main').locator('a[href], button:not([disabled]), input:not([type="hidden"])')
    ).toHaveCount(MAIN_CONTROLS_WITH_ONE_TOAST);
  });

  test('Space on an eye toggle shows the password', async ({ page }) => {
    await openSettings(page, stubProfile(page));

    await toggles(page).first().focus();
    await page.keyboard.press('Space');

    await expect(currentPasswordField(page)).toHaveAttribute('type', 'text');
  });

  test('Enter in a field submits the form once', async ({ page }) => {
    const stub = await openSettings(page, stubProfile(page));

    await fillInput(nameField(page), NEW_NAME);
    await fillCurrentPassword(page, password);
    await currentPasswordField(page).press('Enter');

    await expectSuccessToast(page, text.saved);
    expect(stub.count('UpdateUser')).toBe(1);
  });

  test('focus returns to Save once a save settles', async ({ page }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithSaved()] }));

    await saveName(page);

    await expect(saveButton(page)).toBeFocused();
  });

  test('focus moves to the first field in error when a save ends in field errors', async ({
    page,
  }) => {
    const stub = await openSettings(
      page,
      stubProfile(page, {
        UpdateUser: [replyWithGraphQLError('email: This email address is already registered', 422)],
      })
    );

    await fillInput(emailField(page), 'taken@example.com');
    await fillCurrentPassword(page, password);
    await saveButton(page).click();

    await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();
    await expect(emailField(page)).toBeFocused();

    await saveButton(page).click();

    await expect.poll(() => stub.count('UpdateUser')).toBe(2);
    await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();
    await expect(emailField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(emailField(page)).toHaveAccessibleDescription(new RegExp(text.emailTaken));
    await expect(emailField(page)).toBeFocused();
  });

  test('Clear masks both passwords again after they were shown', async ({ page }) => {
    await openSettings(page, stubProfile(page));
    await fillCurrentPassword(page, password);
    await toggles(page).first().click();
    await toggles(page).first().click();
    await expect(currentPasswordField(page)).toHaveAttribute('type', 'text');
    await expect(newPasswordField(page)).toHaveAttribute('type', 'text');

    await clearButton(page).click();

    await expect(currentPasswordField(page)).toHaveAttribute('type', 'password');
    await expect(newPasswordField(page)).toHaveAttribute('type', 'password');
    await expect(toggles(page)).toHaveCount(2);
  });

  test('Clear keeps focus on itself and restores the loaded values', async ({ page }) => {
    await openSettings(page, stubProfile(page));
    await fillInput(nameField(page), NEW_NAME);

    await clearButton(page).focus();
    await page.keyboard.press('Enter');

    await expect(clearButton(page)).toBeFocused();
    await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
  });

  test('closing the last toast returns focus to Save', async ({ page }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithSaved()] }));
    await saveName(page);

    await toastClose(page).focus();
    await page.keyboard.press('Enter');

    await expect(toastClose(page)).toHaveCount(0);
    await expect(saveButton(page)).toBeFocused();
  });

  test('an ended session leaves focus on main of the sign-in page', async ({ page }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithEndedSession] }));

    await editName(page, NEW_NAME, password);
    await saveButton(page).click();

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole('main')).toBeFocused();
  });
});
