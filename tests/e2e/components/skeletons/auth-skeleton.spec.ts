import { test, expect } from '@tests/e2e/utils/fixtures';

import {
  interceptAuthFormChunks,
  AUTH_ASYNC_JS_GLOB,
} from '../../../utils/intercept-auth-form-chunks';

const AUTH_URL = '/sign-up';

test.describe('AuthSkeleton Component E2E Tests', () => {
  test.describe('Loading State', () => {
    let releaseDelayedChunk: (() => Promise<void>) | undefined;

    test.beforeEach(async ({ page }) => {
      releaseDelayedChunk = await interceptAuthFormChunks(page);
      await page.goto(AUTH_URL, { waitUntil: 'commit' });
    });

    test.afterEach(async ({ page }) => {
      await releaseDelayedChunk?.();
      await page.unroute(AUTH_ASYNC_JS_GLOB);
    });

    test('should display all skeleton elements while authentication module loads', async ({
      page,
    }) => {
      const skeletonTestIds = [
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
        skeletonTestIds.map((testId) =>
          expect(page.locator(`#${testId}`)).toBeVisible({ timeout: 5000 })
        )
      );

      // subtitle-line2 is rendered but hidden via display:none above 336px viewports
      await expect(page.locator('#auth-skeleton-subtitle-line2')).toBeAttached();
    });

    test('should have accessible loading label on skeleton section', async ({ page }) => {
      const ariaLabel = 'Завантаження форми автентифікації';
      const section = page.locator(`section[aria-label="${ariaLabel}"]`);
      await expect(section).toBeVisible({ timeout: 5000 });
    });

    test('should transition from skeleton to authentication form', async ({ page }) => {
      await expect(page.locator('#auth-skeleton-divider')).toBeVisible({ timeout: 5000 });

      await releaseDelayedChunk?.();
      await page.unroute(AUTH_ASYNC_JS_GLOB);

      const form = page.locator('form, [role="form"]');
      await expect(form).toBeVisible({ timeout: 10000 });

      const inputs = page.locator(
        'input[type="text"], input[type="email"], input[type="password"]'
      );
      await expect(inputs.first()).toBeVisible();

      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should hide skeleton elements after authentication form loads', async ({ page }) => {
      await expect(page.locator('#auth-skeleton-title')).toBeVisible({ timeout: 5000 });

      await releaseDelayedChunk?.();
      await page.unroute(AUTH_ASYNC_JS_GLOB);

      await expect(page.locator('form, [role="form"]')).toBeVisible({ timeout: 10000 });

      await expect(page.locator('#auth-skeleton-title')).not.toBeVisible();
      await expect(page.locator('#auth-skeleton-submit')).not.toBeVisible();
      await expect(page.locator('#auth-skeleton-divider')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    // The suite-wide `consoleGuard` fixture (tests/e2e/utils/fixtures.ts, issue #168)
    // now enforces the zero-tolerance `pageerror` half for every spec, so this test
    // keeps only its targeted, page-specific assertion: no unexpected non-ok response
    // while the authentication page loads.
    test('loads the authentication page without unexpected non-ok responses', async ({ page }) => {
      const failedResponses: string[] = [];
      page.on('response', (response) => {
        const status = response.status();
        if (status >= 300 && status < 400) return;
        // The auth page can trigger an expected 400 from the user API during form
        // bootstrap in test mode. Match the exact endpoint pathname (not a
        // substring) so an unrelated `/api/users/...` 400 still fails the check.
        const { pathname } = new URL(response.url());
        if (status === 400 && pathname === '/api/users') return;
        if (!response.ok()) failedResponses.push(`${status} ${response.url()}`);
      });

      await page.goto(AUTH_URL);

      const form = page.locator('form, [role="form"]');
      await expect(form).toBeVisible({ timeout: 10000 });

      expect(failedResponses).toHaveLength(0);
    });
  });
});
