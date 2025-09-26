import { Page, expect } from '@playwright/test';

import { currentLanguage, ScreenSize, timeoutDuration } from './constants';

async function takeVisualSnapshot(page: Page, url: string, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }`;
    document.head.appendChild(style);
  });
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: timeoutDuration }).catch(() => {});

  if (await page.evaluate(() => 'fonts' in document)) {
    await page.evaluate(() => document.fonts.ready).catch(() => {});
  }

  await expect(page).toHaveScreenshot(`${currentLanguage}_${screen.name}.png`, {
    fullPage: true,
    animations: 'disabled',
  });
}

export default takeVisualSnapshot;
