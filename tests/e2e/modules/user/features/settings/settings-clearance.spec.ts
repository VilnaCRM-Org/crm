import type { Page } from '@playwright/test';

import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import { bellOf, expectShellReady } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
import waitForSettledScroll from '@tests/e2e/utils/wait-for-settled-scroll';

import { probeFocused, resetSeen } from './utils/focus-cover';
import {
  type ProfileReplies,
  replyWithStatus,
  signInToSettings,
  stubProfile,
} from './utils/profile-stub';
import {
  editName,
  everySectionReplies,
  expectErrorOutcome,
  namePasswordField,
  noticeCardOf,
  openLoadedSettings,
  saveEverySection,
  saveNameButton,
  type SectionEdits,
  text,
} from './utils/settings-page';

interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

interface OutcomeSet {
  readonly name: string;
  readonly replies: (edits: SectionEdits) => ProfileReplies;
  readonly show: (page: Page, edits: SectionEdits) => Promise<void>;
}

interface TabReport {
  readonly visited: number;
  readonly covered: readonly string[];
}

const SIZES: readonly ViewportSize[] = [
  { width: 1440, height: 900 },
  { width: 1024, height: 1366 },
  { width: 375, height: 812 },
  { width: 320, height: 256 },
];

const MAX_TAB_STOPS = 300;
const MIN_TAB_STOPS = 10;
const CARET_TOLERANCE_PX = 2;

const newEdits = (): SectionEdits => ({
  fullName: buildFullName(),
  email: buildEmail(),
  password: buildPassword(),
  newPassword: buildPassword(),
});

const ONE_OUTCOME: OutcomeSet = {
  name: 'one outcome',
  replies: () => ({ UpdateUser: [replyWithStatus(503)] }),
  show: async (page, edits) => {
    await editName(page, edits.fullName, edits.password);
    await namePasswordField(page).press('Enter');
    await expectErrorOutcome(page, text.transient);
    await expect(saveNameButton(page)).toBeFocused();
  },
};

const THREE_OUTCOMES: OutcomeSet = {
  name: 'three outcomes',
  replies: (edits) => everySectionReplies(edits),
  show: (page, edits) => saveEverySection(page, edits),
};

const OUTCOME_SETS: readonly OutcomeSet[] = [ONE_OUTCOME, THREE_OUTCOMES];

const sizeName = (size: ViewportSize): string => `${size.width} × ${size.height}`;

async function tabThroughEveryControl(page: Page, key = 'Tab'): Promise<TabReport> {
  await resetSeen(page);
  const covered: string[] = [];
  let visited = 0;
  let bodies = 0;
  for (let step = 0; step < MAX_TAB_STOPS; step += 1) {
    await page.keyboard.press(key);
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
  outcomes: OutcomeSet,
  size: ViewportSize
): Promise<void> {
  const edits = newEdits();
  await stubProfile(page, outcomes.replies(edits));
  await openLoadedSettings(page);
  await expectShellReady(page);
  await outcomes.show(page, edits);
  await page.setViewportSize(size);
  await waitForSettledScroll(page);
}

test.describe('Focus clearance (issue #391)', () => {
  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  for (const size of SIZES) {
    for (const outcomes of OUTCOME_SETS) {
      const title = `keeps every focused control uncovered with ${outcomes.name}`;

      test(`${title} at ${sizeName(size)}`, async ({ page }) => {
        await openWithOutcomes(page, outcomes, size);

        const report = await tabThroughEveryControl(page);

        expect(report.visited).toBeGreaterThanOrEqual(MIN_TAB_STOPS);
        expect(report.covered).toEqual([]);
      });

      test(`${title} at ${sizeName(size)}, backwards`, async ({ page }) => {
        await openWithOutcomes(page, outcomes, size);

        const report = await tabThroughEveryControl(page, 'Shift+Tab');

        expect(report.visited).toBeGreaterThanOrEqual(MIN_TAB_STOPS);
        expect(report.covered).toEqual([]);
      });
    }
  }
});

test.describe('The first outcome is in view once its save settles (SM-3, issue #391)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  for (const size of SIZES.filter(({ height }) => height > 256)) {
    for (const outcomes of OUTCOME_SETS) {
      test(`${outcomes.name} at ${sizeName(size)}`, async ({ page }) => {
        const edits = newEdits();
        await stubProfile(page, outcomes.replies(edits));
        await openLoadedSettings(page);
        await expectShellReady(page);
        await page.setViewportSize(size);

        await outcomes.show(page, edits);

        const rows = noticeCardOf(page).getByRole('listitem');
        await expect(rows).toHaveCount(outcomes === ONE_OUTCOME ? 1 : 3);
        await expect(rows.first()).toBeInViewport({ ratio: 1 });
      });
    }
  }
});

test.describe('The merged shape at 1920 × 1080 (FR-18, issue #391)', () => {
  const WIDE = { width: 1920, height: 1080 };

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('stays attached to the bell', async ({ page }) => {
    await openWithOutcomes(page, ONE_OUTCOME, WIDE);
    const shape = noticeCardOf(page).locator('xpath=..');
    await expect(shape).toBeVisible();
    const offsetFromBell = async (): Promise<number> => {
      const bell = await bellOf(page).boundingBox();
      const corner = await shape.evaluate((root) => {
        const rects = [...root.children].map((child) => child.getBoundingClientRect());
        return {
          x: Math.min(...rects.map((rect) => rect.left)),
          y: Math.min(...rects.map((rect) => rect.top)),
        };
      });
      return Math.max(
        Math.abs(corner.x - (bell?.x ?? Infinity)),
        Math.abs(corner.y - (bell?.y ?? Infinity))
      );
    };

    await expect.poll(offsetFromBell).toBeLessThanOrEqual(CARET_TOLERANCE_PX);
  });
});

test.describe('The caret card at 1024 × 1366 (issue #391)', () => {
  const TABLET = { width: 1024, height: 1366 };

  test.beforeEach(async ({ page }) => {
    await signInToSettings(page);
  });

  test('points its caret at the bell centre and stays in view at the end of the page', async ({
    page,
  }) => {
    await openWithOutcomes(page, ONE_OUTCOME, TABLET);
    const card = noticeCardOf(page);
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
