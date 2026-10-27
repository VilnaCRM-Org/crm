import type { Locator, Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import fillInput from '@tests/e2e/utils/fill-input';
import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import type { SignInOutcome } from '@tests/e2e/utils/two-factor-responses';
import { stubSignIn } from '@tests/e2e/utils/two-factor-responses';

export const challengeText = {
  title: t('two_factor.title'),
  subtitle: t('two_factor.subtitle'),
  note: t('two_factor.note'),
  codeLabel: t('two_factor.code_label'),
  submit: t('two_factor.submit_button'),
  submitting: t('two_factor.submitting'),
  incomplete: t('two_factor.errors.incomplete'),
  invalidCode: t('two_factor.errors.invalid_code'),
  rateLimited: t('two_factor.banner.rate_limited'),
  transient: t('two_factor.banner.transient'),
  expiredNotice: t('sign_in.notices.two_factor_expired'),
  lockedNotice: t('sign_in.notices.account_locked'),
  back: t('password_recovery.back'),
  retry: t('auth.error.tryAgain'),
  recoveryLabel: t('two_factor.recovery.label'),
  recoverySubtitle: t('two_factor.recovery.subtitle'),
  useRecovery: t('two_factor.recovery.use_recovery'),
  useAuthenticator: t('two_factor.recovery.use_authenticator'),
  recoveryFormat: t('two_factor.errors.recovery_format'),
  recoveryInvalid: t('two_factor.errors.recovery_invalid'),
} as const;

const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const signInSubmit: string = t('sign_in.form.submit_button');

export const challengeHeadingOf = (page: Page): Locator =>
  page.getByRole('heading', { level: 1, name: challengeText.title, exact: true });

export const codeCellsOf = (page: Page): Locator =>
  page.getByRole('group', { name: challengeText.codeLabel }).getByRole('textbox');

export const confirmButtonOf = (page: Page): Locator =>
  page.getByRole('button', { name: challengeText.submit, exact: true });

export const challengeBackOf = (page: Page): Locator =>
  page.getByRole('button', { name: challengeText.back, exact: true });

export const recoveryFieldOf = (page: Page): Locator =>
  page.getByRole('textbox', { name: challengeText.recoveryLabel, exact: true });

export const recoveryToggleOf = (page: Page): Locator =>
  page.getByRole('button', { name: challengeText.useRecovery, exact: true });

export const authenticatorToggleOf = (page: Page): Locator =>
  page.getByRole('button', { name: challengeText.useAuthenticator, exact: true });

export const challengeRetryOf = (page: Page): Locator =>
  page.getByRole('button', { name: challengeText.retry, exact: true });

export async function submitSignIn(
  page: Page,
  credentials: { email: string; password: string }
): Promise<void> {
  await fillInput(page.getByPlaceholder(emailPlaceholder), credentials.email);
  await fillInput(page.getByPlaceholder(passwordPlaceholder), credentials.password);
  await page.locator('button', { hasText: signInSubmit }).click();
}

export async function typeCode(page: Page, code: string): Promise<void> {
  await codeCellsOf(page).first().click();
  await page.keyboard.type(code);
}

export async function signInToChallenge(
  page: Page,
  credentials: { email: string; password: string },
  outcomes: readonly SignInOutcome[] = ['challenge']
): Promise<void> {
  await stubSignIn(page, outcomes);
  await page.goto(ROUTE_PATHS.signIn, { waitUntil: 'domcontentloaded' });
  await submitSignIn(page, credentials);
  await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.twoFactorChallenge}$`));
  await expect(challengeHeadingOf(page)).toBeVisible();
}
