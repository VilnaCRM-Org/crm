import type { Page } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  backButtonOf,
  errorCardHeading,
  expectSignInErrorCard,
  expectSignInErrorCardWithoutRetry,
  expectSignInSuccessCard,
  retryButtonOf,
  signInErrorMessages,
} from '@tests/e2e/utils/sign-in-result-card';
import { stubSignIn, type SignInOutcome } from '@tests/e2e/utils/two-factor-responses';

import fillInput from '../../../../../../../utils/fill-input';
import { t } from '../../../../../../../utils/initialize-localization';

const LOGIN_URL = '/sign-in';

const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

const validCredentials = buildCredentials();

async function submitValidLogin(page: Page): Promise<void> {
  await page.goto(LOGIN_URL);
  await fillInput(page.getByPlaceholder(emailPlaceholder), validCredentials.email);
  await fillInput(page.getByPlaceholder(passwordPlaceholder), validCredentials.password);
  await page.locator('button', { hasText: submitLabel }).click();
}

const TRANSIENT_FAILURES: readonly (readonly [string, SignInOutcome])[] = [
  ['a dropped connection', 'network'],
  ['a 503', 'unavailable'],
];

// Sign-in is a GraphQL mutation that is requested once (issue #331, superseding the REST retry
// opt-in of issue #147): nothing is re-sent behind the user's back, and only a transient failure
// offers the result card's own "Спробувати ще раз".
test.describe('Sign-in request is not retried automatically', () => {
  // Firefox reports an aborted cross-origin request as a CORS console error; the single request is
  // the behaviour under test.
  test.use({ allowedConsoleErrors: [/^\[JavaScript Error: "Cross-Origin Request Blocked:/] });

  for (const [name, outcome] of TRANSIENT_FAILURES) {
    test(`${name} sends one request and shows the transient card`, async ({ page }) => {
      const signIn = await stubSignIn(page, [outcome]);

      await submitValidLogin(page);

      await expectSignInErrorCard(page, signInErrorMessages.transient);
      expect(signIn.count()).toBe(1);
    });

    test(`Спробувати ще раз after ${name} sends exactly one more request`, async ({ page }) => {
      const signIn = await stubSignIn(page, [outcome, 'session']);
      await submitValidLogin(page);
      await expectSignInErrorCard(page, signInErrorMessages.transient);

      await retryButtonOf(page).click();

      await expectSignInSuccessCard(page);
      expect(signIn.count()).toBe(2);
      expect(signIn.calls[1]?.variables['input']).toMatchObject({
        email: validCredentials.email,
        password: validCredentials.password,
      });
    });
  }

  test('does not retry a permanent 401 and offers no Retry', async ({ page }) => {
    const signIn = await stubSignIn(page, ['unauthenticated']);

    await submitValidLogin(page);

    await expectSignInErrorCardWithoutRetry(page, signInErrorMessages.invalidCredentials);
    expect(signIn.count()).toBe(1);
  });

  test('Назад from the transient card returns to the form without a second request', async ({
    page,
  }) => {
    const signIn = await stubSignIn(page, ['unavailable']);
    await submitValidLogin(page);
    await expectSignInErrorCard(page, signInErrorMessages.transient);

    await backButtonOf(page).click();

    await expect(errorCardHeading(page)).toHaveCount(0);
    await expect(page.getByPlaceholder(emailPlaceholder)).toHaveValue(validCredentials.email);
    expect(signIn.count()).toBe(1);
  });
});
