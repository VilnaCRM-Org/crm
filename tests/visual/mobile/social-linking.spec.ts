import { test } from '@playwright/test';

import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { stubSocialLinks } from '@tests/e2e/modules/user/features/settings/utils/social-links-page';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';
import { PAGES } from '@tests/visual/constants';

import { takeReadyMobileSnapshot } from './take-mobile-snapshot';

test.describe.parallel('Mobile device visual tests', () => {
  test('[mobile] linked social accounts', async ({ page }) => {
    await seedPreloadedAuthToken(page);
    await stubProfile(page);
    await stubSocialLinks(page, { linked: ['google', 'facebook', 'github', 'twitter'] });

    await takeReadyMobileSnapshot(
      page,
      PAGES.SETTINGS,
      'social-linking-linked',
      t('settings.social.unlink', { provider: 'Google' })
    );
  });
});
