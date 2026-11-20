import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import {
  PROFILE_NODE,
  signInToSettings,
  stubProfile,
  type StubbedProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  everySectionReplies,
  expectSuccessOutcome,
  inlineBlockOf,
  nameField,
  openLoadedSettings,
  outcomeSurface,
  passwordFormOf,
  saveEditedName,
  saveEverySection,
  text,
  toastMessage,
  unreadDescription,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { bellOf, expectShellReady, logoOf } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  NOTIFICATION_STYLES,
  type NotificationFootprint,
  type NotificationStyle,
  useNotificationStyle,
  watchNotificationFootprint,
} from '@tests/e2e/utils/notification-style';

const DESKTOP = { width: 1440, height: 900 };

const historyText = {
  markAllRead: t('notification_center.history.mark_all_read'),
  unread: t('notification_center.history.unread'),
};

interface SeedRow {
  readonly message: string;
  readonly time: RegExp;
  readonly unread: boolean;
}

const SEED_ROWS: readonly SeedRow[] = [
  { message: text.passwordChanged, time: /\b10\b.*2026.*09:15/, unread: true },
  { message: text.emailSent, time: /\b0?9\b.*2026.*16:40/, unread: false },
  { message: text.saved, time: /\b0?8\b.*2026.*11:05/, unread: false },
];

const SAVED_FIRST = [text.passwordChanged, text.emailSent, text.saved];

const NOTICE_CLOSES_BEFORE_OPENING: Record<NotificationStyle, number> = {
  toast: 0,
  inline: 0,
  bell: 3,
};

const NOTICE_CHUNK_LOADS: Record<NotificationStyle, number> = { toast: 0, inline: 0, bell: 1 };

const historyOf = async (page: Page): Promise<Locator> => {
  const id = await bellOf(page).getAttribute('aria-controls');
  return page.locator(`[id="${id ?? ''}"]`);
};

const rowsOf = (history: Locator): Locator => history.locator('li');

const markAllOf = (history: Locator): Locator =>
  history.getByRole('button', { name: historyText.markAllRead, exact: true });

const unreadLabelsOf = (scope: Locator): Locator =>
  scope.getByText(historyText.unread, { exact: true });

const badgeOf = (page: Page): Locator => bellOf(page).getByText(/^\d+$/);

const noticeClosesOf = (page: Page): Locator =>
  page.getByRole('banner').getByRole('button', { name: text.toastClose, exact: true });

const SHOWN_WITH_BELL_OPEN: Record<NotificationStyle, (page: Page) => Promise<void>> = {
  toast: async (page) => {
    await expect(outcomeSurface(page, 'toast')).toHaveCount(SAVED_FIRST.length);
    for (const message of SAVED_FIRST) {
      await expect(toastMessage(page, message)).toBeVisible();
    }
  },
  inline: async (page) => {
    await expect(inlineBlockOf(passwordFormOf(page), text.passwordChanged)).toBeVisible();
  },
  bell: async (page) => {
    await expect(noticeClosesOf(page)).toHaveCount(0);
  },
};

async function openBellWithKeyboard(page: Page): Promise<Locator> {
  await bellOf(page).press('Enter');
  await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'true');
  const history = await historyOf(page);
  await expect(markAllOf(history)).toBeVisible();
  return history;
}

async function expectClosed(page: Page, history: Locator): Promise<void> {
  await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(history).toBeHidden();
}

async function expectSeedRows(history: Locator): Promise<void> {
  await expect(rowsOf(history)).toHaveCount(SEED_ROWS.length);
  for (const [index, row] of SEED_ROWS.entries()) {
    await expect(rowsOf(history).nth(index)).toContainText(row.message);
    await expect(rowsOf(history).nth(index)).toContainText(row.time);
    await expect(unreadLabelsOf(rowsOf(history).nth(index))).toHaveCount(row.unread ? 1 : 0);
  }
  await expect(unreadLabelsOf(history)).toHaveCount(1);
}

async function expectEveryRowRead(page: Page, history: Locator): Promise<void> {
  await expect(unreadLabelsOf(history)).toHaveCount(0);
  await expect(badgeOf(page)).toHaveCount(0);
  await expect(bellOf(page)).toHaveAccessibleDescription('');
}

const receivesPointer = (field: Locator): Promise<boolean> =>
  field.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return hit !== null && (hit === element || element.contains(hit));
  });

