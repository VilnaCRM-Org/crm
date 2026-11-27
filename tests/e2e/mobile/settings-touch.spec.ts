import type { Locator, Page } from '@playwright/test';

import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import {
  PROFILE_NODE,
  replyWithProfile,
  replyWithResent,
  replyWithSaved,
  replyWithStatus,
  signInToSettings,
  stubProfile,
  type StubbedProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  clearButtonOf,
  currentPasswordField,
  emailField,
  emailPasswordField,
  expectSuccessOutcome,
  nameField,
  namePasswordField,
  newPasswordField,
  noticeCardOf,
  noticeClose,
  saveButton,
  saveEmailButton,
  saveNameButton,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import {
  cancelUnlinkButton,
  confirmUnlinkButton,
  countOf,
  linkButton,
  stubSocialLinks,
  unlinkButton,
} from '@tests/e2e/modules/user/features/settings/utils/social-links-page';
import { bellOf, burgerOf, drawerOf, shellText } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

import { showPasswordLabel } from './constants';
import expectTouchTarget from './utils/touch-target';

const NEW_NAME = buildFullName();
const password = buildPassword();
const newPassword = buildPassword();
const newEmail = buildEmail();
const MIN_SMALL_TARGET_PX = 24;
const KEYBOARD_VIEWPORT_RATIO = 0.45;
const NARROW_VIEWPORT = { width: 320, height: 640 };
const REFLOW_VIEWPORT = { width: 320, height: 256 };

const markAllLabel: string = t('notification_center.history.mark_all_read');
const CARD_GUTTER_PX = 16;

interface LayoutBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const noticeRetry = (page: Page): Locator =>
  page.getByRole('banner').getByRole('button', { name: text.tryAgain, exact: true });
const tasksOf = (page: Page): Locator =>
  page.getByRole('banner').getByRole('button', { name: shellText.tasks, exact: true });
const markAllOf = (page: Page): Locator =>
  page.getByRole('button', { name: markAllLabel, exact: true });
const boxGap = (first: LayoutBox | null, second: LayoutBox | null): number => {
  const a = first ?? { x: 0, y: 0, width: Infinity, height: Infinity };
  const b = second ?? { x: 0, y: 0, width: Infinity, height: Infinity };
  return Math.max(
    b.x - (a.x + a.width),
    a.x - (b.x + b.width),
    b.y - (a.y + a.height),
    a.y - (b.y + b.height)
  );
};

const clearButton = (page: Page): Locator => clearButtonOf(currentPasswordField(page));

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
  await burgerOf(page).tap();
  await drawerOf(page).getByRole('link', { name: shellText.settings, exact: true }).tap();
  await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
}

async function tapSaveWith(page: Page, fullName: string): Promise<void> {
  await typeByTap(nameField(page), fullName);
  await typeByTap(namePasswordField(page), password);
  await saveNameButton(page).tap();
}

