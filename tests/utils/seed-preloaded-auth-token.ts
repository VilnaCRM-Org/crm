import type { Page } from '@playwright/test';

import { preloadedAuthTokenKey } from '@/stores/preloaded-auth-token';

export const PRELOADED_AUTH_TOKEN = 'playwright-preloaded-auth-token';
export const preloadedAuthTokenEnvVar = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN' as const;

type PageRouteTarget = Pick<Page, 'route'>;

export async function seedPreloadedAuthToken(
  page: PageRouteTarget,
  token: string = process.env[preloadedAuthTokenEnvVar]?.trim() || PRELOADED_AUTH_TOKEN
): Promise<void> {
  const inlineScript = `<script>window[${JSON.stringify(preloadedAuthTokenKey)}]=${JSON.stringify(token)};</script>`;

  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'document') {
      const response = await route.fetch();
      const body = await response.text();
      let updatedBody;

      if (body.includes('<head>')) {
        updatedBody = body.replace('<head>', `<head>${inlineScript}`);
      } else if (body.includes('</body>')) {
        updatedBody = body.replace('</body>', `${inlineScript}</body>`);
      } else if (body.includes('<html>')) {
        updatedBody = body.replace('<html>', `<html>${inlineScript}`);
      } else {
        updatedBody = `${inlineScript}${body}`;
      }

      await route.fulfill({
        response,
        body: updatedBody,
      });
      return;
    }

    await route.continue();
  });
}
