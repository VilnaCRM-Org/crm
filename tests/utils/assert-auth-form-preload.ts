import { expect, type Locator, type Page } from '@playwright/test';

export interface AuthFormPreloadConfig {
  readonly formChunk: string;
  readonly pageChunk: string;
  readonly url: string;
}

export async function assertAuthFormPreload(
  page: Page,
  { formChunk, pageChunk, url }: AuthFormPreloadConfig
): Promise<Locator> {
  let releasePage!: () => void;
  const pageGate = new Promise<void>((resolve) => {
    releasePage = resolve;
  });
  let markPageHeld!: () => void;
  const pageHeld = new Promise<void>((resolve) => {
    markPageHeld = resolve;
  });
  const continuations: Promise<void>[] = [];

  await page.route(pageChunk, async (route) => {
    markPageHeld();
    const continuation = pageGate.then(() => route.continue());
    continuations.push(continuation);
    await continuation;
  });
  const formRequested = page.waitForRequest(`**/static/js/async/${formChunk}.*.js`);

  try {
    await page.goto(url, { waitUntil: 'commit' });
    await Promise.all([pageHeld, formRequested]);
    await expect(
      page.locator(`link[rel="preload"][as="script"][href*="/${formChunk}."]`)
    ).toHaveCount(1);
    await expect(page.locator(`script[src*="/${formChunk}."]`)).toHaveCount(0);
    await expect(page.locator('form')).not.toBeVisible();
  } finally {
    releasePage();
    await Promise.all(continuations);
    await page.unroute(pageChunk);
  }

  return page.locator('form');
}
