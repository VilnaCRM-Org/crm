import { expect, test, type Page } from '@playwright/test';

import {
  holdReply,
  replyWithGraphQLError,
  replyWithProfile,
  replyWithSaved,
  replyWithStatus,
  signInWithFlag,
  stubProfile,
  PROFILE_NODE,
  type ProfileReplies,
} from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import {
  currentPasswordField,
  emailField,
  expectErrorToast,
  expectToastsInOrder,
  nameField,
  newPasswordField,
  saveButton,
  text,
} from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import { t } from '@tests/e2e/utils/initialize-localization';

import { currentLanguage, notFoundScreens, PAGES, type ScreenSize, screenSizes } from './constants';
import stabilizePage from './stabilize-page';
import takeStableSnapshot from './take-stable-snapshot';

const PASSWORD = 'Current1pass';
const NEW_PASSWORD = 'Another2pass';
const NEW_NAME = 'Іван Коваль';
const NEW_EMAIL = 'ivan.koval@example.com';

const personalHeading: string = t('settings.profile.sections.personal');
const loadFailed: string = t('settings.profile.load_failed');

async function openSettings(
  page: Page,
  screen: ScreenSize,
  replies: ProfileReplies
): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await signInWithFlag(page, true);
  await stubProfile(page, replies);
  await stabilizePage(page, PAGES.SETTINGS);
}

async function expectResting(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 2, name: personalHeading })).toBeVisible();
  await expect(nameField(page)).toHaveValue(PROFILE_NODE.initials);
}

const takeSettingsSnapshot = (page: Page, screen: ScreenSize, name: string): Promise<void> =>
  takeStableSnapshot(page, `${currentLanguage}_settings-${name}_${screen.name}.png`);

async function fillEveryAspect(page: Page): Promise<void> {
  await nameField(page).fill(NEW_NAME);
  await emailField(page).fill(NEW_EMAIL);
  await currentPasswordField(page).fill(PASSWORD);
  await newPasswordField(page).fill(NEW_PASSWORD);
}

test.describe.parallel('Settings visual tests (issue #330)', () => {
  for (const screen of screenSizes) {
    test(`[settings] resting ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, {});
      await expectResting(page);

      await takeSettingsSnapshot(page, screen, 'resting');
    });
  }

  for (const screen of notFoundScreens) {
    test(`[settings] unconfirmed e-mail row ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, { CurrentUser: [replyWithProfile({ confirmed: false })] });
      await expectResting(page);
      await expect(page.getByText(text.unconfirmed, { exact: true })).toBeVisible();

      await takeSettingsSnapshot(page, screen, 'unconfirmed');
    });

    test(`[settings] field errors ${screen.name}`, async ({ page }) => {
      const message = [
        'initials: Bad name',
        'email: This email address is already registered',
        'newPassword: Too weak',
      ].join('\n');
      await openSettings(page, screen, { UpdateUser: [replyWithGraphQLError(message, 422)] });
      await expectResting(page);
      await fillEveryAspect(page);
      await saveButton(page).click();
      await expect(page.getByText(text.emailTaken, { exact: true })).toBeVisible();

      await takeSettingsSnapshot(page, screen, 'field-errors');
    });

    test(`[settings] success toasts ${screen.name}`, async ({ page }) => {
      const saved = replyWithSaved({ initials: NEW_NAME, email: NEW_EMAIL, confirmed: false });
      await openSettings(page, screen, { UpdateUser: [saved] });
      await expectResting(page);
      await fillEveryAspect(page);
      await saveButton(page).click();
      await expectToastsInOrder(page, [text.saved, text.emailSent, text.passwordChanged]);

      await takeSettingsSnapshot(page, screen, 'success-toasts');
    });

    test(`[settings] transient error toast ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, { UpdateUser: [replyWithStatus(503)] });
      await expectResting(page);
      await nameField(page).fill(NEW_NAME);
      await currentPasswordField(page).fill(PASSWORD);
      await saveButton(page).click();
      await expectErrorToast(page, text.transient);

      await takeSettingsSnapshot(page, screen, 'transient-toast');
    });

    test(`[settings] skeleton ${screen.name}`, async ({ page }) => {
      const gate = holdReply(replyWithProfile());
      await openSettings(page, screen, { CurrentUser: [gate.reply] });
      await expect(page.locator('#profile-skeleton-save')).toBeVisible();

      await takeSettingsSnapshot(page, screen, 'skeleton');
    });

    test(`[settings] load failure ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, { CurrentUser: [replyWithStatus(503)] });
      await expect(page.getByRole('alert').filter({ hasText: loadFailed })).toBeAttached();
      await expect(page.getByRole('button', { name: text.tryAgain, exact: true })).toBeVisible();

      await takeSettingsSnapshot(page, screen, 'load-failure');
    });
  }
});
