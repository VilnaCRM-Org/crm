import type { Page } from '@playwright/test';

export const PRELOADED_AUTH_TOKEN = 'playwright-preloaded-auth-token';

type PageRouteTarget = Pick<Page, 'route'>;

export async function seedPreloadedAuthToken(
  page: PageRouteTarget,
  token: string = PRELOADED_AUTH_TOKEN
): Promise<void> {
  const inlineScript = `<script>window["__PRELOADED_AUTH_TOKEN__"]=${JSON.stringify(token)};</script>`;
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'document') {
      const response = await route.fetch();
      const body = await response.text();
      await route.fulfill({ response, body: body.replace('<head>', `<head>${inlineScript}`) });
    } else {
      await route.continue();
    }
  });
}
