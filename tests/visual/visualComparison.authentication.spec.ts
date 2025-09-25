import { test } from '@playwright/test';

import { PAGES, screenSizes } from './constants';
import takeVisualSnapshot from './takePageScreenshot';

test.describe('Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`${screen.name} test`, async ({ page }) => {
      await takeVisualSnapshot(page, PAGES.AUTH, screen);
    });
  }
});
