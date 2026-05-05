import { test } from '@playwright/test';

import { seedPreloadedAuthToken } from '../utils/seed-preloaded-auth-token';

import { PAGES, screenSizes } from './constants';
import takeVisualSnapshot from './take-visual-snapshot';

test.describe.parallel('Home Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[home] ${screen.name}`, async ({ page }) => {
      await seedPreloadedAuthToken(page);
      await takeVisualSnapshot(page, PAGES.HOME, screen);
    });
  }
});
