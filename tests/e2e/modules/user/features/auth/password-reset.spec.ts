import { type Page, type Request, type Route } from '@playwright/test';

import { buildPassword, buildResetToken, seedFaker } from '@tests/builders';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { freezeClock, installClock } from '@tests/e2e/utils/freeze-clock';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import fillInput from '../../../../utils/fill-input';
import { t } from '../../../../utils/initialize-localization';

seedFaker();

const GRAPHQL_URL = '**/graphql';
const NEW_PASSWORD = buildPassword();

const heading: string = t('password_reset.title');
const newPasswordLabel: string = t('password_reset.new_password.label');
const confirmLabel: string = t('password_reset.confirm_password.label');
const submitLabel: string = t('password_recovery.submit_button');
const showPasswordLabel: string = t('auth.password.show');
const backLabel: string = t('password_recovery.back');
const invalidTitle: string = t('password_reset.invalid.title');
const invalidBody: string = t('password_reset.invalid.body');
const requestNew: string = t('password_reset.invalid.request_new');
const notice: string = t('sign_in.notices.password_reset');
const policyRejected: string = t('password_reset.errors.policy_rejected');
const rateLimited: string = t('password_recovery.errors.rate_limited');
const transient: string = t('password_recovery.errors.transient');
const recoveryHeading: string = t('password_recovery.title');
const signInHeading: string = t('sign_in.title');
const emailLabel: string = t('sign_in.form.email_input.label');
const homeHeading: string = t('home.heading');

interface ConfirmBody {
  readonly operationName?: string;
  readonly variables?: {
    readonly input?: {
      readonly token?: string;
      readonly newPassword?: string;
      readonly clientMutationId?: string;
    };
  };
}

type Answer = (route: Route) => Promise<void>;

interface InvalidLinkRender {
  readonly html: string;
  readonly text: string;
}

const json =
  (body: unknown): Answer =>
  (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const confirmed: Answer = json({ data: { confirmPasswordResetUser: { clientMutationId: 'e2e' } } });

const refused = (message: string): Answer => json({ data: null, errors: [{ message }] });

async function answerConfirms(page: Page, answer: Answer): Promise<ConfirmBody[]> {
  const bodies: ConfirmBody[] = [];
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const body = route.request().postDataJSON() as ConfirmBody;
    if (body.operationName !== 'ConfirmPasswordReset') return route.fallback();
    bodies.push(body);
    return answer(route);
  });
  return bodies;
}

async function openWithToken(page: Page, token: string = buildResetToken()): Promise<string> {
  await page.goto(`/password-reset?token=${token}`);
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await expect(page.getByLabel(newPasswordLabel)).toBeVisible();
  return token;
}

async function submitPasswords(page: Page, confirmation: string = NEW_PASSWORD): Promise<void> {
  await fillInput(page.getByLabel(newPasswordLabel), NEW_PASSWORD);
  await fillInput(page.getByLabel(confirmLabel), confirmation);
  await page.getByRole('button', { name: submitLabel }).click();
}

async function expectSignedInHome(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window.history.state as { usr?: { focusMain?: boolean } } | null)?.usr?.focusMain ??
          false
      )
    )
    .toBe(false);
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('main').getByRole('heading', { level: 1, name: homeHeading })
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: signInHeading })).toHaveCount(0);
}

async function invalidLinkAfter(page: Page, answer: Answer): Promise<InvalidLinkRender> {
  await answerConfirms(page, answer);
  await openWithToken(page);

  await submitPasswords(page);

  await expect(page.getByRole('heading', { level: 1, name: invalidTitle })).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: invalidBody })).toBeVisible();
  const main = page.getByRole('main');
  const render = { html: await main.innerHTML(), text: await main.innerText() };
  await page.unrouteAll({ behavior: 'wait' });
  return render;
}

