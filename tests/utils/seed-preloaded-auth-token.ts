import type { Page } from '@playwright/test';

export const PRELOADED_AUTH_TOKEN = 'playwright-preloaded-auth-token';
export const preloadedAuthTokenEnvVar = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN' as const;
// Held in lockstep with src/config/env/preloaded-auth-token.ts by that module's unit test,
// which seeds this exact key on `window` and asserts the seam reads it back.
export const PRELOADED_AUTH_TOKEN_WINDOW_KEY = '__PRELOADED_AUTH_TOKEN__' as const;

type PageRouteTarget = Pick<Page, 'route'>;

export async function seedPreloadedAuthToken(
  page: PageRouteTarget,
  token: string = process.env[preloadedAuthTokenEnvVar]?.trim() || PRELOADED_AUTH_TOKEN
): Promise<void> {
  const escapeForInlineScript = (json: string): string =>
    json.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  const keyJson = escapeForInlineScript(JSON.stringify(PRELOADED_AUTH_TOKEN_WINDOW_KEY));
  const tokenJson = escapeForInlineScript(JSON.stringify(token));
  const inlineScript = `<script>window[${keyJson}]=${tokenJson};</script>`;

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
