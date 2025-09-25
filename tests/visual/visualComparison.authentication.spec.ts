import { test } from '@playwright/test';

import { PAGES, screenSizes } from './constants';
import takeVisualSnapshot from './takeVisualSnapshot';

test.describe.parallel('Auth Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[auth] ${screen.name}`, async ({ page }) => {
      await takeVisualSnapshot(page, PAGES.AUTH, screen);
    });
  }
});
