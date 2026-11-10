import { test } from '@playwright/test';

import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import { PAGES, screenSizes } from './constants';
import takeVisualSnapshot from './take-visual-snapshot';

test.describe.parallel('Home Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[home] ${screen.name}`, async ({ page }) => {
      await seedPreloadedAuthToken(page);
      await stubProfile(page);
      await takeVisualSnapshot(page, PAGES.HOME, screen);
    });
  }
});
