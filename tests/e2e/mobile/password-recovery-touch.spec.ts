import { test, expect, type Locator, type Page, type Route } from '@playwright/test';

import { buildEmail, buildPassword, buildResetToken } from '@tests/builders';
import { t } from '@tests/e2e/utils/initialize-localization';

import { MIN_TOUCH_TARGET_PX, showPasswordLabel } from './constants';

const RECOVERY_URL = '/password-recovery';
const GRAPHQL_URL = '**/graphql';
const EMAIL = buildEmail();
const NEW_PASSWORD = buildPassword();
const MIN_SMALL_TARGET_PX = 24;
const KEYBOARD_VIEWPORT_RATIO = 0.45;

const submitLabel: string = t('password_recovery.submit_button');
const backLabel: string = t('password_recovery.back');
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const sentTitle: string = t('password_recovery.sent.title');
const toSignIn: string = t('password_recovery.sent.to_sign_in');
const transient: string = t('password_recovery.errors.transient');
const tryAgain: string = t('auth.error.tryAgain');
const resetTitle: string = t('password_reset.title');
const newPasswordLabel: string = t('password_reset.new_password.label');
const confirmLabel: string = t('password_reset.confirm_password.label');
const notice: string = t('sign_in.notices.password_reset');

type Answer = (route: Route) => Promise<void>;

const ok =
  (data: unknown): Answer =>
  (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });

async function answer(page: Page, operation: string, reply: Answer): Promise<string[]> {
  const seen: string[] = [];
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const body = route.request().postDataJSON() as { operationName?: string };
    if (body.operationName !== operation) return route.fallback();
    seen.push(operation);
    return reply(route);
  });
  return seen;
}

async function openRequest(page: Page): Promise<Locator> {
  await page.goto(RECOVERY_URL);
  const submit = page.getByRole('button', { name: submitLabel });
  await expect(submit).toBeVisible();
  return submit;
}

async function openReset(page: Page): Promise<Locator> {
  await page.goto(`/password-reset?token=${buildResetToken()}`);
  await expect(page.getByRole('heading', { level: 1, name: resetTitle })).toBeVisible();
  await expect(page.getByLabel(newPasswordLabel)).toBeVisible();
  return page.getByRole('button', { name: submitLabel });
}

async function expectTargetAtLeast(locator: Locator, minimum: number): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(minimum);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(minimum);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(0);
}

async function typeByTap(field: Locator, value: string): Promise<void> {
  await field.tap();
  await field.fill(value);
}

test.describe('Password recovery on touch devices (issue #315)', () => {
  test('completes the request step with taps only', async ({ page }) => {
    await answer(page, 'RequestPasswordReset', ok({ requestPasswordResetUser: null }));
    const submit = await openRequest(page);

    await typeByTap(page.getByPlaceholder(emailPlaceholder), EMAIL);
    await submit.tap();

    await expect(page.getByRole('heading', { level: 1, name: sentTitle })).toBeVisible();
  });

  test('completes the reset step with taps only and lands on sign-in', async ({ page }) => {
    await answer(page, 'ConfirmPasswordReset', ok({ confirmPasswordResetUser: null }));
    const submit = await openReset(page);

    await typeByTap(page.getByLabel(newPasswordLabel), NEW_PASSWORD);
    await typeByTap(page.getByLabel(confirmLabel), NEW_PASSWORD);
    await submit.tap();

    await expect(page).toHaveURL('/sign-in');
    await expect(page.getByRole('status').filter({ hasText: notice })).toBeVisible();
  });

  test('flips password visibility on a tap', async ({ page }) => {
    await openReset(page);

    await page.getByRole('button', { name: showPasswordLabel }).first().tap();

    await expect(page.getByLabel(newPasswordLabel)).toHaveAttribute('type', 'text');
  });

  test('sends nothing for an empty submit', async ({ page }) => {
    const seen = await answer(page, 'RequestPasswordReset', ok({ requestPasswordResetUser: null }));
    const submit = await openRequest(page);

    await submit.tap();

    await expect(page.getByPlaceholder(emailPlaceholder)).toHaveAttribute('aria-invalid', 'true');
    expect(seen).toHaveLength(0);
  });

  test('keeps the request controls tappable', async ({ page }) => {
    await answer(page, 'RequestPasswordReset', (route) => route.fulfill({ status: 503, body: '' }));
    const submit = await openRequest(page);

    await expectTargetAtLeast(page.getByPlaceholder(emailPlaceholder), MIN_TOUCH_TARGET_PX);
    await expectTargetAtLeast(submit, MIN_TOUCH_TARGET_PX);
    await expectTargetAtLeast(page.getByRole('link', { name: backLabel }), MIN_SMALL_TARGET_PX);

    await typeByTap(page.getByPlaceholder(emailPlaceholder), EMAIL);
    await submit.tap();
    await expect(page.getByRole('alert')).toHaveText(transient);
    await expectTargetAtLeast(page.getByRole('button', { name: tryAgain }), MIN_SMALL_TARGET_PX);
  });

  test('keeps the sent-step link tappable', async ({ page }) => {
    await answer(page, 'RequestPasswordReset', ok({ requestPasswordResetUser: null }));
    const submit = await openRequest(page);
    await typeByTap(page.getByPlaceholder(emailPlaceholder), EMAIL);
    await submit.tap();

    await expectTargetAtLeast(page.getByRole('link', { name: toSignIn }), MIN_SMALL_TARGET_PX);
  });

  test('keeps the reset controls tappable', async ({ page }) => {
    const submit = await openReset(page);

    await expectTargetAtLeast(page.getByLabel(newPasswordLabel), MIN_TOUCH_TARGET_PX);
    await expectTargetAtLeast(page.getByLabel(confirmLabel), MIN_TOUCH_TARGET_PX);
    await expectTargetAtLeast(submit, MIN_TOUCH_TARGET_PX);
  });

  test('renders both pages without horizontal overflow', async ({ page }) => {
    await openRequest(page);
    await expectNoHorizontalOverflow(page);

    await openReset(page);
    await expectNoHorizontalOverflow(page);
  });

  test('keeps the submit reachable at keyboard height', async ({ page }) => {
    const size = page.viewportSize();
    const submit = await openReset(page);
    const field = page.getByLabel(newPasswordLabel);
    await field.tap();
    await page.setViewportSize({
      width: size?.width ?? 390,
      height: Math.round((size?.height ?? 664) * KEYBOARD_VIEWPORT_RATIO),
    });

    await submit.scrollIntoViewIfNeeded();

    await expect(field).toBeFocused();
    await expect(submit).toBeInViewport();
  });
});
