import { test } from '@playwright/test';

import { PAGES } from '@tests/visual/constants';

import takeMobileSnapshot from './take-mobile-snapshot';

const errorPages = [
  { url: PAGES.NOT_FOUND, name: 'not-found' },
  { url: PAGES.FORBIDDEN, name: 'forbidden' },
  { url: PAGES.SERVER_ERROR, name: 'server-error' },
] as const;

test.describe.parallel('Mobile device error-page visual tests', () => {
  for (const { url, name } of errorPages) {
    test(`[mobile] ${name}`, async ({ page }) => {
      await takeMobileSnapshot(page, url, name);
    });
  }
});
