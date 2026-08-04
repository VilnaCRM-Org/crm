import { test, expect, type Page, type Route } from '@playwright/test';

import {
  credentials,
  LOGIN_API_URL,
  newUser,
  REGISTRATION_API_URL,
  SIGN_IN_URL,
  SIGN_UP_URL,
  signIn,
  signUp,
  switcherToSignInLabel,
  switcherToSignUpLabel,
} from './constants';
import fulfillRegistrationSuccess from './utils/registration-response';

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
    let postCount = 0;
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });

    await page.route(LOGIN_API_URL, async (route: Route) => {
      if (!isPost(route)) return route.fallback();
      postCount += 1;
      await inFlight;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(SIGN_IN_URL);
    await tapAndFill(page, signIn.emailPlaceholder, credentials.email);
    await tapAndFill(page, signIn.passwordPlaceholder, credentials.password);

    const submit = page.locator('button', { hasText: signIn.submitLabel });
    await submit.tap();

    await expect(submit).toBeDisabled();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => postCount).toBe(1);

    release();
  });

  test('registers with taps only and shows the success notification', async ({ page }) => {
    await page.route(REGISTRATION_API_URL, fulfillRegistrationSuccess);

    await page.goto(SIGN_UP_URL);
    await tapAndFill(page, signUp.namePlaceholder, newUser.fullName);
    await tapAndFill(page, signUp.emailPlaceholder, newUser.email);
    await tapAndFill(page, signUp.passwordPlaceholder, newUser.password);

    await page.locator('button', { hasText: signUp.submitLabel }).tap();

    await expect(page.locator(`text=${signUp.successNotificationTitle}`)).toBeVisible();
  });

  test('tapping submit on an empty form surfaces validation and sends no request', async ({
    page,
  }) => {
    let requestCount = 0;
    await page.route(REGISTRATION_API_URL, async (route: Route) => {
      requestCount += 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(SIGN_UP_URL);
    await page.locator('button', { hasText: signUp.submitLabel }).tap();

    await expect(page.locator(`text=${signUp.requiredNameError}`).first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${SIGN_UP_URL}$`));
    expect(requestCount).toBe(0);
  });

  test('taps the switcher to move /sign-in → /sign-up without a full reload', async ({ page }) => {
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

  test('taps the switcher to move /sign-up → /sign-in without a full reload', async ({ page }) => {
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
