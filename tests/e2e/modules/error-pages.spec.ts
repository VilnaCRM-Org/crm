import type { ConsoleMessage, Locator, Page, Request } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface ErrorPageLayout {
  viewportWidth: number;
  viewportHeight: number;
  scrollWidth: number;
  card: Rect;
  description: Rect;
  descriptionLineHeight: number;
  tab: Rect;
  actions: Rect[];
  glyphs: Rect[];
  decorations: Rect[];
  footer: Rect;
}

interface ErrorPageCase {
  name: string;
  path: string;
  title: string;
  description: string;
}

const BASE_TITLE = 'VilnaCRM';
const NOT_FOUND_PATH = '/definitely-not-a-route';
const MOBILE_CARD_HEIGHT = 173.696;
const DESKTOP_CARD_WIDTH = 614;
const TABLET_CARD_WIDTH = 474;
const PAGE_PADDING_BOTTOM = 121;
const MOBILE_TEXT_INSET = 16;
const LARGE_TEXT_INSET = 24;
const FOCUS_RING_INSET = 4;
const NAVIGATING_REQUEST_TYPES = new Set(['document', 'fetch', 'xhr']);

const homeLabel: string = t('error_page.actions.home');
const requestAccessLabel: string = t('error_page.actions.request_access');

const notFoundPage: ErrorPageCase = {
  name: 'not found',
  path: NOT_FOUND_PATH,
  title: t('error_page.not_found.title'),
  description: t('error_page.not_found.description'),
};
const forbiddenPage: ErrorPageCase = {
  name: 'forbidden',
  path: ROUTE_PATHS.forbidden,
  title: t('error_page.forbidden.title'),
  description: t('error_page.forbidden.description'),
};
const serverErrorPage: ErrorPageCase = {
  name: 'server error',
  path: ROUTE_PATHS.serverError,
  title: t('error_page.server_error.title'),
  description: t('error_page.server_error.description'),
};
const allPages: readonly ErrorPageCase[] = [notFoundPage, forbiddenPage, serverErrorPage];
const longCopyPages: readonly ErrorPageCase[] = [forbiddenPage, serverErrorPage];

const headingOf = (page: Page): Locator => page.locator('main h1');
const actionsOf = (page: Page): Locator => page.locator('#error-page-actions > *');
const homeLinkOf = (page: Page): Locator => page.locator('main a[href="/"]');
const requestAccessOf = (page: Page): Locator =>
  page.getByRole('button', { name: requestAccessLabel, exact: true });

async function openErrorPage(
  page: Page,
  errorPage: ErrorPageCase,
  path = errorPage.path
): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(headingOf(page)).toHaveText(errorPage.title);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

function readLayout(page: Page): Promise<ErrorPageLayout> {
  return page.evaluate((): ErrorPageLayout => {
    const rectOf = (element: Element): Rect => {
      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return {
        left: left + window.scrollX,
        right: right + window.scrollX,
        top: top + window.scrollY,
        bottom: bottom + window.scrollY,
        width,
        height,
      };
    };
    const title = document.querySelector('main h1') as HTMLElement;
    const card = title.parentElement as HTMLElement;
    const layer = card.parentElement?.firstElementChild as HTMLElement;
    const description = card.querySelector(':scope > h1 + p + p') as HTMLElement;
    const rendered = (elements: Element[]): Element[] =>
      elements.filter((element) => element.getClientRects().length > 0);

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      card: rectOf(card),
      description: rectOf(description),
      descriptionLineHeight: Number.parseFloat(getComputedStyle(description).lineHeight),
      tab: rectOf(layer.firstElementChild as HTMLElement),
      actions: [...document.querySelectorAll('#error-page-actions > *')].map(rectOf),
      glyphs: [...document.querySelectorAll('#error-page-digits > span')].map(rectOf),
      decorations: rendered([...layer.children]).map(rectOf),
      footer: rectOf(document.querySelector('footer') as HTMLElement),
    };
  });
}

function expectInset(inner: Rect, outer: Rect, inset: number): void {
  expect(inner.left - outer.left).toBeGreaterThanOrEqual(inset);
  expect(outer.right - inner.right).toBeGreaterThanOrEqual(inset);
  expect(inner.top - outer.top).toBeGreaterThanOrEqual(inset);
  expect(outer.bottom - inner.bottom).toBeGreaterThanOrEqual(inset);
}

