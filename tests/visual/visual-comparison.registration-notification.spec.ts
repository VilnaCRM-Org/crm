import { test, expect } from '@playwright/test';

import {
  REGISTRATION_URL,
  REGISTRATION_API_URL,
  userData,
  successNotificationTitle,
} from '../e2e/modules/User/features/Auth/components/FormSection/AuthForms/constants/constants';
import {
  successResponse,
  serverErrorResponse,
} from '../e2e/modules/User/features/Auth/components/FormSection/AuthForms/utils/responses';
import getFormFields from '../e2e/modules/User/features/Auth/components/FormSection/AuthForms/utils/getFormFields';
import fillInput from '../e2e/utils/fillInput';
import { currentLanguage, screenSizes } from './constants';
import getRegistrationNotificationSnapshotName from './getRegistrationNotificationSnapshotName';

async function disableAnimations(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    if (document.getElementById('__pw-disable-animations')) return;
    const style = document.createElement('style');
    style.id = '__pw-disable-animations';
    style.textContent = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }`;
    document.head.appendChild(style);
  });
}

test.describe.parallel('Registration Notification Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[notification-success] ${screen.name}`, async ({ page }) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await disableAnimations(page);
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

      await page.route(REGISTRATION_API_URL, successResponse);
      await page.goto(REGISTRATION_URL, { waitUntil: 'domcontentloaded' });

      const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);
      await fillInput(initialsInput, userData.fullName);
      await fillInput(emailInput, userData.email);
      await fillInput(passwordInput, userData.password);
      await signupButton.click();

      await expect(page.locator(`text=${successNotificationTitle}`)).toBeVisible();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(
        getRegistrationNotificationSnapshotName(currentLanguage, screen.name, 'success'),
        {
          fullPage: true,
          animations: 'disabled',
          scale: 'css',
        }
      );
    });

    test(`[notification-error] ${screen.name}`, async ({ page }) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await disableAnimations(page);
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

      await page.route(
        REGISTRATION_API_URL,
        serverErrorResponse(400, { message: 'EMAIL_ALREADY_EXISTS' })
      );
      await page.goto(REGISTRATION_URL, { waitUntil: 'domcontentloaded' });

      const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);
      await fillInput(initialsInput, userData.fullName);
      await fillInput(emailInput, userData.email);
      await fillInput(passwordInput, userData.password);
      await signupButton.click();

      await expect(page.locator('[role="alert"]')).toBeVisible();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(
        getRegistrationNotificationSnapshotName(currentLanguage, screen.name, 'error'),
        {
          fullPage: true,
          animations: 'disabled',
          scale: 'css',
        }
      );
    });
  }
});
