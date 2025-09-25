import { test } from '@playwright/test';

import { PAGES, screenSizes } from './constants';
import takeVisualSnapshot from './takeVisualSnapshot';

test.describe.parallel('Home Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[home] ${screen.name}`, async ({ page }) => {
      await takeVisualSnapshot(page, PAGES.HOME, screen);
    });
  }
});
