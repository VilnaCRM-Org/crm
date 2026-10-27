import { expect, type Page } from '@playwright/test';

import { buildCredentials, seedFaker } from '@tests/builders';
import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  sectionOf,
  signInToTwoFactorSettings,
  startOf,
} from '@tests/e2e/modules/user/features/settings/utils/two-factor-page';
import { t } from '@tests/e2e/utils/initialize-localization';
import { challengeHeadingOf } from '@tests/e2e/utils/reach-challenge';
import { stubSignIn } from '@tests/e2e/utils/two-factor-responses';
import {
  stubConfirm,
  stubDisable,
  stubRegenerate,
  stubSetup,
} from '@tests/e2e/utils/two-factor-settings-responses';

import { PAGES } from './constants';
import stabilizePage from './stabilize-page';

seedFaker();

const credentials = buildCredentials();
const emailPlaceholder: string = t('sign_in.form.email_input.placeholder');
const passwordPlaceholder: string = t('sign_in.form.password_input.placeholder');
const signInSubmit: string = t('sign_in.form.submit_button');

export async function openChallenge(page: Page): Promise<void> {
  await stubSignIn(page, ['challenge']);
  await stabilizePage(page, PAGES.SIGN_IN);
  await page.getByPlaceholder(emailPlaceholder).fill(credentials.email);
  await page.getByPlaceholder(passwordPlaceholder).fill(credentials.password);
  await page.locator('button', { hasText: signInSubmit }).click();
  await expect(challengeHeadingOf(page)).toBeVisible();
}

export async function openTwoFactorSettings(page: Page): Promise<void> {
  await signInToTwoFactorSettings(page);
  await stubProfile(page);
  await stubSetup(page);
  await stubConfirm(page);
  await stubDisable(page);
  await stubRegenerate(page);
  await stabilizePage(page, PAGES.SETTINGS);
  await expect(sectionOf(page)).toBeVisible();
  await expect(startOf(page)).toBeVisible();
}
