import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

import { currentLanguage, PAGES, ScreenSize, screenSizes } from './constants';

const AUTH_ASYNC_JS_GLOB = '**/static/js/async/*.js';
async function takeSkeletonSnapshot(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  const pendingRoutes: Array<() => void> = [];
  const pendingContinuations: Promise<void>[] = [];
  let released = false;
  let shouldDelayRemainingChunks = false;
  let routeHandlingChain = Promise.resolve();

  await page.route(AUTH_ASYNC_JS_GLOB, async (route: Route): Promise<void> => {
    const handleRoute = async (): Promise<void> => {
      if (released) {
        await route.continue();
        return;
      }

      if (shouldDelayRemainingChunks) {
        let continueRoute!: () => void;
        const delayedChunkGate = new Promise<void>((resolve) => {
          continueRoute = resolve;
        });
        const continuation = (async (): Promise<void> => {
          await delayedChunkGate;
          await route.continue();
        })();

        pendingRoutes.push(continueRoute);
        pendingContinuations.push(continuation);
        await continuation;
        return;
      }

      await route.continue();

      try {
        await page.waitForSelector('#auth-skeleton-title', {
          state: 'visible',
          timeout: 1000,
        });
        shouldDelayRemainingChunks = true;
      } catch {
        // Keep releasing chunks until the skeleton is actually rendered.
      }
    };

    const currentRouteHandling = routeHandlingChain.then(handleRoute);
    routeHandlingChain = currentRouteHandling.catch(() => undefined);
    await currentRouteHandling;
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
    released = true;
    pendingRoutes.splice(0, pendingRoutes.length).forEach((releaseRoute) => releaseRoute());
    await Promise.all([...pendingContinuations.splice(0, pendingContinuations.length), routeHandlingChain]);
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
