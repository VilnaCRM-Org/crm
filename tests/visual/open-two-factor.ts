import { expect, type Page } from '@playwright/test';

import { buildCredentials, seedFaker } from '@tests/builders';
import {
  signInToSettings,
  stubProfile,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  sectionOf,
  startOf,
} from '@tests/e2e/modules/user/features/settings/utils/two-factor-page';
import { t } from '@tests/e2e/utils/initialize-localization';
import { challengeHeadingOf } from '@tests/e2e/utils/reach-challenge';
import { stubSignIn } from '@tests/e2e/utils/two-factor-responses';
import {
  replyWithConfirmedCodes,
  replyWithRegeneratedCodes,
  replyWithSetup,
  stubConfirm,
  stubDisable,
  stubRegenerate,
  stubSetup,
} from '@tests/e2e/utils/two-factor-settings-responses';

import { PAGES } from './constants';
import stabilizePage from './stabilize-page';

seedFaker();

const BASELINE_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
const BASELINE_LABEL = 'VilnaCRM%3Aolena.petrenko%40example.com';
const BASELINE_URI = `otpauth://totp/${BASELINE_LABEL}?secret=${BASELINE_SECRET}&issuer=VilnaCRM`;
const BASELINE_CODES: readonly string[] = [
  'K7QM-4RTD',
  'W2XB-9NHF',
  'P5ZC-1LVA',
  'D8GJ-6YSE',
  'T3UR-7KBN',
  'H4EW-2MQX',
  'C9FA-5ZPL',
  'N6VD-8JTG',
];
const BASELINE_NEW_CODES: readonly string[] = [
  'A2BC-3DEF',
  'G4HJ-5KMN',
  'P6QR-7STV',
  'W8XY-9Z2A',
  'B3CD-4EFG',
  'H5JK-6MNP',
  'Q7RS-8TVW',
  'X9YZ-2ABC',
];

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
  await signInToSettings(page);
  await stubProfile(page);
  await stubSetup(page, [replyWithSetup(BASELINE_URI, BASELINE_SECRET)]);
  await stubConfirm(page, [replyWithConfirmedCodes(BASELINE_CODES)]);
  await stubDisable(page);
  await stubRegenerate(page, [replyWithRegeneratedCodes(BASELINE_NEW_CODES)]);
  await stabilizePage(page, PAGES.SETTINGS);
  await expect(sectionOf(page)).toBeVisible();
  await expect(startOf(page)).toBeVisible();
}
