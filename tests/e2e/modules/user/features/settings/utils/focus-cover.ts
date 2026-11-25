import type { Page } from '@playwright/test';

import waitForSettledScroll from '@tests/e2e/utils/wait-for-settled-scroll';

import { noticeCardOf } from './settings-page';

interface EdgeReading {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

interface CoverReading {
  readonly area: EdgeReading;
  readonly focused: EdgeReading;
  readonly holdsFocus: boolean;
}

interface FocusVisit {
  readonly state: 'body' | 'repeat' | 'fresh';
  readonly name: string;
}

const SEEN_KEY = '__clearanceSeen';
const EDGE_TOLERANCE_PX = 0.5;

export async function resetSeen(page: Page): Promise<void> {
  await page.evaluate((key) => Reflect.deleteProperty(window, key), SEEN_KEY);
}

const nextPaint = (page: Page): Promise<void> =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );

function visitFocused(key: string): FocusVisit {
  const focused = document.activeElement;
  if (focused === null || focused === document.body) return { state: 'body', name: '' };
  const seen = (Reflect.get(window, key) as WeakSet<Element> | undefined) ?? new WeakSet<Element>();
  Reflect.set(window, key, seen);
  const state = seen.has(focused) ? 'repeat' : 'fresh';
  seen.add(focused);
  const label = focused.getAttribute('aria-label') ?? focused.textContent?.trim() ?? '';
  return { state, name: `${focused.tagName.toLowerCase()} "${label}"` };
}

function readCovers(covers: readonly Element[]): readonly CoverReading[] {
  const edgesOf = (element: Element): EdgeReading => {
    const { left, right, top, bottom } = element.getBoundingClientRect();
    return { left, right, top, bottom };
  };
  const focused = document.activeElement ?? document.body;
  return covers.map((cover) => ({
    area: edgesOf(cover),
    focused: edgesOf(focused),
    holdsFocus: cover.contains(focused),
  }));
}

const hasArea = (edges: EdgeReading): boolean =>
  edges.right > edges.left && edges.bottom > edges.top;

const liesInside = (inner: EdgeReading, outer: EdgeReading): boolean =>
  [
    inner.left - outer.left,
    outer.right - inner.right,
    inner.top - outer.top,
    outer.bottom - inner.bottom,
  ].every((gap) => gap >= -EDGE_TOLERANCE_PX);

const hidesFocus = ({ area, focused, holdsFocus }: CoverReading): boolean =>
  !holdsFocus && [area, focused].every(hasArea) && liesInside(focused, area);

const joined = (header: CoverReading, card: CoverReading): CoverReading => ({
  ...card,
  area: { ...card.area, top: header.area.top },
  holdsFocus: header.holdsFocus || card.holdsFocus,
});

async function coverHiding(page: Page): Promise<string | undefined> {
  const header = await page.locator('header').first().evaluateAll(readCovers);
  if (header.some(hidesFocus)) return 'header';
  const card = await noticeCardOf(page).evaluateAll(readCovers);
  if (card.some(hidesFocus)) return 'bell notice card';
  const both = header.flatMap((top) => card.map((reading) => joined(top, reading)));
  return both.some(hidesFocus) ? 'header and the bell notice card together' : undefined;
}

async function coverOnceSettled(page: Page): Promise<string | undefined> {
  await waitForSettledScroll(page);
  return coverHiding(page);
}

export async function probeFocused(page: Page): Promise<string> {
  await nextPaint(page);
  const { state, name } = await page.evaluate(visitFocused, SEEN_KEY);
  if (state !== 'fresh') return state;
  const cover = (await coverHiding(page)) && (await coverOnceSettled(page));
  return cover === undefined ? 'clear' : `${name} under the ${cover}`;
}
