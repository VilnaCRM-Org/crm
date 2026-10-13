import { type Page, type Request, type Route } from '@playwright/test';

import { test, expect } from '@tests/e2e/utils/fixtures';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import fillInput from '../../../../utils/fill-input';
import { t } from '../../../../utils/initialize-localization';

const RECOVERY_URL = '/password-recovery';
const GRAPHQL_URL = '**/graphql';
const EMAIL = 'eirene@gmail.com';
const MASKED = 'eir*****@gmail.com';

const heading: string = t('password_recovery.title');
const submitLabel: string = t('password_recovery.submit_button');
const backLabel: string = t('password_recovery.back');
const sentTitle: string = t('password_recovery.sent.title');
const toSignIn: string = t('password_recovery.sent.to_sign_in');
const rateLimited: string = t('password_recovery.errors.rate_limited');
const transient: string = t('password_recovery.errors.transient');
const emailRejected: string = t('password_recovery.errors.email_rejected');
const tryAgain: string = t('auth.error.tryAgain');
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const signInTitle: string = t('sign_in.title');

interface GraphQLBody {
  readonly operationName?: string;
  readonly query?: string;
  readonly variables?: { readonly input?: { readonly email?: string } };
}

type Answer = (route: Route) => Promise<void>;

const json =
  (body: unknown): Answer =>
  (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const sentPayload: Answer = json({
  data: { requestPasswordResetUser: { clientMutationId: 'e2e-client-mutation-id' } },
});

async function answerResets(page: Page, answer: Answer): Promise<GraphQLBody[]> {
  const bodies: GraphQLBody[] = [];
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const body = route.request().postDataJSON() as GraphQLBody;
    if (body.operationName !== 'RequestPasswordReset') return route.fallback();
    bodies.push(body);
    return answer(route);
  });
  return bodies;
}

async function submitEmail(page: Page, email: string = `  ${EMAIL} `): Promise<void> {
  await fillInput(page.getByPlaceholder(emailPlaceholder), email);
  await page.getByRole('button', { name: submitLabel }).click();
}

