import { expect, test } from '@playwright/test';

import { sectionOf } from '@tests/e2e/modules/user/features/settings/utils/two-factor-page';
import { codeCellsOf } from '@tests/e2e/utils/reach-challenge';
import { openChallenge, openTwoFactorSettings } from '@tests/visual/open-two-factor';
import waitForStableDom from '@tests/visual/wait-for-stable-dom';

import { MOBILE_SNAPSHOT_OPTIONS, mobileSnapshotName } from './take-mobile-snapshot';

test.describe.parallel('Mobile device two-factor visual tests', () => {
  test('[mobile] two-factor challenge', async ({ page }) => {
    await openChallenge(page);
    await expect(codeCellsOf(page)).toHaveCount(6);
    await waitForStableDom(page);

    await expect(page).toHaveScreenshot(
      mobileSnapshotName('two-factor-challenge'),
      MOBILE_SNAPSHOT_OPTIONS
    );
  });

  test('[mobile] two-factor settings off', async ({ page }) => {
    await openTwoFactorSettings(page);
    await expect(sectionOf(page)).toBeVisible();
    await waitForStableDom(page);

    await expect(page).toHaveScreenshot(
      mobileSnapshotName('two-factor-settings-off'),
      MOBILE_SNAPSHOT_OPTIONS
    );
  });
});
