import { test } from '@playwright/test';

import { PAGES, screenSizes } from './constants';
import takeVisualSnapshot from './take-visual-snapshot';

test.describe.parallel('Sign-in Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[sign-in] ${screen.name}`, async ({ page }) => {
      await takeVisualSnapshot(page, PAGES.SIGN_IN, screen);
    });
  }
});
