import { test } from '@playwright/test';

import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';
import { PAGES } from '@tests/visual/constants';

import { takeReadyMobileSnapshot } from './take-mobile-snapshot';

test.describe.parallel('Mobile device visual tests', () => {
  test('[mobile] settings', async ({ page }) => {
    await seedPreloadedAuthToken(page);
    await stubProfile(page);

    await takeReadyMobileSnapshot(
      page,
      PAGES.SETTINGS,
      'settings',
      t('settings.profile.full_name')
    );
  });
});
