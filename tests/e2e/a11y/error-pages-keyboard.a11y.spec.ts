import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { expectTabOrder } from '@tests/utils/a11y/keyboard';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

interface ErrorPageCase {
  name: string;
  path: string;
  title: string;
}

const NOT_FOUND_PATH = '/definitely-not-a-route';
const SHORT_LANDSCAPE_VIEWPORT = { width: 839, height: 412 };

const homeLabel: string = t('error_page.actions.home');
const requestAccessLabel: string = t('error_page.actions.request_access');
const homeHeading: string = t('home.heading');
const privacyLabel: string = t('footer.privacy');
const termsLabel: string = t('footer.usage_policy');

const notFoundPage: ErrorPageCase = {
  name: 'not found',
  path: NOT_FOUND_PATH,
  title: t('error_page.not_found.title'),
};
const forbiddenPage: ErrorPageCase = {
  name: 'forbidden',
  path: ROUTE_PATHS.forbidden,
  title: t('error_page.forbidden.title'),
};
const serverErrorPage: ErrorPageCase = {
  name: 'server error',
  path: ROUTE_PATHS.serverError,
  title: t('error_page.server_error.title'),
};
const allPages: readonly ErrorPageCase[] = [notFoundPage, forbiddenPage, serverErrorPage];
const singleActionPages: readonly ErrorPageCase[] = [notFoundPage, serverErrorPage];

const headingOf = (page: Page): Locator => page.locator('main h1');
const homeLinkOf = (page: Page): Locator =>
  page.getByRole('main').getByRole('link', { name: homeLabel, exact: true });

async function openErrorPage(page: Page, errorPage: ErrorPageCase): Promise<void> {
  await page.goto(errorPage.path, { waitUntil: 'domcontentloaded' });
  await expect(headingOf(page)).toHaveText(errorPage.title);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(headingOf(page)).toBeFocused();
}

test.describe('Error-page keyboard contract (issue #309)', () => {
  test('Tab on /forbidden visits home, request access, then the footer, each visibly', async ({
    page,
  }) => {
    await openErrorPage(page, forbiddenPage);
    const footer = page.getByRole('contentinfo');

    await expectTabOrder(page, [
      { locator: homeLinkOf(page), visibleFocus: true },
      {
        locator: page.getByRole('button', { name: requestAccessLabel, exact: true }),
        visibleFocus: true,
      },
      { locator: footer.getByRole('link', { name: privacyLabel }), visibleFocus: true },
      { locator: footer.getByRole('link', { name: termsLabel }), visibleFocus: true },
    ]);
  });

  for (const errorPage of singleActionPages) {
    test(`Tab on the ${errorPage.name} page lands on the home link with a visible focus`, async ({
      page,
    }) => {
      await openErrorPage(page, errorPage);

      await expectTabOrder(page, [{ locator: homeLinkOf(page), visibleFocus: true }]);
    });
  }

  for (const errorPage of allPages) {
    test(`Enter on the ${errorPage.name} home link navigates to the home route`, async ({
      page,
    }) => {
      await seedPreloadedAuthToken(page);
      await openErrorPage(page, errorPage);
      await expectTabOrder(page, [{ locator: homeLinkOf(page) }]);

      await page.keyboard.press('Enter');

      await expect(page).toHaveURL((url) => url.pathname === ROUTE_PATHS.home);
      await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
    });

    test(`focuses the ${errorPage.name} heading on load without an outline`, async ({ page }) => {
      await openErrorPage(page, errorPage);

      await expect(headingOf(page)).toHaveCSS('outline-style', 'none');
    });

    test(`keeps the focused ${errorPage.name} heading inside an 839 x 412 viewport`, async ({
      page,
    }) => {
      await page.setViewportSize(SHORT_LANDSCAPE_VIEWPORT);
      await openErrorPage(page, errorPage);

      await expect(headingOf(page)).toBeInViewport({ ratio: 1 });
    });
  }
});
