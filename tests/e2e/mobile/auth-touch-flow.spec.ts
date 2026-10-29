import { test, expect, type Page, type Route } from '@playwright/test';

import fulfillCreateUserSuccess from '@tests/e2e/utils/create-user-response';
import {
  backButtonOf,
  errorCardHeading,
  expectSignInErrorCardWithoutRetry,
  signInErrorMessages,
} from '@tests/e2e/utils/sign-in-result-card';
import { SIGN_IN_REPLIES, stubSignIn } from '@tests/e2e/utils/two-factor-responses';

import {
  credentials,
  newUser,
  REGISTRATION_API_URL,
  SIGN_IN_URL,
  SIGN_UP_URL,
  signIn,
  signUp,
  switcherToSignInLabel,
  switcherToSignUpLabel,
} from './constants';

type ReloadMarkedWindow = Window & { __noReloadMarker?: boolean };

async function tapAndFill(page: Page, placeholder: string, value: string): Promise<void> {
  const input = page.getByPlaceholder(placeholder);
  await input.tap();
  await input.fill(value);
}

function isPost(route: Route): boolean {
  return route.request().method() === 'POST';
}

test.describe('Auth flow driven by touch', () => {
  test('signs in with taps only and reports the in-flight busy state', async ({ page }) => {
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    const signInStub = await stubSignIn(page, [
      async (route: Route): Promise<void> => {
        await inFlight;
        await SIGN_IN_REPLIES.session(route);
      },
    ]);

    await page.goto(SIGN_IN_URL);
    await tapAndFill(page, signIn.emailPlaceholder, credentials.email);
    await tapAndFill(page, signIn.passwordPlaceholder, credentials.password);

    const submit = page.locator('button', { hasText: signIn.submitLabel });
    await submit.tap();

    await expect(submit).toBeDisabled();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => signInStub.count()).toBe(1);

    release();
  });

  test('a failed sign-in shows the error card and tapping Назад restores the form', async ({
    page,
  }) => {
    await stubSignIn(page, ['unauthenticated']);

    await page.goto(SIGN_IN_URL);
    await tapAndFill(page, signIn.emailPlaceholder, credentials.email);
    await tapAndFill(page, signIn.passwordPlaceholder, credentials.password);
    await page.locator('button', { hasText: signIn.submitLabel }).tap();

    await expectSignInErrorCardWithoutRetry(page, signInErrorMessages.invalidCredentials);

    await backButtonOf(page).tap();

    await expect(errorCardHeading(page)).toHaveCount(0);
    await expect(page.getByPlaceholder(signIn.emailPlaceholder)).toBeFocused();
    await expect(page.getByPlaceholder(signIn.emailPlaceholder)).toHaveValue(credentials.email);
    await expect(page.getByPlaceholder(signIn.passwordPlaceholder)).toHaveValue(
      credentials.password
    );
  });

  test('registers with taps only and shows the success notification', async ({ page }) => {
    await page.route(REGISTRATION_API_URL, fulfillCreateUserSuccess(newUser));

    await page.goto(SIGN_UP_URL);
    await tapAndFill(page, signUp.namePlaceholder, newUser.fullName);
    await tapAndFill(page, signUp.emailPlaceholder, newUser.email);
    await tapAndFill(page, signUp.passwordPlaceholder, newUser.password);

    await page.locator('button', { hasText: signUp.submitLabel }).tap();

    await expect(
      page.getByRole('heading', { level: 2, name: signUp.successNotificationTitle })
    ).toBeFocused();
  });

  test('tapping submit on an empty form surfaces validation and sends no request', async ({
    page,
  }) => {
    let postCount = 0;
    await page.route(REGISTRATION_API_URL, async (route: Route) => {
      if (!isPost(route)) return route.fallback();
      postCount += 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(SIGN_UP_URL);
    await page.locator('button', { hasText: signUp.submitLabel }).tap();

    await expect(page.locator(`text=${signUp.requiredNameError}`).first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${SIGN_UP_URL}$`));
    expect(postCount).toBe(0);
  });

  test('taps the switcher from /sign-in to /sign-up without a full reload', async ({ page }) => {
    await page.goto(SIGN_IN_URL);
    await page.evaluate(() => {
      (window as ReloadMarkedWindow).__noReloadMarker = true;
    });

    const link = page
      .locator(`a[href="${SIGN_UP_URL}"]`)
      .filter({ hasText: switcherToSignUpLabel });
    await expect(link).toHaveCount(1);
    await link.tap();

    await expect(page).toHaveURL(new RegExp(`${SIGN_UP_URL}$`));
    const survivedNavigation = await page.evaluate(
      () => (window as ReloadMarkedWindow).__noReloadMarker === true
    );
    expect(survivedNavigation).toBe(true);
  });

  test('taps the switcher from /sign-up to /sign-in without a full reload', async ({ page }) => {
    await page.goto(SIGN_UP_URL);
    await page.evaluate(() => {
      (window as ReloadMarkedWindow).__noReloadMarker = true;
    });

    const link = page
      .locator(`a[href="${SIGN_IN_URL}"]`)
      .filter({ hasText: switcherToSignInLabel });
    await expect(link).toHaveCount(1);
    await link.tap();

    await expect(page).toHaveURL(new RegExp(`${SIGN_IN_URL}$`));
    const survivedNavigation = await page.evaluate(
      () => (window as ReloadMarkedWindow).__noReloadMarker === true
    );
    expect(survivedNavigation).toBe(true);
  });
});
