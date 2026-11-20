import { type Locator, Page, expect } from '@playwright/test';

import { bellOf } from '@tests/e2e/utils/app-shell';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import { PAGES, SHELL_BADGE_MIN_WIDTH, SEED_UNREAD, timeoutDuration } from './constants';
import waitForStableDom from './wait-for-stable-dom';

export interface StabilizeOptions {
  readonly unread?: number;
  readonly motion?: 'disabled' | 'allowed';
}

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

const shellBadgeOf = (page: Page): Locator => bellOf(page).getByText(/^\d+$/);

export async function waitForShellBell(page: Page, unread: number = SEED_UNREAD): Promise<void> {
  const width = page.viewportSize()?.width ?? 0;
  const badge = width >= SHELL_BADGE_MIN_WIDTH ? [String(unread)] : [];
  await expect(bellOf(page)).toBeEnabled();
  await expect(bellOf(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(shellBadgeOf(page)).toHaveText(badge);
}

async function waitForShellBellIfShown(page: Page, unread: number | undefined): Promise<void> {
  if ((await page.getByRole('banner').count()) === 0) return;

  await waitForShellBell(page, unread);
  await waitForStableDom(page);
}

async function stabilizePage(
  page: Page,
  url: string,
  options: StabilizeOptions = {}
): Promise<void> {
  if (options.motion !== 'allowed') {
    await disableAnimations(page);
  }

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
  await waitForStableDom(page);

  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

  await waitForNetworkIdle(page);
  await waitForStableDom(page);
  await waitForShellBellIfShown(page, options.unread);
}

export default stabilizePage;
