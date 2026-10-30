import type { Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { buildCredentials } from '@tests/builders';
import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { test, expect } from '@tests/e2e/utils/fixtures';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  challengeText,
  codeCellsOf,
  confirmButtonOf,
  recoveryFieldOf,
  recoveryToggleOf,
  signInToChallenge,
  typeCode,
} from '@tests/e2e/utils/reach-challenge';
import { replyWithRemainingCodes, stubChallenge } from '@tests/e2e/utils/two-factor-responses';
import expectCleanScan from '@tests/utils/a11y/expect-clean-scan';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';

const CODE = '123456';
const RECOVERY_CODE = 'ABCD-2345';
const credentials = buildCredentials();
const homeHeading: string = t('home.heading');

async function expectBannerScanned(page: Page, text: string): Promise<void> {
  await expect(page.getByRole('alert').filter({ hasText: text })).toBeVisible();
  await expectCleanScan(page);
}

test.describe('WCAG 2.1 AA scans of the sign-in challenge states (issue #331)', () => {
  test('the resting challenge has no axe violations', async ({ page }) => {
    await signInToChallenge(page, credentials);
    await expect(codeCellsOf(page)).toHaveCount(6);
    await expect(page.getByRole('contentinfo')).toBeVisible();

    await expectCleanScan(page);
  });

  test('the incomplete-code error has no axe violations', async ({ page }) => {
    await signInToChallenge(page, credentials);
    await typeCode(page, '1234');
    await confirmButtonOf(page).click();
    await expect(page.getByText(challengeText.incomplete)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the wrong-code error has no axe violations', async ({ page }) => {
    await stubChallenge(page, ['invalid_code']);
    await signInToChallenge(page, credentials);
    await typeCode(page, CODE);
    await confirmButtonOf(page).click();
    await expect(page.getByText(challengeText.invalidCode)).toBeVisible();

    await expectCleanScan(page);
  });

  test('recovery mode has no axe violations', async ({ page }) => {
    await signInToChallenge(page, credentials);
    await recoveryToggleOf(page).click();
    await expect(recoveryFieldOf(page)).toBeFocused();

    await expectCleanScan(page);
  });

  test('the recovery format error has no axe violations', async ({ page }) => {
    await signInToChallenge(page, credentials);
    await recoveryToggleOf(page).click();
    await recoveryFieldOf(page).fill('abc-123');
    await confirmButtonOf(page).click();
    await expect(page.getByText(challengeText.recoveryFormat)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the wrong recovery code has no axe violations', async ({ page }) => {
    await stubChallenge(page, ['invalid_code']);
    await signInToChallenge(page, credentials);
    await recoveryToggleOf(page).click();
    await recoveryFieldOf(page).fill('abcd0002');
    await confirmButtonOf(page).click();
    await expect(page.getByText(challengeText.recoveryInvalid)).toBeVisible();

    await expectCleanScan(page);
  });

  test('the rate-limited banner has no axe violations', async ({ page }) => {
    await stubChallenge(page, ['rate_limited']);
    await signInToChallenge(page, credentials);
    await typeCode(page, CODE);
    await confirmButtonOf(page).click();

    await expectBannerScanned(page, challengeText.rateLimited);
  });

  test('the transient banner with its retry has no axe violations', async ({ page }) => {
    await stubChallenge(page, ['unavailable']);
    await signInToChallenge(page, credentials);
    await typeCode(page, CODE);
    await confirmButtonOf(page).click();
    await expect(page.getByRole('button', { name: challengeText.retry })).toBeVisible();

    await expectBannerScanned(page, challengeText.transient);
  });

  test('/sign-in with the expired-session notice has no axe violations', async ({ page }) => {
    await stubChallenge(page, ['expired_session']);
    await signInToChallenge(page, credentials);
    await typeCode(page, CODE);
    await confirmButtonOf(page).click();
    await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.signIn}$`));
    await expect(page.getByText(challengeText.expiredNotice)).toBeVisible();

    await expectCleanScan(page);
  });

  test('/sign-in with the locked-account notice has no axe violations', async ({ page }) => {
    await stubChallenge(page, ['locked']);
    await signInToChallenge(page, credentials);
    await typeCode(page, CODE);
    await confirmButtonOf(page).click();
    await expect(page.getByText(challengeText.lockedNotice)).toBeVisible();

    await expectCleanScan(page);
  });

  test('a protected page with the low-codes notice has no axe violations', async ({ page }) => {
    await overrideRuntimeConfig(page, { flags: { userSettings: true } });
    await stubProfile(page);
    await stubChallenge(page, [replyWithRemainingCodes(1)]);
    await signInToChallenge(page, credentials);
    await recoveryToggleOf(page).click();
    await recoveryFieldOf(page).fill(RECOVERY_CODE);
    await confirmButtonOf(page).click();
    await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
    await expect(
      page
        .getByRole('main')
        .getByRole('status')
        .filter({ hasText: t('recovery_codes_notice.remaining', { count: 1 }) })
    ).toBeVisible();

    await expectCleanScan(page);
  });
});