function expectWithinViewportWidth(rect: Rect, viewportWidth: number): void {
  expect(rect.left).toBeGreaterThanOrEqual(0);
  expect(rect.right).toBeLessThanOrEqual(viewportWidth);
}

function expectNarrowLayout(layout: ErrorPageLayout): void {
  expect(layout.scrollWidth).toBe(layout.viewportWidth);
  expect(layout.glyphs).toHaveLength(3);
  layout.glyphs.forEach((glyph) => expectWithinViewportWidth(glyph, layout.viewportWidth));
  expectWithinViewportWidth(layout.card, layout.viewportWidth);
  layout.actions.forEach((action) => expectInset(action, layout.card, FOCUS_RING_INSET));
  expect(layout.tab.left).toBeGreaterThanOrEqual(layout.card.left);
  expect(layout.tab.right).toBeLessThanOrEqual(layout.card.right);
}

function expectWrappedDescription(layout: ErrorPageLayout): void {
  expect(layout.description.height).toBeGreaterThan(layout.descriptionLineHeight * 1.5);
  expect(layout.card.height).toBeGreaterThan(MOBILE_CARD_HEIGHT);
  expectInset(layout.description, layout.card, MOBILE_TEXT_INSET);
}

function expectFooterBelowDecorations(layout: ErrorPageLayout): void {
  const lowest = Math.max(layout.card.bottom, ...layout.decorations.map((rect) => rect.bottom));

  expect(layout.footer.top).toBeGreaterThanOrEqual(lowest + PAGE_PADDING_BOTTOM - 0.5);
  expect(layout.scrollWidth).toBe(layout.viewportWidth);
}

async function expectRequestAccessInert(page: Page, activate: () => Promise<void>): Promise<void> {
  const requests: string[] = [];
  const recordRequest = (request: Request): void => {
    if (NAVIGATING_REQUEST_TYPES.has(request.resourceType())) {
      requests.push(`${request.method()} ${request.url()}`);
    }
  };
  const url = page.url();
  page.on('request', recordRequest);

  await activate();

  await expect(page).toHaveURL(url);
  await expect(headingOf(page)).toHaveText(forbiddenPage.title);
  await expect(page.locator('h1')).toHaveCount(1);
  page.off('request', recordRequest);
  expect(requests).toEqual([]);
}