for (const style of NOTIFICATION_STYLES) {
  test.describe(`Bell history under ${style} (issue #391)`, () => {
    test.use({ viewport: DESKTOP, timezoneId: 'UTC' });

    let footprint: NotificationFootprint;
    let stub: StubbedProfile;

    test.beforeEach(async ({ page }) => {
      footprint = await watchNotificationFootprint(page);
      await useNotificationStyle(page, style);
      await signInToSettings(page);
    });

    test.afterEach(async () => {
      expect(footprint.notificationRequests()).toEqual([]);
      expect(await footprint.notificationStorageWrites()).toEqual([]);
      expect(stub.calls.filter((call) => /notification/i.test(call.operation))).toEqual([]);
    });

    test('lists the seeded rows when the bell is reached with Tab and opened with Enter', async ({
      page,
    }) => {
      stub = await stubProfile(page);
      await openLoadedSettings(page);
      await expectShellReady(page);
      await expect(badgeOf(page)).toHaveText('1');
      await expect(bellOf(page)).toHaveAccessibleDescription(unreadDescription(1));
      await logoOf(page).focus();

      await page.keyboard.press('Tab');
      await expect(bellOf(page)).toBeFocused();
      await page.keyboard.press('Enter');

      await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'true');
      const history = await historyOf(page);
      await expect(history).toBeVisible();
      await expectSeedRows(history);
    });

    test('marks every row read, drops the badge and keeps focus on the button', async ({
      page,
    }) => {
      stub = await stubProfile(page);
      await openLoadedSettings(page);
      const history = await openBellWithKeyboard(page);

      await markAllOf(history).press('Enter');

      await expectEveryRowRead(page, history);
      await expect(rowsOf(history)).toHaveCount(SEED_ROWS.length);
      await expect(markAllOf(history)).toBeFocused();
    });

    test('raises the badge to four over three saves, then lists them first and clears it', async ({
      page,
    }) => {
      const edits = {
        fullName: buildFullName(),
        email: buildEmail(),
        password: buildPassword(),
        newPassword: buildPassword(),
      };
      stub = await stubProfile(page, everySectionReplies(edits));
      await openLoadedSettings(page);
      await expect(badgeOf(page)).toHaveText('1');

      await saveEverySection(page, style, edits);

      await expect(badgeOf(page)).toHaveText('4');
      await expect(bellOf(page)).toHaveAccessibleDescription(unreadDescription(4));
      await expect(noticeClosesOf(page)).toHaveCount(NOTICE_CLOSES_BEFORE_OPENING[style]);
      const history = await openBellWithKeyboard(page);
      await expect(rowsOf(history)).toHaveCount(SAVED_FIRST.length + SEED_ROWS.length);
      for (const [index, message] of SAVED_FIRST.entries()) {
        await expect(rowsOf(history).nth(index)).toContainText(message);
      }
      await expect(unreadLabelsOf(history)).toHaveCount(4);
      await SHOWN_WITH_BELL_OPEN[style](page);

      await markAllOf(history).press('Enter');

      await expectEveryRowRead(page, history);
      await SHOWN_WITH_BELL_OPEN[style](page);
      expect(footprint.scriptLoads('notifications-notice')).toBe(NOTICE_CHUNK_LOADS[style]);
    });

    test('loads the history chunk only when the bell is first opened', async ({ page }) => {
      stub = await stubProfile(page);
      await openLoadedSettings(page);
      await saveEditedName(page, buildFullName(), buildPassword());
      await expectSuccessOutcome(page, style, text.saved);
      await expect(badgeOf(page)).toHaveText('2');

      expect(footprint.scriptLoads('notifications-history')).toBe(0);
      await openBellWithKeyboard(page);

      await expect.poll(() => footprint.scriptLoads('notifications-history')).toBe(1);
    });

    test('closes on Escape, an outside click, a Tab past the panel and a route change', async ({
      page,
    }) => {
      stub = await stubProfile(page);
      await openLoadedSettings(page);
      await nameField(page).scrollIntoViewIfNeeded();

      const history = await openBellWithKeyboard(page);
      await markAllOf(history).focus();
      await page.keyboard.press('Escape');
      await expectClosed(page, history);
      await expect(bellOf(page)).toBeFocused();

      await openBellWithKeyboard(page);
      expect(await receivesPointer(nameField(page))).toBe(true);
      await nameField(page).click();
      await expectClosed(page, history);
      await expect(nameField(page)).toBeFocused();

      await openBellWithKeyboard(page);
      await markAllOf(history).focus();
      await page.keyboard.press('Tab');
      await expectClosed(page, history);

      await openBellWithKeyboard(page);
      await page.goBack();
      await expect(page).toHaveURL(ROUTE_PATHS.home);
      await expectClosed(page, history);
    });

    test('shows the seed again with a badge of one after a reload', async ({ page }) => {
      stub = await stubProfile(page);
      await openLoadedSettings(page);
      const history = await openBellWithKeyboard(page);
      await markAllOf(history).press('Enter');
      await expectEveryRowRead(page, history);
      expect(await footprint.notificationStorageWrites()).toEqual([]);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
      await expectShellReady(page);

      await expect(badgeOf(page)).toHaveText('1');
      await expect(bellOf(page)).toHaveAccessibleDescription(unreadDescription(1));
      await expectSeedRows(await openBellWithKeyboard(page));
    });
  });
}
