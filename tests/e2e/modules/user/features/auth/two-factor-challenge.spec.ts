import type { Route } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildCredentials } from '@tests/builders';
import { expectNoSecrets } from '@tests/e2e/utils/expect-no-secrets';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  challengeBackOf,
  challengeHeadingOf,
  challengeRetryOf,
  challengeText,
  codeCellsOf,
  confirmButtonOf,
  signInToChallenge,
  submitSignIn,
  typeCode,
} from '@tests/e2e/utils/reach-challenge';
import { bounceFromProtectedDestination, signOutToSignIn } from '@tests/e2e/utils/sign-out';
import {
  CHALLENGE_ACCESS_TOKEN,
  SIGN_IN_PENDING_SESSION_ID,
  stubChallenge,
  stubSignIn,
} from '@tests/e2e/utils/two-factor-responses';

const PRESERVED_DESTINATION = '/?tab=deals#pipeline';
const CODE = '123456';
const homeHeading: string = t('home.heading');

const credentials = buildCredentials();
const secrets = {
  sessionId: SIGN_IN_PENDING_SESSION_ID,
  code: CODE,
  token: CHALLENGE_ACCESS_TOKEN,
  password: credentials.password,
};

test.describe('Sign-in challenge on /sign-in/two-factor (issue #331)', () => {
  test('a typed URL without a pending session is replaced by /sign-in with no request', async ({
    page,
  }) => {
    const signIn = await stubSignIn(page);
    const challenge = await stubChallenge(page);

    await page.goto(ROUTE_PATHS.twoFactorChallenge, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.signIn}$`));
    await expect(page.getByRole('heading', { level: 1, name: t('sign_in.title') })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /\S/ })).toHaveCount(0);
    expect(signIn.count()).toBe(0);
    expect(challenge.count()).toBe(0);
  });

  test('a reload of the challenge drops it and returns to /sign-in without a notice', async ({
    page,
  }) => {
    const challenge = await stubChallenge(page);
    await signInToChallenge(page, credentials);
    await expectNoSecrets(page, secrets);

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.signIn}$`));
    await expect(page.getByRole('status').filter({ hasText: /\S/ })).toHaveCount(0);
    expect(challenge.count()).toBe(0);
  });

  test('shows the card and keeps the session id out of the URL, history and title', async ({
    page,
  }) => {
    await signInToChallenge(page, credentials);

    await expect(challengeHeadingOf(page)).toBeFocused();
    await expect(page).toHaveTitle(`${challengeText.title} - VilnaCRM`);
    await expect(page.getByText(challengeText.subtitle)).toBeVisible();
    await expect(page.getByText(challengeText.note)).toBeVisible();
    await expect(codeCellsOf(page)).toHaveCount(6);
    await expect(confirmButtonOf(page)).toBeVisible();
    await expect(challengeBackOf(page)).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
    await expectNoSecrets(page, secrets);
  });

  test('four digits show the incomplete error, focus a cell and send nothing', async ({ page }) => {
    const challenge = await stubChallenge(page);
    await signInToChallenge(page, credentials);

    await typeCode(page, '1234');
    await confirmButtonOf(page).click();

    await expect(page.getByText(challengeText.incomplete)).toBeVisible();
    await expect(codeCellsOf(page).nth(4)).toBeFocused();
    await expect(codeCellsOf(page).first()).toHaveAttribute('aria-invalid', 'true');
    expect(challenge.count()).toBe(0);
  });

  test('a completed code lands on the preserved target with focus on main', async ({ page }) => {
    const challenge = await stubChallenge(page);
    await stubSignIn(page, ['challenge']);
    await signOutToSignIn(page);
    await bounceFromProtectedDestination(page, PRESERVED_DESTINATION);
    await submitSignIn(page, credentials);
    await expect(challengeHeadingOf(page)).toBeVisible();

    await typeCode(page, CODE);
    await confirmButtonOf(page).click();

    await expect(page).toHaveURL(PRESERVED_DESTINATION);
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1, name: homeHeading })
    ).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();
    expect(challenge.count()).toBe(1);
    expect(challenge.calls[0]?.authorization).toBeUndefined();
    expect(challenge.calls[0]?.variables['input']).toMatchObject({
      pendingSessionId: SIGN_IN_PENDING_SESSION_ID,
      twoFactorCode: CODE,
    });
    await expectNoSecrets(page, secrets);
  });

  test('a wrong code empties the cells, marks them invalid and refocuses the input', async ({
    page,
  }) => {
    const challenge = await stubChallenge(page, ['invalid_code']);
    await signInToChallenge(page, credentials);

    await typeCode(page, CODE);
    await confirmButtonOf(page).click();

    await expect(page.getByText(challengeText.invalidCode)).toBeVisible();
    for (const cell of await codeCellsOf(page).all()) {
      await expect(cell).toHaveValue('');
      await expect(cell).toHaveAttribute('aria-invalid', 'true');
    }
    await expect(codeCellsOf(page).first()).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.twoFactorChallenge}$`));
    expect(challenge.count()).toBe(1);
    await expectNoSecrets(page, secrets);
  });

  test('an expired session returns to /sign-in with the notice once', async ({ page }) => {
    await stubChallenge(page, ['expired_session']);
    await signInToChallenge(page, credentials);

    await typeCode(page, CODE);
    await confirmButtonOf(page).click();

    await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.signIn}$`));
    await expect(page.getByText(challengeText.expiredNotice)).toHaveCount(1);
    await expect(page.getByRole('main')).toBeFocused();
    await expectNoSecrets(page, secrets);

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.getByText(challengeText.expiredNotice)).toHaveCount(0);
  });

  test('a locked account returns to /sign-in with the locked notice', async ({ page }) => {
    await stubChallenge(page, ['locked']);
    await signInToChallenge(page, credentials);

    await typeCode(page, CODE);
    await confirmButtonOf(page).click();

    await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.signIn}$`));
    await expect(page.getByText(challengeText.lockedNotice)).toHaveCount(1);
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('a 429 shows a focused alert banner without a retry', async ({ page }) => {
    await stubChallenge(page, ['rate_limited']);
    await signInToChallenge(page, credentials);

    await typeCode(page, CODE);
    await confirmButtonOf(page).click();

    const banner = page.getByRole('alert').filter({ hasText: challengeText.rateLimited });
    await expect(banner).toBeVisible();
    await expect(banner).toBeFocused();
    await expect(challengeRetryOf(page)).toHaveCount(0);
  });

  test('a 503 offers a retry that sends exactly one more identical request', async ({ page }) => {
    const challenge = await stubChallenge(page, ['unavailable', 'completed']);
    await signInToChallenge(page, credentials);
    await typeCode(page, CODE);
    await confirmButtonOf(page).click();
    await expect(
      page.getByRole('alert').filter({ hasText: challengeText.transient })
    ).toBeVisible();
    expect(challenge.count()).toBe(1);

    await challengeRetryOf(page).click();

    await expect.poll(() => challenge.count()).toBe(2);
    const [first, second] = challenge.calls.map((call) => call.variables['input']);
    expect({ ...(first as object), clientMutationId: 0 }).toEqual({
      ...(second as object),
      clientMutationId: 0,
    });
  });

  test('Назад during a request aborts it and leaves no banner on /sign-in', async ({ page }) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const challenge = await stubChallenge(page, [
      async (route: Route): Promise<void> => {
        await held;
        await route.abort('failed').catch(() => undefined);
      },
    ]);
    await signInToChallenge(page, credentials);
    await typeCode(page, CODE);
    await confirmButtonOf(page).click();
    await expect.poll(() => challenge.count()).toBe(1);

    await challengeBackOf(page).click();

    await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.signIn}$`));
    release();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
