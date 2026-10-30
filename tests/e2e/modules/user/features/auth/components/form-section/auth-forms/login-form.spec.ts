import { type Locator, type Page, type Route } from '@playwright/test';

import { buildCredentials } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import {
  backButtonOf,
  errorCardHeading,
  errorCardOf,
  expectSignInErrorCard,
  expectSignInErrorCardWithoutRetry,
  retryButtonOf,
  signInErrorCard,
  signInErrorMessages,
} from '@tests/e2e/utils/sign-in-result-card';
import {
  SIGN_IN_REPLIES,
  stubSignIn,
  type SignInOutcome,
} from '@tests/e2e/utils/two-factor-responses';

import fillInput from '../../../../../../../utils/fill-input';
import { t } from '../../../../../../../utils/initialize-localization';

const LOGIN_URL = '/sign-in';

const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const submitLabel: string = t('sign_in.form.submit_button');

const validCredentials = buildCredentials();

async function gotoLogin(page: Page): Promise<void> {
  await page.goto(LOGIN_URL);
}

async function fillValidLogin(page: Page): Promise<Locator> {
  await fillInput(page.getByPlaceholder(emailPlaceholder), validCredentials.email);
  await fillInput(page.getByPlaceholder(passwordPlaceholder), validCredentials.password);
  return page.locator('button', { hasText: submitLabel });
}

function holdUntil(
  released: Promise<void>,
  outcome: SignInOutcome
): (route: Route) => Promise<void> {
  return async (route: Route): Promise<void> => {
    await released;
    await SIGN_IN_REPLIES[outcome](route);
  };
}

function gate(): { released: Promise<void>; release: () => void } {
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { released, release };
}

async function expectCardAfterSubmit(
  page: Page,
  message: string,
  expectCard: typeof expectSignInErrorCard = expectSignInErrorCardWithoutRetry
): Promise<void> {
  await gotoLogin(page);
  const submitButton = await fillValidLogin(page);
  await submitButton.click();
  await expectCard(page, message);
}

test.describe('Login Form loader behaviour', () => {
  test('shows the in-button busy state and aria-busy while the request is in flight', async ({
    page,
  }) => {
    const { released, release } = gate();
    await stubSignIn(page, [holdUntil(released, 'session')]);

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveClass(/MuiButton-loading/);
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');

    release();
  });

  test('does not submit a second time while the button is loading', async ({ page }) => {
    const { released, release } = gate();
    const signIn = await stubSignIn(page, [holdUntil(released, 'session')]);

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();
    await expect(submitButton).toBeDisabled();
    await expect.poll(() => signIn.count()).toBe(1);
    await submitButton.click({ force: true });

    expect(signIn.count()).toBe(1);
    release();
  });

  test('replaces the form with the error card and focuses its heading on failure', async ({
    page,
  }) => {
    await stubSignIn(page, ['unauthenticated']);

    await gotoLogin(page);
    const submitButton = await fillValidLogin(page);
    await submitButton.click();

    await expectSignInErrorCardWithoutRetry(page, signInErrorMessages.invalidCredentials);
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'false');
    await expect(submitButton).toBeDisabled();
    await expect(page.getByRole('alert')).toHaveCount(1);
  });
});

interface CardRow {
  readonly answer: string;
  readonly outcome: SignInOutcome;
  readonly message: string;
  readonly offersRetry: boolean;
}

const CARD_ROWS: readonly CardRow[] = [
  {
    answer: 'a 401',
    outcome: 'unauthenticated',
    message: signInErrorMessages.invalidCredentials,
    offersRetry: false,
  },
  {
    answer: 'a 422 violation',
    outcome: 'violation',
    message: signInErrorMessages.invalidCredentials,
    offersRetry: false,
  },
  {
    answer: 'a 423',
    outcome: 'locked',
    message: signInErrorMessages.locked,
    offersRetry: false,
  },
  {
    answer: 'an HTTP 429',
    outcome: 'rate_limited',
    message: signInErrorMessages.rateLimited,
    offersRetry: false,
  },
  {
    answer: 'an HTTP 503',
    outcome: 'unavailable',
    message: signInErrorMessages.transient,
    offersRetry: true,
  },
  {
    answer: 'a dropped connection',
    outcome: 'network',
    message: signInErrorMessages.transient,
    offersRetry: true,
  },
];

test.describe('Login error card', () => {
  test.use({ allowedConsoleErrors: [/^\[JavaScript Error: "Cross-Origin Request Blocked:/] });

  for (const row of CARD_ROWS) {
    test(`maps ${row.answer} to its localized message`, async ({ page }) => {
      await stubSignIn(page, [row.outcome]);

      await expectCardAfterSubmit(
        page,
        row.message,
        row.offersRetry ? expectSignInErrorCard : expectSignInErrorCardWithoutRetry
      );
    });
  }

  test('Назад fades the card out and returns the form with values kept and e-mail focused', async ({
    page,
  }) => {
    await stubSignIn(page, ['unauthenticated']);
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
    const { released, release } = gate();
    const signIn = await stubSignIn(page, ['unavailable', holdUntil(released, 'unavailable')]);
    await expectCardAfterSubmit(page, signInErrorMessages.transient, expectSignInErrorCard);

    await retryButtonOf(page).click();
    await expect.poll(() => signIn.count()).toBe(2);

    const card = errorCardOf(page);
    await expect(retryButtonOf(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(retryButtonOf(page)).not.toHaveJSProperty('disabled', true);
    await expect(card.getByRole('alert')).toBeEmpty();
    await expect(card.getByRole('status')).toHaveText(signInErrorCard.submitting);
    await expect(errorCardHeading(page)).toBeVisible();

    await retryButtonOf(page).click({ force: true });
    expect(signIn.count()).toBe(2);

    release();

    await expect(card.getByRole('alert')).toHaveText(signInErrorMessages.transient);
    await expect(retryButtonOf(page)).toBeEnabled();
    await expect(card.getByRole('status')).toBeEmpty();
    expect(signIn.count()).toBe(2);
    const [first, second] = signIn.calls.map((call) => call.variables['input'] as object);
    expect(first).toMatchObject({
      email: validCredentials.email,
      password: validCredentials.password,
    });
    expect({ ...second, clientMutationId: 0 }).toEqual({ ...first, clientMutationId: 0 });
  });
});
