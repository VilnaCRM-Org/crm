import { test, expect } from '@tests/e2e/utils/fixtures';

test('requests the sign-up form while the page chunk is still pending', async ({ page }) => {
  const pageChunk = '**/static/js/async/sign-up.*.js';
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
  const formRequested = page.waitForRequest('**/static/js/async/sign-up-form-section.*.js');

  try {
    await page.goto('/sign-up', { waitUntil: 'commit' });
    await Promise.all([pageHeld, formRequested]);
    await expect(
      page.locator('link[rel="preload"][as="script"][href*="/sign-up-form-section."]')
    ).toHaveCount(1);
    await expect(page.locator('script[src*="/sign-up-form-section."]')).toHaveCount(0);
    await expect(page.locator('form')).not.toBeVisible();
  } finally {
    releasePage();
    await Promise.all(continuations);
    await page.unroute(pageChunk);
  }

  await expect(page.locator('form')).toBeVisible();
});
