import { test } from '@playwright/test';

import { PAGES, screenSizes } from './constants';
import takeVisualSnapshot from './take-visual-snapshot';

test.describe.parallel('Sign-up Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[sign-up] ${screen.name}`, async ({ page }) => {
      await takeVisualSnapshot(page, PAGES.SIGN_UP, screen);
    });
  }
});
