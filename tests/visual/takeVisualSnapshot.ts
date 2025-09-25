import { Page, expect } from '@playwright/test';

import { currentLanguage, ScreenSize } from './constants';

async function takeVisualSnapshot(page: Page, url: string, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await page.goto(url);

  await page.waitForLoadState('networkidle');
  await page.evaluate((): Promise<void> => {
    const { fonts } = document as Document;
    return fonts ? fonts.ready.then(() => {}) : Promise.resolve();
  });

  await page.addStyleTag({
    content: `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    caret-color: transparent !important;
  }`,
  });

  await expect(page).toHaveScreenshot(`${currentLanguage}_${screen.name}.png`, { fullPage: true });
}

export default takeVisualSnapshot;
