import { test, expect, type Locator, type Page } from '@playwright/test';

import fillInput from '../../../../../../../utils/fill-input';

import {
  REGISTRATION_URL,
  REGISTRATION_API_URL,
  successNotificationTitle,
  userData,
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

    await page.route(REGISTRATION_API_URL, successResponse);

    await signupButton.click();

    await expect(page.locator(`text=${successNotificationTitle}`)).toBeVisible();
  });

  test('should display error messages for invalid inputs', async ({ page }) => {
    await fillInitialsInput(page, userData);
    await fillEmailInput(page, userData);
    await fillPasswordInput(page, userData);

    await expect(page).toHaveURL(REGISTRATION_URL);
    await expect(page.locator(`text=${successNotificationTitle}`)).toBeHidden();
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

test.describe('Registration Form loader behaviour', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REGISTRATION_URL);
  });

  async function fillValidRegistration(page: Page): Promise<Locator> {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);
    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    return signupButton;
  }

  test('shows the in-button busy state and aria-busy while the request is in flight', async ({
    page,
  }) => {
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(REGISTRATION_API_URL, async (route) => {
      await inFlight;
      return successResponse(route);
    });

    const signupButton = await fillValidRegistration(page);
    await signupButton.click();

    await expect(signupButton).toBeDisabled();
    await expect(signupButton).toHaveClass(/MuiButton-loading/);
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');

    release();
  });

  test('does not submit a second time while the button is loading', async ({ page }) => {
    let postCount = 0;
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(REGISTRATION_API_URL, async (route) => {
      postCount += 1;
      await inFlight;
      return successResponse(route);
    });

    const signupButton = await fillValidRegistration(page);
    await signupButton.click();
    await expect(signupButton).toBeDisabled();
    await signupButton.click({ force: true });

    expect(postCount).toBe(1);
    release();
  });

  test('moves focus to a meaningful element (not body) after a registration failure', async ({
    page,
  }) => {
    await page.route(
      REGISTRATION_API_URL,
      serverErrorResponse(400, { message: 'EMAIL_ALREADY_EXISTS' })
    );

    const signupButton = await fillValidRegistration(page);
    await signupButton.click();

    await expect(page.locator('[role="alert"]')).toBeVisible();

    const focusOnMeaningfulElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active !== document.body && active !== null && !!active.querySelector('h4');
    });
    expect(focusOnMeaningfulElement).toBe(true);
  });
});
