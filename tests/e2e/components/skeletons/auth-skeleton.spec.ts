/* eslint-disable testing-library/prefer-screen-queries */
import { type Page, test, expect } from '@playwright/test';

import { seedPreloadedAuthToken } from '../../../utils/seed-preloaded-auth-token';

const AUTH_URL = '/authentication';
const HOME_URL = '/';
const JS_DELAY_MS = 2000;
const AUTH_ROUTE_SHELL_CHUNKS = 2;

function isLazyChunk(url: string): boolean {
  return /\/static\/js\/.*\.js$/.test(url) && !/\/static\/js\/(?:main|runtime)/.test(url);
}

async function interceptAuthFormChunks(page: Page, delayMs: number): Promise<void> {
  let lazyChunkCount = 0;

  await page.route('**/static/js/**/*.js', async (route) => {
    if (isLazyChunk(route.request().url())) {
      lazyChunkCount += 1;

      // Let the auth route shell load first, then delay the inner form chunk to expose the skeleton.
      if (lazyChunkCount > AUTH_ROUTE_SHELL_CHUNKS) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
    }

    await route.continue();
  });
}

test.describe('Auth skeleton e2e', () => {
  test.describe('loading state', () => {
    test.beforeEach(async ({ page }) => {
      await seedPreloadedAuthToken(page);
      await page.goto(HOME_URL, { waitUntil: 'networkidle' });
      await interceptAuthFormChunks(page, JS_DELAY_MS);
      await page.evaluate((path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, AUTH_URL);
    });

    test('displays all skeleton elements while authentication module loads', async ({ page }) => {
      const skeletonIds = [
        'auth-skeleton-title',
        'auth-skeleton-subtitle',
        'auth-skeleton-field-label-1',
        'auth-skeleton-field-label-2',
        'auth-skeleton-field-label-3',
        'auth-skeleton-input-1',
        'auth-skeleton-input-2',
        'auth-skeleton-input-3',
        'auth-skeleton-submit',
        'auth-skeleton-divider',
        'auth-skeleton-social-google',
        'auth-skeleton-social-facebook',
        'auth-skeleton-social-apple',
        'auth-skeleton-social-linkedin',
        'auth-skeleton-switcher',
      ];

      await Promise.all(
        skeletonIds.map((testId) =>
          expect(page.locator(`#${testId}`)).toBeVisible({ timeout: 5000 })
        )
      );

      await expect(page.locator('#auth-skeleton-subtitle-line2')).toBeAttached();
    });

    test('has an accessible loading label on the skeleton section', async ({ page }) => {
      await expect(page.locator('section[aria-label="Loading authentication form"]')).toBeVisible({
        timeout: 5000,
      });
    });

    test('transitions from skeleton to authentication form', async ({ page }) => {
      await expect(page.locator('#auth-skeleton-divider')).toBeVisible({ timeout: 3000 });

      await page.unroute('**/static/js/**/*.js');

      const form = page.locator('form');
      await expect(form).toBeVisible({ timeout: 10000 });

      await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(2, {
        timeout: 10000,
      });
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('hides skeleton elements after the authentication form loads', async ({ page }) => {
      await expect(page.locator('#auth-skeleton-title')).toBeVisible({ timeout: 3000 });

      await page.unroute('**/static/js/**/*.js');

      await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

      await expect(page.locator('#auth-skeleton-title')).not.toBeVisible();
      await expect(page.locator('#auth-skeleton-submit')).not.toBeVisible();
      await expect(page.locator('#auth-skeleton-divider')).not.toBeVisible();
    });
  });

  test.describe('error handling', () => {
    test('loads the authentication page without critical errors', async ({ page }) => {
      const criticalErrors: string[] = [];

      page.on('pageerror', (error) => {
        criticalErrors.push(error.message);
      });
      page.on('response', (response) => {
        const status = response.status();

        if (status >= 300 && status < 400) return;
        if (status === 400) return;
        if (!response.ok()) criticalErrors.push(`${status} ${response.url()}`);
      });

      await page.goto(AUTH_URL);

      await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
      expect(criticalErrors).toHaveLength(0);
    });
  });
});
