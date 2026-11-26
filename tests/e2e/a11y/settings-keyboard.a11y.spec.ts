import type { Locator, Page } from '@playwright/test';

import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import {
  PROFILE_NODE,
  replyWithEndedSession,
  replyWithGraphQLError,
  replyWithProfile,
  replyWithSaved,
  replyWithStatus,
  signInToSettings,
  stubProfile,
  type StubbedProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  clearButtonOf,
  currentPasswordField,
  editPassword,
  emailField,
  expectErrorOutcome,
  expectEveryPasswordFieldEmpty,
  expectSuccessOutcome,
  fillCurrentPassword,
  nameField,
  namePasswordField,
  newPasswordField,
  noticeClose,
  saveButton,
  saveEditedEmail,
  saveEditedName,
  saveEmailButton,
  text,
  unreadDescription,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { startOf } from '@tests/e2e/modules/user/features/settings/utils/two-factor-page';
import { bellOf, chipOf, expectShellReady, logoOf, shellText } from '@tests/e2e/utils/app-shell';
import fillInput from '@tests/e2e/utils/fill-input';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectTabOrder } from '@tests/utils/a11y/keyboard';

const NEW_NAME = buildFullName();
const password = buildPassword();
const newPassword = buildPassword();
const VISIBLE_MAIN_CONTROLS = 10;
const DESKTOP = { width: 1440, height: 900 };
const FAILED_SAVES = 3;

const showPasswordLabel: string = t('auth.password.show');
const privacyLabel: string = t('footer.privacy');
const termsLabel: string = t('footer.usage_policy');

const clearButton = (page: Page): Locator => clearButtonOf(currentPasswordField(page));
const toggles = (page: Page): Locator => page.getByRole('button', { name: showPasswordLabel });
const resendButton = (page: Page): Locator =>
  page.getByRole('button', { name: text.resend, exact: true });

const markAllLabel: string = t('notification_center.history.mark_all_read');

const noticeRetry = (page: Page): Locator =>
  page.getByRole('banner').getByRole('button', { name: text.tryAgain, exact: true });
const settingsHeading = (page: Page): Locator =>
  page.getByRole('heading', { level: 1, name: text.heading });

async function historyPanelOf(page: Page): Promise<Locator> {
  const id = (await bellOf(page).getAttribute('aria-controls')) ?? '';
  expect(id).not.toBe('');
  return page.locator(`[id="${id}"]`);
}

async function expectBellState(page: Page, expanded: boolean): Promise<void> {
  await expect(bellOf(page)).toHaveAccessibleName(shellText.notifications);
  await expect(bellOf(page)).toHaveRole('button');
  await expect(bellOf(page)).toHaveAttribute('aria-expanded', String(expanded));
  await expect(bellOf(page)).toHaveAccessibleDescription(unreadDescription(1));
}

async function failPasswordSaves(page: Page, count: number): Promise<void> {
  await editPassword(page, password, newPassword);
  for (let saved = 1; saved <= count; saved += 1) {
    await saveButton(page).press('Enter');
    await expect(noticeClose(page)).toHaveCount(saved);
  }
}

async function openSettings(page: Page, stub: Promise<StubbedProfile>): Promise<StubbedProfile> {
  const stubbed = await stub;
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  return stubbed;
}

async function saveName(page: Page): Promise<void> {
  await saveEditedName(page, NEW_NAME, password);
  await expectSuccessOutcome(page, text.saved);
}

async function savePassword(page: Page): Promise<void> {
  await editPassword(page, password, newPassword);
  await saveButton(page).click();
  await expectSuccessOutcome(page, text.passwordChanged);
}

