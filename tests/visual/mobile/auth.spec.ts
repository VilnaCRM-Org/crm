import { test } from '@playwright/test';

import { PAGES } from '../constants';

import takeMobileSnapshot from './take-mobile-snapshot';

test.describe.parallel('Mobile device visual tests', () => {
  test('[mobile] sign-in', async ({ page }) => {
    await takeMobileSnapshot(page, PAGES.SIGN_IN, 'sign-in');
  });

  test('[mobile] sign-up', async ({ page }) => {
    await takeMobileSnapshot(page, PAGES.SIGN_UP, 'sign-up');
  });
});
