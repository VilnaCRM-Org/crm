import { test, expect } from '@tests/e2e/utils/fixtures';

import { t } from '../utils/initialize-localization';

const ACCESS_DENIED_PATH = '/access-denied';

const accessDeniedTitle: string = t('access_denied.title');
const accessDeniedDescription: string = t('access_denied.description');
const accessDeniedCta: string = t('access_denied.cta');

test.describe('Access denied (403) route E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ACCESS_DENIED_PATH, { waitUntil: 'domcontentloaded' });
  });

  test('renders the localized refusal panel', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(`${ACCESS_DENIED_PATH}$`));
    await expect(page.locator('main h1')).toHaveText(accessDeniedTitle);
    await expect(page.locator('main')).toContainText(accessDeniedDescription);
  });

  test('navigates home through the refusal call to action', async ({ page }) => {
    const callToAction = page.locator('main a[href="/"]').filter({ hasText: accessDeniedCta });

    await expect(callToAction).toHaveCount(1);
    await callToAction.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1').filter({ hasText: accessDeniedTitle })).toHaveCount(0);
  });
});
