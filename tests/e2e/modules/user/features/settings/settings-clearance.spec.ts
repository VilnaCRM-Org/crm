import type { Page } from '@playwright/test';

import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import { bellOf, expectShellReady } from '@tests/e2e/utils/app-shell';
import { test, expect } from '@tests/e2e/utils/fixtures';
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
  noticeCardOf,
  openLoadedSettings,
  saveEditedName,
  saveEverySection,
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

interface CoverProbe {
  readonly closeLabel: string;
  readonly seenKey: string;
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
const SEEN_KEY = '__clearanceSeen';

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
    await saveEditedName(page, edits.fullName, edits.password);
    await expectErrorOutcome(page, text.transient);
  },
};

const THREE_OUTCOMES: OutcomeSet = {
  name: 'three outcomes',
  replies: (edits) => everySectionReplies(edits),
  show: (page, edits) => saveEverySection(page, edits),
};

const OUTCOME_SETS: readonly OutcomeSet[] = [ONE_OUTCOME, THREE_OUTCOMES];

const sizeName = (size: ViewportSize): string => `${size.width} × ${size.height}`;

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
          const card = close.closest('ul')?.parentElement?.parentElement;
          if (card) covers.set(card, 'bell notice card');
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
  page.evaluate(coverOfFocused, { closeLabel: text.noticeClose, seenKey: SEEN_KEY });

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
    }
  }
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
