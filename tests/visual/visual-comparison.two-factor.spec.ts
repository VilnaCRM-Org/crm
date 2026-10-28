import { expect, test, type Page } from '@playwright/test';

import ROUTE_PATHS from '@/routes/route-paths';
import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  disableHeadingOf,
  enableTwoFactor,
  openDisableOf,
  openRegenerateOf,
  openSetup,
  reachCodes,
  reauthSignInOf,
  regenerateHeadingOf,
  sectionOf,
  statusHeadingOf,
  twoFactorText,
} from '@tests/e2e/modules/user/features/settings/utils/two-factor-page';
import { t } from '@tests/e2e/utils/initialize-localization';
import {
  challengeText,
  codeCellsOf,
  confirmButtonOf,
  recoveryFieldOf,
  recoveryToggleOf,
  typeCode,
} from '@tests/e2e/utils/reach-challenge';
import { replyWithRemainingCodes, stubChallenge } from '@tests/e2e/utils/two-factor-responses';
import { stubRegenerate } from '@tests/e2e/utils/two-factor-settings-responses';
import { overrideRuntimeConfig } from '@tests/utils/override-runtime-config';

import { currentLanguage, notFoundScreens, type ScreenSize, screenSizes } from './constants';
import { openChallenge, openTwoFactorSettings } from './open-two-factor';
import takeStableSnapshot from './take-stable-snapshot';

const CODE = '123456';
const RECOVERY_CODE = 'ABCD-2345';
const homeHeading: string = t('home.heading');
const lowCodesNotice: string = t('recovery_codes_notice.remaining', { count: 1 });

const takeTwoFactorSnapshot = (page: Page, screen: ScreenSize, name: string): Promise<void> =>
  takeStableSnapshot(page, `${currentLanguage}_two-factor-${name}_${screen.name}.png`);

async function resize(page: Page, screen: ScreenSize): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
}

async function submitWrongCode(page: Page): Promise<void> {
  await typeCode(page, CODE);
  await confirmButtonOf(page).click();
}

test.describe.parallel('Two-factor visual tests (issue #331)', () => {
  for (const screen of screenSizes) {
    test(`[two-factor] challenge resting ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await openChallenge(page);
      await expect(codeCellsOf(page)).toHaveCount(6);

      await takeTwoFactorSnapshot(page, screen, 'challenge-resting');
    });

    test(`[two-factor] settings off ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await openTwoFactorSettings(page);

      await takeTwoFactorSnapshot(page, screen, 'settings-off');
    });
  }

  for (const screen of notFoundScreens) {
    test(`[two-factor] challenge recovery mode ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await openChallenge(page);
      await recoveryToggleOf(page).click();
      await expect(page.getByText(challengeText.recoverySubtitle)).toBeVisible();
      await expect(recoveryFieldOf(page)).toBeVisible();

      await takeTwoFactorSnapshot(page, screen, 'challenge-recovery');
    });

    test(`[two-factor] challenge wrong code ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await stubChallenge(page, ['invalid_code']);
      await openChallenge(page);
      await submitWrongCode(page);
      await expect(page.getByText(challengeText.invalidCode)).toBeVisible();

      await takeTwoFactorSnapshot(page, screen, 'challenge-wrong-code');
    });

    test(`[two-factor] sign-in with the expired notice ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await stubChallenge(page, ['expired_session']);
      await openChallenge(page);
      await submitWrongCode(page);
      await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.signIn}$`));
      await expect(page.getByRole('heading', { level: 1, name: t('sign_in.title') })).toBeVisible();
      await expect(page.getByText(challengeText.expiredNotice)).toBeVisible();

      await takeTwoFactorSnapshot(page, screen, 'sign-in-expired');
    });

    test(`[two-factor] low recovery codes notice ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await overrideRuntimeConfig(page, { flags: { userSettings: true } });
      await stubProfile(page);
      await stubChallenge(page, [replyWithRemainingCodes(1)]);
      await openChallenge(page);
      await recoveryToggleOf(page).click();
      await recoveryFieldOf(page).fill(RECOVERY_CODE);
      await confirmButtonOf(page).click();
      await expect(page).toHaveURL(new RegExp(`${ROUTE_PATHS.home}$`));
      await expect(page.getByRole('heading', { level: 1, name: homeHeading })).toBeVisible();
      await expect(page.getByRole('status').filter({ hasText: lowCodesNotice })).toBeVisible();

      await takeTwoFactorSnapshot(page, screen, 'low-codes-notice');
    });

    test(`[two-factor] settings setup ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await openTwoFactorSettings(page);
      await openSetup(page);

      await takeTwoFactorSnapshot(page, screen, 'settings-setup');
    });

    test(`[two-factor] settings recovery codes ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await openTwoFactorSettings(page);
      await reachCodes(page);

      await takeTwoFactorSnapshot(page, screen, 'settings-codes');
    });

    test(`[two-factor] settings on ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await openTwoFactorSettings(page);
      await enableTwoFactor(page);
      await expect(statusHeadingOf(page, twoFactorText.statusOn)).toBeVisible();

      await takeTwoFactorSnapshot(page, screen, 'settings-on');
    });

    test(`[two-factor] settings disable confirmation ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await openTwoFactorSettings(page);
      await enableTwoFactor(page);
      await openDisableOf(page).click();
      await expect(disableHeadingOf(page)).toBeVisible();

      await takeTwoFactorSnapshot(page, screen, 'settings-disable');
    });

    test(`[two-factor] settings re-authentication ${screen.name}`, async ({ page }) => {
      await resize(page, screen);
      await openTwoFactorSettings(page);
      await stubRegenerate(page, ['reauth_required']);
      await enableTwoFactor(page);
      await openRegenerateOf(page).click();
      await expect(regenerateHeadingOf(page)).toBeVisible();
      await sectionOf(page).getByRole('button', { name: twoFactorText.regenerateSubmit }).click();
      await expect(reauthSignInOf(page)).toBeVisible();

      await takeTwoFactorSnapshot(page, screen, 'settings-reauth');
    });
  }
});
