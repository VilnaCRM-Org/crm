import { test } from '@playwright/test';

import {
  signInWithFlag,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { t } from '@tests/e2e/utils/initialize-localization';
import { PAGES } from '@tests/visual/constants';

import takeMobileSnapshot from './take-mobile-snapshot';

test.describe.parallel('Mobile device visual tests', () => {
  test('[mobile] settings', async ({ page }) => {
    await signInWithFlag(page, true);
    await stubProfile(page);

    await takeMobileSnapshot(page, PAGES.SETTINGS, 'settings', t('sign_up.form.name_input.label'));
  });
});
