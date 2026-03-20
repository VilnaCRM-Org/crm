import { test, expect } from '@playwright/test';

import fillInput from '../../../../../../../utils/fill-input';

import { REGISTRATION_URL, REGISTRATION_API_URL, userData, successNotificationTitle } from './constants/constants';
import { fillEmailInput, fillInitialsInput, fillPasswordInput } from './utils/fill-form';
import getFormFields from './utils/get-form-fields';
import { serverErrorResponse, successResponse } from './utils/responses';

test.describe('Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REGISTRATION_URL);
  });

  test('submits successfully with valid data', async ({ page }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);

    await page.route(REGISTRATION_API_URL, successResponse);

    await signupButton.click();

    await expect(page.locator(`text=${successNotificationTitle}`)).toBeVisible();
  });

  test('should display error messages for invalid inputs', async ({ page }) => {
    await fillInitialsInput(page, userData);
    await fillEmailInput(page, userData);
    await fillPasswordInput(page, userData);
  });

  test('displays server error on registration failure', async ({ page }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    await page.route(
      REGISTRATION_API_URL,
      serverErrorResponse(400, { message: 'EMAIL_ALREADY_EXISTS' })
    );

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    await signupButton.click();

    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
