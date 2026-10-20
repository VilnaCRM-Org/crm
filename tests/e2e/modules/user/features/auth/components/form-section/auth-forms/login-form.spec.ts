import { type Locator, type Page, type Request, type Route } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  backButtonOf,
  errorCardHeading,
  errorCardOf,
  expectSignInErrorCard,
  retryButtonOf,
  signInErrorCard,
  signInErrorMessages,
} from '@tests/e2e/utils/sign-in-result-card';

import fillInput from '../../../../../../../utils/fill-input';
import { t } from '../../../../../../../utils/initialize-localization';

const LOGIN_URL = '/sign-in';
const LOGIN_API_URL = '**/api/users';

const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

const validCredentials = buildCredentials();

type Fulfilment = Parameters<Route['fulfill']>[0];

async function gotoLogin(page: Page): Promise<void> {
  await page.goto(LOGIN_URL);
}

async function fillValidLogin(page: Page): Promise<Locator> {
  await fillInput(page.getByPlaceholder(emailPlaceholder), validCredentials.email);
  await fillInput(page.getByPlaceholder(passwordPlaceholder), validCredentials.password);
  return page.locator('button', { hasText: submitLabel });
}

function isPostLogin(route: Route): boolean {
  return route.request().method() === 'POST';
}

function isLoginRequest(request: Request): boolean {
  return request.url().includes('/api/users') && request.method() === 'POST';
}

const rejection = (status: number, message: string): Fulfilment => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify({ message }),
});

const invalidCredentials = (): Fulfilment => rejection(401, 'Invalid credentials');

async function answerLoginWith(page: Page, answer: () => Fulfilment): Promise<void> {
  await page.route(LOGIN_API_URL, async (route: Route) => {
    if (!isPostLogin(route)) return route.fallback();
    return route.fulfill(answer());
  });
}

async function rejectAndHoldRetries(
  page: Page
): Promise<{ posted: unknown[]; releaseRetry: () => void }> {
  const posted: unknown[] = [];
  let releaseHeld: () => void = () => {};
  const retryHeld = new Promise<void>((resolve) => {
    releaseHeld = resolve;
  });
  await page.route(LOGIN_API_URL, async (route: Route) => {
    if (!isPostLogin(route)) return route.fallback();
    posted.push(route.request().postDataJSON());
    if (posted.length > 1) await retryHeld;
    return route.fulfill(invalidCredentials());
  });
  return { posted, releaseRetry: (): void => releaseHeld() };
}

async function expectCardAfterSubmit(page: Page, message: string): Promise<void> {
  await gotoLogin(page);
  const submitButton = await fillValidLogin(page);
  await submitButton.click();
  await expectSignInErrorCard(page, message);
}

test.describe('Login Form loader behaviour', () => {
  test('shows the in-button busy state and aria-busy while the request is in flight', async ({
    page,
  }) => {
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      await inFlight;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveClass(/MuiButton-loading/);
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');

    release();
  });

  test('does not submit a second time while the button is loading', async ({ page }) => {
    let postCount = 0;
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPostLogin(route)) return route.fallback();
      postCount += 1;
      await inFlight;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();
    await expect(submitButton).toBeDisabled();
    await expect.poll(() => postCount).toBe(1);
    await submitButton.click({ force: true });

    expect(postCount).toBe(1);
    release();
  });

  test('replaces the form with the error card and focuses its heading on failure', async ({
    page,
  }) => {
    await answerLoginWith(page, invalidCredentials);

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();

    await expectSignInErrorCard(page, signInErrorMessages.invalidCredentials);
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
    await expect(submitButton).toBeDisabled();
    await expect(page.getByRole('alert')).toHaveCount(1);
  });
});

test.describe('Login error card', () => {
  for (const [status, message] of [
    [401, signInErrorMessages.invalidCredentials],
    [400, signInErrorMessages.validation],
    [403, signInErrorMessages.unexpected],
    [429, signInErrorMessages.rateLimited],
  ] as const) {
    test(`maps an HTTP ${status} to its localized message`, async ({ page }) => {
      await answerLoginWith(page, () => rejection(status, 'Rejected'));

      await expectCardAfterSubmit(page, message);
    });
  }

  test('Назад fades the card out and returns the form with values kept and e-mail focused', async ({
    page,
  }) => {
    await answerLoginWith(page, invalidCredentials);
    await expectCardAfterSubmit(page, signInErrorMessages.invalidCredentials);

    await backButtonOf(page).click();

    await expect(errorCardHeading(page)).toHaveCount(0);
    await expect(page.getByPlaceholder(emailPlaceholder)).toBeFocused();
    await expect(page.getByPlaceholder(emailPlaceholder)).toHaveValue(validCredentials.email);
    await expect(page.getByPlaceholder(passwordPlaceholder)).toHaveValue(validCredentials.password);
    await expect(page.locator('#login-form')).not.toHaveAttribute('inert', '');
    await expect(page.locator('#auth-provider-buttons-container')).not.toHaveAttribute('inert', '');
    await expect(page.locator('button', { hasText: submitLabel })).toBeEnabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('Спробувати ще раз resubmits the last values and keeps the card while it runs', async ({
    page,
  }) => {
    const { posted, releaseRetry } = await rejectAndHoldRetries(page);
    await expectCardAfterSubmit(page, signInErrorMessages.invalidCredentials);

    const retryRequest = page.waitForRequest(isLoginRequest);
    await retryButtonOf(page).click();
    await retryRequest;

    const card = errorCardOf(page);
    await expect(retryButtonOf(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(retryButtonOf(page)).not.toHaveJSProperty('disabled', true);
    await expect(card.getByRole('alert')).toBeEmpty();
    await expect(card.getByRole('status')).toHaveText(signInErrorCard.submitting);
    await expect(errorCardHeading(page)).toBeVisible();

    await retryButtonOf(page).click({ force: true });
    expect(posted).toHaveLength(2);

    releaseRetry();

    await expect(card.getByRole('alert')).toHaveText(signInErrorMessages.invalidCredentials);
    await expect(retryButtonOf(page)).toBeEnabled();
    await expect(card.getByRole('status')).toBeEmpty();
    expect(posted).toHaveLength(2);
    expect(posted[0]).toMatchObject({
      email: validCredentials.email,
      password: validCredentials.password,
    });
    expect(posted[1]).toEqual(posted[0]);
  });
});