test.describe('Settings keyboard contract (issue #330)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('Tab visits the form, two-factor and the footer in reading order', async ({ page }) => {
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
      { locator: startOf(page), visibleFocus: true },
      { locator: footer.getByRole('link', { name: privacyLabel }), visibleFocus: true },
      { locator: footer.getByRole('link', { name: termsLabel }), visibleFocus: true },
    ]);
  });

  test('keeps the control count in main after an unconfirmed save', async ({ page }) => {
    await openSettings(
      page,
      stubProfile(page, {
        CurrentUser: [replyWithProfile({ confirmed: false })],
        UpdateUser: [replyWithSaved({ initials: NEW_NAME, confirmed: false })],
      })
    );
    await saveName(page);

    await expect(
      page
        .getByRole('main')
        .locator('a[href], button:not([disabled]), input:not([type="hidden"])')
        .filter({ visible: true })
    ).toHaveCount(VISIBLE_MAIN_CONTROLS);
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
    await fillInput(namePasswordField(page), password);
    await namePasswordField(page).press('Enter');

    await expectSuccessOutcome(page, text.saved);
    expect(stub.count('UpdateUser')).toBe(1);
  });

  test('focus moves to the name input once a name save settles, because its Save hid', async ({
    page,
  }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithSaved()] }));

    await saveName(page);

    await expect(nameField(page)).toBeFocused();
  });

  test('focus returns to the password Save once a password save settles', async ({ page }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithSaved()] }));

    await savePassword(page);

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

    await saveEditedEmail(page, buildEmail(), password);

    await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();
    await expect(emailField(page)).toBeFocused();

    await saveEmailButton(page).click();

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

  test('the password Clear keeps focus on itself and empties both fields', async ({ page }) => {
    await openSettings(page, stubProfile(page));
    await editPassword(page, password, newPassword);

    await clearButton(page).focus();
    await page.keyboard.press('Enter');

    await expect(clearButton(page)).toBeFocused();
    await expectEveryPasswordFieldEmpty(page);
    await expect(currentPasswordField(page)).toHaveAttribute('type', 'password');
    await expect(newPasswordField(page)).toHaveAttribute('type', 'password');
  });

  test('the name Clear restores the loaded value and moves focus to the input', async ({
    page,
  }) => {
    await openSettings(page, stubProfile(page));
    await fillInput(nameField(page), NEW_NAME);

    await clearButtonOf(nameField(page)).focus();
    await page.keyboard.press('Enter');

    await expect(nameField(page)).toBeFocused();
    await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
    await expect(namePasswordField(page)).toHaveCount(0);
  });

  test('closing the last notice row of a name save returns focus to the name input', async ({
    page,
  }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithSaved()] }));
    await saveName(page);

    await noticeClose(page).focus();
    await page.keyboard.press('Enter');

    await expect(noticeClose(page)).toHaveCount(0);
    await expect(nameField(page)).toBeFocused();
  });

  test('closing the last notice row of a password save returns focus to its Save', async ({
    page,
  }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithSaved()] }));
    await savePassword(page);

    await noticeClose(page).focus();
    await page.keyboard.press('Enter');

    await expect(noticeClose(page)).toHaveCount(0);
    await expect(saveButton(page)).toBeFocused();
  });

  test('an ended session leaves focus on main of the sign-in page', async ({ page }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithEndedSession] }));

    await saveEditedName(page, NEW_NAME, password);

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole('main')).toBeFocused();
  });
});

test.describe('Outcome close focus (issue #391)', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('closing moves focus to the next close, the previous close, then Save', async ({ page }) => {
    const stub = await openSettings(
      page,
      stubProfile(page, {
        UpdateUser: [replyWithStatus(503), replyWithStatus(503), replyWithStatus(503)],
      })
    );
    await failPasswordSaves(page, FAILED_SAVES);
    expect(stub.count('UpdateUser')).toBe(FAILED_SAVES);
    await noticeClose(page).nth(1).focus();
    await page.keyboard.press('Enter');
    await expect(noticeClose(page)).toHaveCount(2);
    await expect(noticeClose(page).nth(1)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(noticeClose(page)).toHaveCount(1);
    await expect(noticeClose(page).first()).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(noticeClose(page)).toHaveCount(0);
    await expect(saveButton(page)).toBeFocused();
  });

  test('closing the last outcome while Save is disabled moves focus to the h1', async ({
    page,
    context,
  }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithStatus(503)] }));
    await failPasswordSaves(page, 1);
    await expectErrorOutcome(page, text.transient);
    await context.setOffline(true);
    await expect(saveButton(page)).toBeDisabled();

    await noticeClose(page).focus();
    await page.keyboard.press('Enter');

    await expect(noticeClose(page)).toHaveCount(0);
    await expect(settingsHeading(page)).toBeFocused();
  });
});

