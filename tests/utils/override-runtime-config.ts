import type { Page } from '@playwright/test';

import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import type { AppConfigValues } from '@/config/runtime/types/app-config';

type PageRouteTarget = Pick<Page, 'route'>;

const BLOCK_PATTERN = new RegExp(
  `(<script[^>]*\\bid="${APP_CONFIG_ELEMENT_ID}"[^>]*>)[\\s\\S]*?(</script>)`
);

/**
 * Serves the SAME production artifact with a different runtime configuration by rewriting the
 * inline app-config block in the document response — the browser-side twin of what
 * scripts/render-app-config.js does at container start (issue #145).
 *
 * This is what lets an e2e spec prove "one build, many configs" against a running production
 * container it cannot write files into.
 */
export async function overrideRuntimeConfig(
  page: PageRouteTarget,
  config: AppConfigValues
): Promise<void> {
  // Escaping `<` keeps a configured value from terminating the script block early.
  const json = JSON.stringify(config).replace(/</g, '\\u003c');

  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') {
      await route.continue();
      return;
    }

    const response = await route.fetch();
    const body = await response.text();

    if (!BLOCK_PATTERN.test(body)) {
      throw new Error(
        `The served document has no #${APP_CONFIG_ELEMENT_ID} block to override. ` +
          'The production HTML shell must ship one (public/index.html).'
      );
    }

    await route.fulfill({
      response,
      body: body.replace(BLOCK_PATTERN, (_match, open, close) => `${open}${json}${close}`),
    });
  });
}
