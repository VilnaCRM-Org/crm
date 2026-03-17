import type { Page } from '@playwright/test';

export const PRELOADED_AUTH_TOKEN = 'playwright-preloaded-auth-token';

type PageInitScriptTarget = Pick<Page, 'addInitScript'>;

export async function seedPreloadedAuthToken(
  page: PageInitScriptTarget,
  token: string = PRELOADED_AUTH_TOKEN
): Promise<void> {
  await page.addInitScript((preloadedAuthToken: string) => {
    (window as Window & { __PRELOADED_AUTH_TOKEN__?: string }).__PRELOADED_AUTH_TOKEN__ =
      preloadedAuthToken;
  }, token);
}
