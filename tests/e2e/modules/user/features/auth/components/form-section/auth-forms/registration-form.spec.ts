/* eslint-disable testing-library/prefer-screen-queries */
import { test, Locator, Route, Response, expect } from '@playwright/test';

import fillInput from '../../../../../../../utils/fill-input';
import { t } from '../../../../../../../utils/initialize-localization';

import {
  REGISTRATION_URL,
  GRAPHQL_URL,
  userData,
  duplicateEmailServerError,
  notificationSuccessTitle,
  notificationSuccessButton,
  notificationSuccessConfettiAlt,
  notificationErrorTitle,
  notificationErrorButton,
  notificationErrorRetryButton,
  notificationErrorImageAlt,
  notificationSomethingWentWrong,
  serverPasswordNoNumbersError,
  serverInitialsOnlySpacesError,
} from './constants/constants';
import { fillEmailInput, fillInitialsInput, fillPasswordInput } from './utils/fill-form';
import getFormFields from './utils/get-form-fields';
import {
  graphqlErrorResponse,
  networkAbortResponse,
  responseErrorFilter,
  serverErrorResponse,
  successResponse,
} from './utils/responses';

const errorTitleText: string = t('notifications.error.title');
const successTitleText: string = t('notifications.success.title');
const backToFormButton: string = t('notifications.error.button');
const retryButtonText: string = t('notifications.error.retry_button');

const networkErrorText: string = t('failure_responses.network_errors.network_error');
const serverErrorText: string = t('failure_responses.server_errors.server_error');
const unauthorizedErrorText: string = t(
  'failure_responses.authentication_errors.unauthorized_access'
);
const accessDeniedErrorText: string = t('failure_responses.authentication_errors.access_denied');
const somethingWentWrongText: string = t('failure_responses.client_errors.something_went_wrong');

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
    await page.getByRole('button', { name: notificationSuccessButton }).click();
    await expect(initialsInput).toBeVisible();
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
    await expect(page.getByText(notificationSomethingWentWrong)).toBeVisible();
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
    await page.getByRole('button', { name: notificationSuccessButton }).click();
    await expect(initialsInput).toBeVisible();
  });

  test('displays password error under password input from server', async ({ page }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    await page.route(
      GRAPHQL_URL,
      serverErrorResponse(400, { message: 'password: Password must contain at least one number' })
    );

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    await signupButton.click();

    await expect(
      page
        .locator('p.MuiFormHelperText-root.Mui-error', { hasText: serverPasswordNoNumbersError })
        .first()
    ).toBeVisible();
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });

  test('displays initials error under name input from server', async ({ page }) => {
    const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

    await page.route(
      GRAPHQL_URL,
      serverErrorResponse(400, { message: 'initials: Initials cannot consist only of spaces' })
    );

    await fillInput(initialsInput, userData.fullName);
    await fillInput(emailInput, userData.email);
    await fillInput(passwordInput, userData.password);
    await signupButton.click();

    await expect(
      page
        .locator('p.MuiFormHelperText-root.Mui-error', { hasText: serverInitialsOnlySpacesError })
        .first()
    ).toBeVisible();
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });
});

test('Submit form with INTERNAL_SERVER_ERROR, verify server error notification, and return to filled form', async ({
  page,
}) => {
  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

  await page.goto(REGISTRATION_URL);

  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);

  await page.route(GRAPHQL_URL, graphqlErrorResponse('INTERNAL_SERVER_ERROR', 'Server crashed'));
  const responsePromise: Promise<Response> = page.waitForResponse(responseErrorFilter);

  await signupButton.click();
  await responsePromise;

  const errorTitle: Locator = page.getByText(errorTitleText);
  await expect(errorTitle).toBeVisible();
  await expect(page.getByText(serverErrorText)).toBeVisible();

  const backButton: Locator = page.getByRole('button', { name: backToFormButton });
  await expect(backButton).toBeEnabled();
  await backButton.click();

  await expect(initialsInput).toHaveValue(userData.fullName);
  await expect(emailInput).toHaveValue(userData.email);
  await expect(passwordInput).toHaveValue(userData.password);
});

test('Submit form with SERVER_ERROR, verify server error notification, and return to filled form', async ({
  page,
}) => {
  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

  await page.goto(REGISTRATION_URL);

  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);

  await page.route(GRAPHQL_URL, graphqlErrorResponse('SERVER_ERROR', 'Internal error'));
  const responsePromise: Promise<Response> = page.waitForResponse(responseErrorFilter);

  await signupButton.click();
  await responsePromise;

  const errorTitle: Locator = page.getByText(errorTitleText);
  await expect(errorTitle).toBeVisible();
  await expect(page.getByText(serverErrorText)).toBeVisible();

  const backButton: Locator = page.getByRole('button', { name: backToFormButton });
  await expect(backButton).toBeEnabled();
  await backButton.click();

  await expect(initialsInput).toHaveValue(userData.fullName);
  await expect(emailInput).toHaveValue(userData.email);
  await expect(passwordInput).toHaveValue(userData.password);
});

test('Submit form with UNAUTHORIZED, verify unauthorized notification, and return to filled form', async ({
  page,
}) => {
  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

  await page.goto(REGISTRATION_URL);

  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);

  await page.route(GRAPHQL_URL, graphqlErrorResponse('UNAUTHORIZED', 'Not authorized'));
  const responsePromise: Promise<Response> = page.waitForResponse(responseErrorFilter);

  await signupButton.click();
  await responsePromise;

  const errorTitle: Locator = page.getByText(errorTitleText);
  await expect(errorTitle).toBeVisible();
  await expect(page.getByText(unauthorizedErrorText)).toBeVisible();

  const backButton: Locator = page.getByRole('button', { name: backToFormButton });
  await expect(backButton).toBeEnabled();
  await backButton.click();

  await expect(initialsInput).toHaveValue(userData.fullName);
  await expect(emailInput).toHaveValue(userData.email);
  await expect(passwordInput).toHaveValue(userData.password);
});

