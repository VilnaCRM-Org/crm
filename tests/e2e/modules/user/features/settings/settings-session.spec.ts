import type { Request } from '@playwright/test';

import { buildCredentials, buildPassword } from '@tests/builders';
import fillInput from '@tests/e2e/utils/fill-input';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import { continueButtonOf, expectSignInSuccessCard } from '@tests/e2e/utils/sign-in-result-card';

import {
  replyWithEndedSession,
  signInToSettings,
  stubProfile,
  watchContactedOrigins,
  type StubbedProfile,
} from './utils/profile-stub';
import {
  editName,
  expectEveryPasswordFieldEmpty,
  expectNoPersonalDataInUrls,
  configuredRestOrigin,
  expectOnlyAllowedOrigins,
  openLoadedSettings,
  saveButton,
  text,
} from './utils/settings-page';

const LOGIN_API_URL = '**/api/users';
const NEW_NAME = 'Іван Коваль';
const password = buildPassword();
const credentials = buildCredentials();
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

test.describe('Settings session end (issue #330)', () => {
  let contacted: () => string[] = () => [];
  let stub: StubbedProfile;

  test.beforeEach(async ({ page }) => {
    contacted = watchContactedOrigins(page);
    await signInToSettings(page);
    await page.route(LOGIN_API_URL, async (route) => {
      const request: Request = route.request();
      if (request.method() !== 'POST') return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'e2e-session-token' }),
      });
    });
  });

  test.afterEach(({ page }) => {
    expectOnlyAllowedOrigins(contacted(), page.url(), stub.calls, [
      configuredRestOrigin(page.url()),
    ]);
    expectNoPersonalDataInUrls(contacted(), [password, NEW_NAME, credentials.password]);
  });

  async function endSession(page: Parameters<typeof openLoadedSettings>[0]): Promise<void> {
    await openLoadedSettings(page);
    await editName(page, NEW_NAME, password);
    await saveButton(page).click();
    await expect(page).toHaveURL(/\/sign-in$/);
  }

  test('returns to sign-in with the notice and focus, then back to settings after login', async ({
    page,
  }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithEndedSession] });

    await endSession(page);

    await expect(page.getByRole('status').filter({ hasText: text.sessionEnded })).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();

    await fillInput(page.getByPlaceholder(emailPlaceholder), credentials.email);
    await fillInput(page.getByPlaceholder(passwordPlaceholder), credentials.password);
    await page.getByRole('button', { name: submitLabel }).click();
    await expectSignInSuccessCard(page);
    await continueButtonOf(page).click();

    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { level: 1, name: text.heading })).toBeVisible();
    await expectEveryPasswordFieldEmpty(page);
  });

  test('does not show the notice again after a reload of sign-in', async ({ page }) => {
    stub = await stubProfile(page, { UpdateUser: [replyWithEndedSession] });

    await endSession(page);
    await expect(page.getByRole('status').filter({ hasText: text.sessionEnded })).toBeVisible();
    await page.reload();

    await expect(page.getByRole('heading', { level: 1, name: text.signInTitle })).toBeVisible();
    await expect(page.getByText(text.sessionEnded)).toHaveCount(0);
  });
});
