import type { Page } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  codeCellsOf,
  recoveryFieldOf,
  recoveryToggleOf,
  signInToChallenge,
} from '@tests/e2e/utils/reach-challenge';

interface Rect {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly height: number;
}

interface ChallengeLayout {
  readonly viewportWidth: number;
  readonly scrollWidth: number;
  readonly card: Rect;
  readonly title: Rect;
  readonly titleBox: Rect;
  readonly titleScrollWidth: number;
  readonly titleClientWidth: number;
}

interface SpacingViewport {
  readonly width: number;
  readonly height: number;
}

interface ChallengeMode {
  readonly name: string;
  readonly open: (page: Page) => Promise<void>;
}

const TEXT_SPACING_OVERRIDES = [
  '* { line-height: 1.5 !important; letter-spacing: 0.12em !important;',
  'word-spacing: 0.16em !important; }',
  'p { margin-bottom: 2em !important; }',
].join(' ');

const credentials = buildCredentials();

const spacingViewports: readonly SpacingViewport[] = [
  { width: 1440, height: 940 },
  { width: 1024, height: 1366 },
  { width: 375, height: 812 },
  { width: 320, height: 640 },
];

const challengeModes: readonly ChallengeMode[] = [
  {
    name: 'authenticator',
    open: async (page): Promise<void> => {
      await expect(codeCellsOf(page)).toHaveCount(6);
    },
  },
  {
    name: 'recovery',
    open: async (page): Promise<void> => {
      await recoveryToggleOf(page).click();
      await expect(recoveryFieldOf(page)).toBeFocused();
    },
  },
];

async function openChallenge(
  page: Page,
  viewport: SpacingViewport,
  mode: ChallengeMode
): Promise<void> {
  await page.setViewportSize(viewport);
  await signInToChallenge(page, credentials);
  await mode.open(page);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

function readChallengeLayout(page: Page): Promise<ChallengeLayout> {
  return page.evaluate((): ChallengeLayout => {
    const rectOf = (box: Element | Range): Rect => {
      const { left, right, top, bottom, height } = box.getBoundingClientRect();
      return { left, right, top, bottom, height };
    };
    const card = document.querySelector('#auth-form-card') as HTMLElement;
    const title = card.querySelector('h1') as HTMLElement;
    const glyphs = document.createRange();
    glyphs.selectNodeContents(title);

    return {
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      card: rectOf(card),
      title: rectOf(glyphs),
      titleBox: rectOf(title),
      titleScrollWidth: title.scrollWidth,
      titleClientWidth: title.clientWidth,
    };
  });
}

function expectInside(inner: Rect, outer: Rect): void {
  expect(inner.left).toBeGreaterThanOrEqual(outer.left);
  expect(inner.right).toBeLessThanOrEqual(outer.right);
  expect(inner.top).toBeGreaterThanOrEqual(outer.top);
  expect(inner.bottom).toBeLessThanOrEqual(outer.bottom);
}

test.describe('Two-factor challenge WCAG 1.4.12 text spacing (issue #331)', () => {
  for (const mode of challengeModes) {
    for (const viewport of spacingViewports) {
      const size = `${viewport.width} x ${viewport.height}`;

      test(`wraps the spaced ${mode.name} title inside the card at ${size}`, async ({ page }) => {
        await openChallenge(page, viewport, mode);
        const resting = await readChallengeLayout(page);

        await page.addStyleTag({ content: TEXT_SPACING_OVERRIDES });
        const spaced = await readChallengeLayout(page);

        expect(spaced.titleBox.height).toBeGreaterThan(resting.titleBox.height);
        expect(spaced.scrollWidth).toBe(spaced.viewportWidth);
        expect(spaced.card.left).toBeGreaterThanOrEqual(0);
        expect(spaced.card.right).toBeLessThanOrEqual(spaced.viewportWidth);
        expect(spaced.titleScrollWidth).toBeLessThanOrEqual(spaced.titleClientWidth);
        expectInside(spaced.title, spaced.titleBox);
        expectInside(spaced.title, spaced.card);
      });
    }
  }
});
