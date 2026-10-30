import { test } from '@playwright/test';

import {
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';

import { PAGES, screenSizes } from './constants';
import takeVisualSnapshot from './take-visual-snapshot';

test.describe.parallel('Home Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[home] ${screen.name}`, async ({ page }) => {
      await signInWithFlag(page, true);
      await stubProfile(page);
      await takeVisualSnapshot(page, PAGES.HOME, screen);
    });
  }
});
