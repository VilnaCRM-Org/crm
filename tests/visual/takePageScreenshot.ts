import { Page, expect } from '@playwright/test';

import { timeoutDuration, currentLanguage, ScreenSize } from './constants';

async function takeVisualSnapshot(page: Page, url: string, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await page.goto(url);

  await page.waitForLoadState('networkidle');
  await page.evaluateHandle('document.fonts.ready');
  await page.waitForTimeout(timeoutDuration);

  await expect(page).toHaveScreenshot(`${currentLanguage}_${screen.name}.png`, { fullPage: true });
}

export default takeVisualSnapshot;
