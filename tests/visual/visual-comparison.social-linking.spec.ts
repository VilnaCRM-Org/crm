import { expect, test, type Page } from '@playwright/test';

import { stubProfile } from '@tests/e2e/modules/user/features/settings/utils/profile-stub';
import { nameField, text } from '@tests/e2e/modules/user/features/settings/utils/settings-page';
import {
  cancelUnlinkButton,
  type SocialLinkReplies,
  stubSocialLinks,
  unlinkButton,
} from '@tests/e2e/modules/user/features/settings/utils/social-links-page';
import { t } from '@tests/e2e/utils/initialize-localization';
import { seedPreloadedAuthToken } from '@tests/utils/seed-preloaded-auth-token';

import { currentLanguage, notFoundScreens, PAGES, type ScreenSize } from './constants';
import stabilizePage from './stabilize-page';
import takeStableSnapshot from './take-stable-snapshot';

const ALL_LINKED: SocialLinkReplies = { linked: ['google', 'facebook', 'github', 'twitter'] };

async function openSettings(
  page: Page,
  screen: ScreenSize,
  replies: SocialLinkReplies
): Promise<void> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await seedPreloadedAuthToken(page);
  await stubProfile(page);
  await stubSocialLinks(page, replies);
  await stabilizePage(page, PAGES.SETTINGS);
  await expect(nameField(page)).toBeVisible();
}

async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

const takeSnapshot = (page: Page, screen: ScreenSize, name: string): Promise<void> =>
  takeStableSnapshot(page, `${currentLanguage}_social-linking-${name}_${screen.name}.png`);

test.describe.parallel('Social account linking visual tests', () => {
  for (const screen of notFoundScreens) {
    test(`[social-linking] linked ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, ALL_LINKED);
      await expect(unlinkButton(page, 'Google')).toBeVisible();

      await takeSnapshot(page, screen, 'linked');
    });

    test(`[social-linking] unlink confirmation ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, ALL_LINKED);
      await unlinkButton(page, 'Google').click();
      await page.mouse.move(0, 0);
      await expect(cancelUnlinkButton(page, 'Google')).toBeFocused();
      await scrollToTop(page);

      await takeSnapshot(page, screen, 'confirmation');
    });

    test(`[social-linking] load failure ${screen.name}`, async ({ page }) => {
      await openSettings(page, screen, { listFailures: 1 });
      await expect(page.getByRole('button', { name: text.tryAgain, exact: true })).toBeVisible();

      await takeSnapshot(page, screen, 'load-failure');
    });

    test(`[social-linking] popup return ${screen.name}`, async ({ page }) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await page.addInitScript(() => {
        window.close = (): void => undefined;
      });
      await stabilizePage(page, '/auth/callback/google?code=visual&state=link.visual');
      await expect(
        page.getByRole('heading', { level: 1, name: t('auth.social.link_title'), exact: true })
      ).toBeVisible();

      await takeSnapshot(page, screen, 'popup-return');
    });
  }
});
