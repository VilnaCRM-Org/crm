import type { Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  height: number;
}

interface CardLayout {
  card: Rect;
  title: Rect;
  description: Rect;
  actions: Rect[];
}

interface SpacingViewport {
  width: number;
  height: number;
}

const FOCUS_RING_INSET = 4;
const REQUEST_ACCESS_ACTIONS = 2;
const TEXT_SPACING_OVERRIDES = [
  '* { line-height: 1.5 !important; letter-spacing: 0.12em !important;',
  'word-spacing: 0.16em !important; }',
  'p { margin-bottom: 2em !important; }',
].join(' ');

const forbiddenTitle: string = t('error_page.forbidden.title');

const spacingViewports: readonly SpacingViewport[] = [
  { width: 1440, height: 940 },
  { width: 1024, height: 1366 },
  { width: 375, height: 812 },
  { width: 320, height: 640 },
];

async function openForbidden(page: Page, viewport: SpacingViewport): Promise<void> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(ROUTE_PATHS.forbidden, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1')).toHaveText(forbiddenTitle);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

function readCardLayout(page: Page): Promise<CardLayout> {
  return page.evaluate((): CardLayout => {
    const rectOf = (element: Element): Rect => {
      const { left, right, top, bottom, height } = element.getBoundingClientRect();
      return { left, right, top, bottom, height };
    };
    const title = document.querySelector('main h1') as HTMLElement;
    const card = title.parentElement as HTMLElement;

    return {
      card: rectOf(card),
      title: rectOf(title),
      description: rectOf(card.querySelector(':scope > h1 + p + p') as HTMLElement),
      actions: [...document.querySelectorAll('#error-page-actions > *')].map(rectOf),
    };
  });
}

function expectInside(inner: Rect, outer: Rect, inset: number): void {
  expect(inner.left - outer.left).toBeGreaterThanOrEqual(inset);
  expect(outer.right - inner.right).toBeGreaterThanOrEqual(inset);
  expect(inner.top - outer.top).toBeGreaterThanOrEqual(inset);
  expect(outer.bottom - inner.bottom).toBeGreaterThanOrEqual(inset);
}

test.describe('Error-page WCAG 1.4.12 text spacing (issue #309)', () => {
  for (const viewport of spacingViewports) {
    test(`keeps spaced 403 content in the card at ${viewport.width} x ${viewport.height}`, async ({
      page,
    }) => {
      await openForbidden(page, viewport);
      const resting = await readCardLayout(page);

      await page.addStyleTag({ content: TEXT_SPACING_OVERRIDES });
      const spaced = await readCardLayout(page);

      expect(spaced.card.height).toBeGreaterThan(resting.card.height);
      expectInside(spaced.title, spaced.card, 0);
      expectInside(spaced.description, spaced.card, 0);
      expect(spaced.actions).toHaveLength(REQUEST_ACCESS_ACTIONS);
      spaced.actions.forEach((action) => expectInside(action, spaced.card, FOCUS_RING_INSET));
    });
  }
});