test.describe('Create new password (issue #315)', () => {
  test('strips the token from the URL, the page and the title', async ({ page }) => {
    await page.goto('/sign-in');
    const token = await openWithToken(page);

    await expect(page).toHaveURL(/\/password-reset$/);
    expect(await page.evaluate(() => window.location.search)).toBe('');
    expect(await page.content()).not.toContain(token);
    await expect(page).toHaveTitle(`${heading} - VilnaCRM`);

    await page.goBack();

    await expect(page).toHaveURL('/sign-in');
    expect(page.url()).not.toContain('token=');

    await page.goForward();

    await expect(page).toHaveURL(/\/password-reset$/);
    expect(page.url()).not.toContain('token=');
  });

  test('confirms once and lands on /sign-in with a one-time notice', async ({ page }) => {
    const bodies = await answerConfirms(page, confirmed);
    const token = await openWithToken(page);

    await submitPasswords(page);

    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByRole('status').filter({ hasText: notice })).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.variables?.input?.token).toBe(token);
    expect(bodies[0]?.variables?.input?.newPassword).toBe(NEW_PASSWORD);

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: signInHeading })).toBeVisible();
    await expect(page.getByLabel(emailLabel)).toBeVisible();
    await expect(page.getByText(notice)).toHaveCount(0);
  });

  test('never returns to the token or re-shows the notice on Back', async ({ page }) => {
    await answerConfirms(page, confirmed);
    await page.goto('/sign-in');
    await page.evaluate((url: string) => {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, `/password-reset?token=${buildResetToken()}`);
    await expect(page.getByLabel(newPasswordLabel)).toBeVisible();
    await expect(page).toHaveURL(/\/password-reset$/);

    await submitPasswords(page);
    await expect(page.getByRole('status').filter({ hasText: notice })).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL('/sign-in');
    expect(page.url()).not.toContain('token=');
    await expect(page.getByRole('heading', { level: 1, name: signInHeading })).toBeVisible();
    await expect(page.getByText(notice)).toHaveCount(0);
  });

  for (const [name, answer] of [
    ['a message-only error', refused('Token has expired.')],
    ['another message-only error', refused('Token is not found.')],
    [
      'a token violation',
      json({ data: null, errors: [{ message: 'token: Invalid.', extensions: { status: 422 } }] }),
    ],
  ] as const) {
    test(`shows the invalid-link state for ${name}`, async ({ page }) => {
      await answerConfirms(page, answer);
      await openWithToken(page);

      await submitPasswords(page);

      await expect(page.getByRole('heading', { level: 1, name: invalidTitle })).toBeFocused();
      await page.getByRole('link', { name: requestNew }).click();
      await expect(page).toHaveURL('/password-recovery');
      await expect(page.getByRole('heading', { level: 1, name: recoveryHeading })).toBeVisible();
      await expect(page.getByRole('main')).toBeFocused();
    });
  }

  test('renders the same invalid-link state for two different message-only refusals', async ({
    page,
  }) => {
    const expired = await invalidLinkAfter(page, refused('Token has expired.'));
    const notFound = await invalidLinkAfter(page, refused('Token is not found.'));

    expect(notFound.text).toContain(invalidTitle);
    expect(notFound.html).toBe(expired.html);
    expect(notFound.text).toBe(expired.text);
  });

  for (const [name, url] of [
    ['no token', '/password-reset'],
    ['an empty token', '/password-reset?token='],
    ['a 256-character token', `/password-reset?token=${'a'.repeat(256)}`],
  ] as const) {
    test(`shows the invalid-link state without a request for ${name}`, async ({ page }) => {
      const bodies = await answerConfirms(page, confirmed);
      await page.goto(url);

      await expect(page.getByRole('heading', { level: 1, name: invalidTitle })).toBeVisible();
      expect(bodies).toHaveLength(0);
    });
  }

  test('shows the invalid-link state after a reload strips the token', async ({ page }) => {
    await openWithToken(page);

    await page.reload();

    await expect(page.getByRole('heading', { level: 1, name: invalidTitle })).toBeVisible();
  });

  test('puts a newPassword violation on the field and keeps both values', async ({ page }) => {
    await answerConfirms(
      page,
      json({
        data: null,
        errors: [{ message: 'newPassword: Too weak.', extensions: { status: 422 } }],
      })
    );
    await openWithToken(page);

    await submitPasswords(page);

    await expect(page.getByText(policyRejected)).toBeVisible();
    await expect(page.getByLabel(newPasswordLabel)).toHaveValue(NEW_PASSWORD);
    await expect(page.getByLabel(confirmLabel)).toHaveValue(NEW_PASSWORD);
  });

  test('shows the rate-limit banner without a retry control for HTTP 429', async ({ page }) => {
    await installClock(page);
    const bodies = await answerConfirms(page, (route) => route.fulfill({ status: 429, body: '' }));
    await openWithToken(page);

    await submitPasswords(page);

    await expect(page.getByRole('alert')).toHaveText(rateLimited);
    await freezeClock(page);
    await expect(page.getByLabel(newPasswordLabel)).toHaveValue(NEW_PASSWORD);
    await expect(page.getByLabel(confirmLabel)).toHaveValue(NEW_PASSWORD);
    const form = page.locator('form');
    await expect(form.getByRole('button')).toHaveCount(3);
    await expect(form.getByRole('button', { name: showPasswordLabel })).toHaveCount(2);
    await expect(form.getByRole('button', { name: submitLabel })).toHaveCount(1);
    expect(bodies).toHaveLength(1);
  });

  async function expectResubmitAfter(page: Page, answer: Answer): Promise<void> {
    await installClock(page);
    const bodies = await answerConfirms(page, answer);
    await openWithToken(page);

    await submitPasswords(page);
    await expect(page.getByRole('alert')).toHaveText(transient);
    await freezeClock(page);
    await page.getByRole('button', { name: submitLabel }).click();

    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]?.variables?.input?.token).toBe(bodies[0]?.variables?.input?.token);
    expect(bodies[1]?.variables?.input?.newPassword).toBe(NEW_PASSWORD);
    expect(bodies[1]?.variables?.input?.clientMutationId).toEqual(expect.any(String));
    expect(bodies[1]?.variables?.input?.clientMutationId).not.toBe(
      bodies[0]?.variables?.input?.clientMutationId
    );
  }

  test('resubmits once after an HTTP 503', async ({ page }) => {
    await expectResubmitAfter(page, (route) => route.fulfill({ status: 503, body: '' }));
  });

  test.describe('dropped connection', () => {
    test.use({ allowedConsoleErrors: [/^\[JavaScript Error: "Cross-Origin Request Blocked:/] });

    test('resubmits once after an aborted request', async ({ page }) => {
      await expectResubmitAfter(page, (route) => route.abort('failed'));
    });
  });

  test('aborts a request in flight when Назад is activated', async ({ page }) => {
    let aborted = false;
    page.on('requestfailed', (request: Request) => {
      if (request.url().includes('graphql')) aborted = true;
    });
    await page.route(GRAPHQL_URL, () => undefined);
    await openWithToken(page);

    await submitPasswords(page);
    await page.getByRole('link', { name: backLabel }).click();

    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(notice)).toHaveCount(0);
    await expect.poll(() => aborted).toBe(true);
  });

  test('keeps a seeded session through a successful confirm', async ({ page }) => {
    await seedPreloadedAuthToken(page);
    await answerConfirms(page, confirmed);
    await openWithToken(page);

    await submitPasswords(page);

    await expect(page).toHaveURL('/sign-in');
    await expectSignedInHome(page);
  });

  for (const [name, entry, linkName, ready, destination] of [
    [
      'Назад on the form',
      (): string => `/password-reset?token=${buildResetToken()}`,
      backLabel,
      heading,
      '/sign-in',
    ],
    [
      'Запросити нове посилання on the invalid-link state',
      (): string => '/password-reset',
      requestNew,
      invalidTitle,
      '/password-recovery',
    ],
  ] as const) {
    test(`navigates from ${name} without a document load`, async ({ page }) => {
      await seedPreloadedAuthToken(page);
      await page.goto('/sign-in');
      await page.evaluate(() => {
        (window as unknown as { resetSentinel: boolean }).resetSentinel = true;
      });
      await page.evaluate((url: string) => {
        window.history.pushState({}, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, entry());
      await expect(page.getByRole('heading', { level: 1, name: ready })).toBeVisible();

      await page.getByRole('link', { name: linkName }).click();

      await expect(page).toHaveURL(destination);
      await expect(page.getByRole('main')).toBeFocused();
      expect(
        await page.evaluate(() => (window as unknown as { resetSentinel?: boolean }).resetSentinel)
      ).toBe(true);
      await expectSignedInHome(page);
    });
  }

  test('contacts only the document origin and the API origins', async ({ page, baseURL }) => {
    const origins = new Set<string>();
    page.on('request', (request: Request) => {
      origins.add(new URL(request.url()).origin);
    });
    await answerConfirms(page, confirmed);
    await openWithToken(page);
    await submitPasswords(page);
    await expect(page).toHaveURL('/sign-in');

    const documentOrigin = new URL(baseURL ?? page.url()).origin;
    const allowed = new Set([
      documentOrigin,
      new URL(process.env.REACT_APP_GRAPHQL_URL ?? documentOrigin).origin,
      new URL(process.env.REACT_APP_MOCKOON_URL ?? documentOrigin).origin,
    ]);
    expect([...origins].filter((origin) => !allowed.has(origin))).toEqual([]);
  });
});
