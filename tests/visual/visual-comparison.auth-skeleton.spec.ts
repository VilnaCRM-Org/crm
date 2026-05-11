import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { interceptAuthFormChunks, AUTH_ASYNC_JS_GLOB } from '../utils/intercept-auth-form-chunks';

import { currentLanguage, PAGES, ScreenSize, screenSizes } from './constants';

async function takeSkeletonSnapshot(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  const release = await interceptAuthFormChunks(page);

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
    await release();
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
