import { test, expect } from '@playwright/test';

import { screenSizes, timeoutDuration } from './constants';

const currentLanguage: string = process.env.REACT_APP_MAIN_LANGUAGE as string;

test.describe('Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`${screen.name} test`, async ({ page }) => {
      await page.goto('/');

      await page.waitForLoadState('networkidle');
      await page.evaluateHandle('document.fonts.ready');

      await page.waitForTimeout(timeoutDuration);

      const scrollHeight: number = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width: screen.width, height: scrollHeight });

      await page.waitForTimeout(timeoutDuration);

      await page.setViewportSize({ width: screen.width, height: screen.height });

      await page.waitForTimeout(timeoutDuration);

      await expect(page).toHaveScreenshot(`${currentLanguage}_${screen.name}.png`, {
        fullPage: true,
      });
    });
  }
});
