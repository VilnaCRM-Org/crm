import { Page, expect } from '@playwright/test';

import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import { PAGES, timeoutDuration } from './constants';

const injectedPages = new WeakSet<Page>();

async function disableAnimations(page: Page): Promise<void> {
  if (injectedPages.has(page)) return;

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

async function waitForNetworkIdle(page: Page): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: timeoutDuration });
  } catch {
    //
  }
}

async function stabilizePage(page: Page, url: string): Promise<void> {
  await disableAnimations(page);

  if (url === PAGES.HOME) {
    await seedPreloadedAuthToken(page);
  }

  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(
    response && response.ok(),
    `Navigation failed: ${response?.status()} ${response?.statusText()} for ${url}`
  ).toBeTruthy();
  await waitForNetworkIdle(page);

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

  await waitForNetworkIdle(page);
  await page.waitForTimeout(timeoutDuration);
}

export default stabilizePage;
