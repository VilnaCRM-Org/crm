import type { Locator, Page } from '@playwright/test';

import { buildEmail, buildPassword } from '@tests/builders';
import {
  PROFILE_NODE,
  replyWithProfile,
  replyWithResent,
  replyWithSaved,
  replyWithStatus,
  signInWithFlag,
  stubProfile,
  type StubbedProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  currentPasswordField,
  emailField,
  nameField,
  newPasswordField,
  saveButton,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

import { showPasswordLabel } from './constants';
import expectTouchTarget from './utils/touch-target';

const NEW_NAME = 'Іван Коваль';
const password = buildPassword();
const newPassword = buildPassword();
const newEmail = buildEmail();
const MIN_SMALL_TARGET_PX = 24;
const KEYBOARD_VIEWPORT_RATIO = 0.45;
const NARROW_VIEWPORT = { width: 320, height: 640 };
const TOAST_EDGE_PX = 16;

const clearLabel: string = t('settings.profile.clear');
const closeLabel: string = t('ui_toast.close');

const clearButton = (page: Page): Locator =>
  page.getByRole('button', { name: clearLabel, exact: true });

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(0);
}

async function typeByTap(field: Locator, value: string): Promise<void> {
  await field.tap();
  await field.fill(value);
}

async function openByTap(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: text.homeLink, exact: true }).tap();
  await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
}

async function tapSaveWith(page: Page, fullName: string): Promise<void> {
  await typeByTap(nameField(page), fullName);
  await typeByTap(currentPasswordField(page), password);
  await saveButton(page).tap();
}

test.describe('Settings on touch devices (issue #330)', () => {
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    await signInWithFlag(page, true);
  });

  test('changes a name with taps only', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openByTap(page);

    await tapSaveWith(page, NEW_NAME);

    await expect(page.getByText(text.saved, { exact: true })).toBeVisible();
    expect(stub.count('UpdateUser')).toBe(1);
  });

  test('changes an e-mail and resends the link with taps only', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithSaved({ email: newEmail, confirmed: false })],
      ResendEmailToUser: [replyWithResent()],
    });
    await openByTap(page);

    await typeByTap(emailField(page), newEmail);
    await typeByTap(currentPasswordField(page), password);
    await saveButton(page).tap();
    await expect(page.getByText(text.emailSent, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: text.resend, exact: true }).tap();

    await expect(page.getByText(text.resent, { exact: true })).toBeVisible();
    expect(stub.count('ResendEmailToUser')).toBe(1);
  });

  test('changes a password with taps only', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved()] });
    await openByTap(page);

    await typeByTap(currentPasswordField(page), password);
    await typeByTap(newPasswordField(page), newPassword);
    await saveButton(page).tap();

    await expect(page.getByText(text.passwordChanged, { exact: true })).toBeVisible();
  });

  test('flips password visibility on a tap', async ({ page }) => {
    stub = await stubProfile(page);
    await openByTap(page);

    await page.getByRole('button', { name: showPasswordLabel }).first().tap();

    await expect(currentPasswordField(page)).toHaveAttribute('type', 'text');
  });

  test('sends nothing when Save is tapped with only the current password', async ({ page }) => {
    stub = await stubProfile(page);
    await openByTap(page);

    await typeByTap(currentPasswordField(page), password);
    await saveButton(page).tap();

    await expect(page.getByText(text.noChanges, { exact: true })).toBeVisible();
    expect(stub.count('UpdateUser')).toBe(0);
  });

  test('keeps every control at the touch-target floor', async ({ page }) => {
    stub = await stubProfile(page, {
      CurrentUser: [replyWithProfile({ confirmed: false })],
      UpdateUser: [replyWithStatus(503)],
    });
    await openByTap(page);

    await expectTouchTarget(nameField(page), 'name field');
    await expectTouchTarget(emailField(page), 'e-mail field');
    await expectTouchTarget(currentPasswordField(page), 'current password field');
    await expectTouchTarget(newPasswordField(page), 'new password field');
    await expectTouchTarget(saveButton(page), 'Save');
    await expectTouchTarget(clearButton(page), 'Clear');
    await expectTouchTarget(
      page.getByRole('button', { name: text.resend, exact: true }),
      'resend link',
      MIN_SMALL_TARGET_PX
    );

    await tapSaveWith(page, NEW_NAME);

    await expectTouchTarget(page.getByRole('button', { name: closeLabel }), 'toast close');
    await expectTouchTarget(
      page.getByRole('button', { name: text.tryAgain, exact: true }),
      'toast retry'
    );
  });

  test('has no horizontal overflow at the device width or at 320 px', async ({ page }) => {
    stub = await stubProfile(page, { CurrentUser: [replyWithProfile({ confirmed: false })] });
    await openByTap(page);
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize(NARROW_VIEWPORT);

    await expectNoHorizontalOverflow(page);
  });

  test('keeps Save reachable and tappable at keyboard height', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openByTap(page);
    const size = page.viewportSize();
    await typeByTap(nameField(page), NEW_NAME);
    await typeByTap(currentPasswordField(page), password);
    await page.setViewportSize({
      width: size?.width ?? NARROW_VIEWPORT.width,
      height: Math.round((size?.height ?? NARROW_VIEWPORT.height) * KEYBOARD_VIEWPORT_RATIO),
    });

    await saveButton(page).scrollIntoViewIfNeeded();
    await expect(saveButton(page)).toBeInViewport();
    await saveButton(page).tap();

    await expect(page.getByText(text.saved, { exact: true })).toBeVisible();
  });

  test('spans the toasts across the bottom and scrolls focused controls clear of them', async ({
    page,
  }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithStatus(429)] });
    await openByTap(page);
    await tapSaveWith(page, NEW_NAME);
    const toast = page.getByRole('alert').filter({ hasText: text.rateLimited });
    await expect(toast).toBeVisible();

    const width = page.viewportSize()?.width ?? 0;
    const toastBox = await toast.boundingBox();
    expect(toastBox?.x ?? Infinity).toBeLessThanOrEqual(TOAST_EDGE_PX);
    expect((toastBox?.x ?? 0) + (toastBox?.width ?? 0)).toBeGreaterThanOrEqual(
      width - TOAST_EDGE_PX
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    await clearButton(page).focus();

    await expect(clearButton(page)).toBeInViewport();
    const clearBox = await clearButton(page).boundingBox();
    expect((clearBox?.y ?? Infinity) + (clearBox?.height ?? 0)).toBeLessThanOrEqual(
      toastBox?.y ?? 0
    );
  });
});
