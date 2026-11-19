import { test } from '@playwright/test';

import { currentLanguage } from './constants';
import {
  arrangeSocialCallback,
  socialCallbackScreens,
  socialCallbackShots,
} from './social-callback-states';
import takeVisualSnapshot from './take-visual-snapshot';

test.describe.parallel('Social callback Visual Tests', () => {
  for (const shot of socialCallbackShots) {
    for (const screen of socialCallbackScreens) {
      test(`[social-callback] ${shot.name} ${screen.name}`, async ({ page }) => {
        await arrangeSocialCallback(page, shot);

        await takeVisualSnapshot(
          page,
          shot.url,
          screen,
          `${currentLanguage}_${shot.name}-${screen.name}.png`
        );
      });
    }
  }
});
