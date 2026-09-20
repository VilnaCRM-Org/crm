import type { Page, Route } from '@playwright/test';

export const AUTH_ASYNC_JS_GLOB = '**/static/js/async/sign-up-form-section.*.js';

/**
 * Intercepts async JS chunks for the auth skeleton test pattern.
 *
 * Holds the named form chunk independently of page-chunk request order.
 *
 * @returns An async function that, when called, releases all held chunks
 *          and awaits their completion.
 */
export async function interceptAuthFormChunks(page: Page): Promise<() => Promise<void>> {
  let releaseChunk!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseChunk = resolve;
  });
  const continuations: Promise<void>[] = [];

  await page.route(AUTH_ASYNC_JS_GLOB, async (route: Route): Promise<void> => {
    const continuation = gate.then(() => route.continue());
    continuations.push(continuation);
    await continuation;
  });

  return async (): Promise<void> => {
    releaseChunk();
    await Promise.all(continuations);
  };
}
