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
  expectErrorToast,
  expectSuccessToast,
  nameField,
  namePasswordField,
  newPasswordField,
  saveButton,
  saveEmailButton,
  saveNameButton,
  text,
  toastClose,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { bellOf, burgerOf, drawerOf, shellText } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  NOTIFICATION_STYLES,
  type NotificationStyle,
  useNotificationStyle,
} from '@tests/e2e/utils/notification-style';

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
const TOAST_EDGE_PX = 16;

const closeLabel: string = t('ui_notification.close');
const markAllLabel: string = t('notification_center.history.mark_all_read');
const CARD_GUTTER_PX = 16;

interface OutcomeControl {
  readonly name: string;
  readonly of: (page: Page) => Locator;
}

interface LayoutBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const closeIn = (scope: Locator): Locator =>
  scope.getByRole('button', { name: closeLabel, exact: true });
const retryIn = (scope: Locator): Locator =>
  scope.getByRole('button', { name: text.tryAgain, exact: true });
const nameFormOf = (page: Page): Locator => nameField(page).locator('xpath=ancestor::form');
const tasksOf = (page: Page): Locator =>
  page.getByRole('banner').getByRole('button', { name: shellText.tasks, exact: true });
const markAllOf = (page: Page): Locator =>
  page.getByRole('button', { name: markAllLabel, exact: true });
const bellNoticeCardOf = (page: Page): Locator =>
  closeIn(page.getByRole('banner')).first().locator('xpath=ancestor::ul[1]/../..');

