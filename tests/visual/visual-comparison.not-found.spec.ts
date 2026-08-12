import { test } from '@playwright/test';

import { notFoundScreens, PAGES } from './constants';
import takeVisualSnapshot from './take-visual-snapshot';

test.describe.parallel('Not-found Visual Tests', () => {
  for (const screen of notFoundScreens) {
    test(`[not-found] ${screen.name}`, async ({ page }) => {
      await takeVisualSnapshot(page, PAGES.NOT_FOUND, screen);
    });
  }
});
