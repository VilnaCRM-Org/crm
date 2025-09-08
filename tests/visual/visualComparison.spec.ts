import { test, expect } from '@playwright/test';

import { screenSizes, timeoutDuration, currentLanguage } from './constants';

test.describe('Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`${screen.name} test`, async ({ page }) => {
      await page.goto('/');

      await page.waitForLoadState('networkidle');
      await page.evaluateHandle('document.fonts.ready');

      await page.waitForTimeout(timeoutDuration);

      await expect(page).toHaveScreenshot(`${currentLanguage}_${screen.name}.png`, {
        fullPage: true,
      });
    });
  }
});
