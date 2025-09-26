import { Page, expect } from '@playwright/test';

import { currentLanguage, ScreenSize, timeoutDuration } from './constants';

async function takeVisualSnapshot(
  page: Page,
  url: string,
  screen: ScreenSize,
  fileName?: string
): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  await page.addInitScript(() => {
    if (document.getElementById('__pw-disable-animations')) return;
    const style = document.createElement('style');
    style.id = '__pw-disable-animations';
    style.textContent = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }`;
    document.head.appendChild(style);
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  try {
    await page.waitForLoadState('networkidle', { timeout: timeoutDuration });
  } catch {
    //
  }

  if (await page.evaluate(() => 'fonts' in document)) {
    await page.evaluate(() => document.fonts.ready).catch(() => {});
  }
  const snapshotName = fileName ?? `${currentLanguage}_${screen.name}.png`;

  await expect(page).toHaveScreenshot(snapshotName, {
    fullPage: true,
    animations: 'disabled',
  });
}

export default takeVisualSnapshot;