test.describe('Password recovery request step (issue #315)', () => {
  test('renders the request form with its title', async ({ page }) => {
    await page.goto(RECOVERY_URL);

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page).toHaveTitle(`${heading} - VilnaCRM`);
    await expect(page.getByRole('link', { name: backLabel })).toHaveAttribute('href', '/sign-in');
  });

  test('stays on the page for a seeded session', async ({ page }) => {
    await seedPreloadedAuthToken(page);
    await page.goto(RECOVERY_URL);

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page).toHaveURL(RECOVERY_URL);
  });

  for (const [name, answer] of [
    ['a clientMutationId payload', sentPayload],
    ['a null payload', json({ data: { requestPasswordResetUser: null } })],
  ] as const) {
    test(`shows the same sent step for ${name}`, async ({ page }) => {
      const bodies = await answerResets(page, answer);
      await page.goto(RECOVERY_URL);

      await submitEmail(page);

      const sentHeading = page.getByRole('heading', { level: 1, name: sentTitle });
      await expect(sentHeading).toBeFocused();
      await expect(page.getByRole('status').filter({ hasText: MASKED })).toBeVisible();
      await expect(page.getByRole('link', { name: toSignIn })).toHaveAttribute('href', '/sign-in');
      expect(bodies).toHaveLength(1);
      expect(bodies[0]?.variables?.input?.email).toBe(EMAIL);
      expect(bodies[0]?.query).not.toMatch(/\buser\b/);
      await expect(page).toHaveTitle(`${heading} - VilnaCRM`);
    });
  }

  test('puts an email violation on the field', async ({ page }) => {
    await answerResets(
      page,
      json({
        data: null,
        errors: [
          {
            message: 'email: This value is not a valid email address.',
            extensions: { status: 422 },
          },
        ],
      })
    );
    await page.goto(RECOVERY_URL);

    await submitEmail(page);

    await expect(page.getByText(emailRejected)).toBeVisible();
    await expect(page.getByPlaceholder(emailPlaceholder)).toHaveAttribute('aria-invalid', 'true');
  });

  for (const [name, answer] of [
    ['an HTTP 429', (route: Route): Promise<void> => route.fulfill({ status: 429, body: '' })],
    [
      'a message-only GraphQL error',
      json({ data: null, errors: [{ message: 'Too many requests.' }] }),
    ],
  ] as const) {
    test(`shows the rate-limit banner without Retry for ${name}`, async ({ page }) => {
      await answerResets(page, answer);
      await page.goto(RECOVERY_URL);

      await submitEmail(page);

      await expect(page.getByRole('alert')).toHaveText(rateLimited);
      await expect(page.getByRole('button', { name: tryAgain })).toHaveCount(0);
      await expect(page.getByPlaceholder(emailPlaceholder)).toHaveValue(EMAIL);
    });
  }

  async function expectSameEmailRetryAfter(page: Page, answer: Answer): Promise<void> {
    test.info().annotations.push({ type: 'issue', description: '#315' });
    const bodies = await answerResets(page, answer);
    await page.goto(RECOVERY_URL);

    await submitEmail(page);
    await expect(page.getByRole('alert')).toHaveText(transient);
    expect(bodies).toHaveLength(1);

    await page.getByRole('button', { name: tryAgain }).click();

    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]?.variables?.input?.email).toBe(EMAIL);
  }

  test('retries once with the same e-mail after an HTTP 503', async ({ page }) => {
    await expectSameEmailRetryAfter(page, (route) => route.fulfill({ status: 503, body: '' }));
  });

  test.describe('dropped connection', () => {
    // Firefox reports an aborted cross-origin request as a CORS console error; the retry is the
    // behaviour under test and the second POST proves the first one never reached the backend.
    test.use({ allowedConsoleErrors: [/^\[JavaScript Error: "Cross-Origin Request Blocked:/] });

    test('retries once with the same e-mail after an aborted request', async ({ page }) => {
      await expectSameEmailRetryAfter(page, (route) => route.abort('failed'));
    });
  });

  test('aborts a request in flight when Назад is activated', async ({ page }) => {
    let aborted = false;
    page.on('requestfailed', (request: Request) => {
      if (request.url().includes('graphql')) aborted = true;
    });
    await page.route(GRAPHQL_URL, () => undefined);
    await page.goto(RECOVERY_URL);

    await submitEmail(page);
    await page.getByRole('link', { name: backLabel }).click();

    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect.poll(() => aborted).toBe(true);
  });

  test('returns from the sent step to the refilled form without a request', async ({ page }) => {
    const bodies = await answerResets(page, sentPayload);
    await page.goto(RECOVERY_URL);
    await submitEmail(page);
    await expect(page.getByRole('heading', { level: 1, name: sentTitle })).toBeVisible();

    await page.getByRole('button', { name: backLabel }).click();

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();
    await expect(page.getByPlaceholder(emailPlaceholder)).toHaveValue(EMAIL);
    expect(bodies).toHaveLength(1);
  });

  for (const [name, reach] of [
    [
      'Назад on the request form',
      async (page: Page): Promise<void> => {
        await page.getByRole('link', { name: backLabel }).click();
      },
    ],
    [
      'До входу on the sent step',
      async (page: Page): Promise<void> => {
        await submitEmail(page);
        await page.getByRole('link', { name: toSignIn }).click();
      },
    ],
  ] as const) {
    test(`reaches /sign-in from ${name} without a document load`, async ({ page }) => {
      await seedPreloadedAuthToken(page);
      await answerResets(page, sentPayload);
      await page.goto(RECOVERY_URL);
      await page.evaluate(() => {
        (window as unknown as { recoverySentinel: boolean }).recoverySentinel = true;
      });

      await reach(page);

      await expect(page).toHaveURL('/sign-in');
      await expect(page.getByRole('main')).toBeFocused();
      expect(
        await page.evaluate(
          () => (window as unknown as { recoverySentinel?: boolean }).recoverySentinel
        )
      ).toBe(true);
      await page.evaluate(() => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { level: 1, name: signInTitle })).toHaveCount(0);
    });
  }

  test('opens /sign-in in a new page for a modified click on До входу', async ({
    page,
    context,
  }) => {
    await answerResets(page, sentPayload);
    await page.goto(RECOVERY_URL);
    await submitEmail(page);
    const link = page.getByRole('link', { name: toSignIn });

    const [opened] = await Promise.all([
      context.waitForEvent('page'),
      link.click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] }),
    ]);

    await expect(opened).toHaveURL(/\/sign-in$/);
    await expect(page.getByRole('heading', { level: 1, name: sentTitle })).toBeVisible();
  });

  test('contacts only the document origin and the API origins', async ({ page, baseURL }) => {
    const origins = new Set<string>();
    page.on('request', (request: Request) => {
      origins.add(new URL(request.url()).origin);
    });
    await answerResets(page, sentPayload);
    await page.goto(RECOVERY_URL);
    await submitEmail(page);
    await expect(page.getByRole('heading', { level: 1, name: sentTitle })).toBeVisible();

    const documentOrigin = new URL(baseURL ?? page.url()).origin;
    const allowed = new Set([
      documentOrigin,
      new URL(process.env.REACT_APP_GRAPHQL_URL ?? documentOrigin).origin,
      new URL(process.env.REACT_APP_MOCKOON_URL ?? documentOrigin).origin,
    ]);
    expect([...origins].filter((origin) => !allowed.has(origin))).toEqual([]);
  });
});
