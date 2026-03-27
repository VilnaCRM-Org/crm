import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

import { currentLanguage, PAGES, ScreenSize, screenSizes } from './constants';

const AUTH_ASYNC_JS_GLOB = '**/static/js/async/*.js';
async function takeSkeletonSnapshot(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  let applied = false;
  let releaseDelayedChunk: (() => void) | undefined;
  let delayedChunkHandled: Promise<void> | undefined;
  const delayedChunkGate = new Promise<void>((resolve) => {
    releaseDelayedChunk = resolve;
  });
  await page.route(AUTH_ASYNC_JS_GLOB, async (route: Route): Promise<void> => {
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

  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  await page.goto(PAGES.AUTH, { waitUntil: 'commit' });

  const skeletonTitle = page.locator('#auth-skeleton-title');
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
    if (releaseDelayedChunk) {
      releaseDelayedChunk();
    }
    if (delayedChunkHandled) {
      await delayedChunkHandled;
    }
    await page.unroute(AUTH_ASYNC_JS_GLOB);
  }
}

test.describe.parallel('Auth Skeleton Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[auth-skeleton] ${screen.name}`, async ({ page }) => {
      await takeSkeletonSnapshot(page, screen);
    });
  }
});