test.describe('Notice Retry focus (issue #391)', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('Retry leaves focus on the password Save and sends exactly one more update', async ({
    page,
  }) => {
    const stub = await openSettings(
      page,
      stubProfile(page, { UpdateUser: [replyWithStatus(503), replyWithSaved()] })
    );
    await editPassword(page, password, newPassword);
    await saveButton(page).press('Enter');
    await expectErrorOutcome(page, text.transient);

    await noticeRetry(page).focus();
    await page.keyboard.press('Enter');

    await expectSuccessOutcome(page, text.passwordChanged);
    await expect(saveButton(page)).toBeFocused();
    expect(stub.count('UpdateUser')).toBe(2);
  });
});

test.describe('Bell disclosure (J15, issue #391)', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('the bell is a Tab stop before the chip and Escape returns focus to it', async ({
    page,
  }) => {
    await openSettings(page, stubProfile(page));
    await expectShellReady(page);
    await logoOf(page).focus();

    await expectTabOrder(page, [{ locator: bellOf(page), visibleFocus: true }]);
    await expectBellState(page, false);
    await expectTabOrder(page, [{ locator: chipOf(page), visibleFocus: true }]);
    await expectTabOrder(page, [{ locator: bellOf(page), visibleFocus: true }], 'Shift+Tab');

    await page.keyboard.press('Enter');
    await expectBellState(page, true);
    const panel = await historyPanelOf(page);
    await expect(panel).toBeVisible();
    await expectTabOrder(page, [
      {
        locator: panel.getByRole('button', { name: markAllLabel, exact: true }),
        visibleFocus: true,
      },
    ]);

    await page.keyboard.press('Escape');

    await expect(panel).toBeHidden();
    await expect(bellOf(page)).toBeFocused();
    await expectBellState(page, false);
    await page.keyboard.press('Space');
    await expectBellState(page, true);
  });

  test('the history is read, cleared and left with the keyboard alone', async ({ page }) => {
    await openSettings(page, stubProfile(page));
    await expectShellReady(page);
    await logoOf(page).focus();
    await expectTabOrder(page, [{ locator: bellOf(page), visibleFocus: true }]);
    await expect(bellOf(page)).toHaveAccessibleDescription(unreadDescription(1));
    await page.keyboard.press('Enter');
    const panel = await historyPanelOf(page);
    const markAll = panel.getByRole('button', { name: markAllLabel, exact: true });
    await expect(markAll).toBeVisible();

    await expectTabOrder(page, [{ locator: markAll, visibleFocus: true }]);
    await page.keyboard.press('Enter');

    await expect(bellOf(page)).toHaveAccessibleDescription('');
    await expect(page.getByRole('banner').getByText(/^\d+$/)).toHaveCount(0);
    await expect(markAll).toBeFocused();
    await expectTabOrder(page, [{ locator: chipOf(page), visibleFocus: true }]);
    await expect(panel).toBeHidden();
    await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('Retry and close of an error are the Tab stops between the bell and the chip', async ({
    page,
  }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithStatus(503)] }));
    await expectShellReady(page);
    await saveEditedName(page, NEW_NAME, password);
    await expectErrorOutcome(page, text.transient);
    await logoOf(page).focus();

    await expectTabOrder(page, [
      { locator: bellOf(page), visibleFocus: true },
      { locator: noticeRetry(page), visibleFocus: true },
      { locator: noticeClose(page), visibleFocus: true },
      { locator: chipOf(page), visibleFocus: true },
    ]);
  });

  test('the notice close is the Tab stop between the bell and the chip', async ({ page }) => {
    await openSettings(page, stubProfile(page, { UpdateUser: [replyWithSaved()] }));
    await expectShellReady(page);
    await saveName(page);
    await logoOf(page).focus();

    await expectTabOrder(page, [
      { locator: bellOf(page), visibleFocus: true },
      { locator: noticeClose(page), visibleFocus: true },
      { locator: chipOf(page), visibleFocus: true },
    ]);
  });
});
