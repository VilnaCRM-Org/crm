import type { Locator, Page } from '@playwright/test';

import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import { bellOf, expectShellReady } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  NOTIFICATION_STYLES,
  type NotificationStyle,
  useNotificationStyle,
} from '@tests/e2e/utils/notification-style';
import waitForSettledScroll from '@tests/e2e/utils/wait-for-settled-scroll';

import {
  type ProfileReplies,
  replyWithStatus,
  signInToSettings,
  stubProfile,
} from './utils/profile-stub';
import {
  everySectionReplies,
  expectErrorOutcome,
  openLoadedSettings,
  saveEditedName,
  saveEverySection,
  type SectionEdits,
  text,
  toastClose,
} from './utils/settings-page';

interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

interface OutcomeSet {
  readonly name: string;
  readonly replies: (edits: SectionEdits) => ProfileReplies;
  readonly show: (page: Page, style: NotificationStyle, edits: SectionEdits) => Promise<void>;
}

interface TabReport {
  readonly visited: number;
  readonly covered: readonly string[];
}

interface CoverProbe {
  readonly closeLabel: string;
  readonly seenKey: string;
}

interface ToastBox {
  readonly viewport: ViewportSize;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly mainPadding: number;
}

const SIZES: readonly ViewportSize[] = [
  { width: 1440, height: 900 },
  { width: 1024, height: 1366 },
  { width: 375, height: 812 },
  { width: 320, height: 256 },
];

const MAX_TAB_STOPS = 300;
const MIN_TAB_STOPS = 10;
const BOX_TOLERANCE_PX = 1;
const CARET_TOLERANCE_PX = 2;
const REFLOW = { width: 320, height: 256 };
const SEEN_KEY = '__clearanceSeen';

const markAllLabel: string = t('notification_center.history.mark_all_read');

const TOAST_BOXES: readonly ToastBox[] = [
  { viewport: { width: 1440, height: 900 }, right: 12, bottom: 24, width: 397, mainPadding: 19 },
  { viewport: { width: 1024, height: 1366 }, right: 24, bottom: 24, width: 397, mainPadding: 19 },
  { viewport: { width: 375, height: 812 }, right: 15, bottom: 15, width: 345, mainPadding: 16 },
];

const newEdits = (): SectionEdits => ({
  fullName: buildFullName(),
  email: buildEmail(),
  password: buildPassword(),
  newPassword: buildPassword(),
});

const ONE_OUTCOME: OutcomeSet = {
  name: 'one outcome',
  replies: () => ({ UpdateUser: [replyWithStatus(503)] }),
  show: async (page, style, edits) => {
    await saveEditedName(page, edits.fullName, edits.password);
    await expectErrorOutcome(page, style, text.transient);
  },
};

const THREE_OUTCOMES: OutcomeSet = {
  name: 'three outcomes',
  replies: (edits) => everySectionReplies(edits),
  show: (page, style, edits) => saveEverySection(page, style, edits),
};

const OUTCOME_SETS: readonly OutcomeSet[] = [ONE_OUTCOME, THREE_OUTCOMES];

const sizeName = (size: ViewportSize): string => `${size.width} × ${size.height}`;

const bellNoticeCardOf = (page: Page): Locator =>
  page
    .getByRole('banner')
    .getByRole('button', { name: text.toastClose, exact: true })
    .first()
    .locator('xpath=ancestor::ul[1]/../..');

function coverOfFocused(probe: CoverProbe): Promise<string> {
  return new Promise((resolve) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const seen =
          (Reflect.get(window, probe.seenKey) as WeakSet<Element> | undefined) ??
          new WeakSet<Element>();
        Reflect.set(window, probe.seenKey, seen);
        const focused = document.activeElement;
        if (focused === null || focused === document.body) return resolve('body');
        if (seen.has(focused)) return resolve('repeat');
        seen.add(focused);
        const header = document.querySelector('header');
        const covers = new Map<Element, string>();
        if (header !== null) covers.set(header, 'header');
        const closes = [...document.querySelectorAll('button')].filter(
          (button) => button.getAttribute('aria-label') === probe.closeLabel
        );
        for (const close of closes) {
          const inHeader = header?.contains(close) ?? false;
          const card = inHeader
            ? close.closest('ul')?.parentElement?.parentElement
            : close.parentElement?.parentElement?.parentElement;
          if (card) covers.set(card, inHeader ? 'bell notice card' : 'toast stack');
        }
        const box = focused.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return resolve('clear');
        const label = focused.getAttribute('aria-label') ?? focused.textContent?.trim() ?? '';
        const name = `${focused.tagName.toLowerCase()} "${label}"`;
        for (const [cover, coverName] of covers) {
          const area = cover.getBoundingClientRect();
          const inside =
            area.width > 0 &&
            area.height > 0 &&
            box.left >= area.left - 0.5 &&
            box.right <= area.right + 0.5 &&
            box.top >= area.top - 0.5 &&
            box.bottom <= area.bottom + 0.5;
          if (inside && !cover.contains(focused)) return resolve(`${name} under the ${coverName}`);
        }
        return resolve('clear');
      })
    );
  });
}

const probeFocused = (page: Page): Promise<string> =>
  page.evaluate(coverOfFocused, { closeLabel: text.toastClose, seenKey: SEEN_KEY });

async function resetSeen(page: Page): Promise<void> {
  await page.evaluate((key) => Reflect.deleteProperty(window, key), SEEN_KEY);
}

