import { test, expect, Page, Route } from '@playwright/test';

import {
  REGISTRATION_URL,
  REGISTRATION_API_URL,
  userData,
  successNotificationTitle,
  getFormFields,
  successResponse,
  serverErrorResponse,
} from '../e2e/modules/user/features/auth/components/form-section/auth-forms';
import fillInput from '../e2e/utils/fill-input';
import { t } from '../e2e/utils/initialize-localization';

import { currentLanguage, screenSizes } from './constants';
import getRegistrationNotificationSnapshotName from './get-registration-notification-snapshot-name';
import stabilizePage from './stabilize-page';

const successDescription: string = t('notifications.success.description');
const errorTitle: string = t('notifications.error.title');

type RegistrationReply = (route: Route) => Promise<void>;

async function submitRegistration(page: Page, reply: RegistrationReply): Promise<void> {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(REGISTRATION_API_URL, async (route) => {
    await released;
    await reply(route);
  });
  await stabilizePage(page, REGISTRATION_URL);

  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);
  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);
  await signupButton.click();
  await expect(signupButton).toBeDisabled();
  release();
}

test.describe.parallel('Registration Notification Visual Tests', () => {
  for (const screen of screenSizes) {
    test(`[notification-success] ${screen.name}`, async ({ page }) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

      await submitRegistration(page, successResponse);

      await expect(
        page.getByRole('heading', { level: 2, name: successNotificationTitle })
      ).toBeFocused();
      await expect(page.getByRole('status').filter({ hasText: successDescription })).toHaveText(
        successDescription
      );
      await page.waitForLoadState('networkidle');
      await page.mouse.move(0, 0);

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
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });

      await submitRegistration(page, serverErrorResponse(400, { message: 'EMAIL_ALREADY_EXISTS' }));

      await expect(page.getByRole('heading', { level: 2, name: errorTitle })).toBeFocused();
      await expect(page.getByRole('alert')).not.toBeEmpty();
      await page.waitForLoadState('networkidle');
      await page.mouse.move(0, 0);

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
