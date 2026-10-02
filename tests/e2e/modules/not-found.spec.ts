import type { ConsoleMessage, Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

const BASE_TITLE = 'VilnaCRM';
const UNKNOWN_PATH = '/definitely-not-a-route';
const DEEP_PATH = '/a/b/c?x=1#y';
const MEMLAB_AWAY_PATH = '/__memlab_away__';

const notFoundTitle: string = t('error_page.not_found.title');
const notFoundDescription: string = t('error_page.not_found.description');
const homeLabel: string = t('error_page.actions.home');
const backToMainLabel: string = t('buttons.back_to_main');
const homeHeading: string = t('home.heading');

const headingOf = (page: Page): Locator => page.locator('main h1');
const homeLinkOf = (page: Page): Locator => page.locator('main a[href="/"]');

const openNotFound = async (page: Page, path: string): Promise<void> => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(headingOf(page)).toHaveText(notFoundTitle);
};

test.describe('Catch-all (404) route E2E Tests (issue #309)', () => {
  for (const path of [UNKNOWN_PATH, DEEP_PATH]) {
    test(`renders the designed 404 page on ${path}`, async ({ page }) => {
      await openNotFound(page, path);

      await expect(page).toHaveURL((url) => `${url.pathname}${url.search}${url.hash}` === path);
      await expect(page).toHaveTitle(`${notFoundTitle} - ${BASE_TITLE}`);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(headingOf(page)).toBeFocused();
      await expect(page.locator('main')).toContainText(notFoundDescription);
      await expect(homeLinkOf(page)).toHaveCount(1);
      await expect(homeLinkOf(page)).toHaveAccessibleName(homeLabel);
    });
  }

  test('renders no back-to-main link and no button', async ({ page }) => {
    await openNotFound(page, UNKNOWN_PATH);

    await expect(page.getByRole('link', { name: backToMainLabel })).toHaveCount(0);
    await expect(page.locator('button')).toHaveCount(0);
  });

  test('renders the 404 page on the memlab away path with zero console output', async ({
    page,
  }) => {
    const messages: string[] = [];
    page.on('console', (message: ConsoleMessage) => {
      messages.push(`${message.type()}: ${message.text()}`);
    });

    await openNotFound(page, MEMLAB_AWAY_PATH);
    await expect(homeLinkOf(page)).toHaveCount(1);

    expect(messages).toEqual([]);
  });

  test('follows the home link to the root, where the auth redirect applies', async ({ page }) => {
    await openNotFound(page, UNKNOWN_PATH);

    await homeLinkOf(page).click();

    await expect(page).toHaveURL(new RegExp(`(${ROUTE_PATHS.home}|${ROUTE_PATHS.signIn})$`));
    await expect(page.locator('h1').filter({ hasText: notFoundTitle })).toHaveCount(0);
  });

  test('follows the home link to the home page when signed in', async ({ page }) => {
    await seedPreloadedAuthToken(page);
    await openNotFound(page, UNKNOWN_PATH);

    await homeLinkOf(page).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
  });
});
