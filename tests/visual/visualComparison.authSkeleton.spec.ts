import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

import { currentLanguage, PAGES, ScreenSize, screenSizes } from './constants';

const AUTH_ASYNC_JS_GLOB = '**/static/js/**/*.js';
const JS_DELAY_MS = 3000;

async function takeSkeletonSnapshot(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  let sharedAsyncDelay: Promise<void> | null = null;
  const delayAsyncChunksOnce = async (route: Route): Promise<void> => {
    if (!sharedAsyncDelay) {
      sharedAsyncDelay = new Promise<void>((resolve) => {
        setTimeout(resolve, JS_DELAY_MS);
      });
    }
    await sharedAsyncDelay;
    await route.continue();
  };
  await page.route(AUTH_ASYNC_JS_GLOB, delayAsyncChunksOnce);

  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  await page.goto(PAGES.AUTH, { waitUntil: 'domcontentloaded' });

  const skeletonTitle = page.locator('[data-testid="auth-skeleton-title"]');
  await expect(skeletonTitle).toBeVisible({ timeout: 5000 });

  await page.waitForTimeout(300);

  const snapshotName = `${currentLanguage}_${screen.name}.png`;

  try {
    await expect(page).toHaveScreenshot(snapshotName, {
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
      timeout: 10000,
    });
  } finally {
    await page.unroute(AUTH_ASYNC_JS_GLOB, delayAsyncChunksOnce);
  }
}

test.describe.parallel('Auth Skeleton Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[auth-skeleton] ${screen.name}`, async ({ page }) => {
      await takeSkeletonSnapshot(page, screen);
    });
  }
});