test.describe('Settings on touch devices (issue #330)', () => {
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('changes a name with taps only', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openByTap(page);

    await tapSaveWith(page, NEW_NAME);

    await expectSuccessOutcome(page, text.saved);
    expect(stub.count('UpdateUser')).toBe(1);
    expect(stub.calls.find((call) => call.operation === 'UpdateUser')?.variables).toEqual({
      input: expect.objectContaining({ id: PROFILE_NODE.id, initials: NEW_NAME }),
    });
  });

  test('changes an e-mail and resends the link with taps only', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithSaved({ email: newEmail, confirmed: false })],
      ResendEmailToUser: [replyWithResent()],
    });
    await openByTap(page);

    await typeByTap(emailField(page), newEmail);
    await typeByTap(emailPasswordField(page), password);
    await saveEmailButton(page).tap();
    await expectSuccessOutcome(page, text.emailSent);
    await page.getByRole('button', { name: text.resend, exact: true }).tap();

    await expectSuccessOutcome(page, text.resent);
    expect(stub.count('ResendEmailToUser')).toBe(1);
  });

  test('changes a password with taps only', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved()] });
    await openByTap(page);

    await typeByTap(currentPasswordField(page), password);
    await typeByTap(newPasswordField(page), newPassword);
    await saveButton(page).tap();

    await expectSuccessOutcome(page, text.passwordChanged);
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

    await expectTouchTarget(namePasswordField(page), 'name password field');
    await expectTouchTarget(saveNameButton(page), 'name Save');
    await expectTouchTarget(clearButtonOf(nameField(page)), 'name Clear');
    await expectTouchTarget(noticeClose(page), 'notice close');
    await expectTouchTarget(noticeRetry(page), 'notice retry');

    await typeByTap(emailField(page), buildEmail());

    await expectTouchTarget(emailPasswordField(page), 'e-mail password field');
    await expectTouchTarget(saveEmailButton(page), 'e-mail Save');
    await expectTouchTarget(clearButtonOf(emailField(page)), 'e-mail Clear');
  });

  test('has no horizontal overflow at the device width or at 320 px', async ({ page }) => {
    stub = await stubProfile(page, { CurrentUser: [replyWithProfile({ confirmed: false })] });
    await openByTap(page);
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize(NARROW_VIEWPORT);

    await expectNoHorizontalOverflow(page);
  });

  test('keeps every notice row reachable when three show on a short viewport', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithStatus(503), replyWithStatus(503)],
    });
    await openByTap(page);
    await tapSaveWith(page, `${PROFILE_NODE.initials} А`);
    await expect(noticeClose(page)).toHaveCount(1);
    await saveNameButton(page).tap();
    await expect(noticeClose(page)).toHaveCount(2);
    await saveNameButton(page).tap();
    await expect(noticeClose(page)).toHaveCount(3);

    await page.setViewportSize(REFLOW_VIEWPORT);

    for (const close of await noticeClose(page).all()) {
      await close.scrollIntoViewIfNeeded();
      await expect(close).toBeInViewport({ ratio: 1 });
    }
    await expectNoHorizontalOverflow(page);
  });

  test('keeps Save reachable and tappable at keyboard height', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved({ initials: NEW_NAME })] });
    await openByTap(page);
    const size = page.viewportSize();
    await typeByTap(nameField(page), NEW_NAME);
    await typeByTap(namePasswordField(page), password);
    await page.setViewportSize({
      width: size?.width ?? NARROW_VIEWPORT.width,
      height: Math.round((size?.height ?? NARROW_VIEWPORT.height) * KEYBOARD_VIEWPORT_RATIO),
    });

    await saveNameButton(page).scrollIntoViewIfNeeded();
    await expect(saveNameButton(page)).toBeInViewport();
    await saveNameButton(page).tap();

    await expectSuccessOutcome(page, text.saved);
  });

  test('links and unlinks a social account with taps on full-size targets', async ({ page }) => {
    stub = await stubProfile(page);
    const calls = await stubSocialLinks(page);
    await openByTap(page);
    await expectTouchTarget(linkButton(page, 'Google'), 'Google link');

    const opened = page.waitForEvent('popup');
    await linkButton(page, 'Google').tap();
    await opened;
    await expectSuccessOutcome(page, t('settings.social.linked', { provider: 'Google' }));
    await expectTouchTarget(unlinkButton(page, 'Google'), 'Google unlink');
    await unlinkButton(page, 'Google').tap();
    await expectTouchTarget(confirmUnlinkButton(page, 'Google'), 'Google unlink confirmation');
    await expectTouchTarget(cancelUnlinkButton(page, 'Google'), 'Google unlink cancel');
    await page.setViewportSize(NARROW_VIEWPORT);
    await expectNoHorizontalOverflow(page);
    await confirmUnlinkButton(page, 'Google').tap();

    await expectSuccessOutcome(page, t('settings.social.unlinked', { provider: 'Google' }));
    await expect(linkButton(page, 'Google')).toBeVisible();
    expect(countOf(calls, 'CompleteSocialLink')).toBe(1);
    expect(calls.filter((call) => call.operation === 'UnlinkSocialProvider')).toEqual([
      { operation: 'UnlinkSocialProvider', input: expect.objectContaining({ provider: 'google' }) },
    ]);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('Notification controls on touch devices (issue #391)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('keeps the bell, mark-all-read and every outcome control at 44 px', async ({ page }) => {
    await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await openByTap(page);
    await tapSaveWith(page, NEW_NAME);
    await expect(noticeRetry(page)).toBeVisible();

    await expectTouchTarget(noticeClose(page), 'notice close');
    await expectTouchTarget(noticeRetry(page), 'notice retry');
    await expectTouchTarget(bellOf(page), 'bell');
    await bellOf(page).tap();
    await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'true');

    await expectTouchTarget(markAllOf(page), 'mark all read');
  });

  test('keeps the bell and the tasks button apart', async ({ page }) => {
    await stubProfile(page);
    await openByTap(page);
    await expect(bellOf(page)).toBeEnabled();
    await expect(tasksOf(page)).toBeVisible();

    const gap = boxGap(await bellOf(page).boundingBox(), await tasksOf(page).boundingBox());

    expect(gap, 'bell and tasks boxes must not overlap').toBeGreaterThanOrEqual(0);
  });

  test('shows an outcome at 320 px with no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(NARROW_VIEWPORT);
    await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await openByTap(page);

    await tapSaveWith(page, NEW_NAME);

    await expect(noticeRetry(page)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('The bell caret card at 320 px (issue #391)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('keeps the caret card inside the viewport with 16 px gutters', async ({ page }) => {
    await page.setViewportSize(NARROW_VIEWPORT);
    await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await openByTap(page);
    await tapSaveWith(page, NEW_NAME);
    const card = noticeCardOf(page);
    await expect(card).toBeVisible();

    const box = await card.boundingBox();

    expect(box).not.toBeNull();
    expect(box?.x ?? -Infinity).toBeGreaterThanOrEqual(CARD_GUTTER_PX - 0.5);
    expect((box?.x ?? 0) + (box?.width ?? Infinity)).toBeLessThanOrEqual(
      NARROW_VIEWPORT.width - CARD_GUTTER_PX + 0.5
    );
    await expect(card).toBeInViewport({ ratio: 1 });
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('The history panel at 320 px (NFR-10, issue #391)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  for (const size of [NARROW_VIEWPORT, REFLOW_VIEWPORT]) {
    test(`fits ${size.width} × ${size.height} with every control reachable`, async ({ page }) => {
      await stubProfile(page);
      await openByTap(page);
      await page.setViewportSize(size);
      await bellOf(page).tap();
      const panel = page.locator(`[id="${await bellOf(page).getAttribute('aria-controls')}"]`);
      await expect(panel).toBeVisible();
      await expect(markAllOf(page)).toBeVisible();

      const box = await panel.boundingBox();
      await markAllOf(page).focus();

      expect(box).not.toBeNull();
      expect(box?.x ?? -Infinity).toBeGreaterThanOrEqual(CARD_GUTTER_PX - 0.5);
      expect((box?.x ?? 0) + (box?.width ?? Infinity)).toBeLessThanOrEqual(
        size.width - CARD_GUTTER_PX + 0.5
      );
      await expect(markAllOf(page)).toBeInViewport({ ratio: 1 });
      await expectNoHorizontalOverflow(page);
    });
  }
});
