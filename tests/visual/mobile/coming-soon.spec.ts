import { expect, test } from '@playwright/test';

import {
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { t } from '@tests/e2e/utils/initialize-localization';
import { COMING_SOON_SECTIONS } from '@tests/visual/coming-soon-sections';
import stabilizePage from '@tests/visual/stabilize-page';

import { MOBILE_SNAPSHOT_OPTIONS, mobileSnapshotName } from './take-mobile-snapshot';

test.describe.parallel('Mobile device coming-soon visual tests (issue #362)', () => {
  for (const section of COMING_SOON_SECTIONS) {
    test(`[mobile] coming-soon ${section.name}`, async ({ page }) => {
      await signInWithFlag(page, true);
      await stubProfile(page);
      await stabilizePage(page, section.path);
      await expect(
        page.getByRole('heading', { level: 1, name: t(section.headingKey) })
      ).toBeVisible();

      await expect(page).toHaveScreenshot(
        mobileSnapshotName(`coming-soon-${section.name}`),
        MOBILE_SNAPSHOT_OPTIONS
      );
    });
  }
});
