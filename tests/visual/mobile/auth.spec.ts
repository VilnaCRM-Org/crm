import { test } from '@playwright/test';

import { buildResetToken } from '@tests/builders';
import { t } from '@tests/e2e/utils/initialize-localization';
import { PAGES } from '@tests/visual/constants';

import takeMobileSnapshot from './take-mobile-snapshot';

test.describe.parallel('Mobile device visual tests', () => {
  test('[mobile] sign-in', async ({ page }) => {
    await takeMobileSnapshot(page, PAGES.SIGN_IN, 'sign-in');
  });

  test('[mobile] sign-up', async ({ page }) => {
    await takeMobileSnapshot(page, PAGES.SIGN_UP, 'sign-up');
  });

  test('[mobile] password-recovery', async ({ page }) => {
    await takeMobileSnapshot(page, PAGES.PASSWORD_RECOVERY, 'password-recovery');
  });

  test('[mobile] password-reset', async ({ page }) => {
    await takeMobileSnapshot(
      page,
      `${PAGES.PASSWORD_RESET}?token=${buildResetToken()}`,
      'password-reset',
      t('password_reset.new_password.label')
    );
  });
});