const OUTCOME_CONTROLS: Record<NotificationStyle, readonly OutcomeControl[]> = {
  toast: [
    { name: 'toast close', of: (page) => closeIn(page.getByRole('main')) },
    { name: 'toast Retry', of: (page) => retryIn(page.getByRole('main')) },
  ],
  inline: [{ name: 'inline Retry', of: (page) => retryIn(nameFormOf(page)) }],
  bell: [
    { name: 'bell notice close', of: (page) => closeIn(page.getByRole('banner')) },
    { name: 'bell notice Retry', of: (page) => retryIn(page.getByRole('banner')) },
  ],
};

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

    await expectSuccessToast(page, text.saved);
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
    await expectSuccessToast(page, text.emailSent);
    await page.getByRole('button', { name: text.resend, exact: true }).tap();

    await expectSuccessToast(page, text.resent);
    expect(stub.count('ResendEmailToUser')).toBe(1);
  });

  test('changes a password with taps only', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithSaved()] });
    await openByTap(page);

    await typeByTap(currentPasswordField(page), password);
    await typeByTap(newPasswordField(page), newPassword);
    await saveButton(page).tap();

    await expectSuccessToast(page, text.passwordChanged);
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
    await expectTouchTarget(page.getByRole('button', { name: closeLabel }), 'toast close');
    await expectTouchTarget(
      page.getByRole('button', { name: text.tryAgain, exact: true }),
      'toast retry'
    );

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

  test('keeps every toast reachable when three stack on a short viewport', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithStatus(503), replyWithStatus(503)],
    });
    await openByTap(page);
    await tapSaveWith(page, `${PROFILE_NODE.initials} А`);
    await expect(page.getByRole('button', { name: closeLabel, exact: true })).toHaveCount(1);
    await saveNameButton(page).tap();
    await expect(page.getByRole('button', { name: closeLabel, exact: true })).toHaveCount(2);
    await saveNameButton(page).tap();
    const closes = page.getByRole('button', { name: closeLabel, exact: true });
    await expect(closes).toHaveCount(3);

    await page.setViewportSize(REFLOW_VIEWPORT);

    for (const close of await closes.all()) {
      await close.scrollIntoViewIfNeeded();
      await expect(close).toBeInViewport({ ratio: 1 });
    }
    await expectNoHorizontalOverflow(page);
  });

  test('keeps a focused Save clear of three toasts at the reflow size', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithStatus(503), replyWithStatus(503)],
    });
    await openByTap(page);
    await tapSaveWith(page, `${PROFILE_NODE.initials} А`);
    await expect(page.getByRole('button', { name: closeLabel, exact: true })).toHaveCount(1);
    await saveNameButton(page).tap();
    await expect(page.getByRole('button', { name: closeLabel, exact: true })).toHaveCount(2);
    await saveNameButton(page).tap();
    const closes = page.getByRole('button', { name: closeLabel, exact: true });
    await expect(closes).toHaveCount(3);

    await page.setViewportSize(REFLOW_VIEWPORT);
    await expect
      .poll(() =>
        page.evaluate(() =>
          Number.parseFloat(
            document.documentElement.style.getPropertyValue('scroll-padding-bottom')
          )
        )
      )
      .toBeLessThanOrEqual(REFLOW_VIEWPORT.height / 2);
    await page.evaluate(() => window.scrollTo(0, 0));
    await clearButton(page).focus();
    await saveButton(page).focus();

    await expect(saveButton(page)).toBeInViewport({ ratio: 1 });
    const saveBox = await saveButton(page).boundingBox();
    const stackBox = await closes.first().locator('../..').boundingBox();
    expect(stackBox?.height ?? Infinity).toBeLessThanOrEqual(REFLOW_VIEWPORT.height / 2);
    expect((saveBox?.y ?? Infinity) + (saveBox?.height ?? 0)).toBeLessThanOrEqual(stackBox?.y ?? 0);
  });

  test('keeps both footer links clear of three toasts at the end of the page', async ({ page }) => {
    stub = await stubProfile(page, {
      UpdateUser: [replyWithStatus(503), replyWithStatus(503), replyWithStatus(503)],
    });
    await openByTap(page);
    await tapSaveWith(page, `${PROFILE_NODE.initials} А`);
    await expect(page.getByRole('button', { name: closeLabel, exact: true })).toHaveCount(1);
    await saveNameButton(page).tap();
    await expect(page.getByRole('button', { name: closeLabel, exact: true })).toHaveCount(2);
    await saveNameButton(page).tap();
    const closes = page.getByRole('button', { name: closeLabel, exact: true });
    await expect(closes).toHaveCount(3);
    const stackBox = await closes.first().locator('../..').boundingBox();
    const links = await page.getByRole('contentinfo').getByRole('link').all();
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      await link.focus();

      await expect(link).toBeInViewport({ ratio: 1 });
      const linkBox = await link.boundingBox();
      expect((linkBox?.y ?? Infinity) + (linkBox?.height ?? 0)).toBeLessThanOrEqual(
        stackBox?.y ?? 0
      );
    }
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

    await expectSuccessToast(page, text.saved);
  });

  test('spans the toasts across the bottom and scrolls focused controls clear of them', async ({
    page,
  }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithStatus(429)] });
    await openByTap(page);
    await tapSaveWith(page, NEW_NAME);
    await expectErrorToast(page, text.rateLimited);
    const toast = toastClose(page).locator('..');
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

for (const style of NOTIFICATION_STYLES) {
  test.describe(`Notification controls on touch devices under ${style} (issue #391)`, () => {
    test.beforeEach(async ({ page }) => {
      await useNotificationStyle(page, style);
      await signInToSettings(page);
    });

    test('keeps the bell, mark-all-read and every outcome control at 44 px', async ({ page }) => {
      await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
      await openByTap(page);
      await tapSaveWith(page, NEW_NAME);
      await expect(retryIn(page.locator('body'))).toBeVisible();

      for (const control of OUTCOME_CONTROLS[style]) {
        await expectTouchTarget(control.of(page), control.name);
      }
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

      await expect(retryIn(page.locator('body'))).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  });
}

test.describe('The bell caret card at 320 px (issue #391)', () => {
  test.beforeEach(async ({ page }) => {
    await useNotificationStyle(page, 'bell');
    await signInToSettings(page);
  });

  test('keeps the caret card inside the viewport with 16 px gutters', async ({ page }) => {
    await page.setViewportSize(NARROW_VIEWPORT);
    await stubProfile(page, { UpdateUser: [replyWithStatus(503)] });
    await openByTap(page);
    await tapSaveWith(page, NEW_NAME);
    const card = bellNoticeCardOf(page);
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