async function tabThroughEveryControl(page: Page): Promise<TabReport> {
  await resetSeen(page);
  const covered: string[] = [];
  let visited = 0;
  let bodies = 0;
  for (let step = 0; step < MAX_TAB_STOPS; step += 1) {
    await page.keyboard.press('Tab');
    const result = await probeFocused(page);
    if (result === 'repeat') break;
    if (result === 'body') {
      bodies += 1;
      if (bodies > 1) break;
      continue;
    }
    visited += 1;
    if (result !== 'clear') covered.push(result);
  }
  return { visited, covered };
}

async function openWithOutcomes(
  page: Page,
  style: NotificationStyle,
  outcomes: OutcomeSet,
  size: ViewportSize
): Promise<void> {
  const edits = newEdits();
  await stubProfile(page, outcomes.replies(edits));
  await openLoadedSettings(page);
  await expectShellReady(page);
  await outcomes.show(page, style, edits);
  await page.setViewportSize(size);
  await waitForSettledScroll(page);
}

for (const style of NOTIFICATION_STYLES) {
  test.describe(`Focus clearance under ${style} (issue #391)`, () => {
    test.beforeEach(async ({ page }) => {
      await useNotificationStyle(page, style);
      await signInToSettings(page);
    });

    for (const size of SIZES) {
      for (const outcomes of OUTCOME_SETS) {
        const title = `keeps every focused control uncovered with ${outcomes.name}`;

        test(`${title} at ${sizeName(size)}`, async ({ page }) => {
          await openWithOutcomes(page, style, outcomes, size);

          const report = await tabThroughEveryControl(page);

          expect(report.visited).toBeGreaterThanOrEqual(MIN_TAB_STOPS);
          expect(report.covered).toEqual([]);
        });
      }
    }
  });
}

test.describe('The history panel beside three toasts at 320 × 256 (issue #391)', () => {
  test.beforeEach(async ({ page }) => {
    await useNotificationStyle(page, 'toast');
    await signInToSettings(page);
  });

  test('keeps every panel control clear of the toast stack while it is tabbed through', async ({
    page,
  }) => {
    await openWithOutcomes(page, 'toast', THREE_OUTCOMES, REFLOW);
    await expect(toastClose(page)).toHaveCount(3);
    await bellOf(page).focus();
    await bellOf(page).press('Enter');
    await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'true');
    const history = page.locator(
      `[id="${(await bellOf(page).getAttribute('aria-controls')) ?? ''}"]`
    );
    await expect(history.getByRole('button', { name: markAllLabel, exact: true })).toBeVisible();
    const controls = await history.getByRole('button').all();
    expect(controls.length).toBeGreaterThan(0);
    await resetSeen(page);

    for (const control of controls) {
      await page.keyboard.press('Tab');

      await expect(control).toBeFocused();
      expect(await probeFocused(page)).toBe('clear');
      await expect(control).toBeInViewport();
    }
    await expect(toastClose(page)).toHaveCount(3);
  });
});

test.describe('The toast box under toast (issue #391)', () => {
  test.beforeEach(async ({ page }) => {
    await useNotificationStyle(page, 'toast');
    await signInToSettings(page);
  });

  for (const expected of TOAST_BOXES) {
    test(`keeps the toast box of main at ${sizeName(expected.viewport)}`, async ({ page }) => {
      await openWithOutcomes(page, 'toast', ONE_OUTCOME, expected.viewport);
      const content = toastClose(page).locator('xpath=..');
      const toast = content.locator('xpath=..');

      const toastBox = await toast.boundingBox();
      const contentBox = await content.boundingBox();

      expect(toastBox).not.toBeNull();
      expect(contentBox).not.toBeNull();
      const right = expected.viewport.width - (toastBox?.x ?? 0) - (toastBox?.width ?? 0);
      const bottom = expected.viewport.height - (toastBox?.y ?? 0) - (toastBox?.height ?? 0);
      expect(Math.abs(right - expected.right)).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
      expect(Math.abs(bottom - expected.bottom)).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
      expect(Math.abs((toastBox?.width ?? 0) - expected.width)).toBeLessThanOrEqual(
        BOX_TOLERANCE_PX
      );
      expect(
        Math.abs((toastBox?.height ?? 0) - (contentBox?.height ?? 0) - 2 * expected.mainPadding)
      ).toBeLessThanOrEqual(BOX_TOLERANCE_PX);
    });
  }
});

test.describe('The caret card under bell at 1024 × 1366 (issue #391)', () => {
  const TABLET = { width: 1024, height: 1366 };

  test.beforeEach(async ({ page }) => {
    await useNotificationStyle(page, 'bell');
    await signInToSettings(page);
  });

  test('points its caret at the bell centre and stays in view at the end of the page', async ({
    page,
  }) => {
    await openWithOutcomes(page, 'bell', ONE_OUTCOME, TABLET);
    const card = bellNoticeCardOf(page);
    const caret = card.locator('xpath=./*[1]');
    await expect(card).toBeVisible();

    const caretBox = await caret.boundingBox();
    const bellBox = await bellOf(page).boundingBox();

    expect(caretBox).not.toBeNull();
    expect(bellBox).not.toBeNull();
    const tip = (caretBox?.x ?? 0) + (caretBox?.width ?? 0) / 2;
    const centre = (bellBox?.x ?? Infinity) + (bellBox?.width ?? 0) / 2;
    expect(Math.abs(tip - centre)).toBeLessThanOrEqual(CARET_TOLERANCE_PX);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await waitForSettledScroll(page);

    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(card).toBeInViewport({ ratio: 1 });
  });
});
