import { type Page, test, expect } from '@playwright/test';

const AUTH_URL = '/authentication';
const AUTH_ASYNC_JS_GLOB = '**/static/js/async/*.js';

async function interceptAuthFormChunks(page: Page): Promise<() => Promise<void>> {
  let applied = false;
  let releaseDelayedChunk: (() => void) | null = null;
  let delayedChunkHandled: Promise<void> | null = null;
  const delayedChunkGate = new Promise<void>((resolve) => {
    releaseDelayedChunk = resolve;
  });

  await page.route(AUTH_ASYNC_JS_GLOB, async (route) => {
    if (!applied) {
      applied = true;
      delayedChunkHandled = (async (): Promise<void> => {
        await delayedChunkGate;
        await route.continue();
      })();
      await delayedChunkHandled;
      return;
    }
    await route.continue();
  });

  return async (): Promise<void> => {
    releaseDelayedChunk?.();
    await delayedChunkHandled;
  };
}

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
      const section = page.locator('section[aria-label="Loading authentication form"]');
      await expect(section).toBeVisible({ timeout: 5000 });
    });

    test('should transition from skeleton to authentication form', async ({ page }) => {
      await expect(page.locator('#auth-skeleton-divider')).toBeVisible({ timeout: 3000 });

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
      await expect(page.locator('#auth-skeleton-title')).toBeVisible({ timeout: 3000 });

      await releaseDelayedChunk?.();
      await page.unroute(AUTH_ASYNC_JS_GLOB);

      await expect(page.locator('form, [role="form"]')).toBeVisible({ timeout: 10000 });

      await expect(page.locator('#auth-skeleton-title')).not.toBeVisible();
      await expect(page.locator('#auth-skeleton-submit')).not.toBeVisible();
      await expect(page.locator('#auth-skeleton-divider')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should load authentication page without critical errors', async ({ page }) => {
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

      const form = page.locator('form, [role="form"]');
      await expect(form).toBeVisible({ timeout: 10000 });

      expect(criticalErrors).toHaveLength(0);
    });
  });
});