test.describe('Forbidden (403) route E2E Tests (issue #309)', () => {
  test('renders the 403 page with its two actions and the footer without auth', async ({
    page,
  }) => {
    await openErrorPage(page, forbiddenPage);

    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(page).toHaveTitle(`${forbiddenPage.title} - ${BASE_TITLE}`);
    await expect(page.locator('main')).toContainText(forbiddenPage.description);
    await expect(actionsOf(page)).toHaveCount(2);
    await expect(actionsOf(page).nth(0)).toHaveAttribute('href', ROUTE_PATHS.home);
    await expect(actionsOf(page).nth(0)).toHaveAccessibleName(homeLabel);
    await expect(actionsOf(page).nth(0)).toHaveClass(/MuiButton-outlined/);
    await expect(actionsOf(page).nth(1)).toHaveAccessibleName(requestAccessLabel);
    await expect(actionsOf(page).nth(1)).toHaveAttribute('type', 'button');
  });

  test('renders the same 403 page with a seeded auth token, without a redirect', async ({
    page,
  }) => {
    await seedPreloadedAuthToken(page);
    await openErrorPage(page, forbiddenPage);

    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(actionsOf(page)).toHaveCount(2);
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('renders the request-access button without an action', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message: ConsoleMessage) => {
      messages.push(`${message.type()}: ${message.text()}`);
    });
    await openErrorPage(page, forbiddenPage);
    const requestAccess = requestAccessOf(page);

    await expect(requestAccess).toHaveAttribute('aria-disabled', 'true');
    await expect(requestAccess).toHaveJSProperty('disabled', false);
    await expectRequestAccessInert(page, () => requestAccess.click({ force: true }));
    await requestAccess.focus();
    await expect(requestAccess).toBeFocused();
    await expectRequestAccessInert(page, () => page.keyboard.press('Enter'));
    await expectRequestAccessInert(page, () => page.keyboard.press('Space'));

    expect(messages).toEqual([]);
  });

  test('keeps the 403 page on reload', async ({ page }) => {
    await openErrorPage(page, forbiddenPage);

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(headingOf(page)).toHaveText(forbiddenPage.title);
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  for (const variantPath of ['/forbidden/', '/Forbidden']) {
    test(`renders the 403 page on ${variantPath} as React Router matches it`, async ({ page }) => {
      await openErrorPage(page, forbiddenPage, variantPath);

      await expect(page).toHaveURL((url) => url.pathname === variantPath);
      await expect(actionsOf(page)).toHaveCount(2);
    });
  }
});

test.describe('Server error (5xx) route E2E Tests (issue #309)', () => {
  test('renders the 5xx page with one home link, the footer and no button', async ({ page }) => {
    await openErrorPage(page, serverErrorPage);

    await expect(page).toHaveURL(/\/server-error$/);
    await expect(page).toHaveTitle(`${serverErrorPage.title} - ${BASE_TITLE}`);
    await expect(page.locator('main')).toContainText(serverErrorPage.description);
    await expect(homeLinkOf(page)).toHaveCount(1);
    await expect(homeLinkOf(page)).toHaveAccessibleName(homeLabel);
    await expect(page.locator('button')).toHaveCount(0);
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('keeps the 5xx page on reload', async ({ page }) => {
    await openErrorPage(page, serverErrorPage);

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(headingOf(page)).toHaveText(serverErrorPage.title);
    await expect(page).toHaveURL(/\/server-error$/);
  });
});

test.describe('Error-page home links (issue #309)', () => {
  for (const errorPage of longCopyPages) {
    test(`follows the ${errorPage.name} home link to the root or its auth redirect`, async ({
      page,
    }) => {
      await openErrorPage(page, errorPage);

      await homeLinkOf(page).click();

      await expect(page).toHaveURL(new RegExp(`(${ROUTE_PATHS.home}|${ROUTE_PATHS.signIn})$`));
      await expect(page.locator('h1').filter({ hasText: errorPage.title })).toHaveCount(0);
    });
  }
});

test.describe('Error-page layout (issue #309)', () => {
  for (const errorPage of allPages) {
    test(`fits the ${errorPage.name} page into a 320 x 640 viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await openErrorPage(page, errorPage);

      expectNarrowLayout(await readLayout(page));
    });

    test(`keeps the ${errorPage.name} footer below the decorations at 1440 x 600`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 600 });
      await openErrorPage(page, errorPage);

      expectFooterBelowDecorations(await readLayout(page));
    });

    test(`pins the ${errorPage.name} footer to the viewport bottom at 1440 x 1400`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1400 });
      await openErrorPage(page, errorPage);
      const layout = await readLayout(page);

      expect(Math.abs(layout.footer.bottom - layout.viewportHeight)).toBeLessThanOrEqual(1);
    });

    test(`centres the 614 px ${errorPage.name} card at 1920 x 1080`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await openErrorPage(page, errorPage);
      const { card } = await readLayout(page);

      expect(card.width).toBeCloseTo(DESKTOP_CARD_WIDTH, 0);
      expect(Math.abs((card.left + card.right) / 2 - 960)).toBeLessThanOrEqual(1);
    });
  }

  for (const errorPage of longCopyPages) {
    test(`wraps the uk ${errorPage.name} description inside a taller card at 320 x 640`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await openErrorPage(page, errorPage);

      expectWrappedDescription(await readLayout(page));
    });

    test(`keeps the uk ${errorPage.name} description inset at 375 x 812`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await openErrorPage(page, errorPage);
      const layout = await readLayout(page);

      expectInset(layout.description, layout.card, MOBILE_TEXT_INSET);
    });
  }

  test('keeps the 403 actions on one row inside the 474 px card at 1024 x 1366', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await openErrorPage(page, forbiddenPage);
    const layout = await readLayout(page);
    const [home, requestAccess] = layout.actions;

    expect(layout.card.width).toBeCloseTo(TABLET_CARD_WIDTH, 0);
    expect(layout.actions).toHaveLength(2);
    expect(Math.abs((home?.top ?? 0) - (requestAccess?.top ?? Number.NaN))).toBeLessThan(1);
    layout.actions.forEach((action) => expectInset(action, layout.card, FOCUS_RING_INSET));
    expectInset(layout.description, layout.card, LARGE_TEXT_INSET);
  });
});
