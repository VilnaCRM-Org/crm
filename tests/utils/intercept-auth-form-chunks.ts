import type { Page, Route } from '@playwright/test';

export const AUTH_ASYNC_JS_GLOB = '**/static/js/async/*.js';

/**
 * Intercepts async JS chunks for the auth skeleton test pattern.
 *
 * Allows the first chunk through (so the skeleton can render), then holds
 * subsequent chunks until the returned release function is called.
 *
 * @returns An async function that, when called, releases all held chunks
 *          and awaits their completion.
 */
export async function interceptAuthFormChunks(page: Page): Promise<() => Promise<void>> {
  const pendingRoutes: Array<() => void> = [];
  const pendingContinuations: Promise<void>[] = [];
  let released = false;
  let shouldDelayRemainingChunks = false;
  let routeHandlingChain = Promise.resolve();

  await page.route(AUTH_ASYNC_JS_GLOB, async (route: Route): Promise<void> => {
    const handleRoute = async (): Promise<void> => {
      if (released) {
        await route.continue();
        return;
      }

      if (shouldDelayRemainingChunks) {
        let continueRoute!: () => void;
        const delayedChunkGate = new Promise<void>((resolve) => {
          continueRoute = resolve;
        });
        const continuation = (async (): Promise<void> => {
          await delayedChunkGate;
          await route.continue();
        })();

        pendingRoutes.push(continueRoute);
        pendingContinuations.push(continuation);
        await continuation;
        return;
      }

      await route.continue();

      try {
        await page.waitForSelector('#auth-skeleton-title', {
          state: 'visible',
          timeout: 1000,
        });
        shouldDelayRemainingChunks = true;
      } catch {
        // Keep releasing chunks until the skeleton is actually rendered.
      }
    };

    const currentRouteHandling = routeHandlingChain.then(handleRoute);
    routeHandlingChain = currentRouteHandling.catch(() => undefined);
    await currentRouteHandling;
  });

  return async (): Promise<void> => {
    released = true;
    const routesToRelease = pendingRoutes.splice(0, pendingRoutes.length);
    const continuationsToAwait = pendingContinuations.splice(0, pendingContinuations.length);

    routesToRelease.forEach((releaseRoute) => releaseRoute());
    await Promise.all([...continuationsToAwait, routeHandlingChain]);
  };
}
