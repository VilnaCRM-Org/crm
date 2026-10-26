import { test } from '@playwright/test';

import {
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { COMING_SOON_SECTIONS } from '@tests/visual/coming-soon-sections';

import takeMobileSnapshot from './take-mobile-snapshot';

test.describe.parallel('Mobile device coming-soon visual tests (issue #362)', () => {
  for (const section of COMING_SOON_SECTIONS) {
    test(`[mobile] coming-soon ${section.name}`, async ({ page }) => {
      await signInWithFlag(page, true);
      await stubProfile(page);

      await takeMobileSnapshot(page, section.path, `coming-soon-${section.name}`);
    });
  }
});
