/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

import fillInput from '../../../../../../../utils/fill-input';

import {
  REGISTRATION_URL,
  GRAPHQL_URL,
  userData,
  duplicateEmailServerError,
  registrationGenericError,
  notificationSuccessTitle,
  notificationSuccessButton,
  notificationSuccessConfettiAlt,
  notificationErrorTitle,
  notificationErrorButton,
  notificationErrorRetryButton,
  notificationErrorImageAlt,
} from './constants/constants';
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

    await page.route(GRAPHQL_URL, successResponse);

    await signupButton.click();

    await expect(page.getByText(notificationSuccessTitle)).toBeVisible();
    await expect(
      page.getByRole('img', { name: notificationSuccessConfettiAlt }).first()
    ).toBeVisible();
    await page.getByRole('link', { name: notificationSuccessButton }).click();
    await expect(page).toHaveURL('/');
  });

  test('should display error messages for invalid inputs', async ({ page }) => {
    await fillInitialsInput(page, userData);
    await fillEmailInput(page, userData);
    await fillPasswordInput(page, userData);
  });

  test('displays duplicate email error under email input', async ({ page }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    await page.route(
      GRAPHQL_URL,
      serverErrorResponse(409, { message: 'email: This email address is already registered' })
    );

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    await signupButton.click();

    await expect(
      page
        .locator('p.MuiFormHelperText-root.Mui-error', { hasText: duplicateEmailServerError })
        .first()
    ).toBeVisible();
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
    await expect(initialsInput).toHaveValue(userData.fullName);
    await expect(emailInput).toHaveValue(userData.email);
    await expect(passwordInput).toHaveValue(userData.password);
  });

  test('displays top-level form error for non-email server failures', async ({ page }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    await page.route(
      GRAPHQL_URL,
      serverErrorResponse(500, { message: 'something failed in backend' })
    );

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    await signupButton.click();

    await expect(page.getByText(notificationErrorTitle)).toBeVisible();
    await expect(page.getByRole('img', { name: notificationErrorImageAlt })).toBeVisible();
    await expect(page.getByText(registrationGenericError)).toBeVisible();
    await page.getByRole('button', { name: notificationErrorButton }).click();

    await expect(initialsInput).toHaveValue(userData.fullName);
    await expect(emailInput).toHaveValue(userData.email);
    await expect(passwordInput).toHaveValue(userData.password);
  });

  test('retries registration from error replacement and shows success replacement', async ({
    page,
  }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    let requestCount = 0;
    await page.route(GRAPHQL_URL, async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await serverErrorResponse(500, { message: 'temporary backend error' })(route);
        return;
      }
      await successResponse(route);
    });

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    await signupButton.click();

    await expect(page.getByText(notificationErrorTitle)).toBeVisible();
    await page.getByRole('button', { name: notificationErrorRetryButton }).click();
    await expect(page.getByText(notificationSuccessTitle)).toBeVisible();
  });

  test('shows loader in try again button while retry request is in flight', async ({ page }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    let requestCount = 0;
    await page.route(GRAPHQL_URL, async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await serverErrorResponse(500, { message: 'temporary backend error' })(route);
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 800);
      });
      await successResponse(route);
    });

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    await signupButton.click();

    await expect(page.getByText(notificationErrorTitle)).toBeVisible();

    const retryButton = page.getByRole('button', { name: notificationErrorRetryButton });
    await retryButton.click();

    const errorNotification = page.getByRole('alert');
    await expect(retryButton).toBeDisabled();
    await expect(errorNotification.getByRole('progressbar')).toBeVisible();
    await expect(page.getByText(notificationSuccessTitle)).toBeVisible();
  });

  test('navigates home after successful retry from error replacement', async ({ page }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    let requestCount = 0;
    await page.route(GRAPHQL_URL, async (route) => {
      requestCount += 1;
      if (requestCount === 1) {
        await serverErrorResponse(500, { message: 'temporary backend error' })(route);
        return;
      }
      await successResponse(route);
    });

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    await signupButton.click();

    await expect(page.getByText(notificationErrorTitle)).toBeVisible();
    await page.getByRole('button', { name: notificationErrorRetryButton }).click();
    await expect(page.getByText(notificationSuccessTitle)).toBeVisible();
    await page.getByRole('link', { name: notificationSuccessButton }).click();
    await expect(page).toHaveURL('/');
  });
});
