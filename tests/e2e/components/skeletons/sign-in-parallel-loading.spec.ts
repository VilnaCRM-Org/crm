import { test, expect } from '@tests/e2e/utils/fixtures';

test('requests the sign-in form while the page chunk is still pending', async ({ page }) => {
  const pageChunk = '**/static/js/async/sign-in.*.js';
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
  const formRequested = page.waitForRequest('**/static/js/async/sign-in-form-section.*.js');

  try {
    await page.goto('/sign-in', { waitUntil: 'commit' });
    await Promise.all([pageHeld, formRequested]);
    await expect(
      page.locator('link[rel="preload"][as="script"][href*="/sign-in-form-section."]')
    ).toHaveCount(1);
    await expect(page.locator('script[src*="/sign-in-form-section."]')).toHaveCount(0);
    await expect(page.locator('form')).not.toBeVisible();
  } finally {
    releasePage();
    await Promise.all(continuations);
    await page.unroute(pageChunk);
  }

  await expect(page.locator('form')).toBeVisible();
});