test('Submit form with UNAUTHENTICATED, verify unauthorized notification, and return to filled form', async ({
  page,
}) => {
  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

  await page.goto(REGISTRATION_URL);

  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);

  await page.route(GRAPHQL_URL, graphqlErrorResponse('UNAUTHENTICATED', 'Token expired'));
  const responsePromise: Promise<Response> = page.waitForResponse(responseErrorFilter);

  await signupButton.click();
  await responsePromise;

  const errorTitle: Locator = page.getByText(errorTitleText);
  await expect(errorTitle).toBeVisible();
  await expect(page.getByText(unauthorizedErrorText)).toBeVisible();

  const backButton: Locator = page.getByRole('button', { name: backToFormButton });
  await expect(backButton).toBeEnabled();
  await backButton.click();

  await expect(initialsInput).toHaveValue(userData.fullName);
  await expect(emailInput).toHaveValue(userData.email);
  await expect(passwordInput).toHaveValue(userData.password);
});

test('Submit form with FORBIDDEN, verify access denied notification, and return to filled form', async ({
  page,
}) => {
  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

  await page.goto(REGISTRATION_URL);

  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);

  await page.route(GRAPHQL_URL, graphqlErrorResponse('FORBIDDEN', 'Access forbidden'));
  const responsePromise: Promise<Response> = page.waitForResponse(responseErrorFilter);

  await signupButton.click();
  await responsePromise;

  const errorTitle: Locator = page.getByText(errorTitleText);
  await expect(errorTitle).toBeVisible();
  await expect(page.getByText(accessDeniedErrorText)).toBeVisible();

  const backButton: Locator = page.getByRole('button', { name: backToFormButton });
  await expect(backButton).toBeEnabled();
  await backButton.click();

  await expect(initialsInput).toHaveValue(userData.fullName);
  await expect(emailInput).toHaveValue(userData.email);
  await expect(passwordInput).toHaveValue(userData.password);
});

test('Submit form with unrecognized error code, verify something went wrong notification, and return to filled form', async ({
  page,
}) => {
  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

  await page.goto(REGISTRATION_URL);

  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);

  await page.route(GRAPHQL_URL, graphqlErrorResponse('UNKNOWN_CODE', 'Some unknown error'));
  const responsePromise: Promise<Response> = page.waitForResponse(responseErrorFilter);

  await signupButton.click();
  await responsePromise;

  const errorTitle: Locator = page.getByText(errorTitleText);
  await expect(errorTitle).toBeVisible();
  await expect(page.getByText(somethingWentWrongText)).toBeVisible();

  const backButton: Locator = page.getByRole('button', { name: backToFormButton });
  await expect(backButton).toBeEnabled();
  await backButton.click();

  await expect(initialsInput).toHaveValue(userData.fullName);
  await expect(emailInput).toHaveValue(userData.email);
  await expect(passwordInput).toHaveValue(userData.password);
});

test('Submit form with network failure, verify network error notification, and return to filled form', async ({
  page,
}) => {
  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

  await page.goto(REGISTRATION_URL);

  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);

  await page.route(GRAPHQL_URL, networkAbortResponse);

  await signupButton.click();

  const errorTitle: Locator = page.getByText(errorTitleText);
  await expect(errorTitle).toBeVisible();
  await expect(page.getByText(networkErrorText)).toBeVisible();

  const backButton: Locator = page.getByRole('button', { name: backToFormButton });
  await expect(backButton).toBeEnabled();
  await backButton.click();

  await expect(initialsInput).toHaveValue(userData.fullName);
  await expect(emailInput).toHaveValue(userData.email);
  await expect(passwordInput).toHaveValue(userData.password);
});

test('Submit form, get server error, retry submission, and succeed', async ({ page }) => {
  const { initialsInput, emailInput, passwordInput, signupButton } = getFormFields(page);

  await page.goto(REGISTRATION_URL);

  await fillInput(initialsInput, userData.fullName);
  await fillInput(emailInput, userData.email);
  await fillInput(passwordInput, userData.password);

  let requestCount: number = 0;
  await page.route(GRAPHQL_URL, async (route: Route) => {
    requestCount += 1;
    if (requestCount <= 2) {
      await graphqlErrorResponse('INTERNAL_SERVER_ERROR', 'Server crashed')(route);
      return;
    }
    await successResponse(route);
  });

  await signupButton.click();

  const errorTitle: Locator = page.getByText(errorTitleText);
  await expect(errorTitle).toBeVisible();

  const backButton: Locator = page.getByRole('button', { name: backToFormButton });
  await expect(backButton).toBeEnabled();
  await backButton.click();

  await expect(initialsInput).toHaveValue(userData.fullName);
  await expect(emailInput).toHaveValue(userData.email);
  await expect(passwordInput).toHaveValue(userData.password);

  await signupButton.click();
  await expect(errorTitle).toBeVisible();

  const retryButton: Locator = page.getByRole('button', { name: retryButtonText });
  await retryButton.click();

  const successNotification: Locator = page.getByText(successTitleText);
  await expect(successNotification).toBeVisible();

  await page.unroute(GRAPHQL_URL);
});
