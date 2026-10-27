import type { Locator, Page } from '@playwright/test';

import { expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';

export const signInErrorCard = {
  title: t('notifications.error.title'),
  retryLabel: t('notifications.error.retry_button'),
  backLabel: t('notifications.error.button'),
  submitting: t('sign_in.form.submitting'),
} as const;

export const signInSuccessCard = {
  title: t('sign_in.success.title'),
  description: t('sign_in.success.description'),
  buttonLabel: t('sign_in.success.button'),
} as const;

export const signInErrorMessages = {
  invalidCredentials: t('sign_in.errors.invalid_credentials'),
  locked: t('sign_in.errors.locked'),
  rateLimited: t('sign_in.errors.rate_limited'),
  transient: t('sign_in.errors.transient'),
  network: t('failure_responses.network_errors.network_error'),
  server: t('failure_responses.server_errors.server_error'),
  validation: t('failure_responses.client_errors.something_went_wrong'),
  unexpected: t('failure_responses.client_errors.unexpected_error'),
} as const;

export const errorCardHeading = (page: Page): Locator =>
  page.getByRole('heading', { level: 2, name: signInErrorCard.title, exact: true });

export const retryButtonOf = (page: Page): Locator =>
  page.getByRole('button', { name: signInErrorCard.retryLabel, exact: true });

export const errorCardOf = (page: Page): Locator =>
  page
    .locator('div')
    .filter({ has: errorCardHeading(page) })
    .filter({ has: retryButtonOf(page) })
    .last();

export const backButtonOf = (page: Page): Locator =>
  page.getByRole('button', { name: signInErrorCard.backLabel, exact: true });

export const successCardHeading = (page: Page): Locator =>
  page.getByRole('heading', { level: 2, name: signInSuccessCard.title, exact: true });

export const continueButtonOf = (page: Page): Locator =>
  page.getByRole('button', { name: signInSuccessCard.buttonLabel, exact: true });

export async function expectSignInErrorCard(page: Page, message: string): Promise<void> {
  await expect(errorCardHeading(page)).toBeFocused();
  await expect(errorCardOf(page).getByRole('alert')).toHaveText(message);
  await expect(retryButtonOf(page)).toBeEnabled();
  await expect(backButtonOf(page)).toBeEnabled();
  await expect(page.locator('#login-form')).toHaveAttribute('inert', '');
  await expect(page.locator('#auth-provider-buttons-container')).toHaveAttribute('inert', '');
}

export const errorCardBodyOf = (page: Page): Locator => errorCardHeading(page).locator('xpath=..');

export async function expectSignInErrorCardWithoutRetry(
  page: Page,
  message: string
): Promise<void> {
  await expect(errorCardHeading(page)).toBeFocused();
  await expect(errorCardBodyOf(page).getByRole('alert')).toHaveText(message);
  await expect(retryButtonOf(page)).toHaveCount(0);
  await expect(backButtonOf(page)).toBeEnabled();
  await expect(page.locator('#login-form')).toHaveAttribute('inert', '');
  await expect(page.locator('#auth-provider-buttons-container')).toHaveAttribute('inert', '');
}

export async function expectSignInSuccessCard(page: Page): Promise<void> {
  await expect(successCardHeading(page)).toBeFocused();
  await expect(
    page.getByRole('status').filter({ hasText: signInSuccessCard.description })
  ).toHaveText(signInSuccessCard.description);
  await expect(continueButtonOf(page)).toBeVisible();
  await expect(page.locator('#login-form')).toHaveAttribute('inert', '');
  await expect(page.locator('#auth-provider-buttons-container')).toHaveAttribute('inert', '');
}
