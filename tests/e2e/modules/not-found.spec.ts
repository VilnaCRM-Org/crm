import { test, expect } from '@playwright/test';

import { t } from '../utils/initialize-localization';

const UNKNOWN_PATH = '/definitely-not-a-route';

const notFoundTitle: string = t('not_found.title');
const notFoundDescription: string = t('not_found.description');
const notFoundCta: string = t('not_found.cta');

test.describe('Catch-all (404) route E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(UNKNOWN_PATH, { waitUntil: 'domcontentloaded' });
  });

  test('renders the localized not-found page for an unknown path', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`${UNKNOWN_PATH}$`));
    await expect(page.locator('main h1')).toHaveText(notFoundTitle);
    await expect(page.locator('main')).toContainText(notFoundDescription);
  });

  test('navigates home through the not-found call to action', async ({ page }) => {
    const callToAction = page.locator('main a[href="/"]').filter({ hasText: notFoundCta });

    await expect(callToAction).toHaveCount(1);
    await callToAction.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1').filter({ hasText: notFoundTitle })).toHaveCount(0);
  });
});
