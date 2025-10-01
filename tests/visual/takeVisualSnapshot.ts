import { Page, expect } from '@playwright/test';

import { currentLanguage, ScreenSize, timeoutDuration } from './constants';

const injectedPages = new WeakSet<Page>();

async function takeVisualSnapshot(
  page: Page,
  url: string,
  screen: ScreenSize,
  fileName?: string
): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });

  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      })
  );
  if (!injectedPages.has(page)) {
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
    injectedPages.add(page);
  }

  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(
    response && response.ok(),
    `Navigation failed: ${response?.status()} ${response?.statusText()} for ${url}`
  ).toBeTruthy();
  try {
    await page.waitForLoadState('networkidle', { timeout: timeoutDuration });
  } catch {
    //
  }

  await page.evaluate(async () => {
    if ('fonts' in document) {
      try {
        await document.fonts.ready;
      } catch {
        //
      }
    }
  });
  await page.waitForTimeout(timeoutDuration);

  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  const snapshotName = fileName ?? `${currentLanguage}_${screen.name}.png`;

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeoutDuration);

  await expect(page).toHaveScreenshot(snapshotName, {
    fullPage: true,
    animations: 'disabled',
    scale: 'css',
  });
}

export default takeVisualSnapshot;
