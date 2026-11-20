import type { Page } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { expectNoSecrets } from '@tests/e2e/utils/expect-no-secrets';
import fillInput from '@tests/e2e/utils/fill-input';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  backButtonOf,
  continueButtonOf,
  errorCardBodyOf,
  expectSignInErrorCard,
  expectSignInErrorCardWithoutRetry,
  expectSignInSuccessCard,
  retryButtonOf,
  signInErrorMessages,
  successCardHeading,
} from '@tests/e2e/utils/sign-in-result-card';
import { bounceFromProtectedDestination, signOutToSignIn } from '@tests/e2e/utils/sign-out';
import {
  replyWithUnauthenticated,
  SIGN_IN_ACCESS_TOKEN,
  stubSignIn,
  type SignInOutcome,
} from '@tests/e2e/utils/two-factor-responses';

const PRESERVED_DESTINATION = '/?tab=deals#pipeline';

const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');
const homeHeading: string = t('home.heading');

const credentials = buildCredentials();
const secrets = { token: SIGN_IN_ACCESS_TOKEN, password: credentials.password };

async function submitCredentials(page: Page): Promise<void> {
  await fillInput(page.getByPlaceholder(emailPlaceholder), credentials.email);
  await fillInput(page.getByPlaceholder(passwordPlaceholder), credentials.password);
  await page.locator('button', { hasText: submitLabel }).click();
}

interface FailureRow {
  readonly title: string;
  readonly outcome: SignInOutcome;
  readonly message: string;
  readonly retryCount: number;
  readonly expectCard: (page: Page, message: string) => Promise<void>;
}

const FAILURES: readonly FailureRow[] = [
  {
    title: 'a locked answer shows its text and offers no Retry',
    outcome: 'locked',
    message: signInErrorMessages.locked,
    retryCount: 0,
    expectCard: expectSignInErrorCardWithoutRetry,
  },
  {
    title: 'a rate-limited answer shows its text and offers no Retry',
    outcome: 'rate_limited',
    message: signInErrorMessages.rateLimited,
    retryCount: 0,
    expectCard: expectSignInErrorCardWithoutRetry,
  },
  {
    title: 'an unavailable answer shows the transient text and offers Retry',
    outcome: 'unavailable',
    message: signInErrorMessages.transient,
    retryCount: 1,
    expectCard: expectSignInErrorCard,
  },
];

test.describe('Sign-in over GraphQL signInUser (issue #331)', () => {
  test('a 2FA-off answer from a protected-page redirect lands back with focus on main', async ({
    page,
  }) => {
    const signIn = await stubSignIn(page, ['session']);
    await signOutToSignIn(page);
    await bounceFromProtectedDestination(page, PRESERVED_DESTINATION);
    await expectNoSecrets(page, secrets);

    await submitCredentials(page);

    await expectSignInSuccessCard(page);
    expect(signIn.count()).toBe(1);
    expect(signIn.calls[0]?.variables).toEqual({
      input: {
        email: credentials.email,
        password: credentials.password,
        clientMutationId: expect.any(String),
      },
    });
    expect(signIn.calls[0]?.variables.input).not.toHaveProperty('rememberMe');
    await expectNoSecrets(page, secrets);

    await continueButtonOf(page).click();

    await expect(page).toHaveURL(PRESERVED_DESTINATION);
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1, name: homeHeading })
    ).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();
    await expect(successCardHeading(page)).toHaveCount(0);
    expect(signIn.count()).toBe(1);
    await expectNoSecrets(page, secrets);
  });

  for (const failure of FAILURES) {
    test(failure.title, async ({ page }) => {
      const signIn = await stubSignIn(page, [failure.outcome]);
      await signOutToSignIn(page);

      await submitCredentials(page);

      await failure.expectCard(page, failure.message);
      await expect(retryButtonOf(page)).toHaveCount(failure.retryCount);
      await expect(backButtonOf(page)).toBeEnabled();
      expect(signIn.count()).toBe(1);
      await expect(page).toHaveURL(/\/sign-in$/);
      await expectNoSecrets(page, secrets);
    });
  }

  test('Retry on the transient card re-sends once with the same credentials', async ({ page }) => {
    const signIn = await stubSignIn(page, ['unavailable', 'session']);
    await signOutToSignIn(page);
    await submitCredentials(page);
    await expectSignInErrorCard(page, signInErrorMessages.transient);
    expect(signIn.count()).toBe(1);

    await retryButtonOf(page).click();

    await expectSignInSuccessCard(page);
    expect(signIn.count()).toBe(2);
    expect(signIn.calls[1]?.variables.input).toMatchObject({
      email: credentials.email,
      password: credentials.password,
    });
    await expectNoSecrets(page, secrets);
  });

  test('Retry that fails for a reason without Retry moves focus to the heading', async ({
    page,
  }) => {
    const signIn = await stubSignIn(page, ['unavailable', 'locked']);
    await signOutToSignIn(page);
    await submitCredentials(page);
    await expectSignInErrorCard(page, signInErrorMessages.transient);

    await retryButtonOf(page).click();

    await expectSignInErrorCardWithoutRetry(page, signInErrorMessages.locked);
    expect(signIn.count()).toBe(2);
  });

  test('two 401 answers with different upstream messages render the same card (NFR-3)', async ({
    page,
  }) => {
    const signIn = await stubSignIn(page, [
      replyWithUnauthenticated('No account for this e-mail address'),
      replyWithUnauthenticated('The password does not match this account'),
    ]);
    await signOutToSignIn(page);

    await submitCredentials(page);
    await expectSignInErrorCardWithoutRetry(page, signInErrorMessages.invalidCredentials);
    const first = await errorCardBodyOf(page).innerHTML();
    expect(signIn.count()).toBe(1);

    await backButtonOf(page).click();
    await expect(page.getByPlaceholder(emailPlaceholder)).toHaveValue(credentials.email);
    await expect(page.getByPlaceholder(emailPlaceholder)).toBeFocused();
    expect(signIn.count()).toBe(1);

    await submitCredentials(page);
    await expectSignInErrorCardWithoutRetry(page, signInErrorMessages.invalidCredentials);
    const second = await errorCardBodyOf(page).innerHTML();

    expect(second).toBe(first);
    expect(signIn.count()).toBe(2);
    await expectNoSecrets(page, secrets);
  });
});
