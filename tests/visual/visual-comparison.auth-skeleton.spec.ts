/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

import { seedPreloadedAuthToken } from '../utils/seed-preloaded-auth-token';

import { currentLanguage, PAGES, type ScreenSize, screenSizes } from './constants';

const AUTH_ASYNC_JS_GLOB = '**/static/js/**/*.js';
const JS_DELAY_MS = 3000;
const AUTH_ROUTE_SHELL_CHUNKS = 2;

function isLazyChunk(url: string): boolean {
  return /\/static\/js\/.*\.js$/.test(url) && !/\/static\/js\/(?:main|runtime)/.test(url);
}

async function takeSkeletonSnapshot(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  let lazyChunkCount = 0;
  let sharedAsyncDelay: Promise<void> | null = null;
  const delayAsyncChunksOnce = async (route: Route): Promise<void> => {
    if (isLazyChunk(route.request().url())) {
      lazyChunkCount += 1;

      if (lazyChunkCount > AUTH_ROUTE_SHELL_CHUNKS) {
        if (!sharedAsyncDelay) {
          sharedAsyncDelay = new Promise<void>((resolve) => {
            setTimeout(resolve, JS_DELAY_MS);
          });
        }
        await sharedAsyncDelay;
      }
    }

    await route.continue();
  };

  await seedPreloadedAuthToken(page);
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  await page.goto(PAGES.HOME, { waitUntil: 'networkidle' });
  await page.route(AUTH_ASYNC_JS_GLOB, delayAsyncChunksOnce);
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, PAGES.AUTH);

  await expect(page.locator('#auth-skeleton-title')).toBeVisible({ timeout: 5000 });
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

test.describe.parallel('Auth skeleton visual tests', () => {
  for (const screen of screenSizes) {
    test(`[auth-skeleton] ${screen.name}`, async ({ page }) => {
      await takeSkeletonSnapshot(page, screen);
    });
  }
});
