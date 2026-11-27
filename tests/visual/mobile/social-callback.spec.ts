import { test } from '@playwright/test';

import { arrangeSocialCallback, socialCallbackShots } from '@tests/visual/social-callback-states';

import takeMobileSnapshot from './take-mobile-snapshot';

test.describe.parallel('Mobile device social callback visual tests', () => {
  for (const shot of socialCallbackShots) {
    test(`[mobile] ${shot.name}`, async ({ page }) => {
      await arrangeSocialCallback(page, shot);

      await takeMobileSnapshot(page, shot.url, shot.name);
    });
  }
});
