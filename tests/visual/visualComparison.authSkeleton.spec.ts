import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';

import { currentLanguage, PAGES, ScreenSize, screenSizes } from './constants';

async function takeSkeletonSnapshot(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  let jsDelayApplied = false;
  await page.route('**/static/js/**/*.js', async (route: Route) => {
    if (!jsDelayApplied) {
      jsDelayApplied = true;
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 3000);
      });
    }
    await route.continue();
  });

  await page.goto(PAGES.AUTH, { waitUntil: 'domcontentloaded' });

  const divider = page.locator('[role="presentation"]');
  await expect(divider).toBeVisible({ timeout: 5000 });

  await page.waitForTimeout(300);

  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  const snapshotName = `${currentLanguage}_${screen.name}.png`;

  try {
    await expect(page).toHaveScreenshot(snapshotName, {
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
      timeout: 10000,
    });
  } finally {
    await page.unroute('**/static/js/**/*.js');
  }
}

test.describe.parallel('Auth Skeleton Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[auth-skeleton] ${screen.name}`, async ({ page }) => {
      await takeSkeletonSnapshot(page, screen);
    });
  }
});
