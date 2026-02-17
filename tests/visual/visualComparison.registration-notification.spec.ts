import { test } from '@playwright/test';

import { screenSizes } from './constants';
import takeNotificationSnapshot from './takeNotificationSnapshot';

test.describe.parallel('Registration Success Notification Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[reg-success] ${screen.name}`, async ({ page }) => {
      await takeNotificationSnapshot(page, 'success', screen);
    });
  }
});

test.describe.parallel('Registration Error Notification Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[reg-error] ${screen.name}`, async ({ page }) => {
      await takeNotificationSnapshot(page, 'error', screen);
    });
  }
});
