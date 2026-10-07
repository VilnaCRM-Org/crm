import { copyFileSync } from 'fs';
import { join } from 'path';

import type { RsbuildPlugin } from '@rsbuild/core';

export const SPA_SHELL_DOCUMENT = 'index.html';
export const SPA_FALLBACK_DOCUMENT = '404.html';

/**
 * Emits `404.html` as a byte copy of the built `index.html` (issue #309). A static host whose
 * error document is `404.html` — the S3 website a sandbox is synced to — then answers every deep
 * link with the SPA shell instead of its own error page, and the router renders the route. Only
 * the sandbox build registers it: a production build must not emit the file.
 */
export const pluginSpaFallbackDocument = (): RsbuildPlugin => ({
  name: 'crm:spa-fallback-document',
  setup(api) {
    api.onAfterBuild(() => {
      const { distPath } = api.context;
      copyFileSync(join(distPath, SPA_SHELL_DOCUMENT), join(distPath, SPA_FALLBACK_DOCUMENT));
    });
  },
});
